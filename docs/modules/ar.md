# 🕶️ Módulo: Vista AR

Ubicación: `frontend/src/features/ar/`

El núcleo de la aplicación. Combina video en tiempo real, renderizado 3D, geolocalización y detección de objetos.

## 📂 Estructura de Archivos

- **`index.js`**: Controlador AR. Orquestador de Motores.
- **`template.html`**: Estructura del HUD (Heads-Up Display).
- **`ar.css`**: Estilos de UI superpuesta y capas Z-index.

## ⚙️ Arquitectura de Motores (`src/js/engines/`)

El módulo AR inicializa y coordina varias clases especializadas:

### 1. `AREngine.js` (Three.js)

- **Responsabilidad**: Renderizado 3D y Video de fondo.
- **Componentes**:
  - `THREE.WebGLRenderer`: Capa intermedia (Z-Index 10).
  - `HTMLVideoElement`: Capa fondo (Z-Index 5).
  - `ScannerEffect`: Efecto visual de malla wireframe en el suelo.
- **Gestión de Escena**: Mantiene un `worldGroup` que rota inversamente a la brújula para simular orientación.

### 2. `GPSEngine.js`

- **Responsabilidad**: Obtener posición (Lat/Lng) y Orientación (Brújula).
- **APIs**:
  - `navigator.geolocation.watchPosition`: Para coordenadas.
  - `deviceorientationabsolute` (o fallback): Para rumbo magnético (Heading).

### 3. `AIEngine.js` (TensorFlow.js)

- **Responsabilidad**: Detectar objetos en el video feed.
- **Modelo**: `coco-ssd` (Pre-entrenado).
- **Salida**: Bounding Boxes y Clases (persona, botella, etc.).

## 🔄 Flujo de Datos y Lógica (`index.js`)

### Inicialización (`init`)

1. Carga `template.html`.
2. Solicita permisos de Sensores (iOS requiere click explícito).
3. Inicia `AREngine` (Cámara + Three.js).
4. Inicia `GPSEngine` (GPS + Brújula).
5. Inicia `AIEngine` (Carga modelo).

### Loop Principal (`loop`)

- Actualiza la posición de las etiquetas HTML (`.ar-label`) proyectando las coordenadas 3D de los marcadores (`THREE.Vector3`) a coordenadas de pantalla 2D.
- Gestiona la visibilidad basada en si el objeto está frente a la cámara.

### Interacción con Base de Datos (`DatabaseService`)

#### `loadWorldData()`

- **Trigger**: Al obtener primera posición GPS o botón "SCAN".
- **Acción**: Llama a `dbService.getNearbyObjects(lat, lng, radio)`.
- **Resultado**: Recibe lista de POIs y crea marcadores 3D (`MarkerSystem`) en la escena.

#### `addMarkerAtCurrentView()`

- **Trigger**: Botón "MARCAR".
- **Lógica**:
  - Calcula una posición a 5 metros frente al usuario basándose en su Heading actual.
  - Fórmula de Haversine inversa.
- **Acción**: Llama a `dbService.createObject(...)`.

## 📱 Consideraciones Móviles

- **Z-Index**:
  - Video: 5
  - Canvas 3D: 10
  - UI HTML: 20
- **Safe Areas**: Uso de `env(safe-area-inset-bottom)` en CSS para evitar conflicto con barras de gestos.
