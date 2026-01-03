# 🧠 Inteligencia Artificial (IA)

## 🌐 Ecosistema Híbrido
KEPLER implementa una arquitectura de IA híbrida, dividiendo el procesamiento entre el navegador del cliente (Edge AI) para inmediatez y el servidor (Cloud AI) para análisis profundo.

---

## ⚡ Frontend AI (Tiempo Real)

### 1. Detección de Objetos (YOLOv11)
*   **Modelo:** YOLOv11 Nano (`yolo11n.onnx`).
*   **Ejecución:** [ONNX Runtime Web](https://onnxruntime.ai/) con backend WebAssembly (WASM) / WebGL.
*   **Rendimiento:** Optimizado para correr directamente en el navegador a 15-30 FPS.
*   **Propósito:** Detectar e identificar objetos instantáneamente en el feed de video del usuario (AR Mode).

### 2. Estabilización (Filtro de Kalman)
*   **Algoritmo:** Implementación personalizada en JS (`KalmanFilter.js`).
*   **Uso:** Suaviza las coordenadas (Bounding Boxes) de las detecciones de YOLO. Reduce el "jitter" (temblor) de las cajas delimitadoras, proporcionando una experiencia de UI fluida y profesional.

### 3. Object Tracking
*   **Lógica:** Sistema de rastreo (`ObjectTracker.js`) que asigna IDs únicos a los objetos detectados para mantener su identidad a través de los frames, evitando parpadeos de etiquetas.

---

## ☁️ Backend AI (Análisis Profundo)

### 3. Visión Semántica (CLIP)
*   **Modelo:** OpenAI CLIP (ViT-B-32).
*   **Función:** Transforma imágenes en vectores numéricos (embeddings).
*   **Aplicación:** Permite al sistema "recordar" qué ha visto y buscar objetos visualmente similares en el archivo histórico sin depender de etiquetas de texto.

### 4. Inteligencia Generativa (Llama 3)
*   **Modelo:** Meta Llama 3 (8B Parameters).
*   **Ejecución:** Local vía Ollama.
*   **Función:** Actúa como el "Cientifico a Bordo". Recibe datos simples (ej: "Roca") y genera descripciones detalladas, hipótesis geológicas y análisis contextuales ricos para el usuario.

---

## 🔄 Flujo de Datos IA

1.  **Cámara:** Captura frame.
2.  **YOLO (Browser):** Detecta "Objeto A" y dibuja caja.
3.  **Usuario:** Toca "Analizar".
4.  **Backend:**
    *   **CLIP:** Genera vector del "Objeto A".
    *   **Llama 3:** Escribe reporte sobre "Objeto A".
5.  **Supabase:** Guarda Imagen + Vector + Reporte.
