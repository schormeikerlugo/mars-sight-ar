# 🔐 Módulo: Login

Ubicación: `frontend/src/features/login/`

Este módulo gestiona la autenticación de usuarios, permitiendo iniciar sesión o registrarse mediante Supabase Auth.

## 📂 Estructura de Archivos

- **`index.js`**: Controlador lógico. Maneja eventos del formulario y llamadas a `auth.js`.
- **`template.html`**: Estructura HTML del formulario (Login Card).
- **`login.css`**: Estilos encapsulados para la vista de login.

## ⚙️ Lógica Principal (`index.js`)

### Funciones Clave

#### `render(container)`

- **Propósito**: Inyecta el HTML en el contenedor principal e inicializa los listeners.
- **Acciones**:
  1. Carga `template.html`.
  2. Importa `login.css`.
  3. Selecciona elementos del DOM (`#login-form`, `#btn-login`, `#btn-register`).
  4. Asigna eventos de click/submit.

#### `handleAuth(mode)`

- **Propósito**: Ejecuta la lógica de autenticación frente a Supabase.
- **Parámetros**: `mode` ('login' o 'register').
- **Conexión Backend**:
  - Llama a `auth.login(email, password)` o `auth.register(...)` (definidos en `src/js/auth.js`).
  - Estas funciones usan el cliente de Supabase (`supabase.auth.signInWithPassword` / `signUp`).
- **Manejo de Errores**: Muestra mensajes en `#error-msg` si falla la conexión o las credenciales.
- **Éxito**: Redirige a la raíz `/` (donde `main.js` cargará el Dashboard).

## 🎨 Interfaz (`template.html` & `login.css`)

- **Diseño**: Tarjeta centrada vertical y horizontalmente sobre fondo animado (`stars-background`).
- **Responsive**: Ajustado para móviles usando `100dvh` y anchos flexibles.
- **Estilos**: Tema oscuro "Cyberpunk/Sci-Fi" con colores neón (Naranja/Azul).

## 🔗 Dependencias Externas

- **`src/js/auth.js`**: Wrapper de Supabase que contiene la instancia del cliente y métodos helpers.
