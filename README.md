<div align="center">

# 🔴 MARS-SIGHT AR

### Sistema de Reconocimiento Visual con IA para Exploración

<p align="center">
  <img src="https://img.shields.io/badge/Fase-Entrenamiento_Terrestre-orange?style=for-the-badge&logo=target&logoColor=white" alt="Fase">
  <img src="https://img.shields.io/badge/Estado-En_Desarrollo-yellow?style=for-the-badge&logo=statuspage&logoColor=white" alt="Estado">
  <img src="https://img.shields.io/badge/Versión-0.1.0_Alpha-blue?style=for-the-badge&logo=semver&logoColor=white" alt="Versión">
</p>

```
 ███╗   ███╗ █████╗ ██████╗ ███████╗    ███████╗██╗ ██████╗ ██╗  ██╗████████╗
 ████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝
 ██╔████╔██║███████║██████╔╝███████╗    ███████╗██║██║  ███╗███████║   ██║   
 ██║╚██╔╝██║██╔══██║██╔══██╗╚════██║    ╚════██║██║██║   ██║██╔══██║   ██║   
 ██║ ╚═╝ ██║██║  ██║██║  ██║███████║    ███████║██║╚██████╔╝██║  ██║   ██║   
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
```

</div>

---

## � ¿Qué es Mars-Sight?

**Mars-Sight AR** es un proyecto en desarrollo que busca crear un sistema de exploración asistido por IA. La visión a largo plazo es su aplicación en misiones de exploración espacial, pero actualmente se encuentra en **fase de entrenamiento terrestre**.

> 🌍 **Fase Actual:** Entrenamiento y validación del sistema de detección en entornos terrestres.

### La Visión

El objetivo final es crear una herramienta que asista a exploradores (humanos o robots) en la identificación, clasificación y documentación de objetos en entornos desconocidos. Pensamos en Marte, pero primero debemos validar el sistema aquí en la Tierra.

---

## 📍 Roadmap del Proyecto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🗺️ HOJA DE RUTA                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔵 FASE 1: Entrenamiento Terrestre (ACTUAL)                           │
│     ├── ✅ Detección de objetos cotidianos                              │
│     ├── ✅ Sistema de clasificación con IA                              │
│     ├── ✅ Almacenamiento geolocalizado                                 │
│     ├── � Mejora de precisión del modelo                               │
│     └── 📋 Validación del sistema de taxonomía                          │
│                                                                         │
│  ⚪ FASE 2: Entornos Extremos                                           │
│     ├── � Pruebas en desiertos/zonas áridas                            │
│     ├── 📋 Detección de formaciones geológicas                          │
│     └── 📋 Adaptación a condiciones de baja luz                         │
│                                                                         │
│  ⚪ FASE 3: Integración Espacial                                        │
│     ├── 📋 Modelos entrenados para rocas marcianas                      │
│     ├── � Optimización para hardware limitado                          │
│     └── 📋 Protocolos de comunicación espacial                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

✅ = Completado   🔄 = En progreso   📋 = Planificado
```

---

## 🛠️ ¿Qué hay implementado actualmente?

### Módulos Funcionales

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| 🔭 **AR Scanner** | ✅ Funcional | Detección de objetos en tiempo real con la cámara |
| � **Chat IA** | ✅ Funcional | Asistente conversacional usando Llama 3 |
| 📊 **Dashboard** | ✅ Funcional | Panel de control con telemetría básica |
| 🏷️ **Taxonomía** | ✅ Funcional | Sistema de clasificación jerárquica |
| � **Archivos** | ✅ Funcional | Historial de objetos detectados |

### Tecnologías de IA en Uso

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Embeddings Visuales** | CLIP (ViT-B-32) | Genera representaciones vectoriales de imágenes |
| **Asistente Conversacional** | Llama 3 (8B) | Responde preguntas y genera descripciones |
| **Detección Frontend** | TensorFlow.js | Detección de objetos en el navegador |

---

## 🚀 Instalación

### Requisitos

```bash
✅ Docker 20.10+
✅ Node.js 18+
✅ Python 3.11+
✅ Ollama (con modelo llama3:8b-instruct-q6_K)
```

### Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/mars-sight-ar.git
cd mars-sight-ar

# 2. Ejecutar script de inicio
./start-dev.sh
```

<details>
<summary>📋 <b>Instalación Manual</b></summary>

### Paso 1: Servicios de Base de Datos
```bash
docker start mars-sight-db mars-sight-auth mars-sight-rest mars-sight-kong
```

### Paso 2: Backend
```bash
cd backend
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Paso 3: Frontend
```bash
cd frontend
npm run dev
```

### Paso 4: Ollama (para IA)
```bash
ollama serve
# En otra terminal:
ollama pull llama3:8b-instruct-q6_K
```

</details>

---

## 🌐 URLs Locales

| Servicio | URL |
|----------|-----|
| Aplicación | https://localhost:5180 |
| API Backend | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |
| Supabase | http://localhost:54321 |

---

## 📁 Estructura

```
mars-sight-ar/
├── frontend/          # Aplicación web (Vite + JS)
│   └── src/features/  # AR, Dashboard, Taxonomía, etc.
├── backend/           # API REST (FastAPI + Python)
│   └── app/services/  # Servicios de IA
├── deployment/        # Configuración Docker producción
└── docs/              # Documentación
```

---

## 🤝 Contribuciones

Este proyecto está en desarrollo activo. Si te interesa contribuir:

1. Fork del repositorio
2. Crea tu rama (`git checkout -b feature/MiMejora`)
3. Commit (`git commit -m 'Agrega MiMejora'`)
4. Push (`git push origin feature/MiMejora`)
5. Abre un Pull Request

### Áreas donde necesitamos ayuda

- 🎯 Mejora de modelos de detección
- 🌍 Testing en diferentes dispositivos
- 📚 Documentación
- 🎨 Mejoras de UI/UX

---

## 📜 Licencia

MIT License - Libre para uso y modificación.

---

<div align="center">

```
     .  *  .      .        *    .    *      .        *
  *    .    *         ★         .       *    .   *
    .    proyecto en evolución    .   *      .
  .   *     rumbo a las estrellas    *    .     *
     *   .    *    .     *    .    *    .   *    .
```

**Un proyecto en camino hacia Marte 🚀**

*Versión 0.1.0 Alpha - Diciembre 2024*

</div>
