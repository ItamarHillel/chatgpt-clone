import uuid
from datetime import datetime, timezone

from mysql.connector import errors as mysql_errors

from dal.dal import DAL
from models.client_errors import ResourceNotFoundError
from models.conversation_model import ChatExchangeModel, ConversationDetailsModel, ConversationModel
from models.message_model import MessageModel
from models.role_model import Role

TITLE_MAX_LENGTH = 60

_CONVERSATION_COLUMNS = "conversation_id, title, created_at, updated_at"
_MESSAGE_COLUMNS = "m.message_id, m.conversation_id, r.role_name AS role, m.content, m.created_at"


def utc_now() -> datetime:
    """Current UTC time, naive and rounded to milliseconds - exactly what a MySQL DATETIME(3) column stores."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return now.replace(microsecond=now.microsecond // 1000 * 1000)


def make_title(content: str) -> str:
    """A short single-line conversation title made from the first user message."""
    title = " ".join(content.split())
    if len(title) <= TITLE_MAX_LENGTH:
        return title
    cut = title[:TITLE_MAX_LENGTH - 1]
    last_space = cut.rfind(" ")
    if last_space > TITLE_MAX_LENGTH // 2:
        cut = cut[:last_space]
    return cut.rstrip(" ,.;:-") + "…"


class ConversationsLogic:
    """Business logic for conversations and their messages (stored in MySQL)."""

    def __init__(self):
        self.dal = DAL()

    def get_all_conversations(self) -> list[ConversationModel]:
        sql = f"SELECT {_CONVERSATION_COLUMNS} FROM conversations ORDER BY updated_at DESC"
        return [ConversationModel(**row) for row in self.dal.get_table(sql)]

    def get_conversation(self, conversation_id: str) -> ConversationModel:
        sql = f"SELECT {_CONVERSATION_COLUMNS} FROM conversations WHERE conversation_id = %s"
        row = self.dal.get_row(sql, (conversation_id,))
        if row is None:
            raise ResourceNotFoundError(f"Conversation '{conversation_id}' was not found.")
        return ConversationModel(**row)

    def get_conversation_details(self, conversation_id: str) -> ConversationDetailsModel:
        conversation = self.get_conversation(conversation_id)
        return ConversationDetailsModel(**conversation.model_dump(), messages=self.get_messages(conversation_id))

    def get_messages(self, conversation_id: str, last: int | None = None) -> list[MessageModel]:
        """All messages of a conversation in the order they were written, or only the `last` ones."""
        sql = f"""
            SELECT {_MESSAGE_COLUMNS}
            FROM messages m JOIN roles r ON r.role_id = m.role_id
            WHERE m.conversation_id = %s
        """
        if last is None:
            rows = self.dal.get_table(sql + " ORDER BY m.message_id", (conversation_id,))
        else:
            rows = self.dal.get_table(sql + " ORDER BY m.message_id DESC LIMIT %s", (conversation_id, last))
            rows.reverse()
        return [MessageModel(**row) for row in rows]

    def add_conversation(self) -> ConversationModel:
        conversation_id = str(uuid.uuid4())
        now = utc_now()
        sql = "INSERT INTO conversations (conversation_id, title, created_at, updated_at) VALUES (%s, NULL, %s, %s)"
        self.dal.execute(sql, (conversation_id, now, now))
        return ConversationModel(conversation_id=conversation_id, title=None, created_at=now, updated_at=now)

    def delete_conversation(self, conversation_id: str) -> None:
        # The conversation's messages are deleted by the database (ON DELETE CASCADE).
        sql = "DELETE FROM conversations WHERE conversation_id = %s"
        if self.dal.execute(sql, (conversation_id,)) == 0:
            raise ResourceNotFoundError(f"Conversation '{conversation_id}' was not found.")

    def save_exchange(self, conversation_id: str, user_content: str, user_sent_at: datetime, assistant_content: str) -> ChatExchangeModel:
        """Saves a user message and the AI reply to it in a single transaction."""
        replied_at = utc_now()
        insert_sql = "INSERT INTO messages (conversation_id, role_id, content, created_at) VALUES (%s, %s, %s, %s)"
        # The first user message of a conversation becomes its title.
        update_sql = "UPDATE conversations SET title = COALESCE(title, %s), updated_at = %s WHERE conversation_id = %s"
        try:
            with self.dal.transaction() as cursor:
                cursor.execute(insert_sql, (conversation_id, Role.USER.role_id, user_content, user_sent_at))
                user_message_id = cursor.lastrowid
                cursor.execute(insert_sql, (conversation_id, Role.ASSISTANT.role_id, assistant_content, replied_at))
                assistant_message_id = cursor.lastrowid
                cursor.execute(update_sql, (make_title(user_content), replied_at, conversation_id))
        except mysql_errors.IntegrityError as err:
            # The conversation was deleted while the AI was answering.
            raise ResourceNotFoundError(f"Conversation '{conversation_id}' was not found.") from err

        return ChatExchangeModel(
            conversation=self.get_conversation(conversation_id),
            user_message=MessageModel(message_id=user_message_id, conversation_id=conversation_id, role=Role.USER, content=user_content, created_at=user_sent_at),
            assistant_message=MessageModel(message_id=assistant_message_id, conversation_id=conversation_id, role=Role.ASSISTANT, content=assistant_content, created_at=replied_at),
        )
