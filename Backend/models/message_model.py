from typing import Annotated

from pydantic import StringConstraints

from models.base_model import ApiModel, UtcDatetime
from models.role_model import Role
from utils.app_config import AppConfig


class MessageModel(ApiModel):
    message_id: int
    conversation_id: str
    role: Role
    content: str
    created_at: UtcDatetime


class SendMessageModel(ApiModel):
    """Request body for sending a new user message."""

    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=AppConfig.max_message_length)]
