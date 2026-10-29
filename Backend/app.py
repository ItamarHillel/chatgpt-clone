import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from controllers.conversations_controller import router as conversations_router
from controllers.health_controller import router as health_router
from utils.app_config import AppConfig
from utils.error_handlers import register_error_handlers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s")
logging.getLogger("watchfiles").setLevel(logging.WARNING)  # The auto-reloader logs every file it sees change.
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not AppConfig.is_openai_configured():
        logger.warning("OPENAI_API_KEY is not set in Backend/.env - chat requests will fail until it is.")
    logger.info("Using OpenAI model '%s'. Allowed client origins: %s", AppConfig.openai_model, ", ".join(AppConfig.cors_origins))
    yield


app = FastAPI(
    title="ChatGPT Clone API",
    version="1.0.0",
    description="REST API of the ChatGPT Clone: conversations and messages are stored in MySQL and the replies come from OpenAI.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=AppConfig.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(health_router)
app.include_router(conversations_router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/docs")


if __name__ == "__main__":
    uvicorn.run("app:app", host=AppConfig.host, port=AppConfig.port, reload=AppConfig.is_development)
