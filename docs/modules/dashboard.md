# 📊 Módulo: Dashboard

Ubicación: `frontend/src/features/dashboard/`

Esta es la vista principal post-login. Muestra el estado del usuario, telemetría vital y acceso a los modos de exploración.

## 📂 Estructura de Archivos

- **`index.js`**: Lógica de presentación, polling de datos y navegación.
- **`template.html`**: Estructura de la interfaz de usuario.
- **`dashboard.css`**: Estilos de HUD y tarjetas de datos.

## ⚙️ Lógica Principal (`index.js`)

### Funciones Clave

#### `render(container)`

- **Acciones**:
  1. Verifica usuario actual (`auth.getUser()`).
  2. Renderiza `template.html`.
  3. Inyecta email del usuario en la UI.
  4. Inicia el polling de telemetría (`pollTelemetry()`).
  5. Configura navegación (Botón "INICIAR EDA" -> `/ar`).

#### `pollTelemetry()`

- **Propósito**: Simula la lectura de sensores biométricos y ambientales.
- **Frecuencia**: Cada 2 segundos.
- **Conexión Backend**:
  - Realiza `fetch('/api/realtime-telemetry')` al backend (FastAPI).
  - Endpoint Backend: `GET /realtime-telemetry` (simulado en `app/main.py`).
- **Datos Mostrados**:
  - Temperatura (ºC)
  - Oxígeno (%)
  - Ritmo Cardíaco (BPM)
  - Radiación (mSv)

### Navegación

- **Botón "Iniciar EDA"**:
  - Realiza `history.pushState(..., '/ar')`.
  - Recarga la página (`window.location.reload()`) para asegurar limpieza de memoria antes de cargar Three.js.

## 🔗 Dependencias Externas

- **Backend API**: `/api/realtime-telemetry`
- **Auth**: Requiere sesión activa.
