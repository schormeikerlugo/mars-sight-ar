# Backend Mars-Sight AR - Análisis Detallado

## 📊 Tamaño Total: 7.8 GB

### Desglose por Componente

```
backend/
├── venv/ ..................... 7.8 GB (99%)
│   ├── nvidia/ ............... 4.3 GB ❌ INNECESARIO
│   ├── torch/ ................ 1.7 GB ✅ NECESARIO
│   ├── triton/ ............... 594 MB ❌ INNECESARIO
│   ├── transformers/ ......... 115 MB ✅ NECESARIO
│   ├── scipy/ ................ 113 MB ✅ NECESARIO
│   ├── opencv/ ............... 179 MB ⚠️ REVISAR
│   ├── onnx/ ................. 80 MB ❌ INNECESARIO
│   └── otros/ ................ ~700 MB
├── app/ ...................... 84 KB
├── migrations/ ............... 16 KB
└── otros ..................... ~60 KB
```

---

## ⚙️ Funciones Implementadas

### 1. `/api/realtime-telemetry` ✅ **EN USO**

**Archivo:** `backend/app/main.py:62-74`
**Propósito:** Telemetría simulada del traje espacial
**Dependencias:** Ninguna (solo Python stdlib)
**Uso:** Dashboard llama cada 1 segundo

```python
# Datos que devuelve:
{
  "heart_rate": 60-90,
  "suit_pressure": 14.5-14.8 PSI,
  "temperature": 20-24°C,
  "oxygen_level": 95-100%,
  "radiation": 0.01-0.05 mSv,
  "timestamp": ISO format
}
```

### 2. `/api/generate-embedding` ✅ **EN USO (Phase 7)**

**Archivo:** `backend/app/main.py:137-159`
**Propósito:** Genera embedding visual 512D con CLIP
**Dependencias:**

- `sentence-transformers` (115 MB)
- `torch` (1.7 GB) ⭐ **Problema: incluye CUDA innecesario**
- `Pillow` (necesario)

**Modelo:** `clip-ViT-B-32`
**Uso:** Cuando usuario presiona ENSEÑAR

```python
Input: image_base64 (JPEG/PNG en Base64)
Output: [0.123, -0.456, ...] # 512 floats
```

### 3. `/api/enrich-data` ✅ **EN USO (Phase 7)**

**Archivo:** `backend/app/main.py:110-135`
**Propósito:** Genera descripción en español con Llama 3
**Dependencias:**

- `ollama` (cliente Python, ~5MB)
- Ollama service (puerto 11434, externo)

**Modelo:** `llama3:8b-instruct-q6_K` (descargado por Ollama)
**Uso:** Cuando usuario presiona ENSEÑAR

```python
Input: label (string, ej: "Silla Roja")
Output: "Una silla de color rojo situada en el espacio..."
```

### 4. `/api/search-similar` ✅ **EN USO (Phase 8)**

**Archivo:** `backend/app/main.py:161-196`
**Propósito:** Búsqueda visual por similitud
**Dependencias:**

- CLIP model (igual que `/api/generate-embedding`)
- `supabase` client

**Uso:** Durante SCAN (automático)

```python
Input: image_base64
Process:
  1. Genera embedding con CLIP
  2. Llama a Supabase RPC search_similar_objects()
  3. Cosine similarity con pgvector
Output: Top 3 matches con similarity > 75%
```

---

## 🔴 Problemas de Espacio

### Problema 1: PyTorch con CUDA (6 GB desperdiciados)

**Causa:** `requirements.txt` tiene `torch>=2.2.0` que instala versión con CUDA por defecto

**Solución:**

```txt
# Antes (requirements.txt)
torch>=2.2.0

# Después (solo CPU)
torch>=2.2.0 --index-url https://download.pytorch.org/whl/cpu
```

**Ahorro:** ~5 GB (CUDA 4.3 GB + Triton 594 MB)

### Problema 2: ONNX innecesario (80 MB)

**Causa:** Se instaló para YOLOv8 pero nunca se activó

**Solución:**

- Opción A: Eliminar si no planeas usar YOLOv8
- Opción B: Mantener si quieres activar YOLOv8 en el futuro

**Ahorro:** 80 MB

### Problema 3: OpenCV redundante (179 MB)

**Causa:** `sentence-transformers` puede usar OpenCV O Pillow

**Verificación necesaria:** ¿Se puede usar solo Pillow?

**Ahorro potencial:** 179 MB

---

## ✅ Dependencias Necesarias

| Paquete                   | Tamaño     | Uso                    |
| ------------------------- | ---------- | ---------------------- |
| **PyTorch (CPU)**         | ~500 MB    | CLIP embeddings        |
| **sentence-transformers** | 115 MB     | Wrapper de CLIP        |
| **transformers**          | (incluido) | Hugging Face models    |
| **scipy**                 | 113 MB     | Cálculos vectoriales   |
| **Pillow**                | ~10 MB     | Procesamiento imágenes |
| **ollama**                | ~5 MB      | Cliente Llama 3        |
| **supabase**              | ~5 MB      | Cliente DB             |
| **fastapi/uvicorn**       | ~50 MB     | Servidor web           |

**Total necesario:** ~800 MB (vs 7.8 GB actual)

---

## 🚀 Optimización Recomendada

### Opción 1: Reinstalar con PyTorch CPU-only

```bash
# Eliminar venv actual
rm -rf venv/

# Crear nuevo venv
python3 -m venv venv
source venv/bin/activate

# Instalar PyTorch CPU-only PRIMERO
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Luego requirements normales
pip install -r requirements.txt
```

**Resultado esperado:** ~1.5 GB total (vs 7.8 GB)

### Opción 2: Crear requirements optimizado

```txt
# backend/requirements-optimized.txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
supabase>=2.3.0
python-dotenv>=1.0.0
ollama>=0.1.6
sentence-transformers>=2.3.1
Pillow>=10.2.0

# PyTorch CPU-only (instalar separado con --index-url)
```

---

## 📝 Resumen

**Funciones que SÍ se usan:**

1. ✅ Telemetría simulada (stdlib)
2. ✅ CLIP embeddings (PyTorch + sentence-transformers)
3. ✅ Llama 3 descriptions (Ollama)
4. ✅ Visual similarity search (CLIP + Supabase)

**Dependencias innecesarias:**

- ❌ NVIDIA CUDA: 4.3 GB
- ❌ Triton: 594 MB
- ⚠️ ONNX: 80 MB (solo si no usas YOLOv8)
- ⚠️ OpenCV: 179 MB (si Pillow es suficiente)

**Ahorro potencial:** 5-6 GB reduciendo a ~1.5-2 GB total

---

## ⏭️ Próximos Pasos

¿Quieres que:

1. **Reinstale el venv con PyTorch CPU-only?** (10-15 mins, ahorra 5 GB)
2. **Cree requirements optimizado?** (2 mins)
3. **Revise si OpenCV es necesario?** (5 mins)
4. **Deje todo como está?**

Dime qué prefieres y procedo. 🚀
