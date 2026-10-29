from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import StreamingResponse

from logic.chat_logic import ChatLogic
from logic.conversations_logic import ConversationsLogic
from models.conversation_model import ChatExchangeModel, ConversationDetailsModel, ConversationModel
from models.message_model import SendMessageModel
from utils.dependencies import get_chat_logic, get_conversations_logic

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

ConversationsLogicDep = Annotated[ConversationsLogic, Depends(get_conversations_logic)]
ChatLogicDep = Annotated[ChatLogic, Depends(get_chat_logic)]


@router.get("", response_model=list[ConversationModel], summary="Get all conversations, most recent first")
def get_all_conversations(logic: ConversationsLogicDep):
    return logic.get_all_conversations()


@router.post("", response_model=ConversationModel, status_code=status.HTTP_201_CREATED, summary="Start a new conversation")
def add_conversation(logic: ConversationsLogicDep):
    return logic.add_conversation()


@router.get("/{conversation_id}", response_model=ConversationDetailsModel, summary="Get a conversation with all of its messages")
def get_conversation(conversation_id: UUID, logic: ConversationsLogicDep):
    return logic.get_conversation_details(str(conversation_id))


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a conversation and its messages")
def delete_conversation(conversation_id: UUID, logic: ConversationsLogicDep):
    logic.delete_conversation(str(conversation_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{conversation_id}/messages",
    response_model=ChatExchangeModel,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message and get the complete AI reply",
)
def send_message(conversation_id: UUID, message: SendMessageModel, chat_logic: ChatLogicDep):
    return chat_logic.send_message(str(conversation_id), message.content)


@router.post(
    "/{conversation_id}/messages/stream",
    response_class=StreamingResponse,
    summary="Send a message and stream the AI reply (Server-Sent Events)",
    description=(
        "Streams `text/event-stream` events: `delta` `{content}` for every piece of the reply, "
        "then `done` `{conversation, userMessage, assistantMessage}` once both messages are saved, "
        "or `error` `{error, status}` if the AI request failed."
    ),
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def stream_message(conversation_id: UUID, message: SendMessageModel, chat_logic: ChatLogicDep):
    events = await chat_logic.start_stream(str(conversation_id), message.content)
    return StreamingResponse(events, media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
