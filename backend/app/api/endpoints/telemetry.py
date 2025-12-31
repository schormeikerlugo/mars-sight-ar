from fastapi import APIRouter
import random
from datetime import datetime

router = APIRouter()

@router.get("/realtime-telemetry")
async def telemetry():
    """
    Returns simulated telemetry data for the Mars Suit.
    """
    return {
        "heart_rate": random.randint(60, 90),
        "suit_pressure": round(random.uniform(14.5, 14.8), 2),
        "temperature": round(random.uniform(20.0, 24.0), 1),
        "oxygen_level": random.randint(95, 100),
        "radiation": round(random.uniform(0.01, 0.05), 3),
        "timestamp": datetime.now().isoformat()
    }
