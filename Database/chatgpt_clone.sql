-- ============================================================================
--  ChatGPT Clone - database export (structure + real conversations created with the app)
--  Author : Itamar Hillel
--  Import : MySQL Workbench > Server > Data Import > Import from Self-Contained File
--           or:  mysql -u root -p < chatgpt_clone.sql
--  Creates the `chatgpt_clone` database. The schema is documented in schema.sql.
-- ============================================================================

-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: chatgpt_clone
-- ------------------------------------------------------
-- Server version	8.4.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `chatgpt_clone`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `chatgpt_clone` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `chatgpt_clone`;

--
-- Temporary view structure for view `conversation_messages_view`
--

DROP TABLE IF EXISTS `conversation_messages_view`;
/*!50001 DROP VIEW IF EXISTS `conversation_messages_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `conversation_messages_view` AS SELECT 
 1 AS `conversation_id`,
 1 AS `conversation_title`,
 1 AS `message_id`,
 1 AS `sender`,
 1 AS `content`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `conversation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique conversation identifier (UUID v4)',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Taken from the first user message, NULL until the first message is sent',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Creation time (UTC)',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Time of the last message (UTC)',
  PRIMARY KEY (`conversation_id`),
  KEY `ix_conversations_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chat sessions - each conversation has a unique id';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES ('c5fc45b4-b3ed-45d5-9b87-38ff53dbcf2e','מה ההבדל בין SQL ל-NoSQL? תשובה קצרה','2026-10-29 08:20:36.297','2026-10-29 08:20:39.638'),('dd239df1-cabb-47b1-85f0-730772a727c4','Tell me a one-liner programming joke','2026-10-29 08:20:32.711','2026-10-29 08:20:36.133');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `message_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Unique message identifier (also defines the order)',
  `conversation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'The conversation this message belongs to',
  `role_id` tinyint unsigned NOT NULL COMMENT 'Who wrote the message: 1 = user, 2 = assistant',
  `content` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Message text',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Creation time (UTC)',
  PRIMARY KEY (`message_id`),
  KEY `ix_messages_conversation` (`conversation_id`,`message_id`),
  KEY `fk_messages_role` (`role_id`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Messages of all conversations';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (13,'dd239df1-cabb-47b1-85f0-730772a727c4',1,'Tell me a one-liner programming joke','2026-10-29 08:20:32.748'),(14,'dd239df1-cabb-47b1-85f0-730772a727c4',2,'Why do programmers prefer dark mode? Because light attracts bugs.','2026-10-29 08:20:34.525'),(15,'dd239df1-cabb-47b1-85f0-730772a727c4',1,'still one-liner, but change the subject','2026-10-29 08:20:34.590'),(16,'dd239df1-cabb-47b1-85f0-730772a727c4',2,'I told my computer I needed a break, and now it won’t stop sending me KitKat ads.','2026-10-29 08:20:36.133'),(17,'c5fc45b4-b3ed-45d5-9b87-38ff53dbcf2e',1,'מה ההבדל בין SQL ל-NoSQL? תשובה קצרה','2026-10-29 08:20:36.325'),(18,'c5fc45b4-b3ed-45d5-9b87-38ff53dbcf2e',2,'**SQL** משתמש במסדי נתונים טבלאיים עם מבנה וסכימה מוגדרים, ומתאים לנתונים מקושרים ולשאילתות מורכבות.  \n**NoSQL** כולל מסדי נתונים לא־טבלאיים, לרוב גמישים יותר במבנה ומתאימים להיקפים גדולים או לנתונים משתנים.','2026-10-29 08:20:38.202'),(19,'c5fc45b4-b3ed-45d5-9b87-38ff53dbcf2e',1,'תן דוגמה אחת לכל אחד מהם','2026-10-29 08:20:38.284'),(20,'c5fc45b4-b3ed-45d5-9b87-38ff53dbcf2e',2,'- **SQL:** PostgreSQL — למשל, טבלת לקוחות עם עמודות מוגדרות כמו שם ואימייל.\n- **NoSQL:** MongoDB — למשל, מסמכי לקוחות שבהם לכל לקוח יכולים להיות שדות שונים.','2026-10-29 08:20:39.638');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` tinyint unsigned NOT NULL COMMENT 'Role identifier',
  `role_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'user = the human user, assistant = the AI chat',
  `description` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Human readable description',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_roles_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lookup table - the author type of a message';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'user','Message written by the user'),(2,'assistant','Message written by the AI chat (OpenAI)');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'chatgpt_clone'
--

--
-- Current Database: `chatgpt_clone`
--

USE `chatgpt_clone`;

--
-- Final view structure for view `conversation_messages_view`
--

/*!50001 DROP VIEW IF EXISTS `conversation_messages_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY INVOKER */
/*!50001 VIEW `conversation_messages_view` AS select `c`.`conversation_id` AS `conversation_id`,`c`.`title` AS `conversation_title`,`m`.`message_id` AS `message_id`,`r`.`role_name` AS `sender`,`m`.`content` AS `content`,`m`.`created_at` AS `created_at` from ((`messages` `m` join `conversations` `c` on((`c`.`conversation_id` = `m`.`conversation_id`))) join `roles` `r` on((`r`.`role_id` = `m`.`role_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29  8:21:58
