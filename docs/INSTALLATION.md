# 📥 Guía de Instalación - Mars-Sight AR

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Docker** y **Docker Compose** (v2.0+)
- **Node.js** 18+ y **npm**
- **Python** 3.11+
- **Git**

---

## 🚀 Instalación Rápida con Docker

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/mars-sight-ar.git
cd mars-sight-ar
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

**Mínimo requerido para empezar:**

```env
DATABASE_URL=postgresql://postgres:mars2025@postgres:5432/mars_sight
SECRET_KEY=$(openssl rand -hex 32)
```

### 3. Levantar los Servicios

```bash
# Levanta PostgreSQL, Backend y Ollama
docker-compose up -d

# Ver logs
docker-compose logs -f
```

**Servicios disponibles:**

- API Backend: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Ollama: http://localhost:11434

### 4. Configurar el Modelo de IA

```bash
# Entrar al contenedor de Ollama
docker exec -it mars-sight-ollama sh

# Descargar el modelo Llama3.1
ollama pull llama3.1:8b

# Crear modelo personalizado con nuestro Modelfile
ollama create mars-explorer -f /app/Modelfile

# Salir
exit
```

### 5. Instalar Frontend

```bash
cd frontend
npm install
npm run dev
```

**Frontend disponible en:** http://localhost:5173

---

## 💻 Instalación Local (Sin Docker)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones (cuando estén configuradas)
# alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

cd "/home/lenovics/portafolio Dev/Mars‑Sight AR/backend"
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 1. Iniciar Supabase (en la carpeta del proyecto)

cd ~/portafolio\ Dev/Mars‑Sight\ AR
npx supabase start

# 2. Espera a que termine (~30 segundos)

# 3. Reiniciar el backend

cd backend
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

### Base de Datos

```bash
# Instalar PostgreSQL localmente o usar Docker:
docker run --name mars-postgres \
  -e POSTGRES_PASSWORD=mars2025 \
  -e POSTGRES_DB=mars_sight \
  -p 5432:5432 \
  -d postgis/postgis:15-3.3
```

### Ollama

```bash
# Descargar e instalar Ollama
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Descargar desde https://ollama.com/download

# Iniciar servicio
ollama serve

# En otra terminal, descargar el modelo
ollama pull llama3.1:8b
```

---

## 🔧 Configuración de Supabase (Opcional)

Si quieres usar autenticación real:

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar URL y Anon Key
4. Actualizar `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key-aqui
```

---

## ✅ Verificar Instalación

### 1. Verificar Backend

```bash
curl http://localhost:8000/health
```

Deberías ver:

```json
{
  "status": "healthy",
  "database": "connected",
  "ai_service": "ready"
}
```

### 2. Verificar Frontend

Abre http://localhost:5173 en tu navegador.

### 3. Verificar Ollama

```bash
curl http://localhost:11434/api/tags
```

---

## 🐛 Troubleshooting

### Error: "Puerto 5432 ya en uso"

```bash
# Ver qué está usando el puerto
sudo lsof -i :5432

# Detener PostgreSQL local
sudo systemctl stop postgresql
```

### Error: "Cannot connect to Docker daemon"

```bash
# Iniciar Docker
sudo systemctl start docker

# Verificar estado
docker ps
```

### Error: Frontend no carga

```bash
# Limpiar caché de node_modules
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Ollama no responde

```bash
# Reiniciar contenedor
docker-compose restart ollama

# Ver logs
docker-compose logs ollama
```

---

## 📚 Próximos Pasos

1. ✅ Leer [README.md](../README.md)
2. 📖 Ver [Documentación de la API](./API.md)
3. 🎨 Revisar [Design System](../frontend/src/styles/tokens.css)
4. 🚀 Empezar a desarrollar con la [Fase 1 del Roadmap](./ROADMAP.md)

---

## 💡 Comandos Útiles

```bash
# Ver todos los contenedores
docker-compose ps

# Reiniciar un servicio
docker-compose restart backend

# Ver logs en tiempo real
docker-compose logs -f backend

# Detener todo
docker-compose down

# Limpiar volúmenes (⚠️ Borra datos)
docker-compose down -v

# Rebuild después de cambios
docker-compose up -d --build
```

---

¿Problemas? Abre un issue en GitHub
