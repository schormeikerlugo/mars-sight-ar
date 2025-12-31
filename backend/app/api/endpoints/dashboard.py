from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    # Use Service Role Key for Dashboard Stats to ensure visibility of all data
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
    return create_client(url, key)

@router.get("/stats")
async def get_dashboard_stats():
    """
    Returns aggregated stats for the dashboard:
    - Counts for POIs, Minerals, Missions, Objects
    - Recent lists for each
    """
    supabase = get_supabase()
    
    try:
        # Tables: misiones, objetos_exploracion
        # POIs/Minerals not yet implemented in DB, return 0
        
        try:
            missions_count = supabase.table("misiones").select("*", count="exact", head=True).execute().count
            missions_data = supabase.table("misiones").select("*").order("inicio_at", desc=True).limit(5).execute().data
        except:
             missions_count = 0
             missions_data = []

        try:
             objects_count = supabase.table("objetos_exploracion").select("*", count="exact", head=True).execute().count
             objects_data = supabase.table("objetos_exploracion").select("*").order("created_at", desc=True).limit(5).execute().data
        except:
             objects_count = 0
             objects_data = []

        # Placeholders for future tables
        pois_count = 0
        minerals_count = 0
        pois_data = []
        minerals_data = []
        
        return {
            "counts": {
                "pois": pois_count,
                "minerals": minerals_count,
                "missions": missions_count,
                "objects": objects_count
            },
            "recent": {
                "pois": pois_data,
                "minerals": minerals_data,
                "missions": missions_data, 
                "objects": objects_data
            }
        }
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return {
             "counts": {"pois": 0, "minerals": 0, "missions": 0, "objects": 0}, 
             "recent": {"pois": [], "minerals": [], "missions": [], "objects": []},
             "error": str(e)
        }
