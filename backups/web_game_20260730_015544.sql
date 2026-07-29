/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.3.2-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: web_game
-- ------------------------------------------------------
-- Server version	12.3.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `web_game`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `web_game` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `web_game`;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES
('491bb1b2-9928-475a-b385-79b2276d6fae','08f32502cb58046d9a49b78fab603bf39cd0cf6d7370ef91eecc0e7249bd6b21','2026-07-29 15:40:01.323','20260729155106_phase1_mysql_foundation',NULL,NULL,'2026-07-29 15:40:01.051',1),
('784b8ddd-0da8-46ac-a62b-2a46c503df56','bf3fd77eead4c5875224d777d96aaddd4b67eaae99065417117d901b1e6c1c44','2026-07-29 15:40:01.051','20260723061254_init',NULL,NULL,'2026-07-29 15:40:01.045',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_sessions` (
  `session_id` char(36) NOT NULL,
  `user_id` varchar(24) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  `last_seen_at` bigint(20) NOT NULL,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `auth_sessions_user_id_key` (`user_id`),
  KEY `idx_auth_sessions_last_seen` (`last_seen_at` DESC),
  CONSTRAINT `auth_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auth_sessions` WRITE;
/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
INSERT INTO `auth_sessions` VALUES
('39ae302b-3065-4f3b-9cee-34d26462888d','NullToufu',1785343762448,1785344123516),
('6589246e-6010-4e71-8056-4110f868ddaa','profile_check3_202607300',1785342408180,1785342408580),
('fdbb02ca-b5d2-41ef-9b2b-48bbcce00188','profile_check2_202607300',1785342328297,1785342328718);
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `friend_chat_reads`
--

DROP TABLE IF EXISTS `friend_chat_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_chat_reads` (
  `user_id` varchar(24) NOT NULL,
  `friend_user_id` varchar(24) NOT NULL,
  `last_read_message_id` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`,`friend_user_id`),
  KEY `friend_chat_reads_friend_user_id_fkey` (`friend_user_id`),
  CONSTRAINT `friend_chat_reads_friend_user_id_fkey` FOREIGN KEY (`friend_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friend_chat_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_chat_reads`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `friend_chat_reads` WRITE;
/*!40000 ALTER TABLE `friend_chat_reads` DISABLE KEYS */;
/*!40000 ALTER TABLE `friend_chat_reads` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `friend_messages`
--

DROP TABLE IF EXISTS `friend_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `sender_user_id` varchar(24) NOT NULL,
  `receiver_user_id` varchar(24) NOT NULL,
  `message` varchar(400) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_friend_messages_pair_time` (`sender_user_id`,`receiver_user_id`,`created_at` DESC),
  KEY `friend_messages_receiver_user_id_fkey` (`receiver_user_id`),
  CONSTRAINT `friend_messages_receiver_user_id_fkey` FOREIGN KEY (`receiver_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friend_messages_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_messages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `friend_messages` WRITE;
/*!40000 ALTER TABLE `friend_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `friend_messages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `friend_requests`
--

DROP TABLE IF EXISTS `friend_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_requests` (
  `requester_user_id` varchar(24) NOT NULL,
  `target_user_id` varchar(24) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`requester_user_id`,`target_user_id`),
  KEY `idx_friend_requests_target` (`target_user_id`,`created_at` DESC),
  CONSTRAINT `friend_requests_requester_user_id_fkey` FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friend_requests_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_requests`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `friend_requests` WRITE;
/*!40000 ALTER TABLE `friend_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `friend_requests` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `user_id` varchar(24) NOT NULL,
  `friend_user_id` varchar(24) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`,`friend_user_id`),
  KEY `friends_friend_user_id_fkey` (`friend_user_id`),
  CONSTRAINT `friends_friend_user_id_fkey` FOREIGN KEY (`friend_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friends_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `inquiries`
--

DROP TABLE IF EXISTS `inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquiries` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(24) DEFAULT NULL,
  `name` varchar(36) NOT NULL,
  `message` varchar(200) NOT NULL,
  `url` varchar(240) NOT NULL DEFAULT '',
  `lang` varchar(2) NOT NULL,
  `submitted_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inquiries_submitted` (`submitted_at` DESC),
  KEY `idx_inquiries_user_time` (`user_id`,`submitted_at` DESC),
  CONSTRAINT `inquiries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inquiries`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `inquiries` WRITE;
/*!40000 ALTER TABLE `inquiries` DISABLE KEYS */;
INSERT INTO `inquiries` VALUES
(2,'inqsw_20260730012001','mysql-check','mysql inquiry route check message','http://localhost/test','ja',1785342001467),
(3,'inq_check_20260730012310','mysql-check','mysql inquiry route check message','http://localhost/test','ja',1785342190526);
/*!40000 ALTER TABLE `inquiries` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `match_records`
--

DROP TABLE IF EXISTS `match_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_records` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(24) NOT NULL,
  `game` varchar(24) NOT NULL,
  `result` enum('win','lose','draw') NOT NULL,
  `room_code` varchar(6) NOT NULL DEFAULT '',
  `opponent` varchar(18) NOT NULL DEFAULT 'Player',
  `played_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_match_records_user_time` (`user_id`,`played_at` DESC),
  KEY `idx_match_records_game_time` (`game`,`played_at` DESC),
  CONSTRAINT `match_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_records`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `match_records` WRITE;
/*!40000 ALTER TABLE `match_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `match_records` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `score`
--

DROP TABLE IF EXISTS `score`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `score` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playerName` varchar(191) NOT NULL,
  `score` int(11) NOT NULL,
  `game` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `score`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `score` WRITE;
/*!40000 ALTER TABLE `score` DISABLE KEYS */;
/*!40000 ALTER TABLE `score` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(24) DEFAULT NULL,
  `player_name` varchar(18) NOT NULL,
  `score` int(11) NOT NULL,
  `game` varchar(24) DEFAULT NULL,
  `max_score` int(11) DEFAULT NULL,
  `score_ratio` int(11) DEFAULT NULL,
  `rank` enum('S','A','B','C') DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scores_created` (`created_at` DESC),
  KEY `idx_scores_game_created` (`game`,`created_at` DESC),
  KEY `scores_user_id_fkey` (`user_id`),
  CONSTRAINT `scores_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `user_id` varchar(24) NOT NULL,
  `player_name` varchar(18) NOT NULL,
  `profile_bio` varchar(180) NOT NULL DEFAULT '',
  `player_avatar` mediumtext NOT NULL DEFAULT '',
  `bank_coins` int(11) NOT NULL DEFAULT 0,
  `pity_counter` int(11) NOT NULL DEFAULT 0,
  `selected_skin` varchar(64) NOT NULL DEFAULT 'classic',
  `unlocked_skins_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`unlocked_skins_json`)),
  `match_stats_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`match_stats_json`)),
  `fit_puzzle_progress_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`fit_puzzle_progress_json`)),
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` varchar(24) NOT NULL,
  `pass_hash_bcrypt` varchar(255) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  `pass_salt_hex` varchar(255) NOT NULL DEFAULT '',
  `pass_hash_hex` varchar(255) NOT NULL DEFAULT '',
  `profile_json` mediumtext NOT NULL DEFAULT '{}',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('inq_check_20260730012310','$2b$12$ZATpmdqNXwpPz2KR6Q8mJ.QxGeO4IziUInMo6gqqUO/X9kSHgR8KS',1785342190292,1785342190292,'','','{\"bankCoins\":0,\"pityCounter\":0,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"Player\",\"profileBio\":\"\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('inqsw_20260730012001','$2b$12$Dcyex9M0T6uuEhS.tPljgOShJPE6q51hl2oQeXjgqTqI8RcyIBDyi',1785342001274,1785342001274,'','','{\"bankCoins\":0,\"pityCounter\":0,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"Player\",\"profileBio\":\"\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('mysql_check_202607300123','$2b$12$tidP.RKfdemXw4lSbp0M0O.S/zWm3Yf39hvwPRaB/W3uASZKX/KJi',1785342189720,1785342189720,'','','{\"bankCoins\":0,\"pityCounter\":0,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"Player\",\"profileBio\":\"\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('mysqlsw_20260730011938','$2b$12$IqL1BPnnF4RlUU7j1TM7JekIzvyKIAtGKgttYrWF6/GczoXwYAsN6',1785341978942,1785341978942,'','','{\"bankCoins\":0,\"pityCounter\":0,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"Player\",\"profileBio\":\"\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('NullToufu','$2b$12$NNMtk0YUxWpXl/zaeRvsFuoz7Vpg89VzNOn4mF2aqGnTe133bXg8K',1785342879990,1785343331645,'','','{\"bankCoins\":0,\"pityCounter\":0,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"Player\",\"profileBio\":\"\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('profile_check_2026073001','$2b$12$MX2YO0ibRdfhjoL1fH2FU.Tunz1b/3Ik5mlpeWeEf1pBTiri5Gihm',1785342269170,1785342270172,'','','{\"bankCoins\":123,\"pityCounter\":2,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"ProfileCheck\",\"profileBio\":\"mysql profile save verification\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":1,\"win\":1,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":1,\"selectedStageIndex\":1,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('profile_check2_202607300','$2b$12$X3rJJmkjn0TqwOp8NY7zauVu87y1FVykJzK0KPW30QM9BpH76lS8C',1785342328161,1785342328763,'','','{\"bankCoins\":77,\"pityCounter\":1,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"ProfileCheck2\",\"profileBio\":\"verify2\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}'),
('profile_check3_202607300','$2b$12$i4qGgjExOBYYK5GSU1VVuOLZYjrbl5uLcfIOGP4uU0F/ggHA2kP4O',1785342408044,1785342408624,'','','{\"bankCoins\":88,\"pityCounter\":1,\"unlockedSkins\":[\"classic\"],\"selectedSkin\":\"classic\",\"playerName\":\"ProfileCheck3\",\"profileBio\":\"verify3\",\"playerAvatar\":\"\",\"matchStats\":{\"total\":0,\"win\":0,\"lose\":0,\"draw\":0,\"byGame\":{}},\"recentMatches\":[],\"fitPuzzleProgress\":{\"highestUnlockedStage\":0,\"selectedStageIndex\":0,\"difficulty\":\"normal\",\"noRotateMode\":false,\"customStages\":[],\"updatedAt\":null}}');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Dumping events for database 'web_game'
--

--
-- Dumping routines for database 'web_game'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-07-30  1:55:44
