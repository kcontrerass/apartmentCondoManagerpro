-- MySQL dump 10.13  Distrib 8.3.0, for macos14 (arm64)
--
-- Host: nozomi.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('334c9938-1b0f-4bc8-b87a-40f64805dbe3','17934a15ab8801cfb52edf8c66e43807ab813e4fdb1c857d6d49aea2a8c1c1c4','2026-01-28 00:39:16.029','20260121234622_add_reservations',NULL,NULL,'2026-01-28 00:39:15.397',1),('42058eed-6fd8-4a15-93bb-fc84d048f23a','14f994a824533bb50555cba46d96d87aec4cbe4266422d3265cad872a457ab27','2026-01-28 00:39:15.268','20260121204233_add_billing_system',NULL,NULL,'2026-01-28 00:39:14.443',1),('5ccd362d-c8d7-489f-bca3-9b6a618af452','1b56e8debf0818ecd157571f625cdd1e5f86c016364e3780240d2e7ba1078772','2026-01-28 00:39:14.309','20260121201145_add_services_and_unit_services',NULL,NULL,'2026-01-28 00:39:13.448',1),('6c4c13b7-e925-44ca-a395-fa9976224245','4b12b65640fcf03adae6da3a89004361dd6e97cfb350be6d0938f4d0f9c9b488','2026-01-28 00:39:17.602','20260128001736_link_reservation_invoice',NULL,NULL,'2026-01-28 00:39:16.162',1),('7c9fa5ab-c49f-406b-8bba-c1e2f934b555','701d8c65898769ab2bb6ac3c2470f8b8e5fcb424980f3008bbde5cfe676a6d97','2026-01-28 00:39:13.315','20260116224419_enforce_unique_admin_complex',NULL,NULL,'2026-01-28 00:39:12.877',1),('88ea215d-6725-4995-b85f-0e731ca668f6','397a3ce3aa461b6192cffc0918c41ba9cb2587d9d26e93fb9beff94b54a2bfe9','2026-01-28 00:39:12.087','20260114002939_add_reset_password_fields',NULL,NULL,'2026-01-28 00:39:11.589',1),('913adc2a-1e12-477a-8690-d055cf1d8117','0fa6ccb77e8a61ad94af9d8d678fa1a579410a9bbda501b3af3f6c8a16215831','2026-01-28 00:39:12.741','20260115232838_add_resident_cascade_delete',NULL,NULL,'2026-01-28 00:39:12.219',1),('ab0a355c-1406-4209-a78e-738f72e0986e','26a9029913bd38e6de48b523018e4c1972e4176c5c73ac8908714081b623ac8c','2026-01-28 00:39:11.322','20260113234244_init',NULL,NULL,'2026-01-28 00:39:10.116',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amenities`
--

DROP TABLE IF EXISTS `amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenities` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` enum('POOL','GYM','CLUBHOUSE','COURT','BBQ','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTHER',
  `capacity` int DEFAULT NULL,
  `operating_hours` json DEFAULT NULL,
  `cost_per_day` decimal(10,2) DEFAULT NULL,
  `cost_per_hour` decimal(10,2) DEFAULT NULL,
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `requires_payment` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `amenities_complex_id_fkey` (`complex_id`),
  CONSTRAINT `amenities_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenities`
--

LOCK TABLES `amenities` WRITE;
/*!40000 ALTER TABLE `amenities` DISABLE KEYS */;
INSERT INTO `amenities` VALUES ('cmkxashk0000a93xfad16zxh9','Main Pool','Large outdoor pool','POOL',20,NULL,NULL,50.00,'cmkxashk0000693xfd8itvml5','2026-01-28 00:39:25.920','2026-01-28 01:20:04.895',1),('cmkxashk0000b93xf3dc1gmre','Fitness Center','24/7 Gym access','GYM',10,'{\"days\": [0, 1, 2, 3, 4, 5, 6], \"open\": \"08:03\", \"close\": \"23:03\"}',20.00,10.00,'cmkxashk0000693xfd8itvml5','2026-01-28 00:39:25.920','2026-01-30 16:12:05.072',1),('cmkxc6uli00015qd6uqpujn13','Maintenance Fee','Salon','POOL',20,'{\"days\": [0, 1, 2, 3, 4, 5, 6], \"open\": \"09:18\", \"close\": \"23:18\"}',10.00,6.50,'cmkxashk0000693xfd8itvml5','2026-01-28 01:18:35.461','2026-01-28 01:59:41.972',1),('cmlb1tyfv0001pcc50ljyg7vq','Piscina grande','piscina de 20mts de profundida','POOL',15,'{\"days\": [0, 1, 2, 3, 4, 5, 6], \"open\": \"07:37\", \"close\": \"18:37\"}',20.00,100.00,'cmkxashk0000693xfd8itvml5','2026-02-06 15:37:24.379','2026-02-06 15:45:00.045',1),('cmlb4jkzm00013dxwk6ahyo3f','Asado','Asado','OTHER',3,'{\"days\": [0, 1, 2, 3, 4, 5, 6], \"open\": \"11:53\", \"close\": \"20:53\"}',20.00,5.00,'cmkxashk0000693xfd8itvml5','2026-02-06 16:53:19.233','2026-02-06 16:53:19.233',1);
/*!40000 ALTER TABLE `amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('LOW','NORMAL','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_roles` json DEFAULT NULL,
  `image_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `author_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_complex_id_idx` (`complex_id`),
  KEY `announcements_published_at_idx` (`published_at`),
  CONSTRAINT `announcements_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES ('cml8cszw30009cfxf0upppgib','test','esto es un test','URGENT','cmkxashk0000693xfd8itvml5','null',NULL,'2026-02-03 18:39:37.746','2026-02-12 21:21:00.000','cmkxases4000193xfkm2d7lag','Complex Manager','2026-02-04 18:21:16.851','2026-02-04 18:39:39.011'),('cml8cvpse000bcfxflpavi5p8','este es un aviso','dfsfasdfasdfasdfasdf','URGENT','cmkxashk0000693xfd8itvml5','null',NULL,'2026-02-03 18:39:37.746','2026-02-27 22:23:00.000','cmkxases4000193xfkm2d7lag','Complex Manager','2026-02-04 18:23:23.726','2026-02-04 18:39:39.011');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complexes`
--

DROP TABLE IF EXISTS `complexes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complexes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('BUILDING','RESIDENTIAL','CONDO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BUILDING',
  `logo_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `adminId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complexes_adminId_key` (`adminId`),
  CONSTRAINT `complexes_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complexes`
--

LOCK TABLES `complexes` WRITE;
/*!40000 ALTER TABLE `complexes` DISABLE KEYS */;
INSERT INTO `complexes` VALUES ('cmkxashk0000693xfd8itvml5','Sunset Towers','123 Ocean Drive, Miami, FL','BUILDING',NULL,NULL,'2026-01-28 00:39:25.920','2026-01-28 00:41:01.684','cmkxases4000193xfkm2d7lag'),('cml781odl0003ixt1i03gp76n','Torre Sol','123 Ocean Drive, Miami, FL','BUILDING','','{}','2026-02-03 23:20:17.381','2026-02-03 23:20:17.381','cml7814ku0001ixt1veburbhs');
/*!40000 ALTER TABLE `complexes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_rsvps`
--

DROP TABLE IF EXISTS `event_rsvps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_rsvps` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('GOING','NOT_GOING','MAYBE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `guests` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_rsvps_event_id_user_id_key` (`event_id`,`user_id`),
  KEY `event_rsvps_event_id_idx` (`event_id`),
  CONSTRAINT `event_rsvps_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_rsvps`
--

LOCK TABLES `event_rsvps` WRITE;
/*!40000 ALTER TABLE `event_rsvps` DISABLE KEYS */;
INSERT INTO `event_rsvps` VALUES ('cml8e8shn0001135zv9gdfo0y','cml8cxewy000dcfxfy2c4cp9r','cmkxasgqs000493xfzun65322','GOING',0,'2026-02-04 19:01:33.371','2026-02-04 19:01:42.919'),('cml8e9mi70007135zbrq5jiiy','cml8cxewy000dcfxfy2c4cp9r','cmkxases4000193xfkm2d7lag','GOING',0,'2026-02-04 19:02:12.271','2026-02-04 19:02:12.271'),('cml8kndzu000d135zkqnzxz23','cml8kn24h000b135zd68dssxj','cmkxasdyo000093xf8nx1apb9','GOING',0,'2026-02-04 22:00:51.908','2026-02-04 22:00:51.908'),('cml8knvwk000f135zbw1sfnum','cml8kn24h000b135zd68dssxj','cmkxasgqs000493xfzun65322','GOING',0,'2026-02-04 22:01:15.333','2026-02-04 22:01:15.333');
/*!40000 ALTER TABLE `event_rsvps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date` datetime(3) NOT NULL,
  `start_time` datetime(3) NOT NULL,
  `end_time` datetime(3) NOT NULL,
  `image_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organizer_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `events_complex_id_idx` (`complex_id`),
  KEY `events_event_date_idx` (`event_date`),
  CONSTRAINT `events_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES ('cml8cxewy000dcfxfy2c4cp9r','Fiesta de fin de año','detallesssssss','cmkxashk0000693xfd8itvml5','Salon social','2026-02-12 18:24:00.000','2026-02-12 18:24:00.000','2026-02-13 18:24:00.000',NULL,'cmkxases4000193xfkm2d7lag','Complex Manager','2026-02-04 18:24:42.804','2026-02-04 18:24:42.804'),('cml8klgoy0009135z952jlq1p','test','testesting','cmkxashk0000693xfd8itvml5','Salon social 2','2026-02-05 23:34:00.000','2026-02-05 23:34:00.000','2026-02-06 02:34:00.000',NULL,'cmkxasdyo000093xf8nx1apb9','Super Admin','2026-02-04 21:59:22.160','2026-02-04 23:34:50.740'),('cml8kn24h000b135zd68dssxj','testeing','testing numero 5','cmkxashk0000693xfd8itvml5','Salon Social 5','2026-02-05 02:00:00.000','2026-02-05 02:00:00.000','2026-02-07 03:00:00.000',NULL,'cmkxasdyo000093xf8nx1apb9','Super Admin','2026-02-04 22:00:36.602','2026-02-04 22:00:36.602');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incidents`
--

DROP TABLE IF EXISTS `incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidents` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('REPORTED','IN_PROGRESS','RESOLVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REPORTED',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `type` enum('MAINTENANCE','SECURITY','NOISE','CLEANING','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OTHER',
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolver_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `incidents_complex_id_idx` (`complex_id`),
  KEY `incidents_reporter_id_idx` (`reporter_id`),
  KEY `incidents_resolver_id_fkey` (`resolver_id`),
  KEY `incidents_unit_id_fkey` (`unit_id`),
  CONSTRAINT `incidents_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `incidents_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `incidents_resolver_id_fkey` FOREIGN KEY (`resolver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `incidents_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incidents`
--

LOCK TABLES `incidents` WRITE;
/*!40000 ALTER TABLE `incidents` DISABLE KEYS */;
INSERT INTO `incidents` VALUES ('cml8lio4p000195dosn96tgza','MUCHO RUIDO','HAY DEMASIADO RUIDO','RESOLVED','URGENT','NOISE','cmkxashk0000693xfd8itvml5','cmkxashk0000993xf9lxrvzji','cmkxasgqs000493xfzun65322',NULL,'','EL LA CASA 203','2026-02-04 22:25:11.591','2026-02-04 22:50:51.826'),('cml8nhzbi0001bjufm1372izv','este es un incidente','incidenteeee','CANCELLED','URGENT','CLEANING','cmkxashk0000693xfd8itvml5','cmkxashk0000993xf9lxrvzji','cmkxasgqs000493xfzun65322',NULL,'','EL LA CASA 203','2026-02-04 23:20:38.669','2026-02-04 23:21:07.073'),('cml8nodha0001fbg60w8mi3r1','incidente','esto es un incidente','RESOLVED','HIGH','NOISE','cmkxashk0000693xfd8itvml5','cmkxashk0000993xf9lxrvzji','cmkxasgqs000493xfzun65322',NULL,'','EL LA CASA 203','2026-02-04 23:25:36.957','2026-02-04 23:26:04.235');
/*!40000 ALTER TABLE `incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `service_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoice_id_fkey` (`invoice_id`),
  CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES ('cmkxasnfa000k93xfsyxewy1t','cmkxasnfa000j93xf7c32jr13','Maintenance Fee',150.00,NULL,'2026-01-28 00:39:33.527','2026-01-28 00:39:33.527'),('cmkxasnfa000l93xfiogv8ku7','cmkxasnfa000j93xf7c32jr13','Water Bill',30.00,NULL,'2026-01-28 00:39:33.527','2026-01-28 00:39:33.527'),('cmkxbdzh7000983tm3h80jytl','cmkxbdzh6000883tm53npmzax','Maintenance Fee',120.00,'cmkxashk0000c93xflnt0ow6y','2026-01-28 00:56:08.922','2026-01-28 00:56:08.922'),('cmkxbdzh7000a83tmyg1scsci','cmkxbdzh6000883tm53npmzax','Water',30.00,'cmkxashk0000d93xf81f48asx','2026-01-28 00:56:08.922','2026-01-28 00:56:08.922'),('cmkxbe09z000d83tmqopri5w8','cmkxbe09z000c83tmc9hds5dv','Maintenance Fee',120.00,'cmkxashk0000c93xflnt0ow6y','2026-01-28 00:56:09.960','2026-01-28 00:56:09.960'),('cmkxbe09z000e83tmgmcgve1w','cmkxbe09z000c83tmc9hds5dv','Water',30.00,'cmkxashk0000d93xf81f48asx','2026-01-28 00:56:09.960','2026-01-28 00:56:09.960'),('cmkxce2mx00065qd6ufo7f8r1','cmkxce2mx00055qd666tcessy','Reserva Amenidad: Maintenance Fee',20.17,NULL,'2026-01-28 01:24:12.633','2026-01-28 01:24:12.633'),('cmkxch7fl000i5qd6v8kll01q','cmkxch7fl000h5qd6bu41q3o5','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-01-28 01:26:38.818','2026-01-28 01:26:38.818'),('cmkxch87y000l5qd66s7z0j66','cmkxch87y000k5qd6tslmcm1t','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-01-28 01:26:39.839','2026-01-28 01:26:39.839'),('cmkxch8pv000o5qd6udoi12kf','cmkxch8pv000n5qd69y3uwts3','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-01-28 01:26:40.484','2026-01-28 01:26:40.484'),('cmkxde0cl000t5qd6xbxuvsnw','cmkxde0cl000s5qd6lmw3x8lc','Reserva Amenidad: Maintenance Fee',10.00,NULL,'2026-01-28 01:52:09.285','2026-01-28 01:52:09.285'),('cmkxdltaj000y5qd6ri1yfqqp','cmkxdltaj000x5qd69qiu8sm8','Reserva Amenidad: Maintenance Fee',19.67,NULL,'2026-01-28 01:58:13.387','2026-01-28 01:58:13.387'),('cmkxdp1ao00135qd67n805450','cmkxdp1ao00125qd6y23vf7ia','Reserva Amenidad: Maintenance Fee',6.50,NULL,'2026-01-28 02:00:43.729','2026-01-28 02:00:43.729'),('cmkxe9vw400185qd6o6wdwpth','cmkxe9vw400175qd69ls8tw09','Reserva Amenidad: Maintenance Fee',6.50,NULL,'2026-01-28 02:16:56.500','2026-01-28 02:16:56.500'),('cmkxr1di30004va612fjiojdc','cmkxr1di30003va61g5le7mq1','Reserva Amenidad: Maintenance Fee',13.00,NULL,'2026-01-28 08:14:14.427','2026-01-28 08:14:14.427'),('cmkxrty2u0004l0pd8s9yo9b5','cmkxrty2u0003l0pded9ur3ra','Reserva Amenidad: Maintenance Fee',20.15,NULL,'2026-01-28 08:36:27.462','2026-01-28 08:36:27.462'),('cmkxsskb70004enkl0k87ym3v','cmkxsskb60003enklep115egj','Reserva Amenidad: Fitness Center',10.17,NULL,'2026-01-28 09:03:22.579','2026-01-28 09:03:22.579'),('cml5i167y000bt78rxpfg5nc9','cml5i167y000at78rm3m6sp9m','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:24:17.854','2026-02-02 18:24:17.854'),('cml5i167y000ct78rkhg119m8','cml5i167y000at78rm3m6sp9m','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:24:17.854','2026-02-02 18:24:17.854'),('cml5i1716000ft78rpw6fl5xf','cml5i1716000et78rrvjq12qq','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:24:18.906','2026-02-02 18:24:18.906'),('cml5i1716000gt78rftyx6xb8','cml5i1716000et78rrvjq12qq','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:24:18.906','2026-02-02 18:24:18.906'),('cml5i17l9000jt78robumttli','cml5i17l9000it78ryh3a2oj0','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:24:19.629','2026-02-02 18:24:19.629'),('cml5i17l9000kt78r24785qvi','cml5i17l9000it78ryh3a2oj0','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:24:19.629','2026-02-02 18:24:19.629'),('cml5j4m3s000yt78r3qa2kuws','cml5j4m3r000xt78rfuh4dsa9','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:54:58.024','2026-02-02 18:54:58.024'),('cml5j4m3s000zt78rd36ky3xj','cml5j4m3r000xt78rfuh4dsa9','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:54:58.024','2026-02-02 18:54:58.024'),('cml5j4mw30012t78rmeaux5yc','cml5j4mw30011t78rueyjmzol','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:54:59.043','2026-02-02 18:54:59.043'),('cml5j4mw30013t78rsl8ugrnh','cml5j4mw30011t78rueyjmzol','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:54:59.043','2026-02-02 18:54:59.043'),('cml5j4nwt0016t78rqg4fn9d0','cml5j4nwt0015t78r337vi7cr','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-02 18:55:00.365','2026-02-02 18:55:00.365'),('cml5j4nwt0017t78r2rwsqh4x','cml5j4nwt0015t78r337vi7cr','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-02 18:55:00.365','2026-02-02 18:55:00.365'),('cml5j4nwt0018t78rmok30hdk','cml5j4nwt0015t78r337vi7cr','Parqueo',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-02 18:55:00.365','2026-02-02 18:55:00.365'),('cml5j4nwt0019t78ra7funkp2','cml5j4nwt0015t78r337vi7cr','LLAVES (x3)',90.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-02 18:55:00.365','2026-02-02 18:55:00.365'),('cml71tpi5000tpxn085vfeei7','cml71tpi5000spxn00iuq9r4v','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 20:26:08.093','2026-02-03 20:26:08.093'),('cml71tpi5000upxn0cmmiynja','cml71tpi5000spxn00iuq9r4v','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 20:26:08.093','2026-02-03 20:26:08.093'),('cml71tpi5000vpxn0t0r1dulf','cml71tpi5000spxn00iuq9r4v','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 20:26:08.093','2026-02-03 20:26:08.093'),('cml71tq6z000ypxn0keigow9v','cml71tq6z000xpxn0x0gxx8rj','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 20:26:08.987','2026-02-03 20:26:08.987'),('cml71tq6z000zpxn0gkz2iy3s','cml71tq6z000xpxn0x0gxx8rj','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 20:26:08.987','2026-02-03 20:26:08.987'),('cml71tq6z0010pxn0ja4cmcem','cml71tq6z000xpxn0x0gxx8rj','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 20:26:08.987','2026-02-03 20:26:08.987'),('cml71tqnr0013pxn0rt2jg7bn','cml71tqnr0012pxn0i4gqhmqr','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 20:26:09.591','2026-02-03 20:26:09.591'),('cml71tqnr0014pxn0ljstfslo','cml71tqnr0012pxn0i4gqhmqr','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 20:26:09.591','2026-02-03 20:26:09.591'),('cml71tqnr0015pxn0nwg596dd','cml71tqnr0012pxn0i4gqhmqr','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 20:26:09.591','2026-02-03 20:26:09.591'),('cml71tr460018pxn08nvw42pc','cml71tr460017pxn0cv0gz5xk','Parqueo',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-03 20:26:10.182','2026-02-03 20:26:10.182'),('cml71trqr001bpxn0qhhscydw','cml71trqr001apxn0x0ez9m6h','LLAVES (x2)',60.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-03 20:26:10.995','2026-02-03 20:26:10.995'),('cml71ts2x001epxn09v2br2jy','cml71ts2x001dpxn0au8mkkzb','Maintenance Fee',400.00,'cml6we983000gpxn0ht8sbfhf','2026-02-03 20:26:11.433','2026-02-03 20:26:11.433'),('cml71tsjj001hpxn0m9omjts7','cml71tsjj001gpxn0ioof6bm8','TerminaRegular (x2)',400.00,'cml6zo38h000mpxn0yaefwdzv','2026-02-03 20:26:12.031','2026-02-03 20:26:12.031'),('cml730ouk000ebinsmgqiki8f','cml730ouj000dbinsa13rh8pg','AGUAAA',200.00,'cml730dsw0008binsbufy8z7u','2026-02-03 20:59:33.451','2026-02-03 20:59:33.451'),('cml733yt8000ibinsyocy1zzn','cml733yt8000hbinslmmexcpt','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:02:06.333','2026-02-03 21:02:06.333'),('cml733yt8000jbinsmd9for35','cml733yt8000hbinslmmexcpt','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:02:06.333','2026-02-03 21:02:06.333'),('cml733yt8000kbinsk6bshp48','cml733yt8000hbinslmmexcpt','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:02:06.333','2026-02-03 21:02:06.333'),('cml733zm3000nbins8bsuf6lm','cml733zm2000mbinslg1kn2n1','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:02:07.371','2026-02-03 21:02:07.371'),('cml733zm3000obinsz9ge0o6j','cml733zm2000mbinslg1kn2n1','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:02:07.371','2026-02-03 21:02:07.371'),('cml733zm3000pbinskkftf7ju','cml733zm2000mbinslg1kn2n1','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:02:07.371','2026-02-03 21:02:07.371'),('cml73403l000sbins5sdvwhsq','cml73403l000rbinsvwe1vn3q','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:02:08.002','2026-02-03 21:02:08.002'),('cml73403l000tbinsv7zsxnqc','cml73403l000rbinsvwe1vn3q','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:02:08.002','2026-02-03 21:02:08.002'),('cml73403l000ubinshossm5i2','cml73403l000rbinsvwe1vn3q','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:02:08.002','2026-02-03 21:02:08.002'),('cml7340ke000xbinsi7z30rry','cml7340kd000wbinsb8t6nleo','Parqueo',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-03 21:02:08.606','2026-02-03 21:02:08.606'),('cml7341140010bins8qs9ih5x','cml734114000zbinscyed6ah3','LLAVES (x2)',60.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-03 21:02:09.209','2026-02-03 21:02:09.209'),('cml7341cr0013binsy5zax5g6','cml7341cr0012binspp4eqp4p','Maintenance Fee',400.00,'cml6we983000gpxn0ht8sbfhf','2026-02-03 21:02:09.628','2026-02-03 21:02:09.628'),('cml7341pu0016bins8lpvd0yz','cml7341pu0015binsfviujzzd','AGUAAA',200.00,'cml730dsw0008binsbufy8z7u','2026-02-03 21:02:10.098','2026-02-03 21:02:10.098'),('cml73lwki001abinsr72qb5h5','cml73lwkh0019binsmv0k5nl5','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:16:03.234','2026-02-03 21:16:03.234'),('cml73lwki001bbinsgu5fb5s8','cml73lwkh0019binsmv0k5nl5','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:16:03.234','2026-02-03 21:16:03.234'),('cml73lwki001cbins04xy9or1','cml73lwkh0019binsmv0k5nl5','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:16:03.234','2026-02-03 21:16:03.234'),('cml73lx74001fbins97w4cvn1','cml73lx74001ebinshtdwsqao','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:16:04.048','2026-02-03 21:16:04.048'),('cml73lx74001gbins10criyvj','cml73lx74001ebinshtdwsqao','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:16:04.048','2026-02-03 21:16:04.048'),('cml73lx74001hbinsxlsdi025','cml73lx74001ebinshtdwsqao','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:16:04.048','2026-02-03 21:16:04.048'),('cml73lxrp001kbinsm4wkti7t','cml73lxrp001jbins6ahz47gw','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-03 21:16:04.789','2026-02-03 21:16:04.789'),('cml73lxrp001lbinsiyvpgs1c','cml73lxrp001jbins6ahz47gw','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-03 21:16:04.789','2026-02-03 21:16:04.789'),('cml73lxrp001mbinsv38pb9gj','cml73lxrp001jbins6ahz47gw','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 21:16:04.789','2026-02-03 21:16:04.789'),('cml73roay001pbins9frbrjta','cml73roay001obinstesv9hxz','Parqueo [Renovación]',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-03 21:20:32.456','2026-02-03 21:20:32.456'),('cml73rpfn001sbins9cqqsqf2','cml73rpfn001rbinsa5eu6zj9','LLAVES (x2) [Renovación]',60.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-03 21:20:33.923','2026-02-03 21:20:33.923'),('cml73rq8z001vbinsg0tz0bum','cml73rq8z001ubinszih6k1tn','Maintenance Fee [Renovación]',400.00,'cml6we983000gpxn0ht8sbfhf','2026-02-03 21:20:34.979','2026-02-03 21:20:34.979'),('cml75o1do0009jlll39m2fcrl','cml75o1do0008jlll7ehso1en','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 22:13:42.012','2026-02-03 22:13:42.012'),('cml75o292000cjlllhgoardak','cml75o292000bjlllguh0kphk','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 22:13:43.142','2026-02-03 22:13:43.142'),('cml75o2p5000fjlll6a259x7b','cml75o2p5000ejlllq4gm011k','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-03 22:13:43.721','2026-02-03 22:13:43.721'),('cml75o35v000ijlllbg0lguev','cml75o35v000hjllliw6v8qwe','Parqueo',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-03 22:13:44.323','2026-02-03 22:13:44.323'),('cml75o3l9000ljlll03lw7ogc','cml75o3l9000kjlll2v95wtb0','LLAVES (x2)',60.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-03 22:13:44.878','2026-02-03 22:13:44.878'),('cml75o3yx000ojlllw5xay7pv','cml75o3yx000njlllrmsq7bvm','Maintenance Fee',400.00,'cml6we983000gpxn0ht8sbfhf','2026-02-03 22:13:45.369','2026-02-03 22:13:45.369'),('cml75o4bj000rjlllmltxp6ve','cml75o4bj000qjlll2ys85bzk','AGUAAA',200.00,'cml730dsw0008binsbufy8z7u','2026-02-03 22:13:45.823','2026-02-03 22:13:45.823'),('cml75o4oi000ujlll9pykzfhv','cml75o4oi000tjlll4zzmyni5','Music app',460.00,'cml75mv680002jllly735z0ye','2026-02-03 22:13:46.290','2026-02-03 22:13:46.290'),('cmlb2ba800006pcc51cysrnwj','cmlb2ba800005pcc5bunk1zjx','Reserva Amenidad: Piscina grande',101.67,NULL,'2026-02-06 15:50:52.801','2026-02-06 15:50:52.801'),('cmlb2i92o0004tg4ea79qt73p','cmlb2i92o0003tg4e85h9y1wk','Reserva Amenidad: Piscina grande',201.67,NULL,'2026-02-06 15:56:17.905','2026-02-06 15:56:17.905'),('cmlb4m4vr00063dxwf9ut0bon','cmlb4m4vr00053dxw6c9lpd26','Reserva Amenidad: Asado',20.00,NULL,'2026-02-06 16:55:18.327','2026-02-06 16:55:18.327'),('cmlb4tch5000d3dxwpv0qpxw0','cmlb4tch4000c3dxwk4wphg8j','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-06 17:00:54.761','2026-02-06 17:00:54.761'),('cmlb4tch5000e3dxwe77cw6a6','cmlb4tch4000c3dxwk4wphg8j','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-06 17:00:54.761','2026-02-06 17:00:54.761'),('cmlb4tch5000f3dxw8cn7izmp','cmlb4tch4000c3dxwk4wphg8j','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-06 17:00:54.761','2026-02-06 17:00:54.761'),('cmlb4tctg000i3dxwv90jras4','cmlb4tctg000h3dxwg9cfnxc2','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-06 17:00:55.205','2026-02-06 17:00:55.205'),('cmlb4tcth000j3dxw81xmxkks','cmlb4tctg000h3dxwg9cfnxc2','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-06 17:00:55.205','2026-02-06 17:00:55.205'),('cmlb4tcth000k3dxw397hkk8d','cmlb4tctg000h3dxwg9cfnxc2','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-06 17:00:55.205','2026-02-06 17:00:55.205'),('cmlb4td1p000n3dxwzs4vh7fg','cmlb4td1p000m3dxw2yylx2t1','TEST',6.50,'cmkxcgqp7000b5qd6mbjfp2o2','2026-02-06 17:00:55.501','2026-02-06 17:00:55.501'),('cmlb4td1p000o3dxwjzy8rtsb','cmlb4td1p000m3dxw2yylx2t1','Seguridad',20.00,'cml5hxmfl0002t78rssqjvddk','2026-02-06 17:00:55.501','2026-02-06 17:00:55.501'),('cmlb4td1p000p3dxwzbtcmk5z','cmlb4td1p000m3dxw2yylx2t1','Mantenimiento',100.00,'cml6vvk8h0002pxn0kd6yispf','2026-02-06 17:00:55.501','2026-02-06 17:00:55.501'),('cmlb4td9w000s3dxwsy9a8at1','cmlb4td9w000r3dxwm0ozmywi','Parqueo',20.00,'cml5iq7me000nt78rbb07qpc8','2026-02-06 17:00:55.797','2026-02-06 17:00:55.797'),('cmlb4tdi6000v3dxw75pqeyw3','cmlb4tdi5000u3dxw6xymk1on','LLAVES (x2)',60.00,'cml5j0lpc000st78rt3v2x6k2','2026-02-06 17:00:56.094','2026-02-06 17:00:56.094'),('cmlb4tdoc000y3dxw4qtlnlsn','cmlb4tdoc000x3dxwrp0134f0','Maintenance Fee',400.00,'cml6we983000gpxn0ht8sbfhf','2026-02-06 17:00:56.316','2026-02-06 17:00:56.316'),('cmlb4tdui00113dxwdj3hjc7d','cmlb4tdui00103dxwl5gv0ygi','AGUAAA',200.00,'cml730dsw0008binsbufy8z7u','2026-02-06 17:00:56.538','2026-02-06 17:00:56.538'),('cmlb4te0n00143dxweidm0h9z','cmlb4te0n00133dxwoeqrx8pj','Music app',460.00,'cml75mv680002jllly735z0ye','2026-02-06 17:00:56.759','2026-02-06 17:00:56.759'),('cmlb4te6v00173dxwq4tm1g3m','cmlb4te6v00163dxw2mdbxgdi','TEST SERVICIO ',20.00,'cmlb4r60t00093dxw0vatbckd','2026-02-06 17:00:56.983','2026-02-06 17:00:56.983');
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `due_date` datetime(3) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','CANCELLED','PROCESSING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `unit_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `payment_method` enum('CARD','CASH','TRANSFER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_number_key` (`number`),
  KEY `invoices_unit_id_fkey` (`unit_id`),
  KEY `invoices_complex_id_fkey` (`complex_id`),
  CONSTRAINT `invoices_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoices_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('cmkxasnfa000j93xf7c32jr13','INV-TEST-001',1,2026,'2026-02-04 00:39:33.526',180.00,'PROCESSING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 00:39:33.527','2026-01-28 01:56:01.014','TRANSFER'),('cmkxbdzh6000883tm53npmzax','INV-202603-102-1W2Q',3,2026,'2026-04-27 00:00:00.000',150.00,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-01-28 00:56:08.922','2026-01-28 00:56:08.922',NULL),('cmkxbe09z000c83tmc9hds5dv','INV-202603-201-VDDH',3,2026,'2026-04-27 00:00:00.000',150.00,'PROCESSING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-01-28 00:56:09.960','2026-01-28 07:39:22.983','TRANSFER'),('cmkxce2mx00055qd666tcessy','RES-1769563452632-885',1,2026,'2026-01-28 01:24:12.632',20.17,'PROCESSING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 01:24:12.633','2026-01-28 01:24:35.179','TRANSFER'),('cmkxch7fl000h5qd6bu41q3o5','INV-202611-101-68IK',11,2026,'2026-12-18 00:00:00.000',6.50,'PAID','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 01:26:38.818','2026-01-28 01:29:58.748',NULL),('cmkxch87y000k5qd6tslmcm1t','INV-202611-102-6RG1',11,2026,'2026-12-18 00:00:00.000',6.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-01-28 01:26:39.839','2026-01-28 01:26:39.839',NULL),('cmkxch8pv000n5qd69y3uwts3','INV-202611-201-IHTB',11,2026,'2026-12-18 00:00:00.000',6.50,'PROCESSING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-01-28 01:26:40.484','2026-01-28 08:56:47.144','CASH'),('cmkxde0cl000s5qd6lmw3x8lc','RES-1769565129282-433',1,2026,'2026-01-28 01:52:09.282',10.00,'PROCESSING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 01:52:09.285','2026-01-28 01:53:04.390','CASH'),('cmkxdltaj000x5qd69qiu8sm8','RES-1769565493384-397',1,2026,'2026-01-28 01:58:13.384',19.67,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 01:58:13.387','2026-01-28 01:58:13.387','TRANSFER'),('cmkxdp1ao00125qd6y23vf7ia','RES-1769565643726-975',1,2026,'2026-01-28 02:00:43.726',6.50,'PAID','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 02:00:43.729','2026-01-28 02:04:46.995','CARD'),('cmkxe9vw400175qd69ls8tw09','RES-1769566616498-464',1,2026,'2026-01-28 02:16:56.498',6.50,'PAID','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-01-28 02:16:56.500','2026-01-28 02:17:20.740','CASH'),('cmkxr1di30003va61g5le7mq1','RES-1769588054426-39',1,2026,'2026-01-28 08:14:14.426',13.00,'PAID','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-01-28 08:14:14.427','2026-01-28 08:59:17.083','TRANSFER'),('cmkxrty2u0003l0pded9ur3ra','RES-1769589387461-343',1,2026,'2026-01-28 08:36:27.461',20.15,'PAID','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-01-28 08:36:27.462','2026-01-28 08:57:18.631','TRANSFER'),('cmkxsskb60003enklep115egj','RES-1769591002576-467',1,2026,'2026-01-28 09:03:22.576',10.17,'PAID','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-01-28 09:03:22.579','2026-01-28 09:04:40.051','TRANSFER'),('cml5i167y000at78rm3m6sp9m','INV-202607-101-P4T4',7,2026,'2026-08-01 00:00:00.000',26.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-02 18:24:17.854','2026-02-02 18:24:17.854',NULL),('cml5i1716000et78rrvjq12qq','INV-202607-102-TKVF',7,2026,'2026-08-01 00:00:00.000',26.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-02 18:24:18.906','2026-02-02 18:24:18.906',NULL),('cml5i17l9000it78ryh3a2oj0','INV-202607-201-YQMZ',7,2026,'2026-08-01 00:00:00.000',26.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-02 18:24:19.629','2026-02-02 18:24:19.629',NULL),('cml5j4m3r000xt78rfuh4dsa9','INV-202702-101-WPZS',2,2027,'2026-02-19 00:00:00.000',26.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-02 18:54:58.024','2026-02-02 18:54:58.024',NULL),('cml5j4mw30011t78rueyjmzol','INV-202702-102-BVP4',2,2027,'2026-02-19 00:00:00.000',26.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-02 18:54:59.043','2026-02-02 18:54:59.043',NULL),('cml5j4nwt0015t78r337vi7cr','INV-202702-201-7NP2',2,2027,'2026-02-19 00:00:00.000',136.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-02 18:55:00.365','2026-02-02 18:55:00.365',NULL),('cml71tpi5000spxn00iuq9r4v','INV-202902-101-7SBI',2,2029,'2026-04-17 00:00:00.000',126.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:08.093','2026-02-03 20:26:08.093',NULL),('cml71tq6z000xpxn0x0gxx8rj','INV-202902-102-DA5T',2,2029,'2026-04-17 00:00:00.000',126.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:08.987','2026-02-03 20:26:08.987',NULL),('cml71tqnr0012pxn0i4gqhmqr','INV-202902-201-955Q',2,2029,'2026-04-17 00:00:00.000',126.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:09.591','2026-02-03 20:26:09.591',NULL),('cml71tr460017pxn0cv0gz5xk','INV-202902-201-5NI6',2,2029,'2026-04-17 00:00:00.000',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:10.182','2026-02-03 20:26:10.182',NULL),('cml71trqr001apxn0x0ez9m6h','INV-202902-201-8OOY',2,2029,'2026-04-17 00:00:00.000',60.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:10.995','2026-02-03 20:26:10.995',NULL),('cml71ts2x001dpxn0au8mkkzb','INV-202902-201-1YTE',2,2029,'2026-04-17 00:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:11.433','2026-02-03 20:26:11.433',NULL),('cml71tsjj001gpxn0ioof6bm8','INV-202902-201-2GP9',2,2029,'2026-04-17 00:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:26:12.031','2026-02-03 20:26:12.031',NULL),('cml730ouj000dbinsa13rh8pg','INV-202602-201-G85A',2,2026,'2026-02-08 20:59:33.021',200.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 20:59:33.021','2026-02-03 20:59:33.451',NULL),('cml733yt8000hbinslmmexcpt','INV-202711-101-UZ5Y',11,2027,'2028-01-07 00:00:00.000',126.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:06.333','2026-02-03 21:02:06.333',NULL),('cml733zm2000mbinslg1kn2n1','INV-202711-102-XRAR',11,2027,'2028-01-07 00:00:00.000',126.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:07.371','2026-02-03 21:02:07.371',NULL),('cml73403l000rbinsvwe1vn3q','INV-202711-201-SZBZ',11,2027,'2028-01-07 00:00:00.000',126.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:08.002','2026-02-03 21:02:08.002',NULL),('cml7340kd000wbinsb8t6nleo','INV-202711-201-8FW6',11,2027,'2028-01-07 00:00:00.000',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:08.606','2026-02-03 21:02:08.606',NULL),('cml734114000zbinscyed6ah3','INV-202711-201-O7P2',11,2027,'2028-01-07 00:00:00.000',60.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:09.209','2026-02-03 21:02:09.209',NULL),('cml7341cr0012binspp4eqp4p','INV-202711-201-ZI8G',11,2027,'2028-01-07 00:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:09.628','2026-02-03 21:02:09.628',NULL),('cml7341pu0015binsfviujzzd','INV-202711-201-NXMB',11,2027,'2028-01-07 00:00:00.000',200.00,'PAID','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:02:10.098','2026-02-03 21:15:26.439',NULL),('cml73lwkh0019binsmv0k5nl5','INV-202911-101-7GXL',11,2029,'2029-12-06 00:00:00.000',126.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-03 21:16:03.234','2026-02-03 21:16:03.234',NULL),('cml73lx74001ebinshtdwsqao','INV-202911-102-9TFY',11,2029,'2029-12-06 00:00:00.000',126.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-03 21:16:04.048','2026-02-03 21:16:04.048',NULL),('cml73lxrp001jbins6ahz47gw','INV-202911-201-AAKF',11,2029,'2029-12-06 00:00:00.000',126.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:16:04.789','2026-02-03 21:16:04.789',NULL),('cml73roay001obinstesv9hxz','INV-202602-201-UKF1',2,2026,'2026-02-28 06:00:00.000',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:20:30.960','2026-02-03 21:20:32.456',NULL),('cml73rpfn001rbinsa5eu6zj9','INV-202602-201-3OUH',2,2026,'2026-02-28 06:00:00.000',60.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:20:30.960','2026-02-03 21:20:33.923',NULL),('cml73rq8z001ubinszih6k1tn','INV-202602-201-CI2H',2,2026,'2026-02-28 06:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 21:20:30.960','2026-02-03 21:20:34.979',NULL),('cml75o1do0008jlll7ehso1en','INV-202607-101-FEHB',7,2026,'2026-02-05 00:00:00.000',100.00,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:42.012','2026-02-03 22:13:42.012',NULL),('cml75o292000bjlllguh0kphk','INV-202607-102-8DA5',7,2026,'2026-02-05 00:00:00.000',100.00,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:43.142','2026-02-03 22:13:43.142',NULL),('cml75o2p5000ejlllq4gm011k','INV-202607-201-PTNE',7,2026,'2026-02-05 00:00:00.000',100.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:43.721','2026-02-03 22:13:43.721',NULL),('cml75o35v000hjllliw6v8qwe','INV-202607-201-VUK9',7,2026,'2026-02-05 00:00:00.000',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:44.323','2026-02-03 22:13:44.323',NULL),('cml75o3l9000kjlll2v95wtb0','INV-202607-201-GUDU',7,2026,'2026-02-05 00:00:00.000',60.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:44.878','2026-02-03 22:13:44.878',NULL),('cml75o3yx000njlllrmsq7bvm','INV-202607-201-W29U',7,2026,'2026-02-05 00:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:45.369','2026-02-03 22:13:45.369',NULL),('cml75o4bj000qjlll2ys85bzk','INV-202607-201-8QWI',7,2026,'2026-02-05 00:00:00.000',200.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:45.823','2026-02-03 22:13:45.823',NULL),('cml75o4oi000tjlll4zzmyni5','INV-202607-201-ZROB',7,2026,'2026-02-05 00:00:00.000',460.00,'PROCESSING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-03 22:13:46.290','2026-02-06 15:42:02.312','CASH'),('cmlb2ba800005pcc5bunk1zjx','RES-1770393052800-90',2,2026,'2026-02-06 15:50:52.800',101.67,'PROCESSING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 15:50:52.801','2026-02-06 15:55:18.227','CASH'),('cmlb2i92o0003tg4e85h9y1wk','RES-1770393377904-36',2,2026,'2026-02-06 15:56:17.904',201.67,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 15:56:17.905','2026-02-06 15:56:17.905','CASH'),('cmlb4m4vr00053dxw6c9lpd26','RES-1770396918326-60',2,2026,'2026-02-06 16:55:18.326',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 16:55:18.327','2026-02-06 16:55:18.327','TRANSFER'),('cmlb4tch4000c3dxwk4wphg8j','INV-202608-101-4W40',8,2026,'2026-08-31 00:00:00.000',126.50,'PENDING','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:54.761','2026-02-06 17:00:54.761',NULL),('cmlb4tctg000h3dxwg9cfnxc2','INV-202608-102-U6BH',8,2026,'2026-08-31 00:00:00.000',126.50,'PENDING','cmkxashk0000893xfqxcsww7d','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:55.205','2026-02-06 17:00:55.205',NULL),('cmlb4td1p000m3dxw2yylx2t1','INV-202608-201-QKOO',8,2026,'2026-08-31 00:00:00.000',126.50,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:55.501','2026-02-06 17:00:55.501',NULL),('cmlb4td9w000r3dxwm0ozmywi','INV-202608-201-JZU6',8,2026,'2026-08-31 00:00:00.000',20.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:55.797','2026-02-06 17:00:55.797',NULL),('cmlb4tdi5000u3dxw6xymk1on','INV-202608-201-ISH0',8,2026,'2026-08-31 00:00:00.000',60.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:56.094','2026-02-06 17:00:56.094',NULL),('cmlb4tdoc000x3dxwrp0134f0','INV-202608-201-FOPG',8,2026,'2026-08-31 00:00:00.000',400.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:56.316','2026-02-06 17:00:56.316',NULL),('cmlb4tdui00103dxwl5gv0ygi','INV-202608-201-G7WX',8,2026,'2026-08-31 00:00:00.000',200.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:56.538','2026-02-06 17:00:56.538',NULL),('cmlb4te0n00133dxwoeqrx8pj','INV-202608-201-2L3Q',8,2026,'2026-08-31 00:00:00.000',460.00,'PENDING','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:56.759','2026-02-06 17:00:56.759',NULL),('cmlb4te6v00163dxw2mdbxgdi','INV-202608-201-X5AZ',8,2026,'2026-08-31 00:00:00.000',20.00,'PAID','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','2026-02-06 17:00:56.983','2026-02-06 17:02:17.425','CASH');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date_time` datetime(3) NOT NULL,
  `end_date_time` datetime(3) NOT NULL,
  `status` enum('PENDING','APPROVED','CANCELLED','REJECTED','COMPLETED','PROCESSING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amenity_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `invoice_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('CARD','CASH','TRANSFER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reservations_invoice_id_key` (`invoice_id`),
  KEY `reservations_user_id_fkey` (`user_id`),
  KEY `reservations_amenity_id_fkey` (`amenity_id`),
  CONSTRAINT `reservations_amenity_id_fkey` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES ('cmkxasmgd000h93xf9mo79xs4','2026-01-29 00:39:32.266','2026-01-29 02:39:32.268','APPROVED','Pool party test',NULL,'cmkxasgqs000493xfzun65322','cmkxashk0000a93xfad16zxh9','2026-01-28 00:39:32.269','2026-01-28 00:39:32.269',NULL,NULL),('cmkxayf79000283tmfdqm2qru','2026-01-29 02:43:00.000','2026-01-29 03:43:00.000','PENDING',NULL,0.00,'cmkxasgqs000493xfzun65322','cmkxashk0000a93xfad16zxh9','2026-01-28 00:44:02.804','2026-01-28 00:44:02.804',NULL,NULL),('cmkxbo3g0000q83tm5v6ur7m3','2026-01-28 02:03:00.000','2026-01-28 03:03:00.000','PENDING',NULL,0.00,'cmkxasgqs000493xfzun65322','cmkxashk0000b93xf3dc1gmre','2026-01-28 01:04:00.624','2026-01-28 01:04:00.624',NULL,NULL),('cmkxce1lu00035qd6thklqzsv','2026-01-28 01:23:00.000','2026-01-28 03:24:00.000','PENDING',NULL,20.17,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 01:24:11.297','2026-01-28 01:24:13.818','cmkxce2mx00055qd666tcessy','CARD'),('cmkxddzfu000q5qd6xjjnwdvz','2026-02-11 01:51:00.000','2026-02-11 02:51:00.000','PENDING',NULL,10.00,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 01:52:08.104','2026-01-28 01:52:10.478','cmkxde0cl000s5qd6lmw3x8lc','TRANSFER'),('cmkxdlse8000v5qd6plkgu60o','2026-03-25 01:59:00.000','2026-03-25 03:57:00.000','PENDING',NULL,19.67,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 01:58:12.223','2026-01-28 01:58:14.442','cmkxdltaj000x5qd69qiu8sm8','TRANSFER'),('cmkxdp0on00105qd691634zyh','2026-04-24 03:59:00.000','2026-04-24 04:59:00.000','APPROVED',NULL,6.50,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 02:00:42.936','2026-01-28 02:04:48.573','cmkxdp1ao00125qd6y23vf7ia','CARD'),('cmkxe9uyz00155qd6douffgtp','2026-05-05 03:16:00.000','2026-05-05 04:16:00.000','APPROVED',NULL,6.50,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 02:16:55.306','2026-01-28 02:24:34.059','cmkxe9vw400175qd69ls8tw09','CASH'),('cmkxr1d2k0001va61hyp0ebnq','2026-01-28 20:13:00.000','2026-01-28 22:13:00.000','APPROVED',NULL,13.00,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 08:14:13.868','2026-01-28 08:59:18.562','cmkxr1di30003va61g5le7mq1','CARD'),('cmkxrtx680001l0pdh8ssvue3','2026-01-31 23:36:00.000','2026-02-01 02:42:00.000','APPROVED',NULL,20.15,'cmkxasgqs000493xfzun65322','cmkxc6uli00015qd6uqpujn13','2026-01-28 08:36:26.288','2026-01-28 08:57:20.179','cmkxrty2u0003l0pded9ur3ra','CASH'),('cmkxssjec0001enklxytrrwy1','2026-02-09 02:01:00.000','2026-02-09 03:02:00.000','APPROVED',NULL,10.17,'cmkxasgqs000493xfzun65322','cmkxashk0000b93xf3dc1gmre','2026-01-28 09:03:21.395','2026-01-28 09:04:41.396','cmkxsskb60003enklep115egj','TRANSFER'),('cmlb2b9s60003pcc5j5voe3ih','2026-02-06 18:49:00.000','2026-02-06 19:50:00.000','PENDING',NULL,101.67,'cmkxasgqs000493xfzun65322','cmlb1tyfv0001pcc50ljyg7vq','2026-02-06 15:50:52.230','2026-02-06 15:50:53.366','cmlb2ba800005pcc5bunk1zjx','CASH'),('cmlb2i8mz0001tg4etm6ruuvt','2026-02-06 20:55:00.000','2026-02-06 22:56:00.000','APPROVED',NULL,201.67,'cmkxasgqs000493xfzun65322','cmlb1tyfv0001pcc50ljyg7vq','2026-02-06 15:56:17.339','2026-02-06 15:57:22.344','cmlb2i92o0003tg4e85h9y1wk','CASH'),('cmlb4m4fm00033dxwxsfp93ru','2026-02-06 18:54:00.000','2026-02-06 22:54:00.000','APPROVED',NULL,20.00,'cmkxasgqs000493xfzun65322','cmlb4jkzm00013dxwk6ahyo3f','2026-02-06 16:55:17.746','2026-02-06 16:56:00.037','cmlb4m4vr00053dxw6c9lpd26','TRANSFER');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `residents`
--

DROP TABLE IF EXISTS `residents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `residents` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('OWNER','TENANT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TENANT',
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `emergency_contact` json DEFAULT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `residents_user_id_key` (`user_id`),
  KEY `residents_unit_id_fkey` (`unit_id`),
  CONSTRAINT `residents_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `residents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `residents`
--

LOCK TABLES `residents` WRITE;
/*!40000 ALTER TABLE `residents` DISABLE KEYS */;
INSERT INTO `residents` VALUES ('cmkxekjt90001bsaeyskqvcse','TENANT','2026-01-28 00:00:00.000',NULL,'{\"name\": \"Mario\", \"phone\": \"4783934\", \"relation\": \"esposo\"}','cmkxasgqs000493xfzun65322','cmkxashk0000993xf9lxrvzji','2026-01-28 02:25:14.061','2026-01-28 02:25:14.061');
/*!40000 ALTER TABLE `residents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `base_price` decimal(10,2) NOT NULL,
  `frequency` enum('ONCE','DAILY','WEEKLY','MONTHLY','YEARLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `hasQuantity` tinyint(1) NOT NULL DEFAULT '0',
  `isRequired` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `services_complex_id_fkey` (`complex_id`),
  CONSTRAINT `services_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('cmkxcgqp7000b5qd6mbjfp2o2','TEST','TEST',6.50,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-01-28 01:26:17.130','2026-01-28 01:26:17.130',0,1),('cml5hxmfl0002t78rssqjvddk','Seguridad','Seguridad',20.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-02 18:21:32.240','2026-02-02 18:21:32.240',0,1),('cml5iq7me000nt78rbb07qpc8','Parqueo','',20.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-02 18:43:46.070','2026-02-02 18:43:46.070',1,0),('cml5j0lpc000st78rt3v2x6k2','LLAVES','LLAVES',30.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-02 18:51:50.880','2026-02-02 18:51:50.880',1,0),('cml6vvk8h0002pxn0kd6yispf','Mantenimiento','descripcion',100.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-03 17:39:36.881','2026-02-03 17:39:36.881',0,1),('cml6we983000gpxn0ht8sbfhf','Maintenance Fee','descripcion',400.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-03 17:54:09.074','2026-02-03 17:54:09.074',0,0),('cml730dsw0008binsbufy8z7u','AGUAAA','AGUAA',200.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-03 20:59:19.135','2026-02-03 20:59:19.135',0,0),('cml75mv680002jllly735z0ye','Music app','lll',460.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-03 22:12:47.312','2026-02-03 22:12:47.312',0,0),('cmlb4r60t00093dxw0vatbckd','TEST SERVICIO ','',20.00,'MONTHLY','cmkxashk0000693xfd8itvml5','2026-02-06 16:59:13.086','2026-02-06 16:59:13.086',0,0);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_services`
--

DROP TABLE IF EXISTS `unit_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_services` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `custom_price` decimal(10,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `service_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `end_date` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_services_unit_id_service_id_key` (`unit_id`,`service_id`),
  KEY `unit_services_service_id_fkey` (`service_id`),
  CONSTRAINT `unit_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `unit_services_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_services`
--

LOCK TABLES `unit_services` WRITE;
/*!40000 ALTER TABLE `unit_services` DISABLE KEYS */;
INSERT INTO `unit_services` VALUES ('cmkxcgrf0000c5qd660g0kay5',NULL,'ACTIVE','cmkxcgqp7000b5qd6mbjfp2o2','cmkxashk0000793xfza0y5pwn','2026-01-28 01:26:18.058',NULL,'2026-01-28 01:26:18.060','2026-01-28 01:26:18.060',1),('cmkxcgrf0000d5qd6s9zkbi9v',NULL,'ACTIVE','cmkxcgqp7000b5qd6mbjfp2o2','cmkxashk0000893xfqxcsww7d','2026-01-28 01:26:18.058',NULL,'2026-01-28 01:26:18.060','2026-01-28 01:26:18.060',1),('cmkxcgrf0000e5qd67d66acgq',NULL,'ACTIVE','cmkxcgqp7000b5qd6mbjfp2o2','cmkxashk0000993xf9lxrvzji','2026-01-28 01:26:18.058',NULL,'2026-01-28 01:26:18.060','2026-01-28 01:26:18.060',1),('cml5hxn3m0003t78r2588cv5j',NULL,'ACTIVE','cml5hxmfl0002t78rssqjvddk','cmkxashk0000793xfza0y5pwn','2026-02-02 18:21:33.105',NULL,'2026-02-02 18:21:33.107','2026-02-02 18:21:33.107',1),('cml5hxn3m0004t78rlomfdlz6',NULL,'ACTIVE','cml5hxmfl0002t78rssqjvddk','cmkxashk0000893xfqxcsww7d','2026-02-02 18:21:33.105',NULL,'2026-02-02 18:21:33.107','2026-02-02 18:21:33.107',1),('cml5hxn3m0005t78rv2vbctrx',NULL,'ACTIVE','cml5hxmfl0002t78rssqjvddk','cmkxashk0000993xf9lxrvzji','2026-02-02 18:21:33.105',NULL,'2026-02-02 18:21:33.107','2026-02-02 18:21:33.107',1),('cml5irhub000pt78r9zvwgx1y',NULL,'ACTIVE','cml5iq7me000nt78rbb07qpc8','cmkxashk0000993xf9lxrvzji','2026-02-02 18:44:44.894',NULL,'2026-02-02 18:44:45.971','2026-02-02 18:44:45.971',1),('cml5j1nbt000ut78r8m93ue7q',NULL,'ACTIVE','cml5j0lpc000st78rt3v2x6k2','cmkxashk0000993xf9lxrvzji','2026-02-03 19:12:44.553',NULL,'2026-02-02 18:52:39.641','2026-02-03 19:12:46.163',2),('cml6vvkx50003pxn09awfs1ne',NULL,'ACTIVE','cml6vvk8h0002pxn0kd6yispf','cmkxashk0000793xfza0y5pwn','2026-02-03 17:39:37.768',NULL,'2026-02-03 17:39:37.769','2026-02-03 17:39:37.769',1),('cml6vvkx50004pxn0cenw7o6g',NULL,'ACTIVE','cml6vvk8h0002pxn0kd6yispf','cmkxashk0000893xfqxcsww7d','2026-02-03 17:39:37.768',NULL,'2026-02-03 17:39:37.769','2026-02-03 17:39:37.769',1),('cml6vvkx50005pxn0owgr7ni4',NULL,'ACTIVE','cml6vvk8h0002pxn0kd6yispf','cmkxashk0000993xf9lxrvzji','2026-02-03 17:39:37.768',NULL,'2026-02-03 17:39:37.769','2026-02-03 17:39:37.769',1),('cml6wexij000jpxn04mmozg0a',NULL,'ACTIVE','cml6we983000gpxn0ht8sbfhf','cmkxashk0000993xf9lxrvzji','2026-02-03 17:54:39.380',NULL,'2026-02-03 17:54:40.556','2026-02-03 17:54:40.556',1),('cml730nx9000bbinsgd08u1cc',NULL,'ACTIVE','cml730dsw0008binsbufy8z7u','cmkxashk0000993xf9lxrvzji','2026-02-03 20:59:30.739',NULL,'2026-02-03 20:59:32.253','2026-02-03 20:59:32.253',1),('cml75nas20005jlllh57923wy',NULL,'ACTIVE','cml75mv680002jllly735z0ye','cmkxashk0000993xf9lxrvzji','2026-02-03 22:13:06.236',NULL,'2026-02-03 22:13:07.538','2026-02-03 22:13:07.538',1),('cmlb4rxdy0002ot3pwzp4nwwo',NULL,'ACTIVE','cmlb4r60t00093dxw0vatbckd','cmkxashk0000993xf9lxrvzji','2026-02-06 16:59:47.864',NULL,'2026-02-06 16:59:48.551','2026-02-06 16:59:48.551',1);
/*!40000 ALTER TABLE `unit_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bedrooms` int NOT NULL DEFAULT '1',
  `bathrooms` double NOT NULL DEFAULT '1',
  `area` double DEFAULT NULL,
  `status` enum('OCCUPIED','VACANT','MAINTENANCE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VACANT',
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `parking_spots` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_complex_id_number_key` (`complex_id`,`number`),
  CONSTRAINT `units_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES ('cmkxashk0000793xfza0y5pwn','101',NULL,2,2,NULL,'OCCUPIED','cmkxashk0000693xfd8itvml5','2026-01-28 00:39:25.920','2026-01-28 00:39:25.920',0),('cmkxashk0000893xfqxcsww7d','102','Apartamento',1,1,0,'VACANT','cmkxashk0000693xfd8itvml5','2026-01-28 00:39:25.920','2026-01-28 00:51:24.611',0),('cmkxashk0000993xf9lxrvzji','201','Apartamento',3,2.5,0,'OCCUPIED','cmkxashk0000693xfd8itvml5','2026-01-28 00:39:25.920','2026-01-28 02:25:14.483',0);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  `role` enum('SUPER_ADMIN','ADMIN','OPERATOR','GUARD','RESIDENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESIDENT',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `resetPasswordExpires` datetime(3) DEFAULT NULL,
  `resetPasswordToken` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_resetPasswordToken_key` (`resetPasswordToken`),
  KEY `users_complex_id_fkey` (`complex_id`),
  CONSTRAINT `users_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmkxasdyo000093xf8nx1apb9','admin@condomanager.com','$2b$12$dZnlxUP60jQBAOv3Bul41eG0gPqLzx6eNfk6cnftYyYn.WIWqW1zm','Super Admin',NULL,NULL,'SUPER_ADMIN','ACTIVE','2026-01-28 00:39:21.264','2026-01-28 00:39:21.264',NULL,NULL,NULL),('cmkxases4000193xfkm2d7lag','manager@condomanager.com','$2b$12$dZnlxUP60jQBAOv3Bul41eG0gPqLzx6eNfk6cnftYyYn.WIWqW1zm','Complex Manager',NULL,NULL,'ADMIN','ACTIVE','2026-01-28 00:39:22.325','2026-01-28 00:39:22.325',NULL,NULL,NULL),('cmkxasfdg000293xffzm80gs5','operator@condomanager.com','$2b$12$dZnlxUP60jQBAOv3Bul41eG0gPqLzx6eNfk6cnftYyYn.WIWqW1zm','Staff Operator',NULL,NULL,'OPERATOR','ACTIVE','2026-01-28 00:39:23.092','2026-01-28 00:39:28.633',NULL,NULL,'cmkxashk0000693xfd8itvml5'),('cmkxasfwc000393xfiw6ppznq','guard@condomanager.com','$2b$12$dZnlxUP60jQBAOv3Bul41eG0gPqLzx6eNfk6cnftYyYn.WIWqW1zm','Security Guard',NULL,NULL,'GUARD','ACTIVE','2026-01-28 00:39:23.772','2026-01-28 00:39:29.833',NULL,NULL,'cmkxashk0000693xfd8itvml5'),('cmkxasgqs000493xfzun65322','resident@example.com','$2b$12$dZnlxUP60jQBAOv3Bul41eG0gPqLzx6eNfk6cnftYyYn.WIWqW1zm','Juan Pérez',NULL,NULL,'RESIDENT','ACTIVE','2026-01-28 00:39:24.868','2026-01-28 00:39:24.868',NULL,NULL,NULL),('cml7814ku0001ixt1veburbhs','adminn@example.com','$2b$10$al.tmmz1vqiHdM25bm36peUqun115OUKrFpUTMcKG7EdemuE.EVJS','Music app','46738687',NULL,'ADMIN','ACTIVE','2026-02-03 23:19:51.028','2026-02-03 23:19:51.028',NULL,NULL,NULL),('cml788srw0005ixt1eruol159','jjjj@gmail.com','$2b$10$uSN3TngHmFzEFu.JYp.zKeMUu2EKYUz06aG3xwtd6r3STqpP606LS','Seguridad','46738687',NULL,'GUARD','ACTIVE','2026-02-03 23:25:49.868','2026-02-03 23:25:49.868',NULL,NULL,'cml781odl0003ixt1i03gp76n');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitor_logs`
--

DROP TABLE IF EXISTS `visitor_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_id_card` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('SCHEDULED','ARRIVED','DEPARTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULED',
  `entry_time` datetime(3) DEFAULT NULL,
  `exit_time` datetime(3) DEFAULT NULL,
  `scheduled_date` datetime(3) NOT NULL,
  `unit_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `complex_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `visitor_logs_unit_id_fkey` (`unit_id`),
  KEY `visitor_logs_complex_id_fkey` (`complex_id`),
  KEY `visitor_logs_created_by_id_fkey` (`created_by_id`),
  CONSTRAINT `visitor_logs_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `visitor_logs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `visitor_logs_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitor_logs`
--

LOCK TABLES `visitor_logs` WRITE;
/*!40000 ALTER TABLE `visitor_logs` DISABLE KEYS */;
INSERT INTO `visitor_logs` VALUES ('cmkxcf0ow00085qd6g8yye34l','Miguel Lopez','3018483860101','Visita familiar','DEPARTED','2026-01-28 01:25:21.168','2026-01-28 02:25:51.972','2026-01-28 00:00:00.000','cmkxashk0000793xfza0y5pwn','cmkxashk0000693xfd8itvml5','cmkxasgqs000493xfzun65322','2026-01-28 01:24:56.559','2026-01-28 02:25:51.975'),('cmkxpezbq0001b5gvysni9xhj','Kevin Contreras ','3018483860101','Visita','ARRIVED','2026-02-04 23:13:59.250',NULL,'2026-01-30 00:00:00.000','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','cmkxasgqs000493xfzun65322','2026-01-28 07:28:49.936','2026-02-04 23:13:59.251'),('cmlb4xde20001r25zqxt1fbad','Ken Castro','3018483860101','Visita familiar','DEPARTED','2026-02-06 17:04:30.581','2026-02-06 17:08:00.419','2026-02-13 00:00:00.000','cmkxashk0000993xf9lxrvzji','cmkxashk0000693xfd8itvml5','cmkxasgqs000493xfzun65322','2026-02-06 17:04:02.494','2026-02-06 17:08:00.420');
/*!40000 ALTER TABLE `visitor_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-06 15:43:36
