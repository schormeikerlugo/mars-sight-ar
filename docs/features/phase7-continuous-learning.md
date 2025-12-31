# Phase 7: Continuous Learning & Ollama Integration

## Overview

Phase 7 adds **AI-powered object learning** to Mars-Sight AR, allowing users to teach the system new objects with natural language descriptions in Spanish.

## Architecture

```
User → AR Interface → Backend AI → Database
                ↓
         CLIP Embedding (512D)
         Llama 3 Description
```

## Components

### Backend APIs

#### 1. `/api/generate-embedding`

**Purpose:** Generate 512D visual embeddings using CLIP

**Request:**

```json
{
  "image_base64": "data:image/jpeg;base64,..."
}
```

**Response:**

```json
{
  "embedding": [0.123, -0.456, ...]  // 512 floats
}
```

**Implementation:**

- Model: `clip-ViT-B-32`
- Library: `sentence-transformers`
- Processing time: 200-400ms

#### 2. `/api/enrich-data`

**Purpose:** Generate natural Spanish descriptions using Llama 3

**Request:**

```json
{
  "label": "Silla Roja"
}
```

**Response:**

```json
{
  "description": "Una silla de color rojo situada en el espacio..."
}
```

**Implementation:**

- Model: `llama3:8b-instruct-q6_K`
- Library: `ollama`
- Processing time: 1-3s
- Language: Spanish (forced via prompt)

### Frontend Components

#### Teach Mode Workflow

1. **User Action:** Presses ENSEÑAR button
2. **Modal Opens:** User inputs object label
3. **Capture:** `AREngine.captureFrame()` captures video frame
4. **Parallel API Calls:**
   - `/api/generate-embedding` → Visual fingerprint
   - `/api/enrich-data` → AI description
5. **Save:** `DatabaseService.createObject()` saves to Supabase
6. **Immediate Feedback:**
   - Toast notification
   - Description modal
   - AR marker appears

#### Key Methods

**`handleTeachObject(label)`**

```javascript
// Location: frontend/src/features/ar/index.js
async handleTeachObject(label) {
  // 1. Capture frame
  const capturedImage = this.arEngine.captureFrame();

  // 2. Parallel AI calls
  const [embeddingRes, docRes] = await Promise.all([
    fetch('/api/generate-embedding', ...),
    fetch('/api/enrich-data', ...)
  ]);

  // 3. Calculate GPS position (5m ahead)
  const newLat = lat + (d / R) * ...;
  const newLng = lng + (d / R) * ...;

  // 4. Save with metadata
  const newObj = await dbService.createObject({
    title, lat, lng, embedding,
    metadata: { description, registered_by, timestamp }
  });

  // 5. Update UI
  this.state.missions.push(newObj);
  this.renderMarkers();
}
```

## Database Schema

### Table: `objetos_exploracion`

**New/Modified Columns:**

- `embedding` - vector(512) - CLIP visual embedding
- `descripcion` - text - Llama 3 Spanish description
- `metadata` - jsonb - Additional data (registered_by, timestamp, etc.)

**Indexes:**

```sql
CREATE INDEX ON objetos_exploracion
USING ivfflat (embedding vector_cosine_ops);
```

## Critical Fixes

### Fix 1: Vector Dimension Mismatch

**Problem:** Database had vector(1024), CLIP outputs 512D  
**Solution:** Migration `fix_embedding_dimension.sql`

```sql
ALTER TABLE objetos_exploracion DROP COLUMN embedding;
ALTER TABLE objetos_exploracion ADD COLUMN embedding vector(512);
```

### Fix 2: Camera Freeze

**Problem:** `alert()` calls blocked UI thread  
**Solution:** Replaced with modals and toasts

```javascript
// Before: alert("ERROR: " + e.message);
// After: this.showToast("Error: " + e.message, 3000);
```

### Fix 3: Description Not Saving

**Problem:** Column `descripcion` was NULL  
**Solution:** Added to INSERT statement

```javascript
descripcion: metadata.description || "";
```

## Configuration

### Backend (`backend/app/main.py`)

```python
# Ollama model
OLLAMA_MODEL = 'llama3:8b-instruct-q6_K'

# CLIP model
CLIP_MODEL = 'clip-ViT-B-32'

# Prompt template
PROMPT = """Eres un asistente que describe objetos...
RESPONDE SOLO EN ESPAÑOL."""
```

### Frontend

```javascript
// Teach button position
const teachBtn = document.getElementById("btn-teach");

// Modal IDs
("teach-modal"); // Input modal
("description-modal"); // Output modal
```

## Usage

### Teaching a New Object

1. Point camera at object
2. Press **ENSEÑAR**
3. Enter label (e.g., "Mesa de Madera")
4. Wait for AI processing (~3-4 seconds)
5. Read Llama 3 description
6. Close modal
7. Object appears in AR with marker

### Viewing Saved Objects

- Objects persist in Supabase
- Load on app start within 1km radius
- Tap marker to see description
- Metadata shows who registered and when

## Performance

- **Image capture:** <50ms
- **Embedding generation:** 200-400ms
- **Description generation:** 1-3s
- **Total teach time:** ~3-4 seconds

## Security

- User authentication required (Supabase Auth)
- User email stored with each object
- Timestamps for audit trail

## Next Steps

- [ ] Batch teaching (multiple objects)
- [ ] Edit descriptions
- [ ] Delete objects
- [ ] Share objects with other users
