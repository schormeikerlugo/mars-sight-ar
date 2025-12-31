# Alternativas a COCO-SSD para Detección de Objetos en Browser

## Modelo Actual: COCO-SSD

**Especificaciones:**

- Modelo: MobileNet V2 + SSD
- Tamaño: ~27 MB
- Clases: 80 objetos COCO
- Velocidad: 150-200ms (CPU) / ~50ms (GPU con WebGL)
- Rango efectivo: 0.5-15m (con multi-escala)

---

## 🎯 Alternativas Disponibles (TensorFlow.js)

### 1. **EfficientDet (Recomendado)**

**Pros:**

- Mejor precisión que COCO-SSD (~10-15% mejora en mAP)
- Múltiples variantes (D0-D7)
- Optimizado para eficiencia
- Soporta GPU/WebGL

**Cons:**

- Tamaño mayor (50-200 MB dependiendo de variante)
- Ligeramente más lento en CPU

**Implementación:**

```javascript
// @tensorflow-models/efficientdet
import * as efficientdet from "@tensorflow-models/efficientdet";
const model = await efficientdet.load();
```

**Variantes:**
| Modelo | Tamaño | Velocidad CPU | Precisión (mAP) |
|--------|--------|---------------|-----------------|
| EfficientDet-D0 | ~50 MB | 300-400ms | 34.6% |
| EfficientDet-D1 | ~80 MB | 500-600ms | 40.5% |

**Recomendación:** EfficientDet-D0 para balance performance/precisión

---

### 2. **MobileNet V3 SSD**

**Pros:**

- Versión mejorada de MobileNet V2 (actual)
- ~15% más rápido con misma precisión
- Tamaño similar (~25-30 MB)

**Cons:**

- Mejora marginal vs V2
- Requiere conversión manual a TF.js

**Estado:** No hay package oficial `@tensorflow-models`, requiere modelo custom

---

### 3. **TensorFlow.js Custom Model (YOLOv5)**

**Pros:**

- Mejor precisión que COCO-SSD
- Más rápido en detección (~100ms CPU)
- Mejor para objetos pequeños/lejanos

**Cons:**

- Requiere conversión TFLite → TF.js
- Sin package oficial
- Tamaño grande (40-80 MB)

**Implementación:** Requiere workflow custom

---

### 4. **MediaPipe Object Detection**

**Pros:**

- Optimizado por Google para mobile/web
- Muy rápido (60+ FPS posible)
- Modelos compactos (10-20 MB)
- WebGPU support

**Cons:**

- Solo 1 clase detectable a la vez (single-shot)
- Menos clases que COCO
- API diferente (no TF.js directo)

**Package:** `@mediapipe/tasks-vision`

---

## 📊 Comparativa Completa

| Modelo                  | Tamaño | CPU Speed | GPU Speed | Precisión | Clases | Compatibilidad |
| ----------------------- | ------ | --------- | --------- | --------- | ------ | -------------- |
| **COCO-SSD (actual)**   | 27 MB  | 150-200ms | ~50ms     | Media     | 80     | ✅ Excelente   |
| **EfficientDet-D0**     | 50 MB  | 300-400ms | ~80ms     | Alta      | 80     | ✅ Buena       |
| **MobileNet V3 SSD**    | 28 MB  | 120-180ms | ~40ms     | Media+    | 80     | ⚠️ Manual      |
| **YOLOv5-nano (TF.js)** | 40 MB  | 100-150ms | ~30ms     | Alta      | 80     | ⚠️ Custom      |
| **MediaPipe**           | 15 MB  | 16-33ms   | 8-16ms    | Media     | 1-10   | ✅ Buena       |

---

## 🚀 Opciones Recomendadas

### Opción A: **EfficientDet-D0** (Mayor Precisión)

**Cuándo usarlo:**

- Necesitas mejor detección de objetos lejanos
- Puedes sacrificar 100-150ms de latencia
- Quieres mejorar reconocimiento

**Instalación:**

```bash
npm install @tensorflow-models/efficientdet
```

**Código:**

```javascript
import * as efficientdet from '@tensorflow-models/efficientdet';

async init(videoElement) {
  this.model = await efficientdet.load();
  this.videoElement = videoElement;
  this.startDetection();
}

async detect(video) {
  const predictions = await this.model.detect(video);
  return predictions;
}
```

---

### Opción B: **MediaPipe Object Detection** (Máxima Velocidad)

**Cuándo usarlo:**

- Necesitas 60 FPS
- Dispositivos de gama baja
- Detección en tiempo real crítica

**Instalación:**

```bash
npm install @mediapipe/tasks-vision
```

**Código:**

```javascript
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';

async init(videoElement) {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  this.detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/efficientdet_lite0.tflite'
    },
    runningMode: 'VIDEO'
  });
}
```

---

### Opción C: **Mantener COCO-SSD Optimizado** (Actual)

**Cuándo usarlo:**

- Funciona bien actualmente
- No quieres riesgo de incompatibilidades
- Ya tienes multi-escala implementado

**Mejoras posibles:**

1. ✅ **WebGL Backend** (ya lo tienes)
2. ✅ **Multi-escala** (ya implementado)
3. ⚠️ **Quantización INT8** (reducir tamaño modelo)

---

## 💡 Recomendación Final

Basado en tus specs (RTX 3060, optimizado para GPU):

### **Si quieres máxima precisión:**

→ **EfficientDet-D0** (+15% precisión, +100ms latencia)

### **Si quieres máxima velocidad:**

→ **MediaPipe** (60 FPS, pero menos flexible)

### **Si quieres balance:**

→ **Mantener COCO-SSD actual** con estas optimizaciones:

1. **Activar WebGL backend explícitamente:**

```javascript
import * as tf from "@tensorflow/tfjs";
await tf.setBackend("webgl");
await tf.ready();
```

2. **Ajustar iouThreshold** para mejor detección:

```javascript
this.iouThreshold = 0.3; // Más sensible (default: 0.5)
```

3. **Implementar caching de predicciones** para objetos estáticos

---

## 📦 Código de Migración (EfficientDet)

Si decides probar EfficientDet, aquí está el cambio mínimo:

```javascript
// AIEngine.js
import * as efficientdet from "@tensorflow-models/efficientdet";

export class AIEngine {
  async init(videoElement) {
    console.log("AI: Loading EfficientDet model...");

    // Load EfficientDet-D0 (best balance)
    this.model = await efficientdet.load("efficientdet-d0");

    console.log("AI: Model loaded.");
    this.videoElement = videoElement;
    this.startDetection();
  }

  async detect(video) {
    const predictions = await this.model.detect(video, {
      maxDetections: 20,
      scoreThreshold: 0.3,
    });

    return predictions.map((pred) => ({
      class: pred.class,
      score: pred.score,
      bbox: pred.bbox,
    }));
  }
}
```

---

## ⏱️ Tiempo de Implementación Estimado

| Opción                             | Tiempo    | Riesgo |
| ---------------------------------- | --------- | ------ |
| Mantener COCO-SSD + optimizaciones | 30 min    | Bajo   |
| Migrar a EfficientDet-D0           | 2-3 horas | Medio  |
| Migrar a MediaPipe                 | 4-5 horas | Alto   |

---

**¿Qué prefieres?**

1. ✅ Mantener COCO-SSD y optimizarlo más
2. 🚀 Probar EfficientDet-D0 para mejor precisión
3. ⚡ Explorar MediaPipe para máxima velocidad
