-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Server version:               8.0.36 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Phiên bản:           12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for buocchancoi_db
CREATE DATABASE IF NOT EXISTS `buocchancoi_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `buocchancoi_db`;

-- Dumping structure for table buocchancoi_db.auth_group
CREATE TABLE IF NOT EXISTS `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.auth_group: ~3 rows (approximately)
INSERT INTO `auth_group` (`id`, `name`) VALUES
	(1, 'Admin'),
	(2, 'Partner'),
	(3, 'User');

-- Dumping structure for table buocchancoi_db.auth_group_permissions
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.auth_group_permissions: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.auth_permission
CREATE TABLE IF NOT EXISTS `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.auth_permission: ~64 rows (approximately)
INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
	(1, 'Can add log entry', 1, 'add_logentry'),
	(2, 'Can change log entry', 1, 'change_logentry'),
	(3, 'Can delete log entry', 1, 'delete_logentry'),
	(4, 'Can view log entry', 1, 'view_logentry'),
	(5, 'Can add permission', 2, 'add_permission'),
	(6, 'Can change permission', 2, 'change_permission'),
	(7, 'Can delete permission', 2, 'delete_permission'),
	(8, 'Can view permission', 2, 'view_permission'),
	(9, 'Can add group', 3, 'add_group'),
	(10, 'Can change group', 3, 'change_group'),
	(11, 'Can delete group', 3, 'delete_group'),
	(12, 'Can view group', 3, 'view_group'),
	(13, 'Can add content type', 4, 'add_contenttype'),
	(14, 'Can change content type', 4, 'change_contenttype'),
	(15, 'Can delete content type', 4, 'delete_contenttype'),
	(16, 'Can view content type', 4, 'view_contenttype'),
	(17, 'Can add session', 5, 'add_session'),
	(18, 'Can change session', 5, 'change_session'),
	(19, 'Can delete session', 5, 'delete_session'),
	(20, 'Can view session', 5, 'view_session'),
	(21, 'Can add Blacklisted Token', 6, 'add_blacklistedtoken'),
	(22, 'Can change Blacklisted Token', 6, 'change_blacklistedtoken'),
	(23, 'Can delete Blacklisted Token', 6, 'delete_blacklistedtoken'),
	(24, 'Can view Blacklisted Token', 6, 'view_blacklistedtoken'),
	(25, 'Can add Outstanding Token', 7, 'add_outstandingtoken'),
	(26, 'Can change Outstanding Token', 7, 'change_outstandingtoken'),
	(27, 'Can delete Outstanding Token', 7, 'delete_outstandingtoken'),
	(28, 'Can view Outstanding Token', 7, 'view_outstandingtoken'),
	(29, 'Can add Media', 8, 'add_media'),
	(30, 'Can change Media', 8, 'change_media'),
	(31, 'Can delete Media', 8, 'delete_media'),
	(32, 'Can view Media', 8, 'view_media'),
	(33, 'Can add Người dùng', 9, 'add_user'),
	(34, 'Can change Người dùng', 9, 'change_user'),
	(35, 'Can delete Người dùng', 9, 'delete_user'),
	(36, 'Can view Người dùng', 9, 'view_user'),
	(37, 'Can add Điểm tham quan', 10, 'add_poi'),
	(38, 'Can change Điểm tham quan', 10, 'change_poi'),
	(39, 'Can delete Điểm tham quan', 10, 'delete_poi'),
	(40, 'Can view Điểm tham quan', 10, 'view_poi'),
	(41, 'Can add Đối tác', 11, 'add_partner'),
	(42, 'Can change Đối tác', 11, 'change_partner'),
	(43, 'Can delete Đối tác', 11, 'delete_partner'),
	(44, 'Can view Đối tác', 11, 'view_partner'),
	(45, 'Can add File âm thanh', 12, 'add_media'),
	(46, 'Can change File âm thanh', 12, 'change_media'),
	(47, 'Can delete File âm thanh', 12, 'delete_media'),
	(48, 'Can view File âm thanh', 12, 'view_media'),
	(49, 'Can add Vết di chuyển', 13, 'add_breadcrumblog'),
	(50, 'Can change Vết di chuyển', 13, 'change_breadcrumblog'),
	(51, 'Can delete Vết di chuyển', 13, 'delete_breadcrumblog'),
	(52, 'Can view Vết di chuyển', 13, 'view_breadcrumblog'),
	(53, 'Can add Lịch sử nghe', 14, 'add_narrationlog'),
	(54, 'Can change Lịch sử nghe', 14, 'change_narrationlog'),
	(55, 'Can delete Lịch sử nghe', 14, 'delete_narrationlog'),
	(56, 'Can view Lịch sử nghe', 14, 'view_narrationlog'),
	(57, 'Can add Tour', 15, 'add_tour'),
	(58, 'Can change Tour', 15, 'change_tour'),
	(59, 'Can delete Tour', 15, 'delete_tour'),
	(60, 'Can view Tour', 15, 'view_tour'),
	(61, 'Can add Điểm tham quan của Tour', 16, 'add_tour_poi'),
	(62, 'Can change Điểm tham quan của Tour', 16, 'change_tour_poi'),
	(63, 'Can delete Điểm tham quan của Tour', 16, 'delete_tour_poi'),
	(64, 'Can view Điểm tham quan của Tour', 16, 'view_tour_poi'),
	(65, 'Can add Tương tác Partner', 17, 'add_partnerinteraction'),
	(66, 'Can change Tương tác Partner', 17, 'change_partnerinteraction'),
	(67, 'Can delete Tương tác Partner', 17, 'delete_partnerinteraction'),
	(68, 'Can view Tương tác Partner', 17, 'view_partnerinteraction'),
	(69, 'Can add File giới thiệu Partner', 18, 'add_partnerintromedia'),
	(70, 'Can change File giới thiệu Partner', 18, 'change_partnerintromedia'),
	(71, 'Can delete File giới thiệu Partner', 18, 'delete_partnerintromedia'),
	(72, 'Can view File giới thiệu Partner', 18, 'view_partnerintromedia');

-- Dumping structure for table buocchancoi_db.breadcrumb_logs
CREATE TABLE IF NOT EXISTS `breadcrumb_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lat` double NOT NULL,
  `long` double NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `status` int NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `breadcrumb_user_ts_idx` (`user_id`,`timestamp`),
  CONSTRAINT `breadcrumb_logs_user_id_8b958168_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.breadcrumb_logs: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.django_admin_log
CREATE TABLE IF NOT EXISTS `django_admin_log` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.django_admin_log: ~2 rows (approximately)
INSERT INTO `django_admin_log` (`id`, `action_time`, `object_id`, `object_repr`, `action_flag`, `change_message`, `content_type_id`, `user_id`) VALUES
	(1, '2026-03-14 06:33:22.332170', '1', 'Điểm 1', 1, '[{"added": {}}]', 10, 1),
	(2, '2026-03-14 07:32:49.564264', '1', 'Điểm 1', 2, '[]', 10, 1);

-- Dumping structure for table buocchancoi_db.django_content_type
CREATE TABLE IF NOT EXISTS `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.django_content_type: ~12 rows (approximately)
INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
	(1, 'admin', 'logentry'),
	(13, 'analytics', 'breadcrumblog'),
	(14, 'analytics', 'narrationlog'),
	(3, 'auth', 'group'),
	(2, 'auth', 'permission'),
	(4, 'contenttypes', 'contenttype'),
	(8, 'core', 'media'),
	(12, 'pois', 'media'),
	(11, 'pois', 'partner'),
	(17, 'pois', 'partnerinteraction'),
	(18, 'pois', 'partnerintromedia'),
	(10, 'pois', 'poi'),
	(5, 'sessions', 'session'),
	(6, 'token_blacklist', 'blacklistedtoken'),
	(7, 'token_blacklist', 'outstandingtoken'),
	(15, 'tours', 'tour'),
	(16, 'tours', 'tour_poi'),
	(9, 'users', 'user');

-- Dumping structure for table buocchancoi_db.django_migrations
CREATE TABLE IF NOT EXISTS `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.django_migrations: ~45 rows (approximately)
INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
	(1, 'contenttypes', '0001_initial', '2026-03-10 16:52:11.832238'),
	(2, 'contenttypes', '0002_remove_content_type_name', '2026-03-10 16:52:11.934632'),
	(3, 'auth', '0001_initial', '2026-03-10 16:52:12.246021'),
	(4, 'auth', '0002_alter_permission_name_max_length', '2026-03-10 16:52:12.314396'),
	(5, 'auth', '0003_alter_user_email_max_length', '2026-03-10 16:52:12.320700'),
	(6, 'auth', '0004_alter_user_username_opts', '2026-03-10 16:52:12.327772'),
	(7, 'auth', '0005_alter_user_last_login_null', '2026-03-10 16:52:12.332653'),
	(8, 'auth', '0006_require_contenttypes_0002', '2026-03-10 16:52:12.337258'),
	(9, 'auth', '0007_alter_validators_add_error_messages', '2026-03-10 16:52:12.344384'),
	(10, 'auth', '0008_alter_user_username_max_length', '2026-03-10 16:52:12.352174'),
	(11, 'auth', '0009_alter_user_last_name_max_length', '2026-03-10 16:52:12.357950'),
	(12, 'auth', '0010_alter_group_name_max_length', '2026-03-10 16:52:12.375759'),
	(13, 'auth', '0011_update_proxy_permissions', '2026-03-10 16:52:12.379632'),
	(14, 'auth', '0012_alter_user_first_name_max_length', '2026-03-10 16:52:12.393570'),
	(15, 'users', '0001_initial', '2026-03-10 16:52:12.675024'),
	(16, 'admin', '0001_initial', '2026-03-10 16:52:12.810499'),
	(17, 'admin', '0002_logentry_remove_auto_add', '2026-03-10 16:52:12.816521'),
	(18, 'admin', '0003_logentry_add_action_flag_choices', '2026-03-10 16:52:12.827295'),
	(19, 'core', '0001_initial', '2026-03-10 16:52:12.861275'),
	(20, 'sessions', '0001_initial', '2026-03-10 16:52:12.905577'),
	(21, 'token_blacklist', '0001_initial', '2026-03-10 16:52:13.104674'),
	(22, 'token_blacklist', '0002_outstandingtoken_jti_hex', '2026-03-10 16:52:13.131230'),
	(23, 'token_blacklist', '0003_auto_20171017_2007', '2026-03-10 16:52:13.144108'),
	(24, 'token_blacklist', '0004_auto_20171017_2013', '2026-03-10 16:52:13.212598'),
	(25, 'token_blacklist', '0005_remove_outstandingtoken_jti', '2026-03-10 16:52:13.272563'),
	(26, 'token_blacklist', '0006_auto_20171017_2113', '2026-03-10 16:52:13.298094'),
	(27, 'token_blacklist', '0007_auto_20171017_2214', '2026-03-10 16:52:13.564124'),
	(28, 'token_blacklist', '0008_migrate_to_bigautofield', '2026-03-10 16:52:13.770660'),
	(29, 'token_blacklist', '0010_fix_migrate_to_bigautofield', '2026-03-10 16:52:13.774769'),
	(30, 'token_blacklist', '0011_linearizes_history', '2026-03-10 16:52:13.774769'),
	(31, 'token_blacklist', '0012_alter_outstandingtoken_user', '2026-03-10 16:52:13.796702'),
	(32, 'token_blacklist', '0013_alter_blacklistedtoken_options_and_more', '2026-03-10 16:52:13.803670'),
	(33, 'pois', '0001_initial', '2026-03-14 06:10:22.627173'),
	(34, 'analytics', '0001_initial', '2026-03-14 06:10:22.913286'),
	(35, 'pois', '0002_partner_media', '2026-03-14 06:10:23.103034'),
	(36, 'tours', '0001_initial', '2026-03-14 08:54:36.640250'),
	(37, 'tours', '0002_tour_poi', '2026-03-14 08:54:36.791013'),
	(38, 'tours', '0003_alter_tour_poi_sequence_order', '2026-03-14 08:54:36.791013'),
	(39, 'pois', '0003_partnerinteraction_partnerintromedia_and_more', '2026-03-18 02:59:54.544171'),
	(40, 'pois', '0004_align_partner_with_erd', '2026-03-18 03:31:51.538761'),
	(41, 'analytics', '0002_allow_anonymous_user', '2026-03-21 22:35:10.780595'),
	(42, 'pois', '0005_partner_status_pending_approval', '2026-03-21 22:35:10.796349'),
	(43, 'core', '0002_remove_media_poi_id_media_poi', '2026-03-21 22:35:10.907245'),
	(44, 'pois', '0006_add_partner_intro_text', '2026-03-21 22:35:10.961502'),
	(45, 'pois', '0007_add_partner_qr_url', '2026-03-21 22:35:11.012000'),
	(46, 'tours', '0004_tour_description_estimated_duration_min', '2026-03-21 22:35:11.075400'),
	(47, 'tours', '0005_tour_poi_unique_order_per_tour', '2026-03-21 22:35:11.113490'),
	(48, 'tours', '0006_tour_poi_unique_poi_per_tour', '2026-03-21 22:35:11.140235');

-- Dumping structure for table buocchancoi_db.django_session
CREATE TABLE IF NOT EXISTS `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.django_session: ~2 rows (approximately)
INSERT INTO `django_session` (`session_key`, `session_data`, `expire_date`) VALUES
	('70fuoxwwlhquynaik0x6jmlyqmphkse1', '.eJxVjMsOwiAUBf-FtSHlQgFduu83EO4DqZqS9LEy_rs26UK3Z2bOS6W8rTVti8xpZHVRRp1-N8z0kGkHfM_TrWlq0zqPqHdFH3TRQ2N5Xg_376DmpX5rH03nIVguPSGYvj9LJOcJqJAEC5wLI3F24IxFASFyWEKh2ImBDtX7A_BsON0:1w00MT:orltQdfmcVZFoil2QFo3x7r3415abtjjLz6h3ETjIFc', '2026-03-24 16:55:13.688428'),
	('89xkmnpns5hzgsdxo05o4j3mocagm6nb', '.eJxVjMsOwiAUBf-FtSHlQgFduu83EO4DqZqS9LEy_rs26UK3Z2bOS6W8rTVti8xpZHVRRp1-N8z0kGkHfM_TrWlq0zqPqHdFH3TRQ2N5Xg_376DmpX5rH03nIVguPSGYvj9LJOcJqJAEC5wLI3F24IxFASFyWEKh2ImBDtX7A_BsON0:1w2hK5:29NkDi3hKcXPG-lFBQAO7oUfJeeydRWHYAIwhNINJK8', '2026-04-01 03:11:53.482882');

-- Dumping structure for table buocchancoi_db.media
CREATE TABLE IF NOT EXISTS `media` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.media: ~2 rows (approximately)
INSERT INTO `media` (`id`, `file`, `language`, `voice_region`, `media_type`, `status`, `created_at`, `updated_at`, `poi_id`) VALUES
	(1, '"abc"', '"abc"', '"abc"', '"abc"', 1, '2026-03-14 19:50:34.000000', '2026-03-14 19:50:35.000000', NULL),
	(2, '"abc"', '"abc"', '"abc"', '"abc"', 0, '2026-03-14 19:51:14.000000', '2026-03-14 19:51:15.000000', NULL);

-- Dumping structure for table buocchancoi_db.narration_logs
CREATE TABLE IF NOT EXISTS `narration_logs` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.narration_logs: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.partners
CREATE TABLE IF NOT EXISTS `partners` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.partners: ~2 rows (approximately)
INSERT INTO `partners` (`id`, `business_name`, `menu_details`, `opening_hours`, `status`, `poi_id`, `intro_text`, `qr_url`) VALUES
	(1, '"Phở Thìn Lò Đúc"', '{}', '06:00 - 20:30', 1, 1, '', ''),
	(2, '"Quán Cà phê"', '{}', '07:00 - 22:00', 0, 1, '', '');

-- Dumping structure for table buocchancoi_db.partner_interactions
CREATE TABLE IF NOT EXISTS `partner_interactions` (
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

-- Dumping data for table buocchancoi_db.partner_interactions: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.partner_intro_media
CREATE TABLE IF NOT EXISTS `partner_intro_media` (
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

-- Dumping data for table buocchancoi_db.partner_intro_media: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.pois
CREATE TABLE IF NOT EXISTS `pois` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.pois: ~0 rows (approximately)
INSERT INTO `pois` (`id`, `name`, `description`, `latitude`, `longitude`, `geofence_radius`, `category`, `qr_code_data`, `status`) VALUES
	(1, 'Điểm 1', 'Điểm tham quan 1', 10.755, 106.33, 50, 'Chưa biết', '', 1);

-- Dumping structure for table buocchancoi_db.poi_media
CREATE TABLE IF NOT EXISTS `poi_media` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_url` varchar(200) NOT NULL,
  `language` varchar(10) NOT NULL,
  `voice_region` varchar(50) NOT NULL,
  `media_type` varchar(10) NOT NULL,
  `status` int NOT NULL,
  `poi_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `media_poi_lang_region_idx` (`poi_id`,`language`,`voice_region`),
  CONSTRAINT `poi_media_poi_id_b691c5fc_fk_pois_id` FOREIGN KEY (`poi_id`) REFERENCES `pois` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.poi_media: ~0 rows (approximately)
INSERT INTO `poi_media` (`id`, `file_url`, `language`, `voice_region`, `media_type`, `status`, `poi_id`) VALUES
	(1, '"a"', '"vi""', '"nam"', '"a"', 1, 1);

-- Dumping structure for table buocchancoi_db.token_blacklist_blacklistedtoken
CREATE TABLE IF NOT EXISTS `token_blacklist_blacklistedtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.token_blacklist_blacklistedtoken: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.token_blacklist_outstandingtoken
CREATE TABLE IF NOT EXISTS `token_blacklist_outstandingtoken` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.token_blacklist_outstandingtoken: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.tours
CREATE TABLE IF NOT EXISTS `tours` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.tours: ~0 rows (approximately)
INSERT INTO `tours` (`id`, `tour_name`, `is_suggested`, `status`, `created_by_id`, `description`, `estimated_duration_min`) VALUES
	(1, 'Bình Tiên', 1, 1, 1, 'Bình Tiên', 1);

-- Dumping structure for table buocchancoi_db.tour_pois
CREATE TABLE IF NOT EXISTS `tour_pois` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.tour_pois: ~0 rows (approximately)
INSERT INTO `tour_pois` (`id`, `sequence_order`, `status`, `poi_id`, `tour_id`) VALUES
	(1, 1, 1, 1, 1);

-- Dumping structure for table buocchancoi_db.users
CREATE TABLE IF NOT EXISTS `users` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.users: ~0 rows (approximately)
INSERT INTO `users` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `is_staff`, `is_active`, `date_joined`, `email`, `device_id`, `preferred_language`, `preferred_voice_region`, `phone_number`, `status`) VALUES
	(1, 'pbkdf2_sha256$1000000$emHMJcEGqW7D4kqqDQOzw6$15wn96tGlay28HvHnvXO1q/HPuVYp1DLkWz2VhQRd5Y=', '2026-03-18 03:11:53.472796', 1, 'truonggiahao', '', '', 1, 1, '2026-03-10 16:54:15.671934', 'truonggiahao24@gmail.com', '', 'vi', '', '', 1),
	(2, 'pbkdf2_sha256$1000000$y9kzlv4IBg8Abk11tuJQUG$/k3IBJQ0LVR74TBbIEM/hq/EiQ1g44kaeGc1l6Aa0jc=', NULL, 1, 'haoyahoo', '', '', 1, 1, '2026-03-14 06:11:34.058115', 'truonggiahao24@yahoo.com', '', 'vi', '', '', 1);

-- Dumping structure for table buocchancoi_db.users_groups
CREATE TABLE IF NOT EXISTS `users_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_groups_user_id_group_id_fc7788e8_uniq` (`user_id`,`group_id`),
  KEY `users_groups_group_id_2f3517aa_fk_auth_group_id` (`group_id`),
  CONSTRAINT `users_groups_group_id_2f3517aa_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `users_groups_user_id_f500bee5_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.users_groups: ~0 rows (approximately)

-- Dumping structure for table buocchancoi_db.users_user_permissions
CREATE TABLE IF NOT EXISTS `users_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_permissions_user_id_permission_id_3b86cbdf_uniq` (`user_id`,`permission_id`),
  KEY `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` (`permission_id`),
  CONSTRAINT `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `users_user_permissions_user_id_92473840_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table buocchancoi_db.users_user_permissions: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
