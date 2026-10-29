-- ============================================================================
--  ChatGPT Clone - Database schema (MySQL 8)
--  Author : Itamar Hillel
--
--  Design:
--    roles          - lookup table: who wrote a message ('user' / 'assistant').
--    conversations  - one row per chat session, identified by a UUID.
--    messages       - every message of every conversation, linked to its
--                     conversation and to the role that wrote it.
--    conversation_messages_view - human-readable view of all messages with the
--                     conversation id/title and the sender name.
--
--  All timestamps are stored in UTC (the backend sets the session time zone).
-- ============================================================================

DROP DATABASE IF EXISTS chatgpt_clone;
CREATE DATABASE chatgpt_clone
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE chatgpt_clone;

-- ----------------------------------------------------------------------------
-- roles: who wrote a message
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id     TINYINT UNSIGNED NOT NULL                 COMMENT 'Role identifier',
    role_name   VARCHAR(20)      NOT NULL                 COMMENT 'user = the human user, assistant = the AI chat',
    description VARCHAR(100)     NOT NULL                 COMMENT 'Human readable description',
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_roles_role_name (role_name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Lookup table - the author type of a message';

INSERT INTO roles (role_id, role_name, description) VALUES
    (1, 'user',      'Message written by the user'),
    (2, 'assistant', 'Message written by the AI chat (OpenAI)');

-- ----------------------------------------------------------------------------
-- conversations: one row per chat session
-- ----------------------------------------------------------------------------
CREATE TABLE conversations (
    conversation_id CHAR(36)     NOT NULL                 COMMENT 'Unique conversation identifier (UUID v4)',
    title           VARCHAR(100)     NULL                 COMMENT 'Taken from the first user message, NULL until the first message is sent',
    created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Creation time (UTC)',
    updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Time of the last message (UTC)',
    PRIMARY KEY (conversation_id),
    KEY ix_conversations_updated_at (updated_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Chat sessions - each conversation has a unique id';

-- ----------------------------------------------------------------------------
-- messages: every message of every conversation
-- ----------------------------------------------------------------------------
CREATE TABLE messages (
    message_id      BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT 'Unique message identifier (also defines the order)',
    conversation_id CHAR(36)         NOT NULL                COMMENT 'The conversation this message belongs to',
    role_id         TINYINT UNSIGNED NOT NULL                COMMENT 'Who wrote the message: 1 = user, 2 = assistant',
    content         MEDIUMTEXT       NOT NULL                COMMENT 'Message text',
    created_at      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Creation time (UTC)',
    PRIMARY KEY (message_id),
    KEY ix_messages_conversation (conversation_id, message_id),
    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_messages_role
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Messages of all conversations';

-- ----------------------------------------------------------------------------
-- Readable view: who said what, in which conversation
-- ----------------------------------------------------------------------------
CREATE SQL SECURITY INVOKER VIEW conversation_messages_view AS
SELECT
    c.conversation_id,
    c.title           AS conversation_title,
    m.message_id,
    r.role_name       AS sender,
    m.content,
    m.created_at
FROM messages m
    JOIN conversations c ON c.conversation_id = m.conversation_id
    JOIN roles r         ON r.role_id = m.role_id;
