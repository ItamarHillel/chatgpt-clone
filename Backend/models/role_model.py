from enum import Enum


class Role(str, Enum):
    """Who wrote a message. Matches the rows of the `roles` table."""

    USER = "user"
    ASSISTANT = "assistant"

    @property
    def role_id(self) -> int:
        return _ROLE_IDS[self]


_ROLE_IDS = {Role.USER: 1, Role.ASSISTANT: 2}
