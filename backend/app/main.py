from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.deps import get_current_user
from dotenv import load_dotenv
import os

# Import Routers
from app.api.endpoints import dashboard, chat, telemetry, missions, objects, ai, taxonomia

load_dotenv()

app = FastAPI(
    title="Mars-Sight AR API",
    description="API para exploración planetaria con IA y AR",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includes
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(telemetry.router, prefix="/api", tags=["telemetry"]) 
app.include_router(missions.router, prefix="/api/missions", tags=["missions"])
app.include_router(objects.router, prefix="/api/objects", tags=["objects"])
app.include_router(ai.router, prefix="/api", tags=["ai"]) 
app.include_router(taxonomia.router, prefix="/api/taxonomia", tags=["taxonomia"])

@app.get("/")
async def root():
    return {
        "message": "Mars-Sight AR API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": ["database", "ai_model"]
    }

@app.get("/me")
async def read_users_me(user = Depends(get_current_user)):
    return user
