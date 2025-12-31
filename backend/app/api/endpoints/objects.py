from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from app.services.ai_service import ai_service
from supabase import create_client
import os
from datetime import datetime
import base64
from io import BytesIO

# Try to import Pillow for server-side cropping
try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("Warning: Pillow not installed. Server-side cropping disabled.")

# Define or Import helper
def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key) if url and key else None

def crop_image_base64(image_base64: str, bbox: List[float]) -> str:
    """Crop an image using bbox coordinates [x, y, width, height]"""
    if not PILLOW_AVAILABLE or not image_base64 or not bbox or len(bbox) < 4:
        return image_base64  # Return original if can't crop
    
    try:
        # Remove data URI prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to image
        img_data = base64.b64decode(image_base64)
        img = Image.open(BytesIO(img_data))
        
        x, y, w, h = bbox
        
        # Add 10% padding
        pad = 0.1
        x1 = max(0, int(x - w * pad))
        y1 = max(0, int(y - h * pad))
        x2 = min(img.width, int(x + w + w * pad))
        y2 = min(img.height, int(y + h + h * pad))
        
        # Crop
        cropped = img.crop((x1, y1, x2, y2))
        
        # Resize if too large (max 640x480)
        if cropped.width > 640 or cropped.height > 480:
            cropped.thumbnail((640, 480), Image.Resampling.LANCZOS)
        
        # Convert back to base64
        buffer = BytesIO()
        cropped.save(buffer, format='JPEG', quality=80)
        cropped_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{cropped_b64}"
    except Exception as e:
        print(f"Crop error: {e}")
        return image_base64  # Return original on error

router = APIRouter()

class ObjectCreateRequest(BaseModel):
    source: str 
    object_class: str
    name: str 
    confidence: float
    timestamp: str
    location: Dict[str, Any]
    heading: float
    image_base64: str
    metadata: Dict[str, Any]
    mission_id: Optional[str] = None
    bbox: Optional[List[float]] = None  # [x, y, width, height] for server-side crop


class ObjectUpdateRequest(BaseModel):
    nombre: str
    descripcion: str
    subcategoria: Optional[str] = None
    genero: Optional[str] = None
    tipo: Optional[str] = None

# --- ENDPOINTS ---

@router.get("/nearby")
async def get_nearby_objects(lat: float, lng: float, radius: int = 500):
    """
    Get all objects within a radius (meters) from a GPS location.
    Returns objects from ALL missions (including orphaned objects).
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return []
        
        # Use PostGIS RPC function if available, otherwise fallback to raw query
        # Try using RPC first (search_nearby_objects_v2)
        try:
            res = supabase.rpc(
                'search_nearby_objects_v2',
                {
                    'user_lat': lat,
                    'user_lng': lng,
                    'max_distance': radius
                }
            ).execute()
            
            if res.data:
                return res.data
        except Exception as rpc_err:
            print(f"RPC fallback: {rpc_err}")
        
        # Fallback: Simple query without distance filtering
        # Use PostGIS functions to extract lat/lng from geometry
        res = supabase.rpc('get_all_objects_with_coords', {}).execute()
        
        if res.data:
            return res.data
        
        # If RPC doesn't exist, try raw select (lat/lng will need client parsing)
        res = supabase.table("objetos_exploracion").select(
            "id, nombre, tipo, descripcion, posicion, metadata, mission_id, created_at, subcategoria, genero"
        ).order("created_at", desc=True).limit(100).execute()
        
        # Post-process to add lat/lng (client-side WKB parsing is hard, so we approximate)
        if res.data:
            for obj in res.data:
                # If posicion exists but is WKB hex, extract from metadata as fallback
                if obj.get('metadata') and obj['metadata'].get('heading') is not None:
                    # Metadata usually has coordinates from save time
                    pass  # Already have metadata
            return res.data
        
        return []
        
    except Exception as e:
        print(f"Nearby objects error: {e}")
        return []

@router.post("/create")
async def create_object(req: ObjectCreateRequest):
    """Create a new AR object (from Sentinel, Teach, or Marker modes)"""
    try:
        supabase = get_supabase()
        if not supabase: 
            return {"success": False, "error": "DB Connection Error"}
        
        # Build GeoJSON Point for PostGIS
        lat = req.location.get('lat', 0)
        lng = req.location.get('lng', 0)
        
        # AI embedding generation (optional, if image provided)
        embedding = None
        if req.image_base64 and len(req.image_base64) > 100:
            try:
                embedding = ai_service.generate_embedding(req.image_base64)
            except Exception as e:
                print(f"Embedding gen failed: {e}")
        
        # Prepare data for insert
        insert_data = {
            "nombre": req.name,
            "tipo": req.object_class,
            "descripcion": req.metadata.get('description', ''),
            "posicion": f"POINT({lng} {lat})",  # PostGIS format
            "metadata": {
                **req.metadata,
                "source": req.source,
                "confidence": req.confidence,
                "heading": req.heading,
                "timestamp": req.timestamp,
                # Store image for display in Archives - crop if bbox provided
                "image_base64": (
                    crop_image_base64(req.image_base64, req.bbox)[:500000] 
                    if req.bbox and req.image_base64 and len(req.image_base64) > 100 
                    else (req.image_base64[:500000] if req.image_base64 and len(req.image_base64) > 100 else None)
                )
            }
        }
        
        # Add mission_id if provided
        if req.mission_id:
            insert_data["mission_id"] = req.mission_id
            
        # Add embedding if generated
        if embedding:
            insert_data["embedding"] = embedding
            
        res = supabase.table("objetos_exploracion").insert(insert_data).execute()
        
        if res.data and len(res.data) > 0:
            return {"success": True, "data": res.data[0]}
        else:
            return {"success": False, "error": "Insert failed"}
            
    except Exception as e:
        print(f"Create object error: {e}")
        return {"success": False, "error": str(e)}

@router.put("/{object_id}")
async def update_object(object_id: str, req: ObjectUpdateRequest):
    try:
        supabase = get_supabase()
        if not supabase: return {"success": False}
        update_data = {
            "nombre": req.nombre,
            "descripcion": req.descripcion,
            "subcategoria": req.subcategoria,
            "genero": req.genero
        }
        if req.tipo:
            update_data["tipo"] = req.tipo
            
        res = supabase.table("objetos_exploracion").update(update_data).eq("id", object_id).execute()
        
        if not res.data:
            return {"success": False, "error": "Object not found or not modified"}
            
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.delete("/{object_id}")
async def delete_object(object_id: str):
    try:
        supabase = get_supabase()
        if not supabase: return {"success": False}
        supabase.table("objetos_exploracion").delete().eq("id", object_id).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
