# 🔔 Realtime y Sistema de Notificaciones

Esta documentación cubre la implementación del sistema de notificaciones en tiempo real de KEPLER.

---

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   PostgreSQL    │────▶│ Supabase        │────▶│   Frontend       │
│   (misiones)    │     │ Realtime v2.68  │     │   WebSocket      │
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   INSERT/UPDATE           Publication          NotificationSystem
   DELETE events          supabase_realtime     + NotificationStore
```

---

## Componentes

### 1. NotificationStore.js
**Ubicación:** `frontend/src/js/services/NotificationStore.js`

Maneja la persistencia del historial de notificaciones.

| Método | Descripción |
|--------|-------------|
| `add(message, type)` | Añade notificación y retorna ID |
| `deleteById(id)` | Elimina notificación individual |
| `deleteByDate(date)` | Elimina todas las de un día |
| `clearAll()` | Borra todo el historial |
| `getGroupedByDate()` | Retorna notificaciones agrupadas |
| `getSortedDates()` | Lista de fechas ordenadas |

**Configuración:**
- **Storage Key:** `kepler_notification_history`
- **Retención:** 30 días máximo
- **Almacenamiento:** localStorage

---

### 2. NotificationSystem.js
**Ubicación:** `frontend/src/js/components/NotificationSystem.js`

Sistema de alertas tipo toast con efectos holográficos.

**Métodos públicos:**
```javascript
window.kepler.notify.info(message)     // ℹ️ 5 segundos
window.kepler.notify.success(message)  // ✅ 4 segundos
window.kepler.notify.warning(message)  // ⚠️ 7 segundos
window.kepler.notify.critical(message) // 🚨 Persistente
window.kepler.notify.toggleLog()       // Abre/cierra Bitácora
```

**Efectos especiales:**
- Animación slide-in desde la derecha
- Efecto holográfico con scanlines
- Glitch de pantalla en notificaciones críticas
- Sonidos por tipo de notificación

---

### 3. RealtimeService.js
**Ubicación:** `frontend/src/js/services/RealtimeService.js`

Servicio que escucha cambios en `public.misiones` vía WebSocket.

**Eventos monitoreados:**

| Evento | Acción |
|--------|--------|
| `INSERT` | Nueva misión detectada |
| `UPDATE` (estado→activa) | Misión activada |
| `UPDATE` (estado→completada) | Misión completada + stats |
| `DELETE` | Misión eliminada |

**Atribución de usuario:**
El servicio obtiene el email del usuario que realizó la acción a través del `user_id` del payload. Incluye caché para evitar consultas repetidas.

---

## Configuración de Supabase Realtime

### docker-compose.yml

```yaml
realtime:
  image: supabase/realtime:v2.68.0
  container_name: realtime-dev.supabase-realtime
  environment:
    DB_HOST: db
    DB_PORT: 5432
    DB_USER: supabase_admin
    DB_PASSWORD: ${POSTGRES_PASSWORD}
    DB_NAME: postgres
    DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
    API_JWT_SECRET: ${JWT_SECRET}
    SECRET_KEY_BASE: ${JWT_SECRET}
    SECURE_CHANNELS: "false"
    SEED_SELF_HOST: "true"
    SELF_HOST_TENANT_NAME: "realtime"
    APP_NAME: realtime
    RUN_JANITOR: "true"
    RLIMIT_NOFILE: "10000"
```

### Configuración de Base de Datos

La tabla `misiones` debe estar en la publicación:

```sql
-- Habilitar replica identity
ALTER TABLE public.misiones REPLICA IDENTITY FULL;

-- Añadir a publicación activa
ALTER PUBLICATION supabase_realtime_messages_publication 
ADD TABLE public.misiones;
```

Verificar configuración:
```sql
SELECT pubname, tablename FROM pg_publication_tables;
```

---

## Inicialización Global

El sistema se inicializa en cada página para garantizar cobertura global:

### main.js (Dashboard SPA)
```javascript
window.kepler = window.kepler || {};
window.kepler.notify = new NotificationSystem();

// Después de autenticación
if (user && !window.kepler.realtime) {
    window.kepler.realtime = new RealtimeService();
}
```

### Páginas standalone (archives.html, taxonomia.html)
```html
<script type="module">
  import { NotificationSystem } from '../../js/components/NotificationSystem.js';
  import { RealtimeService } from '../../js/services/RealtimeService.js';
  
  window.kepler = window.kepler || {};
  if (!window.kepler.notify) {
    window.kepler.notify = new NotificationSystem();
  }
  if (!window.kepler.realtime) {
    window.kepler.realtime = new RealtimeService();
  }
</script>
```

---

## Bitácora (Panel de Historial)

### Acceso
- **Desktop:** Botón campana 🔔 en header
- **Mobile:** Menú hamburguesa → "🔔 Notificaciones"

### Características
- Timeline agrupado por día (Hoy, Ayer, fechas)
- Botón 🗑️ para borrar día completo
- Botón × en cada notificación para eliminar individual
- Botón "Borrar todo" en header del panel

### CSS
Estilos en: `frontend/src/css/notifications.css`

---

## Troubleshooting

### Error: TenantNotFound
```
TenantNotFound: Tenant not found: realtime
```
**Solución:** Verificar `SELF_HOST_TENANT_NAME` = "realtime" y reiniciar el contenedor.

### Error: 403 Forbidden en WebSocket
**Causas posibles:**
1. JWT inválido o expirado
2. `SECURE_CHANNELS: "true"` sin configuración de JWT
3. Tenant no existe

### Notificaciones no aparecen
1. Verificar que la tabla esté en la publicación
2. Verificar que el slot de replicación esté activo:
```sql
SELECT slot_name, active FROM pg_replication_slots;
```

### Logs de Realtime
```bash
docker logs realtime-dev.supabase-realtime --tail 50
```

---

## Scripts de Desarrollo

### Iniciar
```bash
./start-dev.sh
```
Inicia: DB → Auth → Kong → Realtime → Backend → Frontend

### Detener
```bash
./stop-dev.sh
```
Detiene todos los servicios incluyendo `realtime-dev.supabase-realtime`
