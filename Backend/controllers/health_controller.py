from fastapi import APIRouter

from dal.dal import DAL
from utils.app_config import AppConfig

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", summary="Check that the server and the database are up")
def health():
    DAL().get_scalar("SELECT 1")  # Raises 503 if MySQL is unreachable.
    return {
        "status": "ok",
        "database": "connected",
        "openaiConfigured": AppConfig.is_openai_configured(),
        "model": AppConfig.openai_model,
    }
