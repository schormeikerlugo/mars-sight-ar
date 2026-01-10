#!/bin/bash
# KEPLER - Script de Inicio de Desarrollo
# Inicia todos los servicios en el orden correcto

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================"
echo "  🚀 KEPLER System - Iniciando..."
echo "========================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar requisitos
echo -e "${YELLOW}📋 Verificando requisitos...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Requisitos OK${NC}"
echo ""

# ========================================
# PASO 1: Iniciar Supabase
# ========================================
echo -e "${YELLOW}📦 Paso 1: Iniciando Supabase...${NC}"

# Verificar si los contenedores existen (Manteniendo nombres legacy 'mars-sight-*')
if docker ps -a --format '{{.Names}}' | grep -q 'mars-sight-db'; then
    docker start mars-sight-db 2>/dev/null || true
    sleep 3
    docker start mars-sight-auth mars-sight-rest mars-sight-kong realtime-dev.supabase-realtime 2>/dev/null || true
    
    # Esperar a que la DB esté lista
    echo "   Esperando base de datos..."
    for i in {1..30}; do
        if docker exec mars-sight-db pg_isready -U postgres >/dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Base de datos lista${NC}"
            break
        fi
        sleep 1
    done
else
    echo -e "${RED}   ❌ Contenedores no encontrados. Ejecuta primero:${NC}"
    echo "      docker-compose up -d postgres auth rest kong"
    exit 1
fi

# Servicios opcionales (Storage, Meta, Studio)
docker start mars-sight-storage mars-sight-meta mars-sight-studio 2>/dev/null || true

echo -e "${GREEN}✅ Supabase iniciado${NC}"
echo ""

# ========================================
# PASO 2: Iniciar Backend
# ========================================
echo -e "${YELLOW}🐍 Paso 2: Iniciando Backend...${NC}"

# Verificar si ya está corriendo el backend
if lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Backend ya está corriendo en puerto 8000${NC}"
else
    # Iniciar backend en background
    cd "$PROJECT_DIR/backend"
    
    if [ -f "venv/bin/python" ]; then
        nohup ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/kepler-backend.log 2>&1 &
        BACKEND_PID=$!
        echo "   Backend PID: $BACKEND_PID"
        sleep 2
        
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${GREEN}   ✅ Backend iniciado${NC}"
        else
            echo -e "${RED}   ❌ Error al iniciar backend. Ver: /tmp/kepler-backend.log${NC}"
        fi
    else
        echo -e "${RED}   ❌ Virtual env no encontrado. Ejecuta:${NC}"
        echo "      cd backend && python -m venv venv && ./venv/bin/pip install -r requirements.txt"
        exit 1
    fi
fi

cd "$PROJECT_DIR"
echo ""

# ========================================
# PASO 3: Iniciar Frontend
# ========================================
echo -e "${YELLOW}🌐 Paso 3: Iniciando Frontend...${NC}"

# Verificar si ya está corriendo el frontend
if lsof -i:5180 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Frontend ya está corriendo en puerto 5180${NC}"
else
    cd "$PROJECT_DIR/frontend"
    
    if [ -d "node_modules" ]; then
        nohup npm run dev > /tmp/kepler-frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo "   Frontend PID: $FRONTEND_PID"
        sleep 3
        
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${GREEN}   ✅ Frontend iniciado${NC}"
        else
            echo -e "${RED}   ❌ Error al iniciar frontend. Ver: /tmp/kepler-frontend.log${NC}"
        fi
    else
        echo -e "${RED}   ❌ node_modules no encontrado. Ejecuta:${NC}"
        echo "      cd frontend && npm install"
        exit 1
    fi
fi

cd "$PROJECT_DIR"
echo ""

# ========================================
# RESUMEN
# ========================================
echo "========================================"
echo -e "${GREEN}  ✅ ¡Todo iniciado correctamente!${NC}"
echo "========================================"
echo ""
echo "  Servicios KEPLER disponibles:"
echo "  ─────────────────────────────────────"
echo "  🌐 Frontend:     https://localhost:5180"
echo "  🐍 Backend API:  http://localhost:8000"
echo "  📦 Supabase:     http://localhost:54321"
echo "  🗄️  Database:     localhost:54322"
echo ""
echo "  logs:"
echo "  ─────────────────────────────────────"
echo "  Backend:  tail -f /tmp/kepler-backend.log"
echo "  Frontend: tail -f /tmp/kepler-frontend.log"
echo "  Docker:   docker-compose logs -f"
echo ""
echo "  Para detener todo: ./stop-dev.sh"
echo ""
