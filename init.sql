-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: buocchancoi_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
INSERT INTO `auth_group` VALUES (1,'Admin'),(2,'Partner'),(3,'User');
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add Blacklisted Token',6,'add_blacklistedtoken'),(22,'Can change Blacklisted Token',6,'change_blacklistedtoken'),(23,'Can delete Blacklisted Token',6,'delete_blacklistedtoken'),(24,'Can view Blacklisted Token',6,'view_blacklistedtoken'),(25,'Can add Outstanding Token',7,'add_outstandingtoken'),(26,'Can change Outstanding Token',7,'change_outstandingtoken'),(27,'Can delete Outstanding Token',7,'delete_outstandingtoken'),(28,'Can view Outstanding Token',7,'view_outstandingtoken'),(29,'Can add Người dùng',8,'add_user'),(30,'Can change Người dùng',8,'change_user'),(31,'Can delete Người dùng',8,'delete_user'),(32,'Can view Người dùng',8,'view_user'),(33,'Can add Media',9,'add_media'),(34,'Can change Media',9,'change_media'),(35,'Can delete Media',9,'delete_media'),(36,'Can view Media',9,'view_media'),(37,'Can add Điểm tham quan',10,'add_poi'),(38,'Can change Điểm tham quan',10,'change_poi'),(39,'Can delete Điểm tham quan',10,'delete_poi'),(40,'Can view Điểm tham quan',10,'view_poi'),(41,'Can add Vết di chuyển',11,'add_breadcrumblog'),(42,'Can change Vết di chuyển',11,'change_breadcrumblog'),(43,'Can delete Vết di chuyển',11,'delete_breadcrumblog'),(44,'Can view Vết di chuyển',11,'view_breadcrumblog'),(45,'Can add Lịch sử nghe',12,'add_narrationlog'),(46,'Can change Lịch sử nghe',12,'change_narrationlog'),(47,'Can delete Lịch sử nghe',12,'delete_narrationlog'),(48,'Can view Lịch sử nghe',12,'view_narrationlog'),(49,'Can add Đối tác',13,'add_partner'),(50,'Can change Đối tác',13,'change_partner'),(51,'Can delete Đối tác',13,'delete_partner'),(52,'Can view Đối tác',13,'view_partner'),(53,'Can add File âm thanh',14,'add_media'),(54,'Can change File âm thanh',14,'change_media'),(55,'Can delete File âm thanh',14,'delete_media'),(56,'Can view File âm thanh',14,'view_media'),(57,'Can add Tương tác Partner',15,'add_partnerinteraction'),(58,'Can change Tương tác Partner',15,'change_partnerinteraction'),(59,'Can delete Tương tác Partner',15,'delete_partnerinteraction'),(60,'Can view Tương tác Partner',15,'view_partnerinteraction'),(61,'Can add File giới thiệu Partner',16,'add_partnerintromedia'),(62,'Can change File giới thiệu Partner',16,'change_partnerintromedia'),(63,'Can delete File giới thiệu Partner',16,'delete_partnerintromedia'),(64,'Can view File giới thiệu Partner',16,'view_partnerintromedia'),(65,'Can add Tour',17,'add_tour'),(66,'Can change Tour',17,'change_tour'),(67,'Can delete Tour',17,'delete_tour'),(68,'Can view Tour',17,'view_tour'),(69,'Can add Điểm tham quan của Tour',18,'add_tour_poi'),(70,'Can change Điểm tham quan của Tour',18,'change_tour_poi'),(71,'Can delete Điểm tham quan của Tour',18,'delete_tour_poi'),(72,'Can view Điểm tham quan của Tour',18,'view_tour_poi');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `breadcrumb_logs`
--

DROP TABLE IF EXISTS `breadcrumb_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `breadcrumb_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lat` double NOT NULL,
  `long` double NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `status` int NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `breadcrumb_user_ts_idx` (`user_id`,`timestamp`),
  CONSTRAINT `breadcrumb_logs_user_id_8b958168_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `breadcrumb_logs`
--

LOCK TABLES `breadcrumb_logs` WRITE;
/*!40000 ALTER TABLE `breadcrumb_logs` DISABLE KEYS */;
INSERT INTO `breadcrumb_logs` VALUES (1,10.759321437601415,106.68181590851279,'2026-03-21 06:38:25.734000',1,NULL),(2,10.759481160015907,106.68176764417339,'2026-03-21 06:45:28.741000',1,NULL),(3,10.759371686514594,106.68180242305165,'2026-03-21 06:48:04.283000',1,NULL),(4,10.759485207439198,106.68174437052932,'2026-03-21 06:53:34.877000',1,NULL),(5,10.754991763318907,106.70354247093202,'2026-03-21 06:53:35.367000',1,NULL),(6,10.755866361466103,106.70444369316102,'2026-03-21 06:53:40.160000',1,NULL),(7,10.759320429778484,106.68184013851183,'2026-03-21 06:55:48.272000',1,NULL),(8,10.75564507783718,106.70433640480043,'2026-03-21 06:56:05.579000',1,NULL),(9,10.759310301230451,106.68183927045173,'2026-03-21 06:56:07.596000',1,NULL),(10,10.759310301230451,106.68183927045173,'2026-03-21 06:56:18.328000',1,NULL),(11,10.759310301230451,106.68183927045173,'2026-03-21 06:56:23.804000',1,NULL),(12,10.759310301230451,106.68183927045173,'2026-03-21 06:56:27.348000',1,NULL),(13,10.754401671570053,106.70308113098146,'2026-03-21 06:57:56.338000',1,NULL),(14,10.759308743710514,106.68183896421672,'2026-03-21 06:59:06.101000',1,NULL),(15,10.7765,106.701,'2026-03-21 06:59:30.010000',1,NULL),(16,10.759289281104172,106.68185687854569,'2026-03-21 06:59:36.969000',1,NULL),(17,10.759346510130912,106.68180805486038,'2026-03-21 07:00:12.031000',1,NULL),(18,10.756025109399681,106.70477329938818,'2026-03-21 07:00:13.540000',1,NULL),(19,10.759354236921157,106.68179469734676,'2026-03-21 07:00:33.419000',1,NULL),(20,10.754845395053964,106.70343518257143,'2026-03-21 07:00:35.035000',1,NULL),(21,10.759328768652718,106.68180477863771,'2026-03-21 07:01:24.890000',1,NULL),(22,10.759321352039562,106.68182298185539,'2026-03-21 07:03:03.660000',1,NULL),(23,10.754443821018988,106.70298457145692,'2026-03-21 07:03:06.244000',1,NULL),(24,10.759330500558145,106.68182669112724,'2026-03-21 07:04:47.530000',1,NULL),(25,10.759330500558145,106.68182669112724,'2026-03-21 07:04:55.780000',1,NULL),(26,10.759335746264068,106.68181263091545,'2026-03-21 07:05:00.280000',1,NULL),(27,10.759498653264542,106.681777096602,'2026-03-21 07:09:24.681000',1,NULL),(28,10.759330500558145,106.68182669112724,'2026-03-21 07:09:55.240000',1,NULL),(29,10.759447091385594,106.68180175721663,'2026-03-21 07:22:51.628000',1,NULL),(30,10.756619647921234,106.70332789421083,'2026-03-21 07:23:09.740000',1,NULL),(31,10.755613572014706,106.70332789421083,'2026-03-21 07:23:20.312000',1,NULL),(32,10.755845392979465,106.70594573020935,'2026-03-21 07:23:31.629000',1,NULL),(33,10.757130942368397,106.70292019844057,'2026-03-21 07:23:32.691000',1,NULL),(34,10.759354779636977,106.68181045184173,'2026-03-21 07:23:37.137000',1,NULL),(35,10.759347772603247,106.68179064324259,'2026-03-21 07:28:42.504000',1,NULL),(36,10.759317221529063,106.68182556961015,'2026-03-21 07:30:20.006000',1,NULL),(37,10.75932212657191,106.68182164265748,'2026-03-21 07:34:25.223000',1,NULL),(38,10.759353752659774,106.68180862201238,'2026-03-21 07:36:07.741000',1,NULL),(39,10.759362710542192,106.68179215283718,'2026-03-21 07:52:08.269000',1,NULL),(40,10.759312296653409,106.68182873958993,'2026-03-21 07:53:50.386000',1,NULL),(41,10.759359225218667,106.68180046250981,'2026-03-21 07:54:42.037000',1,NULL),(42,10.7593087298021,106.6818368346273,'2026-03-21 07:55:39.451000',1,NULL),(43,10.759358825002705,106.6817899369397,'2026-03-21 07:57:40.903000',1,NULL),(44,10.759417347740865,106.68176320454215,'2026-03-21 07:58:30.000000',1,NULL),(45,10.759351596088763,106.68180260851878,'2026-03-21 07:59:07.671000',1,NULL),(46,10.7594163051413,106.68175336294172,'2026-03-21 08:01:05.353000',1,NULL),(47,10.759388378703074,106.68180588145232,'2026-03-21 08:01:55.862000',1,NULL),(48,10.759415548774278,106.68176630985472,'2026-03-21 08:04:10.366000',1,NULL),(49,10.75934946238993,106.6818053661648,'2026-03-21 08:04:28.209000',1,NULL),(50,10.759414515059278,106.68175371820095,'2026-03-21 08:07:52.382000',1,NULL),(51,10.759351874370804,106.68179775182197,'2026-03-21 08:08:05.033000',1,NULL),(52,10.759353718679124,106.6817923989392,'2026-03-21 08:12:06.430000',1,NULL),(53,10.755655105695341,106.70379459857942,'2026-03-21 08:12:19.399000',1,NULL),(54,10.759321437601415,106.68181590851279,'2026-03-21 08:13:15.066000',1,NULL),(55,10.759417335961736,106.68175340296065,'2026-03-21 08:15:10.859000',1,NULL),(56,10.759336172716793,106.68181347220505,'2026-03-21 08:15:22.502000',1,NULL),(57,10.75934283159033,106.68184221121889,'2026-03-21 08:17:17.653000',1,NULL),(58,10.759378912804511,106.6818290622303,'2026-03-21 08:18:22.847000',1,NULL),(59,10.759425575378959,106.68176829354476,'2026-03-21 08:20:19.110000',1,NULL),(60,10.759357121373284,106.68181153808243,'2026-03-21 08:21:09.771000',1,NULL),(61,10.7765,106.701,'2026-03-21 08:24:56.934000',1,NULL),(62,10.759353249356709,106.68179351554508,'2026-03-21 08:24:58.034000',1,NULL),(63,10.7562617935607,106.70507662666732,'2026-03-21 08:25:04.095000',1,NULL),(64,10.759479771095155,106.68174342796229,'2026-03-21 08:37:38.937000',1,NULL);
/*!40000 ALTER TABLE `breadcrumb_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_users_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2026-03-06 15:50:00.775451','1','[Hình ảnh] vi - it2mozls8fnw5cfscwcx.docx',1,'[{\"added\": {}}]',9,1),(2,'2026-03-14 07:28:23.475478','1','Hao Mlem',1,'[{\"added\": {}}]',10,1),(3,'2026-03-21 05:11:23.739243','13','Khu Bún Bò & Phở Sáng',2,'[{\"changed\": {\"fields\": [\"M\\u00f4 t\\u1ea3\"]}}]',10,1),(4,'2026-03-21 05:17:44.547167','13','Khu Bún Bò & Phở Sáng',2,'[{\"changed\": {\"fields\": [\"M\\u00f4 t\\u1ea3\"]}}]',10,1),(5,'2026-03-21 08:35:20.563780','8','? Phố Ẩm Thực Vĩnh Khánh',2,'[]',10,1),(6,'2026-03-21 08:35:41.355987','8','? Phố Ẩm Thực Vĩnh Khánh',2,'[{\"changed\": {\"name\": \"File \\u00e2m thanh\", \"object\": \"\\ud83c\\udf5c Ph\\u1ed1 \\u1ea8m Th\\u1ef1c V\\u0129nh Kh\\u00e1nh [vi/mien_nam] (TTS)\", \"fields\": [\"N\\u1ed9i dung TTS (b\\u1ea3n d\\u1ecbch)\"]}}]',10,1),(7,'2026-03-21 08:40:00.930075','8','? Phố Ẩm Thực Vĩnh Khánh',2,'[]',10,1),(8,'2026-03-21 08:40:52.865078','11','Chùa Vĩnh Khánh Cổ',2,'[]',10,1),(9,'2026-03-21 08:40:52.875278','11','Chùa Vĩnh Khánh Cổ',2,'[]',10,1),(10,'2026-03-21 08:43:50.290351','11','Chùa Vĩnh Khánh Cổ',2,'[]',10,1),(11,'2026-03-21 08:46:52.281619','9','Quán Hải Sản Đêm Vĩnh Khánh',2,'[]',10,1),(12,'2026-03-21 08:46:52.310434','9','Quán Hải Sản Đêm Vĩnh Khánh',2,'[]',10,1),(13,'2026-03-24 13:48:54.321101','8','? Phố Ẩm Thực Vĩnh Khánh',2,'[]',10,1),(14,'2026-03-24 14:22:11.020532','13','Khu Bún Bò & Phở Sáng',2,'[]',10,1);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(11,'analytics','breadcrumblog'),(12,'analytics','narrationlog'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(9,'core','media'),(14,'pois','media'),(13,'pois','partner'),(15,'pois','partnerinteraction'),(16,'pois','partnerintromedia'),(10,'pois','poi'),(5,'sessions','session'),(6,'token_blacklist','blacklistedtoken'),(7,'token_blacklist','outstandingtoken'),(17,'tours','tour'),(18,'tours','tour_poi'),(8,'users','user');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-03-06 15:15:39.355407'),(2,'contenttypes','0002_remove_content_type_name','2026-03-06 15:15:39.425478'),(3,'auth','0001_initial','2026-03-06 15:15:39.746604'),(4,'auth','0002_alter_permission_name_max_length','2026-03-06 15:15:39.809139'),(5,'auth','0003_alter_user_email_max_length','2026-03-06 15:15:39.815839'),(6,'auth','0004_alter_user_username_opts','2026-03-06 15:15:39.823081'),(7,'auth','0005_alter_user_last_login_null','2026-03-06 15:15:39.829034'),(8,'auth','0006_require_contenttypes_0002','2026-03-06 15:15:39.833782'),(9,'auth','0007_alter_validators_add_error_messages','2026-03-06 15:15:39.839606'),(10,'auth','0008_alter_user_username_max_length','2026-03-06 15:15:39.845244'),(11,'auth','0009_alter_user_last_name_max_length','2026-03-06 15:15:39.851741'),(12,'auth','0010_alter_group_name_max_length','2026-03-06 15:15:39.867652'),(13,'auth','0011_update_proxy_permissions','2026-03-06 15:15:39.874730'),(14,'auth','0012_alter_user_first_name_max_length','2026-03-06 15:15:39.881415'),(15,'users','0001_initial','2026-03-06 15:15:40.238619'),(16,'admin','0001_initial','2026-03-06 15:15:40.387721'),(17,'admin','0002_logentry_remove_auto_add','2026-03-06 15:15:40.392633'),(18,'admin','0003_logentry_add_action_flag_choices','2026-03-06 15:15:40.401469'),(19,'sessions','0001_initial','2026-03-06 15:15:40.439638'),(20,'token_blacklist','0001_initial','2026-03-06 15:15:40.600227'),(21,'token_blacklist','0002_outstandingtoken_jti_hex','2026-03-06 15:15:40.623764'),(22,'token_blacklist','0003_auto_20171017_2007','2026-03-06 15:15:40.639204'),(23,'token_blacklist','0004_auto_20171017_2013','2026-03-06 15:15:40.718554'),(24,'token_blacklist','0005_remove_outstandingtoken_jti','2026-03-06 15:15:40.778548'),(25,'token_blacklist','0006_auto_20171017_2113','2026-03-06 15:15:40.800387'),(26,'token_blacklist','0007_auto_20171017_2214','2026-03-06 15:15:41.059045'),(27,'token_blacklist','0008_migrate_to_bigautofield','2026-03-06 15:15:41.308685'),(28,'token_blacklist','0010_fix_migrate_to_bigautofield','2026-03-06 15:15:41.316351'),(29,'token_blacklist','0011_linearizes_history','2026-03-06 15:15:41.320829'),(30,'token_blacklist','0012_alter_outstandingtoken_user','2026-03-06 15:15:41.332778'),(31,'token_blacklist','0013_alter_blacklistedtoken_options_and_more','2026-03-06 15:15:41.343123'),(32,'core','0001_initial','2026-03-06 15:49:20.020911'),(33,'pois','0001_initial','2026-03-14 03:01:05.444805'),(34,'analytics','0001_initial','2026-03-14 03:01:05.714040'),(35,'pois','0002_partner_media','2026-03-14 03:42:18.382659'),(36,'pois','0003_partnerinteraction_partnerintromedia_and_more','2026-03-21 04:51:33.706671'),(37,'pois','0004_align_partner_with_erd','2026-03-21 04:51:34.071140'),(38,'pois','0005_partner_status_pending_approval','2026-03-21 04:51:34.075281'),(39,'tours','0001_initial','2026-03-21 04:51:34.157750'),(40,'tours','0002_tour_poi','2026-03-21 04:51:34.336440'),(41,'tours','0003_alter_tour_poi_sequence_order','2026-03-21 04:51:34.349237'),(42,'tours','0004_tour_description_estimated_duration_min','2026-03-21 04:51:34.399125'),(43,'tours','0005_tour_poi_unique_order_per_tour','2026-03-21 04:51:34.420947'),(44,'tours','0006_tour_poi_unique_poi_per_tour','2026-03-21 04:51:34.439424'),(45,'core','0002_remove_media_poi_id_media_poi','2026-03-21 04:58:30.500253'),(46,'pois','0006_add_partner_intro_text','2026-03-21 06:28:53.789936'),(47,'analytics','0002_allow_anonymous_user','2026-03-21 06:37:11.839334'),(48,'pois','0007_add_partner_qr_url','2026-03-21 06:54:55.875188'),(49,'pois','0008_add_media_tts_content','2026-03-21 08:17:02.335642');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('98xmylv9lu51o6s7f3mxqo5j3pjnxcjm','.eJxVjDsOwyAQRO9CHaGFxWBSpvcZEJ8lOIlAMnYV5e6xJRdJN5r3Zt7M-W0tbuu0uDmxKxPs8tsFH59UD5Aevt4bj62uyxz4ofCTdj61RK_b6f4dFN_Lvg6UEbXNOmsklDkqA2IgAhAjAKZojTBSqgGERj0GvUcjLIGVKvlk2OcLwzY2gA:1vyWy0:o9mfovO9jG_ZDv2bZKcEQrOCq0ctATlHljXoXjhb0iQ','2026-03-20 15:19:52.700403'),('jlzwdrbomfpa0jfcx89kydl6qjqks6rn','.eJxVjDsOwyAQRO9CHaGFxWBSpvcZEJ8lOIlAMnYV5e6xJRdJN5r3Zt7M-W0tbuu0uDmxKxPs8tsFH59UD5Aevt4bj62uyxz4ofCTdj61RK_b6f4dFN_Lvg6UEbXNOmsklDkqA2IgAhAjAKZojTBSqgGERj0GvUcjLIGVKvlk2OcLwzY2gA:1w1FV5:o9eDKlZ2OCVwdPIaJQFUI9vQ-fQ-5TJF4hXZjGM-_uo','2026-03-28 03:17:15.386896');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media`
--

DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file` varchar(255) NOT NULL,
  `language` varchar(10) NOT NULL,
  `voice_region` varchar(50) NOT NULL,
  `media_type` varchar(10) NOT NULL,
  `status` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `poi_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_poi_id_d04afa07_fk_pois_id` (`poi_id`),
  CONSTRAINT `media_poi_id_d04afa07_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media`
--

LOCK TABLES `media` WRITE;
/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT INTO `media` VALUES (1,'raw/upload/v1772812200/it2mozls8fnw5cfscwcx.docx','vi','Miền Nam','image',1,'2026-03-06 15:50:00.773416','2026-03-06 15:50:00.773416',NULL);
/*!40000 ALTER TABLE `media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `narration_logs`
--

DROP TABLE IF EXISTS `narration_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `narration_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `start_time` datetime(6) NOT NULL,
  `duration` int DEFAULT NULL,
  `trigger_type` varchar(10) NOT NULL,
  `status` int NOT NULL,
  `poi_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `narration_logs_poi_id_ce50e83d_fk_pois_id` (`poi_id`),
  KEY `narration_antispam_idx` (`user_id`,`poi_id`,`trigger_type`,`start_time`),
  CONSTRAINT `narration_logs_poi_id_ce50e83d_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`),
  CONSTRAINT `narration_logs_user_id_b32d5dd8_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `narration_logs`
--

LOCK TABLES `narration_logs` WRITE;
/*!40000 ALTER TABLE `narration_logs` DISABLE KEYS */;
INSERT INTO `narration_logs` VALUES (1,'2026-03-21 06:53:40.164000',NULL,'AUTO',1,9,NULL),(2,'2026-03-21 06:57:57.513000',NULL,'QR',1,11,NULL),(3,'2026-03-21 06:58:28.505000',NULL,'QR',1,11,NULL),(4,'2026-03-21 07:00:13.545000',NULL,'AUTO',1,11,NULL),(5,'2026-03-21 07:00:35.070000',NULL,'AUTO',1,8,NULL),(6,'2026-03-21 07:00:40.325000',NULL,'QR',1,13,NULL),(7,'2026-03-21 07:03:30.071000',NULL,'QR',1,8,NULL),(8,'2026-03-21 07:23:09.780000',NULL,'AUTO',1,8,NULL),(9,'2026-03-21 07:23:22.253000',NULL,'QR',1,8,NULL),(10,'2026-03-21 07:23:32.697000',NULL,'AUTO',1,13,NULL),(11,'2026-03-21 07:41:06.957000',NULL,'QR',1,8,NULL),(12,'2026-03-21 08:12:08.772000',NULL,'QR',1,8,NULL),(13,'2026-03-21 08:12:19.440000',NULL,'AUTO',1,9,NULL),(14,'2026-03-21 08:12:25.519000',NULL,'QR',1,8,NULL),(15,'2026-03-21 08:25:04.107000',NULL,'AUTO',1,11,NULL);
/*!40000 ALTER TABLE `narration_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_interactions`
--

DROP TABLE IF EXISTS `partner_interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_interactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `interaction_type` varchar(20) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `status` int NOT NULL,
  `partner_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_interactions_user_id_b9d7396e_fk_users_id` (`user_id`),
  KEY `partner_interaction_idx` (`partner_id`,`interaction_type`,`timestamp`),
  CONSTRAINT `partner_interactions_partner_id_ea62e508_fk_partners_id` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `partner_interactions_user_id_b9d7396e_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_interactions`
--

LOCK TABLES `partner_interactions` WRITE;
/*!40000 ALTER TABLE `partner_interactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_intro_media`
--

DROP TABLE IF EXISTS `partner_intro_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_intro_media` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `media_id` int NOT NULL,
  `language` varchar(10) NOT NULL,
  `voice_region` varchar(50) NOT NULL,
  `status` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `partner_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `partner_intro_lang_idx` (`partner_id`,`language`,`voice_region`),
  CONSTRAINT `partner_intro_media_partner_id_40f24edd_fk_partners_id` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_intro_media`
--

LOCK TABLES `partner_intro_media` WRITE;
/*!40000 ALTER TABLE `partner_intro_media` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_intro_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `business_name` varchar(255) NOT NULL,
  `menu_details` json NOT NULL,
  `opening_hours` varchar(100) NOT NULL,
  `status` int NOT NULL,
  `poi_id` bigint NOT NULL,
  `intro_text` longtext NOT NULL,
  `qr_url` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `partners_poi_id_05744b50` (`poi_id`),
  CONSTRAINT `partners_poi_id_05744b50_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES (7,'Bánh Tráng Chị Hoa','{\"must_try\": [\"Bánh tráng nướng trứng cút\", \"Bánh tráng nướng phô mai\"], \"price_range\": \"10k - 25k\"}','16:00 - 23:00',2,8,'',''),(8,'Bánh Tráng Anh Tú','{\"must_try\": [\"Bánh tráng nướng tôm khô\", \"Bánh tráng cuộn\"], \"price_range\": \"15k - 30k\"}','17:00 - 22:30',2,8,'',''),(9,'Hải Sản Cô Ba','{\"must_try\": [\"Ghẹ rang me\", \"Ốc hương xào dừa\", \"Tôm nướng muối ớt\"], \"price_range\": \"150k - 500k\"}','17:00 - 01:00',2,9,'',''),(10,'Chè Nguyên','{\"must_try\": [\"Chè khúc bạch\", \"Chè 3 màu\", \"Nước mía ép\"], \"price_range\": \"20k - 45k\"}','08:00 - 23:00',2,10,'',''),(11,'Phở Ký','{\"must_try\": [\"Phở bò tái nạm\", \"Hủ tiếu bò\"], \"price_range\": \"45k - 65k\"}','05:00 - 10:00',2,13,'',''),(12,'Bún Bò Cô Hương','{\"must_try\": [\"Bún bò Huế giò heo\", \"Bún bò chả cua\"], \"price_range\": \"50k - 70k\"}','05:30 - 10:30',2,13,'',''),(13,'Hải Sản Năm Phước','{\"must_try\": [\"Ghẹ rang me\", \"Mực nhồi thịt hấp\", \"Tôm nướng muối ớt\"], \"price_range\": \"150k - 500k\"}','10:00 - 23:00',2,8,'Chào mừng bạn đến Hải Sản Năm Phước! Quán chúng tôi chuyên các món hải sản tươi sống nguyên con, đặc biệt là ghẹ rang me và mực nhồi thịt hấp. Giá cả hợp lý, phục vụ từ 10 giờ sáng đến 11 giờ đêm.','https://maps.app.goo.gl/demo-hai-san'),(14,'Bún Bò Huế Dì Tám','{\"must_try\": [\"Bún bò đặc biệt\", \"Bún giò heo\", \"Bánh mì chấm\"], \"price_range\": \"40k - 80k\"}','06:00 - 10:00',2,8,'Bún Bò Huế Dì Tám — hơn 30 năm giữ nguyên hương vị truyền thống. Nước dùng hầm xương bò 12 tiếng, cay đậm đà, ăn kèm rau sống tươi. Quán mở từ 6 giờ sáng, thường hết hàng trước 10 giờ!',''),(15,'Chè Thái Cô Lan','{\"must_try\": [\"Chè Thái đặc biệt\", \"Trà sữa trân châu\", \"Sinh tố bơ\"], \"price_range\": \"20k - 45k\"}','08:00 - 22:00',2,8,'Giải nhiệt ngay với ly chè Thái mát lạnh của Cô Lan! Topping phong phú: thạch dừa, trân châu, đậu đỏ, kem béo. Chỉ 25.000đ một ly lớn, phục vụ cả ngày.','https://facebook.com/demo-che-thai');
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `poi_media`
--

DROP TABLE IF EXISTS `poi_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poi_media` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_url` varchar(200) NOT NULL,
  `language` varchar(10) NOT NULL,
  `voice_region` varchar(50) NOT NULL,
  `media_type` varchar(10) NOT NULL,
  `status` int NOT NULL,
  `poi_id` bigint NOT NULL,
  `tts_content` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `media_poi_lang_region_idx` (`poi_id`,`language`,`voice_region`),
  CONSTRAINT `poi_media_poi_id_b691c5fc_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poi_media`
--

LOCK TABLES `poi_media` WRITE;
/*!40000 ALTER TABLE `poi_media` DISABLE KEYS */;
INSERT INTO `poi_media` VALUES (9,'','vi','mien_nam','TTS',1,8,'Vĩnh Khánh là con phố ẩm thực nổi tiếng bậc nhất Quận 4, TP. HCM. Nơi đây quy tụ hàng trăm quán ăn đặc sản từ hải sản tươi sống, bún bò, hủ tiếu cho đến các món ăn vặt đường phố. Không khí nhộn nhịp từ sáng đến đêm khuya thu hút cả người dân địa phương lẫn du khách thập phương.'),(10,'','en','','TTS',1,8,'Vinh Khanh is the most famous culinary street in District 4, City. HCM. This place brings together hundreds of specialty restaurants from fresh seafood, beef noodles, noodles to street snacks. The bustling atmosphere from morning to late night attracts both locals and tourists from everywhere.'),(11,'','vi','mien_nam','TTS',1,9,''),(12,'','vi','mien_nam','TTS',1,10,''),(13,'','vi','mien_nam','TTS',1,11,''),(14,'','en','','TTS',1,11,'The more than 150-year-old pagoda is located in the heart of Vinh Khanh culinary street, where local people and small businesses come to burn incense and pray for peace every early morning. The architecture is typical of Southern style, red tiled roof, majestic three-entrance gate.'),(15,'','vi','mien_nam','TTS',1,12,''),(16,'','vi','mien_nam','TTS',1,13,''),(17,'','ja','','TTS',1,8,'ヴィン カインは、市内 4 区で最も有名なグルメ街です。ホーチミン。この場所には、新鮮な魚介類、牛肉春雨、麺類から屋台の軽食まで、何百もの専門レストランが集まっています。朝から夜遅くまで賑やかな雰囲気があり、地元の人はもちろん、各地から観光客が集まります。'),(18,'','ko','','TTS',1,8,'Vinh Khanh은 도시 4군에서 가장 유명한 요리 거리입니다. HCM. 이곳에는 신선한 해산물, 쇠고기 국수, 국수부터 길거리 간식까지 수백 개의 전문 레스토랑이 모여 있습니다. 아침부터 늦은 밤까지 분주한 분위기는 현지인과 관광객 모두를 각지에서 끌어당깁니다.'),(19,'','ja','','TTS',1,11,'150 年以上の歴史を誇るこの塔は、ビン カイン料理街の中心部に位置しており、地元の人々や中小企業が毎朝早朝にお香を焚き、平和を祈るために集まります。典型的な南方様式の建築で、赤瓦の屋根、荘厳な三つ門の門が特徴です。'),(20,'','ko','','TTS',1,11,'150년이 넘는 역사를 지닌 이 탑은 빈칸(Vinh Khanh) 요리 거리 중심부에 위치해 있으며, 현지 주민과 소규모 사업체들이 매일 이른 아침 향을 피우고 평화를 기원하는 곳입니다. 건축물은 붉은 기와지붕, 장엄한 3문으로 이루어진 전형적인 남부 스타일의 건축물입니다.'),(21,'','en','','TTS',1,9,'The most famous night seafood food area in District 4 with dishes of roasted crab with tamarind, stir-fried snails, grilled shrimp with salt and chili, prepared fresh from seafood imported directly every day. Sitting on the sidewalk, the street atmosphere is typical of Saigon.'),(22,'','ja','','TTS',1,9,'4 区で最も有名な夜のシーフード フード エリア。毎日直輸入の新鮮な魚介類を使用して、タマリンド添えカニのロースト、カタツムリの炒め物、塩と唐辛子を添えたエビのグリルなどの料理を提供します。歩道に座っていると、サイゴンらしい街並みの雰囲気が漂います。'),(23,'','ko','','TTS',1,9,'매일 직수입한 신선한 해산물을 이용해 타마린드를 곁들인 게구이, 달팽이 볶음, 소금과 칠리를 곁들인 새우구이 등을 선보이는 4군에서 가장 유명한 야식 해산물 지역입니다. 보도에 앉아 있으면 전형적인 사이공의 거리 분위기를 느낄 수 있습니다.'),(24,'','zh','','TTS',1,9,''),(25,'','zh','','TTS',1,8,''),(26,'','en','','TTS',1,13,'aaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa aaaaaaaaaaaa'),(27,'','ja','','TTS',1,13,'ああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああああ'),(28,'','ko','','TTS',1,13,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa 아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아아'),(29,'','zh','','TTS',1,13,'');
/*!40000 ALTER TABLE `poi_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pois`
--

DROP TABLE IF EXISTS `pois`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pois` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `geofence_radius` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `qr_code_data` varchar(512) NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pois`
--

LOCK TABLES `pois` WRITE;
/*!40000 ALTER TABLE `pois` DISABLE KEYS */;
INSERT INTO `pois` VALUES (8,'? Phố Ẩm Thực Vĩnh Khánh','Vĩnh Khánh là con phố ẩm thực nổi tiếng bậc nhất Quận 4, TP. HCM. Nơi đây quy tụ hàng trăm quán ăn đặc sản từ hải sản tươi sống, bún bò, hủ tiếu cho đến các món ăn vặt đường phố. Không khí nhộn nhịp từ sáng đến đêm khuya thu hút cả người dân địa phương lẫn du khách thập phương.',10.7552,106.7038,200,'food','BCSD-POI-001',1),(9,'Quán Hải Sản Đêm Vĩnh Khánh','Khu ẩm thực hải sản đêm nổi tiếng nhất Quận 4 với các món ghẹ rang me, ốc hương xào, tôm nướng muối ớt được chế biến tươi ngon từ hải sản nhập trực tiếp mỗi ngày. Ngồi vỉa hè, không khí đường phố đặc trưng Sài Gòn.',10.7558,106.7042,50,'food','BCSD-POI-002',1),(10,'Góc Chè & Nước Ép Trái Cây','Điểm dừng chân quen thuộc của dân địa phương sau bữa ăn với hơn 30 loại chè truyền thống Nam Bộ: chè đậu xanh bột báng, chè khúc bạch, chè 3 màu... cùng các loại nước ép trái cây nhiệt đới tươi mát, mở cửa từ sáng đến đêm.',10.7545,106.7028,30,'food','BCSD-POI-003',1),(11,'Chùa Vĩnh Khánh Cổ','Ngôi chùa hơn 150 tuổi nằm giữa lòng phố ẩm thực Vĩnh Khánh, là nơi người dân địa phương và tiểu thương đến thắp hương cầu bình an mỗi sáng sớm. Kiến trúc đặc trưng phong cách Nam Bộ, mái ngói đỏ, cổng tam quan uy nghiêm.',10.7565,106.705,60,'historical','BCSD-POI-004',1),(12,'Cổng Chào Phố Vĩnh Khánh','Cổng chào biểu tượng của tuyến phố ẩm thực đêm Vĩnh Khánh, được thiết kế với đèn LED rực rỡ. Là điểm check-in nổi tiếng và cũng là điểm khởi đầu lý tưởng để khám phá toàn bộ tuyến phố ẩm thực. Sáng đèn từ 18:00 - 24:00.',10.754,106.7022,45,'cultural','BCSD-POI-005',1),(13,'Khu Bún Bò & Phở Sáng','áááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááááá',10.757,106.7032,40,'food','BCSD-POI-006',1);
/*!40000 ALTER TABLE `pois` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_blacklistedtoken`
--

DROP TABLE IF EXISTS `token_blacklist_blacklistedtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_blacklistedtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_blacklistedtoken`
--

LOCK TABLES `token_blacklist_blacklistedtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_outstandingtoken`
--

DROP TABLE IF EXISTS `token_blacklist_outstandingtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_outstandingtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` longtext NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `jti` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq` (`jti`),
  KEY `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` (`user_id`),
  CONSTRAINT `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_outstandingtoken`
--

LOCK TABLES `token_blacklist_outstandingtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_outstandingtoken` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDY3MzcwMywiaWF0IjoxNzc0MDY4OTAzLCJqdGkiOiJlMDgyMWIwOWZiNmI0ZGY5YTMxN2Y3MDJlYmE5OTkyNiIsInVzZXJfaWQiOiIyIn0.TWJ8vDQ6EzpkR0Qnkwl_739zySNtdAmI0l6yb7K1D0M','2026-03-21 04:55:03.377763','2026-03-28 04:55:03.000000',2,'e0821b09fb6b4df9a317f702eba99926');
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour_pois`
--

DROP TABLE IF EXISTS `tour_pois`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour_pois` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sequence_order` int NOT NULL,
  `status` int NOT NULL,
  `poi_id` bigint NOT NULL,
  `tour_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_tour_sequence_order` (`tour_id`,`sequence_order`),
  UNIQUE KEY `uniq_tour_poi` (`tour_id`,`poi_id`),
  KEY `tour_pois_poi_id_678dc6cb_fk_pois_id` (`poi_id`),
  CONSTRAINT `tour_pois_poi_id_678dc6cb_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`),
  CONSTRAINT `tour_pois_tour_id_2c118608_fk_tours_id` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour_pois`
--

LOCK TABLES `tour_pois` WRITE;
/*!40000 ALTER TABLE `tour_pois` DISABLE KEYS */;
INSERT INTO `tour_pois` VALUES (1,1,1,8,1),(2,2,1,9,1),(3,3,1,10,1),(4,1,1,11,2);
/*!40000 ALTER TABLE `tour_pois` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tours`
--

DROP TABLE IF EXISTS `tours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tours` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tour_name` varchar(255) NOT NULL,
  `is_suggested` tinyint(1) NOT NULL,
  `status` int NOT NULL,
  `created_by_id` bigint NOT NULL,
  `description` longtext NOT NULL,
  `estimated_duration_min` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tours_created_by_id_bb2db1f6_fk_users_id` (`created_by_id`),
  CONSTRAINT `tours_created_by_id_bb2db1f6_fk_users_id` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tours`
--

LOCK TABLES `tours` WRITE;
/*!40000 ALTER TABLE `tours` DISABLE KEYS */;
INSERT INTO `tours` VALUES (1,'Xuyên Đêm Phố Vĩnh Khánh',1,1,3,'Khám phá các hàng quán đêm sầm uất nhất phố Vĩnh Khánh.',90),(2,'Văn Hóa Phố Quận 4',1,1,3,'Chùa cổ, gốc cây bồ đề và câu chuyện lịch sử khu dân cư lâu đời nhất Quận 4.',60),(3,'Ẩm Thực Bình Dân Sài Gòn',0,1,3,'Lang thang và thưởng thức các món ăn bình dân nổi tiếng nhất Sài Gòn.',120);
/*!40000 ALTER TABLE `tours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `email` varchar(254) NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `preferred_language` varchar(10) NOT NULL,
  `preferred_voice_region` varchar(50) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'pbkdf2_sha256$1000000$btrdA0jfeudUKb0VR51THX$cZ3PnB8DmC7evgNlMg60u0So8b/VMVmwfDWd+9D+OPM=','2026-03-14 03:17:15.383706',1,'akira3175','','',1,1,'2026-03-06 15:16:43.372016','akira31758421@gmail.com','','vi','','',1),(2,'pbkdf2_sha256$1000000$cS3PzxdeMmdD2KJE4lpiL1$TS9q25K4ZThzzpCRTeusIdu0M4np7mRpRmHKeGWSbmo=',NULL,0,'e','','',0,1,'2026-03-21 04:55:03.095580','ewanikloen@weoj.xn--c-dym','','vi','','',1),(3,'!EkXFcqI8zkP8Xu8oSjZCQBbJbV6gTmR1pN3Svrfk',NULL,0,'seed_tours','','',0,1,'2026-03-21 05:03:58.671212','seed.tours@bcsd.local','seed-tour-device','vi','mien_nam','',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_groups`
--

DROP TABLE IF EXISTS `users_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_groups_user_id_group_id_fc7788e8_uniq` (`user_id`,`group_id`),
  KEY `users_groups_group_id_2f3517aa_fk_auth_group_id` (`group_id`),
  CONSTRAINT `users_groups_group_id_2f3517aa_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `users_groups_user_id_f500bee5_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_groups`
--

LOCK TABLES `users_groups` WRITE;
/*!40000 ALTER TABLE `users_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user_permissions`
--

DROP TABLE IF EXISTS `users_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_permissions_user_id_permission_id_3b86cbdf_uniq` (`user_id`,`permission_id`),
  KEY `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` (`permission_id`),
  CONSTRAINT `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `users_user_permissions_user_id_92473840_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user_permissions`
--

LOCK TABLES `users_user_permissions` WRITE;
/*!40000 ALTER TABLE `users_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-24 23:55:58
