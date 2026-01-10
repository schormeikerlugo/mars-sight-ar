# 🔔 Realtime y Sistema de Notificaciones

Esta documentación cubre la implementación del sistema de notificaciones en tiempo real, persistencia y sincronización de KEPLER.

---

## Arquitectura Híbrida

El sistema de notificaciones utiliza una arquitectura híbrida para garantizar velocidad y portabilidad:

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   PostgreSQL    │◀───▶│ Supabase API    │◀───▶│   Frontend       │
│(user_notifications)│     │                 │     │   (NotificationStore)   │
└─────────────────┘     └─────────────────┘     └─────────┬────────┘
                                                          │
                                                          ▼
                                                    ┌─────────────┐
                                                    │ localStorage│
                                                    │   (Cache)   │
                                                    └─────────────┘
```

1.  **Sincronización:** Las notificaciones se guardan en la tabla `user_notifications` de Supabase.
2.  **Caché Offline:** Se mantiene una copia en `localStorage` para carga instantánea y soporte offline.
3.  **Realtime:** Se escucha eventos websocket para actualizaciones instantáneas (ej. nuevas misiones).

---

## Componentes

### 1. NotificationStore.js
**Ubicación:** `frontend/src/js/services/NotificationStore.js`

Gestor de estado singleton que coordina la sincronización entre Supabase y localStorage.

| Método | Descripción |
|--------|-------------|
| `init()` | Carga caché local y sincroniza cambios desde Supabase |
| `add(message, type)` | Guarda en Local → Envía a Supabase (Background) |
| `deleteById(id)` | Elimina en Local → Elimina en Supabase |
| `deleteByDate(date)` | Batch delete por fecha (Local + DB) |
| `clearAll()` | Borra historial completo (Local + DB) |
| `getGroupedByDate()` | Retorna notificaciones para la UI (Bitácora) |

**Características:**
- **Sync:** Automático al iniciar y al realizar acciones.
- **Retención:** 30 días (gestión automática).
- **Fallback:** Funciona completamente offline si es necesario.

---

### 2. NotificationSystem.js
**Ubicación:** `frontend/src/js/components/NotificationSystem.js`

Controlador de la interfaz de usuario (HUD) y lógica de presentación.

**Características UI:**
- **Panel Bitácora:** Deslizable desde la derecha.
- **Filtros Dinámicos:** Tabs para filtrar por Todos, Crítico, Alerta, Éxito, Info.
- **Contadores:** Badges con números reales por categoría.
- **Scroll Infinito:** Optimizado con `flexbox` y scrollbars personalizados.
- **Modales:** Integración con `ModalSystem` para confirmaciones de borrado.

**Tipos Visuales:**
| Tipo | Icono | Duración | Color |
|------|-------|----------|-------|
| **Critical** | 🚨 | Persistente | Rojo (#ff4444) |
| **Warning** | ⚡ | 7s | Naranja (#ffbb33) |
| **Success** | ✅ | 4s | Verde (#00d4aa) |
| **Info** | ℹ️ | 5s | Azul (#3fa8ff) |

---

### 3. ModalSystem.js
**Ubicación:** `frontend/src/js/components/ModalSystem.js`

Sistema de diálogos modales reutilizable y estético que reemplaza los `confirm()` nativos.

**Uso:**
```javascript
import { modalSystem } from './ModalSystem.js';

const confirmed = await modalSystem.confirm('¿Estás seguro?', 'DELETE');
if (confirmed) {
    // Acción destructiva
}
```

**Temas:**
- `DELETE` (Rojo): Acciones destructivas.
- `FINISH` (Azul): Finalizar procesos.
- `CONFIRM` (Verde): Aceptación general.

---

### 4. RealtimeService.js
**Ubicación:** `frontend/src/js/services/RealtimeService.js`

Escucha cambios en `public.misiones` y gatilla notificaciones automáticas.

---

## Base de Datos (Supabase)

### Tabla: `user_notifications`
Almacenamiento persistente por usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK -> auth.users |
| `message` | TEXT | Contenido |
| `type` | VARCHAR | Tipo de alerta |
| `read` | BOOLEAN | Estado de lectura |
| `created_at` | TIMESTAMPTZ | Fecha envío |

### Seguridad (RLS)
- **Select:** Solo el dueño del registro (`auth.uid() = user_id`)
- **Insert:** Solo el dueño.
- **Delete:** Solo el dueño.

---

## Troubleshooting

### Notificaciones no sincronizan
1. Verificar sesión activa (`supabase.auth.getUser()`).
2. Revisar consola por errores de RLS (403 Forbidden).
3. Confirmar que la tabla `user_notifications` existe en Supabase.

### Modal invisible
El modal usa `z-index: 20000` y `position: fixed`. Verificar que no haya estilos `overflow: hidden` en el `body` que prevengan su visualización, o conflictos de z-index con otros overlays.
