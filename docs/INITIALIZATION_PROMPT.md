# Prompt de Inicialización - Mars-Sight AR

**Úsalo al inicio de nuevas conversaciones para que el AI entienda el contexto del proyecto.**

---

## 📋 Prompt de Contexto

```
Soy el desarrollador de Mars-Sight AR, una aplicación AR de exploración planetaria con IA.

ESTADO ACTUAL DEL PROYECTO:
- Fase 7 Completada (Estabilidad AR + Clasificación + UI Futurista / Settings)
- Fase 8 En Progreso (Entorno Inteligente: Sentinel, Clima, Web Workers)
- Backend con GPU (RTX 3060) optimizado para CLIP embeddings y Llama 3
- Frontend totalmente modular (`ARController`, `ARUI`, `ARData`) con diseño Death Stranding

ARQUITECTURA:
- Frontend: Vite + Vanilla JS + Three.js + TensorFlow.js (COCO-SSD)
- Backend: FastAPI + CUDA + Ollama (Llama 3) + Sentence Transformers (CLIP)
- Database: Supabase + PostgreSQL + PostGIS + pgvector (512 dims)

PROBLEMAS CONOCIDOS:
- YOLOv8 no funciona con Vite (usamos COCO-SSD por ahora)
- Requiere HTTPS para sensores de orientación (iOS 13+)
- Backend debe usar puerto 8001 (8000 lo usa Supabase)

OPTIMIZACIONES APLICADAS:
- **Arquitectura Híbrida**: Detección rápida en móvil (COCO-SSD MobilenetV2) + Inteligencia profunda en servidor (Llama 3).
- **Sensor Fusion**: Complementary Filter mejorado para eliminar jitter.
- **Rendimiento UI**: Modales optimizados, Grid System, y Camera Toggle para ahorro de batería.
- **AI Throttling**: Ajuste de intervalo de detección (15 frames) para 60 FPS estables en iPhone.

Revisa /docs/PROJECT_STATUS.md para el estado completo del proyecto.

¿En qué puedo ayudarte hoy?
```

---

## 🎯 Comandos de Inicio Rápido

Si necesitas que el AI arranque los servicios:

```
Arranca el backend y frontend del proyecto Mars-Sight AR.

Backend: puerto 8001, GPU CUDA habilitado
Frontend: puerto 5180, HTTPS

Verifica que todo esté funcionando correctamente.
```

---

## 📁 Archivos Clave de Referencia

Menciona estos archivos si necesitas que el AI los revise:

### Estado del Proyecto

- `/docs/PROJECT_STATUS.md` - Estado actual completo
- `/docs/INSTALLATION.md` - Setup e instalación
- `/.gemini/antigravity/brain/*/task.md` - Tasks actuales

### Configuración

- `/frontend/vite.config.js` - Proxy backend (puerto 8001)
- `/backend/app/main.py` - API endpoints y GPU config
- `/frontend/src/js/engines/AIEngine.js` - Detección móvil adaptativa

### Fixes Críticos Aplicados

- `/backend/migrations/fix_buscar_objetos_cercanos.sql` - lat/lng floats
- `/frontend/src/js/services/DatabaseService.js` - Coordenadas parsing
- `/frontend/src/features/ar/index.js` - COCO-SSD import

### Documentación

- `/docs/backend-gpu-optimization.md` - CUDA optimizations
- `/docs/features/phase7-continuous-learning.md` - Teach Mode
- `/docs/features/phase8-visual-similarity.md` - Visual search
- `/docs/ai-model-alternatives.md` - Modelos AI evaluados

### 🚧 ROADMAP ACTIVO (Fase 8: Intelligent Environment)

Estas son las tareas pendientes prioritarias:

1. **Web Worker Optimization (Performance)**:

   - Mover la detección de TF.js a un hilo secundario (Worker).
   - Eliminar lag de UI completamente y aumentar tasa de detección.

2. **Sentinel Mode (Auto-Detection)**:

   - Configurar IA para monitoreo pasivo (Person, Animal).
   - Guardar en DB automáticamente con Rate Limiting.

3. **Módulo Clima & Enriquecimiento**:
   - Integrar OpenMeteo API.
   - Post-proceso con Llama 3 para descripciones narrativas.

---

## ⚠️ Importante Recordar

**Si el AI sugiere optimizaciones COCO-SSD:**

```
NO apliques cambios a AIEngine.js sin probar uno por uno.

Cambios que rompen la detección:
- ❌ Forzar WebGL backend
- ❌ minScore: 0.3
- ❌ Frame caching sin inicialización
- ✅ Mobile adaptive detection (ya implementado y funciona)
```

**Si el AI menciona YOLOv8:**

```
YOLOv8 NO es compatible actualmente por issues de Vite con .mjs imports.
Alternativas:
1. Implementar YOLOv8 en backend (Python)
2. Migrar a MediaPipe (3-4 horas)
3. Mantener COCO-SSD (funciona bien actualmente)
```

**Configuración de puertos:**

```
Backend FastAPI: puerto 8001 (NO 8000)
Frontend Vite: puerto 5180
Supabase: puerto 8000
```

---

## 🔍 Preguntas Frecuentes para el AI

### "¿Cómo inicio el proyecto?"

Ver sección "Cómo Iniciar" en `/docs/PROJECT_STATUS.md`

### "¿Cómo optimizo la detección de objetos?"

- Móvil: Ya optimizado con adaptive detection
- Desktop: Funciona bien con config default
- No aplicar cambios de parámetros sin testing incremental

### "¿Por qué el backend usa puerto 8001?"

Supabase local usa puerto 8000. Backend debe usar 8001.

### "¿Funciona YOLOv8?"

No actualmente. Ver `/docs/ai-model-alternatives.md` para opciones.

### "¿Cómo funciona el GPU en backend?"

RTX 3060 con CUDA. CLIP usa ~800MB VRAM. Ver `/docs/backend-gpu-optimization.md`

### "¿Por qué los objetos no aparecen en AR?"

Verificar:

1. Migración SQL `fix_buscar_objetos_cercanos.sql` aplicada
2. DatabaseService usando lat/lng floats (no WKB)
3. Radio de búsqueda: 1km default

---

## 📊 Métricas de Rendimiento Esperadas

```
Backend:
- CLIP embedding: 50-100ms (GPU)
- Visual search: 80-150ms
- Llama 3 description: 2-3s

Frontend:
- COCO-SSD detection (mobile): ~267ms (cada 4 frames)
- COCO-SSD detection (desktop): ~133ms (cada 2 frames)
- AR 3D rendering: 60 FPS constante

VRAM:
- Backend: ~800MB / 12.48GB (6% usage)
```

---

## 🎓 Resumen del Contexto Técnico

**Frontend Stack:**

- Vanilla JavaScript (ES6+)
- Three.js para renderizado 3D
- TensorFlow.js con COCO-SSD
- Supabase client para DB

**Backend Stack:**

- FastAPI (Python)
- PyTorch + CUDA
- Sentence Transformers (CLIP ViT-B-32)
- Ollama (Llama 3 8B)

**Database:**

- PostgreSQL (Supabase)
- PostGIS para coordenadas
- pgvector para embeddings
- Funciones SQL custom para búsqueda

**Dispositivo de Testing:**

- iPhone 13 Pro Max
- Safari browser
- Optimizado con adaptive frame detection

---

## ✅ Checklist de Verificación Inicial

Usa esto para que el AI verifique el estado:

```
[ ] Backend corriendo en puerto 8001
[ ] Frontend corriendo en puerto 5180
[ ] GPU CUDA detectada en backend logs
[ ] CLIP model cargado en CUDA
[ ] Proxy Vite apuntando a localhost:8001
[ ] Supabase conectado
[ ] Ollama service activo (puerto 11434)
```

---

## 🚀 Ejemplo de Inicio de Conversación

```
Hola, trabajo en Mars-Sight AR.

Estado: Phases 7 y 8 completadas, GPU optimizado, mobile optimizado.

Quiero [tu objetivo aquí: agregar feature / debuggear issue / optimizar algo]

Revisa /docs/PROJECT_STATUS.md primero para context.
```

---

**Última actualización:** 2025-12-21  
**Versión prompt:** 1.0  
**Compatibilidad:** Funciona con Claude, GPT-4, Gemini Pro
