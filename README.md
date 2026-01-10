<div align="center">

# 🔭 K E P L E R

### Sistema de Reconocimiento Visual Estelar con IA

<p align="center">
  <img src="https://img.shields.io/badge/Fase-Entrenamiento_Terrestre-cyan?style=for-the-badge&logo=target&logoColor=black" alt="Fase">
  <img src="https://img.shields.io/badge/Estado-Activo-green?style=for-the-badge&logo=statuspage&logoColor=black" alt="Estado">
  <img src="https://img.shields.io/badge/Versión-0.2.0_Beta-blue?style=for-the-badge&logo=semver&logoColor=white" alt="Versión">
</p>

```
  _  __  ______   _____    _        ______   _____  
 | |/ / |  ____| |  __ \  | |      |  ____| |  __ \ 
 | ' /  | |__    | |__) | | |      | |__    | |__) |
 |  <   |  __|   |  ___/  | |      |  __|   |  _  / 
 | . \  | |____  | |      | |____  | |____  | | \ \ 
 |_|\_\ |______| |_|      |______| |______| |_|  \_\
                                                    
```

</div>

---

## 🌌 ¿Qué es KEPLER?

**KEPLER** (anteriormente conocido como Mars-Sight AR) es una plataforma avanzada de exploración asistida por Inteligencia Artificial. Diseñada con una estética holográfica (HUI), su objetivo es asistir a astronautas y rovers en la **identificación, clasificación y análisis en tiempo real** de formaciones geológicas y artefactos en entornos desconocidos.

> 🚀 **Misión:** Proveer ojos inteligentes a la exploración espacial humana y robótica.

---

## 🛠️ Capacidades del Sistema

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| 🔭 **Visual Core** | ✅ Activo | Detección de objetos en tiempo real (YOLOv11 Nano en browser). |
| 🧠 **Cortex AI** | ✅ Activo | Análisis semántico profundo (CLIP + Llama 3). |
| 📊 **Dashboard** | ✅ Activo | Telemetría vital y gestión de misiones. |
| 🔐 **Access** | ✅ Activo | Autenticación biométrica simulada (Supabase Auth). |
| 📂 **Archives** | ✅ Activo | Base de datos vectorial de hallazgos. |
| 🔔 **Realtime Notifications** | ✅ Activo | Alertas en tiempo real vía WebSocket (Supabase Realtime). |

---

## 🔔 Sistema de Notificaciones

KEPLER incluye un sistema de notificaciones en tiempo real para mantener a los usuarios informados de eventos del sistema:

### Características:
- **Notificaciones Globales**: Funcionan en todas las secciones (Dashboard, Archivos, Taxonomía, AR).
- **Sincronización Cloud**: Guardado en Supabase (`user_notifications`) para acceso cross-device.
- **Modo Offline**: Fallback automático a localStorage si no hay conexión.
- **Bitácora Avanzada**: Filtros por tipo (Critical, Alert, Success) y contadores dinámicos.
- **Timeline**: Agrupación cronológica inteligente.
- **Borrado Seguro**: Confirmación mediante modales del sistema (System Modals).
- **Atribución de Usuario**: Cada notificación muestra quién realizó la acción (`👤 por [usuario]`).

### Tipos de Notificaciones:
| Tipo | Icono | Duración |
|------|-------|----------|
| **Critical** | 🚨 | Persistente (requiere cierre manual) |
| **Warning** | ⚠️ | 7 segundos |
| **Success** | ✅ | 4 segundos |
| **Info** | ℹ️ | 5 segundos |

### Eventos Realtime Monitoreados:
- 📡 Nueva misión creada
- 🚀 Misión activada
- ✅ Misión completada (con estadísticas detalladas)
- ⚠️ Misión eliminada

### Acceso a la Bitácora:
- **Desktop**: Clic en el ícono de campana 🔔 en el header
- **Mobile**: Menú hamburguesa → "🔔 Notificaciones"

---

## 📚 Documentación Técnica

La documentación ha sido reorganizada para facilitar el desarrollo:

*   **[🎨 Frontend Architecture](docs/frontend.md)**: UI Design, Animaciones Holográficas, Vite.
*   **[⚙️ Backend & AI Services](docs/backend.md)**: FastAPI, Python, Llama 3, CLIP.
*   **[⚡ Database & Cloud](docs/supabase.md)**: Esquema PostgreSQL, Auth, Vector Search.
*   **[🧠 Hybrid AI System](docs/ia.md)**: Detalles sobre la integración Edge-Cloud AI.
*   **[🔔 Realtime & Notificaciones](docs/realtime.md)**: WebSocket, Alertas, Bitácora.

---

## 🚀 Inicio Rápido

### Requisitos Previos
*   **Docker** (Recomendado para servicios backend/db)
*   **Node.js 18+**
*   **Ollama** (Ejecutándose en puerto 11434 para funciones de chat)

### Ejecución Automática

```bash
# Iniciar stack completo (DB + Backend + Frontend)
./start-dev.sh
```

Para más detalles, consulta la **[Guía de Inicio](docs/guia-inicio.md)**.

---

## 📁 Estructura del Proyecto

```
KEPLER/
├── frontend/          # Interfaz Holográfica (Vite + Vanilla JS)
│   └── src/features/  # Módulos: AR, Dashboard, Login, Archives
├── backend/           # Cerebro Analítico (FastAPI + Python)
│   └── app/           # Lógica de IA y Endpoints
├── deployment/        # Configuración Docker
└── docs/              # Manuales y Referencias
```

---

## 🤝 Contribuciones

El proyecto es Open Source bajo la licencia MIT. Las contribuciones son bienvenidas, especialmente en áreas de:
*   Optimización de inferencia en navegador (WASM).
*   Expansión del dataset geológico.
*   Mejoras de accesibilidad en la UI holográfica.

---

<div align="center">

**KEPLER PROJECT**
*Explorando lo desconocido, un frame a la vez.*

Desarrollado con 💙 y ☕ por el equipo de ingeniería.

</div>
