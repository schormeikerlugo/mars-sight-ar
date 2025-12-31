# 🗄️ Database Schema & Supabase Configuration

Este documento detalla la estructura actual de la base de datos PostgreSQL alojada en Supabase (Docker Local) y su interacción con la aplicación "Mars-Sight AR".

## 🛠️ Configuración General

- **Motor**: PostgreSQL 15.6.1
- **Extensiones Habilitadas**:
  - `postgis`: Para soporte geoespacial (Tipos `GEOGRAPHY`, `POINT`).
  - `vector`: Para almacenamiento de embeddings IA (`pgvector`).

## 📋 Tablas Principales

### 1. `public.objetos_exploracion`

Almacena todos los puntos de interés (POIs), marcadores y objetos detectados en el entorno AR.

| Columna      | Tipo               | Descripción                                                      |
| :----------- | :----------------- | :--------------------------------------------------------------- |
| `id`         | `UUID`             | Identificador único (Primary Key). Defecto: `gen_random_uuid()`. |
| `user_id`    | `UUID`             | Referencia a `auth.users(id)`. Creador del objeto.               |
| `nombre`     | `TEXT`             | Título o nombre del objeto (ej: "Roca Alpha", "Marcador").       |
| `tipo`       | `TEXT`             | Categoría: 'resource', 'hazard', 'base', 'unknown'.              |
| `posicion`   | `GEOGRAPHY(POINT)` | Coordenadas geoespaciales reales (Lat, Lng). Usamos SRID 4326.   |
| `embedding`  | `VECTOR(384)`      | (Opcional) Vector semántico generado por IA para búsquedas.      |
| `metadata`   | `JSONB`            | Datos extra (altitud, confianza IA, fecha creación).             |
| `created_at` | `TIMESTAMPTZ`      | Fecha de registro.                                               |

### 2. `auth.users` (Supabase System)

Tabla interna de Supabase que gestiona la autenticación. No la modificamos directamente, pero la relacionamos mediante `user_id`.

- **Interacción**: Login desde `LoginView.js` genera un JWT asociado a un registro aquí.

## 🔄 Funciones RPC (Remote Procedure Calls)

Funciones SQL que llamamos directamente desde el frontend (`supabase.rpc()`) para lógica compleja.

### 1. `buscar_objetos_cercanos`

Busca objetos en un radio específico alrededor del usuario.

- **Parámetros**:
  - `lat` (float8): Latitud del usuario.
  - `lon` (float8): Longitud del usuario.
  - `radio_metros` (float8): Radio de búsqueda en metros.
- **Lógica**: Utiliza `ST_DWithin` de PostGIS para filtrar eficientemente por distancia geodésica.
- **Retorno**: TABLE con columnas individuales incluyendo:
  - `id`, `nombre`, `tipo`, `descripcion`
  - **`lat` y `lng` como floats** (extraídos de posicion con ST_X/ST_Y)
  - `embedding`, `metadata`, `created_at`

**Actualización reciente:** Función modificada para devolver `lat` y `lng` como columnas float separadas en lugar del objeto `posicion` binario WKB, facilitando el parseo en JavaScript.

### 2. `search_similar_objects` **(NUEVO - Phase 8)**

Encuentra objetos visualmente similares usando búsqueda vectorial.

- **Parámetros**:
  - `query_embedding` (vector(512)): Embedding CLIP del frame actual.
  - `match_threshold` (float): Umbral mínimo de similitud (default: 0.75).
  - `match_count` (int): Número máximo de resultados (default: 3).
- **Lógica**:
  - Usa operador de distancia coseno `<=>` de pgvector.
  - Filtra objetos con `embedding IS NOT NULL`.
  - Calcula similitud como `1 - distancia`.
- **Retorno**: TABLE con:
  - `id`, `nombre`, `tipo`
  - `lat`, `lng` (extraídos con ST_Y/ST_X)
  - `metadata`
  - **`similarity`** (float 0-1): Score de similitud visual

---

## 🔐 Seguridad (RLS - Row Level Security)

Actualmente, el acceso depende del `KEY` anonimo y la validación de usuario autenticado.

- **Políticas Actuales**:
  - _Lectura_: Permitida a usuarios autenticados.
  - _Escritura_: Permitida a usuarios autenticados (asocian su `user_id`).

## 📡 Conexión Frontend -> Backend

La conexión se gestiona en `src/js/services/DatabaseService.js`.

**Ejemplo de Flujo de Guardado:**

1. Usuario pulsa "MARCAR" en AR.
2. Frontend calcula coordenadas.
3. Llama a `dbService.createObject()`.
4. Supabase inserta en `objetos_exploracion`.
