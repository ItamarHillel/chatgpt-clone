from models.base_model import ApiModel, UtcDatetime
from models.message_model import MessageModel


class ConversationModel(ApiModel):
    conversation_id: str
    title: str | None  # None until the first message is sent.
    created_at: UtcDatetime
    updated_at: UtcDatetime


class ConversationDetailsModel(ConversationModel):
    messages: list[MessageModel]


class ChatExchangeModel(ApiModel):
    """The result of sending a message: the saved user message and the AI reply."""

    conversation: ConversationModel
    user_message: MessageModel
    assistant_message: MessageModel
