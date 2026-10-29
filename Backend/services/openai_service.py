import logging
from typing import AsyncIterator

import openai
from openai import AsyncOpenAI, OpenAI

from models.client_errors import AIServiceError
from utils.app_config import AppConfig

logger = logging.getLogger(__name__)

# The conversation sent to OpenAI: [{"role": "user" | "assistant", "content": "..."}, ...]
ChatContext = list[dict[str, str]]


class OpenAIService:
    """The only place in the system that talks to OpenAI (Responses API).

    The API key never leaves the server - the client only talks to our REST API.
    """

    def __init__(self):
        self._client: OpenAI | None = None
        self._async_client: AsyncOpenAI | None = None

    def ensure_configured(self) -> None:
        if not AppConfig.is_openai_configured():
            raise AIServiceError("The OpenAI API key is not configured. Set OPENAI_API_KEY in Backend/.env and restart the server.", 503)

    def get_reply(self, context: ChatContext) -> str:
        """Sends the whole conversation and returns the complete reply."""
        self.ensure_configured()
        try:
            response = self._get_client().responses.create(**self._request_args(context))
        except openai.OpenAIError as err:
            raise self._to_app_error(err) from err
        reply = response.output_text
        if not reply.strip():
            raise AIServiceError("The AI returned an empty response. Please try again.")
        return reply

    async def stream_reply(self, context: ChatContext) -> AsyncIterator[str]:
        """Sends the whole conversation and yields the reply piece by piece as it is generated."""
        self.ensure_configured()
        try:
            stream = await self._get_async_client().responses.create(**self._request_args(context), stream=True)
            async with stream:  # Closes the HTTP connection to OpenAI even if the client stops early.
                async for event in stream:
                    if event.type == "response.output_text.delta":
                        yield event.delta
                    elif event.type == "error":
                        raise AIServiceError(f"OpenAI error: {event.message}")
                    elif event.type == "response.failed":
                        error = event.response.error
                        raise AIServiceError(f"OpenAI error: {error.message if error else 'the response failed.'}")
        except openai.OpenAIError as err:
            raise self._to_app_error(err) from err

    def _get_client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=AppConfig.openai_api_key, timeout=AppConfig.openai_timeout_seconds, max_retries=2)
        return self._client

    def _get_async_client(self) -> AsyncOpenAI:
        if self._async_client is None:
            self._async_client = AsyncOpenAI(api_key=AppConfig.openai_api_key, timeout=AppConfig.openai_timeout_seconds, max_retries=2)
        return self._async_client

    @staticmethod
    def _request_args(context: ChatContext) -> dict:
        return {
            "model": AppConfig.openai_model,
            "instructions": AppConfig.system_prompt,
            "input": context,
            "store": False,  # The conversation is stored in our own MySQL database.
        }

    @staticmethod
    def _to_app_error(err: openai.OpenAIError) -> AIServiceError:
        logger.error("OpenAI request failed: %r", err)
        if isinstance(err, openai.AuthenticationError):
            return AIServiceError("OpenAI rejected the API key. Check OPENAI_API_KEY in Backend/.env.")
        if isinstance(err, openai.PermissionDeniedError):
            return AIServiceError(f"The OpenAI API key has no access to the model '{AppConfig.openai_model}'.")
        if isinstance(err, openai.NotFoundError):
            return AIServiceError(f"The OpenAI model '{AppConfig.openai_model}' was not found. Check OPENAI_MODEL in Backend/.env.")
        if isinstance(err, openai.RateLimitError):
            return AIServiceError("OpenAI rate limit or quota exceeded. Please try again later.", 429)
        if isinstance(err, openai.APITimeoutError):
            return AIServiceError("OpenAI did not respond in time. Please try again.", 504)
        if isinstance(err, openai.APIConnectionError):
            return AIServiceError("Could not connect to OpenAI. Check the server's internet connection.", 503)
        if isinstance(err, openai.BadRequestError):
            return AIServiceError(f"OpenAI could not process the request: {err.message}")
        if type(err) is openai.APIError:  # An error event sent in the middle of a stream.
            return AIServiceError(f"OpenAI error: {err.message}")
        return AIServiceError("The AI service failed to respond. Please try again.")
