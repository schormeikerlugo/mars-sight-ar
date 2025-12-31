from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import jwt
from supabase import create_client, Client

security = HTTPBearer()

# JWT Secret - same as used by Auth service
JWT_SECRET = os.getenv("JWT_SECRET", "55a6dca744ee4e41c5c59be899a1fd185fb12c76b8eecc232ccd8cf6babed5d5")

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase credentials not configured in backend"
        )
    return create_client(url, key)

class MockUser:
    """Simple user object from JWT payload"""
    def __init__(self, payload):
        self.id = payload.get("sub")
        self.email = payload.get("email")
        self.role = payload.get("role")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the JWT token using the same secret as Supabase Auth.
    This is faster and more reliable than calling the auth HTTP endpoint.
    """
    token = credentials.credentials
    
    try:
        # Decode JWT using the same secret as Auth service
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        
        if not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return MockUser(payload)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        print(f"AUTH ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

