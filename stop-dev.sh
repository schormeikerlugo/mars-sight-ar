#!/bin/bash
# KEPLER - Script para Detener Desarrollo
# Detiene todos los servicios

echo "========================================"
echo "  🛑 KEPLER System - Deteniendo..."
echo "========================================"
echo ""

# Detener Frontend
echo "🌐 Deteniendo Frontend..."
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Detener Backend
echo "🐍 Deteniendo Backend..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true

# Detener Supabase
echo "📦 Deteniendo Supabase..."
# Manteniendo referencias a contenedores legacy
docker stop mars-sight-kong mars-sight-rest mars-sight-auth mars-sight-storage mars-sight-meta mars-sight-studio mars-sight-db 2>/dev/null || true

echo ""
echo "✅ Todos los servicios detenidos"
