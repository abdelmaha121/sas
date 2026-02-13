-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: marketplace_platform
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_tenant_action` (`tenant_id`,`action`),
  KEY `idx_resource` (`resource_type`,`resource_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('02b8646a-56dd-472e-b0f3-c0cb1843e625','demo-tenant-001','customer-001','customer.booking.create','booking','5fa53e0b-2ef5-47ba-aef0-80d3619ac2c0','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:43'),('03eddd67-079c-45a9-8d4d-a072f1de10c2','demo-tenant-001','admin-001','admin.user.update','user','3a9092be-d7ee-47e9-b812-3832c43dae16','{\"role\": \"provider\", \"phone\": \"97696016\", \"status\": \"active\", \"lastName\": \"HUSSEIN\", \"firstName\": \"Mohamed\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-12 18:51:51'),('0712462f-afe5-4587-92d5-513c5d22cbb8','demo-tenant-001','customer-001','customer.booking.create','booking','6aa2db95-c8eb-43d0-a1c8-c273eb5cd0fa','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:11:54'),('080201cb-f42f-4974-998c-dfd60777b156','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:55:51'),('08423eab-0e8f-463a-87ab-73eed603f4ca','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-12 17:54:23'),('0a4c3afa-9892-40d3-afef-fc17e9230d61','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 17:08:08'),('0c085e88-35be-4d60-9a97-0dc68e1d64bc','demo-tenant-001','customer-001','customer.payment.create','payment','1ac30570-834d-4d86-a9cd-90e319487598','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"668da8cf-7ea0-491a-8ca0-1cecbeb7cf4d\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:58:26'),('0d68d2e4-5552-4fee-be7a-64d653122642','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 14:13:58'),('0f3fc2c5-3f8a-4502-a4c9-9ae3bc35df07','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 10:45:38'),('0f50610c-1f87-4273-8581-faa8d416763e','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:33:46'),('12135960-637c-41d8-b1e8-5f19e7a99958','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 10:24:06'),('12b7a52e-b6ec-4b43-ab01-f16a26a0f407','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 17:39:28'),('1397edd8-4227-4fdd-8c44-efa5fcdfa19a','demo-tenant-001','admin-001','admin.provider.update','provider','provider-001','{\"featured\": 1, \"isActive\": 1, \"description\": \"High-quality home services with 10+ years experience\", \"businessName\": \"Premium Home Services\", \"businessNameAr\": \"خدمات المنزل المتميزة\", \"commissionRate\": 15, \"verificationStatus\": \"approved\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:07:31'),('144b584b-2a67-4dbf-9e8e-a933cd64f828','demo-tenant-001','customer-001','customer.booking.create','booking','1a415fbc-4b5c-4f2c-b454-87c3d2f88036','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:23:14'),('1900d714-aadf-4ed6-a7ce-3b4167b0cf66','demo-tenant-001','admin-001','admin.user.update','user','3a9092be-d7ee-47e9-b812-3832c43dae16','{\"role\": \"super_admin\", \"phone\": \"97696016\", \"status\": \"active\", \"lastName\": \"HUSSEIN\", \"firstName\": \"Mohamed\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-12 18:50:38'),('1ae6042a-9433-4fff-90d2-6e2b230c4c34','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 19:47:26'),('1b92dee8-58f3-42aa-906a-f9f75ac0e6fb','demo-tenant-001','customer-001','customer.booking.create','booking','8fb6ba8a-c9d2-4705-9b0a-623d7a5aab0a','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 11:11:52'),('1d8a8447-7e01-4c78-bac3-9b5a37043850','demo-tenant-001','customer-001','customer.booking.create','booking','ae409e1c-8537-460c-92b3-c2bf68a525d9','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:43:17'),('204c5b08-04be-4523-8626-028bdbd8bdf4','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 18:16:46'),('228ef8e5-2882-410e-9e10-727b8daaf071','demo-tenant-001','customer-001','customer.booking.create','booking','5f223427-e030-4f37-8b1f-fac32cb03cd3','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 10:45:15'),('229b6bcd-fd26-496f-9ee6-9e27dd9c3e8f','demo-tenant-001','customer-001','customer.payment.create','payment','7b0ead9f-67f6-45cc-a828-c7f1c21f722d','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"bcf1f9b4-ff9d-4e35-b1ac-9fc44e99b484\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 10:57:55'),('2417235b-ed51-46b1-91a0-7f8bdb3a094b','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:09:50'),('24e5c524-122c-410a-a4c2-c4610d01019c','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 16:39:19'),('250f9965-71a1-4cd0-b425-90ef16558d36','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:33:12'),('2665135a-64f4-4984-9555-46e16d84d8f8','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 19:49:16'),('2ab3e5e0-19b8-4706-a0a7-4c5fdd8cbb94','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 13:40:24'),('2beaed68-2cb0-4d99-95a8-a04ea2ae287e','demo-tenant-001','customer-001','customer.booking.create','booking','42d86cbc-fe1e-432b-b8fa-7e24c29c5799','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 09:58:41'),('2fce72e0-648f-41b4-81f4-45be6def84e2','demo-tenant-001','admin-001','admin.provider.update','provider','provider-001','{\"featured\": 1, \"isActive\": 1, \"description\": \"High-quality home services with 10+ years experience\", \"businessName\": \"Premium Home Services\", \"businessNameAr\": \"خدمات المنزل المتميزة\", \"commissionRate\": 15, \"verificationStatus\": \"approved\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:07:48'),('30a45161-77f4-4535-939f-9e0cd40dc680','demo-tenant-001','customer-001','customer.booking.create','booking','61175cd6-2397-450e-a9c9-e1debcf5ce84','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:42'),('327d166d-3490-4e53-988e-03679df797eb','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 20:18:45'),('331b2da8-b57c-4295-ac09-a4be1148023f','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('35e42f8f-356b-4475-bc19-b0395b256872','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 11:33:33'),('368f5761-2583-44e1-80ca-2368b8344891','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('369c1126-8bc5-4456-952f-ef7134bd04f0','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('3a5c89ac-d6b8-491d-a528-2cbdabf69ebc','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 08:04:35'),('3a80bd01-6349-42c2-95bc-0dcb4c931619','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:54:08'),('3adc0eec-eb96-45b7-a5df-70ac608da770','demo-tenant-001','customer-001','customer.payment.create','payment','35132700-30c3-4b1f-a4e2-08081c443029','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"1a415fbc-4b5c-4f2c-b454-87c3d2f88036\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:23:58'),('3ce3c3cb-f042-4fe6-aadf-91c5299d06d2','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 10:11:58'),('3eb4ba0d-0bbb-4d8d-8b72-aee877b8acd8','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": true, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 08:04:37'),('42083151-7129-4072-9bba-e7f20f4a0e3b','demo-tenant-001','admin-001','admin.provider.update','provider','provider-001','{\"featured\": 1, \"isActive\": 1, \"description\": \"High-quality home services with 10+ years \", \"businessName\": \"Premium Home Services\", \"businessNameAr\": \"خدمات المنزل المتميزة\", \"commissionRate\": 15, \"verificationStatus\": \"pending\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:08:05'),('4963b7cf-a1c9-47fb-92bd-639d86228549','demo-tenant-001','admin-001','admin.category.create','category','814d8337-b7a2-40d7-aa43-67e32f3037cd','{\"name\": \"حدادة\", \"nameAr\": \"حدادة\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:48:09'),('4a898f27-e944-4be1-afd9-2769b97046df','demo-tenant-001','customer-001','customer.booking.cancel','booking','ec601446-a99b-4536-aa9c-df0c64654288','{\"status\": \"cancelled\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 13:35:08'),('4fa7a1ef-7cea-4ff6-80dd-bb4003cdb373','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('51e6cd5f-b81b-4307-bee3-8698439fa4a7','demo-tenant-001','customer-001','customer.booking.create','booking','8104360f-5a0f-4c77-beaa-95f7aff1bf3c','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 13:47:32'),('53d450c0-4ac0-48dc-94e8-062ea355832d','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 17:08:55'),('57512000-dc8a-4266-80c8-5cfefcc34402','demo-tenant-001','customer-001','customer.booking.create','booking','5b2ee12e-d673-47c0-8287-5be009d8bd0e','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:26:30'),('5a91da44-4003-46a3-8f9e-9aaf53474a7b','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-14 12:30:36'),('5b63aece-5157-4e8e-8604-807db9cd8414','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 10:11:17'),('5cf7c79e-a256-4284-afdd-f3f3c842c79a','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:55:44'),('5e8aaac9-c84d-4b3c-bfcf-361d00c7cb77','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:39:21'),('60c8d474-d5f3-4854-bcad-f69fdf23ec0a','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:39:46'),('68fe3128-be05-463d-97ee-167551701de8','demo-tenant-001','customer-001','customer.booking.create','booking','02f86ed6-b34c-4898-8faa-89fe7de85d56','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 11:42:48'),('6fa229e6-5fd3-4741-baf2-ecbc8a2246a7','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 11:33:03'),('70e848e4-b38a-4042-8fbb-1df4a1533122','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 10:46:55'),('729ccddd-cf75-40d3-b883-7fd735aea415','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 13:45:58'),('73b3e351-531b-49b7-b7f8-642d1fbbb1ee','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 19:47:26'),('74c084df-4cb6-44e8-bc1c-fd0ff76ff4f1','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-12 12:51:28'),('75ccf492-e952-418a-ad28-db714eef5109','demo-tenant-001','customer-001','customer.booking.create','booking','b4698829-db90-4f1f-b156-b957d0ea52be','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 16:36:13'),('75d1a453-820b-4ca3-8c78-d72360ea931e','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 19:46:49'),('7a8f647a-b262-4a42-82bd-65e5b8dd40cf','demo-tenant-001','customer-001','customer.booking.create','booking','9983adc9-0842-4d4c-b875-fa476978e9f1','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 10:14:16'),('7f69d9a2-5879-41f7-b597-5765552da1d7','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 14:13:58'),('80522aec-626b-4be0-85d4-3ad8511383e1','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:56:06'),('819f41fd-2f5e-4efe-b4ab-f3bbd388c62c','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 20:21:35'),('82e815a8-4fdf-4fa4-b9c7-cf849dd6575c','demo-tenant-001','customer-001','user.logout','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 20:22:15'),('8318cb60-ddad-4179-ba95-ea8de93e814c','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:09:50'),('8927cb2f-73d9-438d-8056-9fabd0cadfa6','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:54:01'),('8951faf6-449e-4b84-87e5-676a2b3e4271','demo-tenant-001','customer-001','customer.booking.create','booking','2d977e5a-b0cf-4ccf-8a26-a114ba33f8de','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:45'),('89652537-3c0d-461a-b3f9-79d8e2323493','demo-tenant-001','customer-001','customer.booking.create','booking','ec601446-a99b-4536-aa9c-df0c64654288','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 12:37:59'),('91bc4328-ea77-11f0-974a-e4e749820a0e','demo-tenant-001','admin-001','data_export','revenue',NULL,'{\"format\": \"pdf\", \"recordCount\": 0}',NULL,NULL,'2026-01-05 20:46:11'),('92951bd8-4e1e-4318-90ed-058c658e2208','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('97fc2d0e-ca24-4422-9206-c867b05141a4','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 07:56:29'),('99118655-dee5-4f33-acba-6de938ee6f37','demo-tenant-001','customer-001','customer.payment.create','payment','8c4ca199-8699-43c7-86e5-14e4bdc626cd','{\"amount\": \"100.00\", \"method\": \"card\", \"bookingId\": \"564d8381-83dd-44e9-9c0d-78e000f6b084\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:08:01'),('9963de20-ff2b-460b-85e0-c64e48118bf8','demo-tenant-001','customer-001','customer.booking.create','booking','56b36319-bfb1-4c89-92ee-d0d4bb296bd9','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 11:16:50'),('9cc51d39-f352-4336-922c-d7ecc35ab008','demo-tenant-001','customer-001','customer.booking.create','booking','f6622477-f557-44fb-8895-b04220c221b9','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:32'),('9de21926-cf29-4a26-9af5-a34c80fc54e4','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:57:45'),('a024a851-2a11-4c1c-bb9c-ed7a09c73786','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:53:23'),('a113e5d0-4fcf-4e62-907e-0e2c1e0cef9b','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('a123be37-9f86-4063-a1ba-9dd5325b366a','demo-tenant-001','admin-001','admin.provider.update','provider','provider-001','{\"featured\": 1, \"isActive\": 1, \"description\": \"High-quality home with 10+ years \", \"businessName\": \"Premium Home Services\", \"businessNameAr\": \"خدمات المنزل المتميزة\", \"commissionRate\": 15, \"verificationStatus\": \"approved\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-14 14:59:51'),('a4537667-92ef-424e-b625-9d1c8e68f487','demo-tenant-001','customer-001','customer.booking.create','booking','65b02623-c5b8-4b29-844c-7285c1f09d31','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:28:59'),('a5f855b2-e8b1-47f8-8f44-c38a0a6f4c94','demo-tenant-001','customer-001','customer.booking.create','booking','bcf1f9b4-ff9d-4e35-b1ac-9fc44e99b484','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 10:57:27'),('a6e4dcda-ae7b-4f0d-8461-d1d2180aaf9c','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 18:12:49'),('a83a0c76-883b-4269-8cac-69658ddaf3b2','demo-tenant-001','customer-001','customer.booking.create','booking','033a9d51-b383-45ee-8228-9fdd5d77eb66','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:29:12'),('a8f04ab2-d09f-47be-a560-07591ed2d6c5','demo-tenant-001','customer-001','customer.payment.create','payment','8e688da8-f04f-4456-82d2-b375f623501a','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"65b02623-c5b8-4b29-844c-7285c1f09d31\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:29:38'),('a92d42af-8c43-4e4d-9ea9-753f5fd729bd','demo-tenant-001','customer-001','customer.booking.create','booking','ccd2b5bb-49b4-49ed-8831-32cbf664814e','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:04:04'),('a9ba576a-a2cb-438a-80ad-5677815051a1','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 20:22:36'),('a9e7b4dc-9b18-43c2-a9cc-51a64886021e','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:57:08'),('aa207c75-0a6f-40f7-ac85-b49bbc00cd01','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 14:28:52'),('b83f33b8-9af1-40f5-8cd0-71541a861ce4','demo-tenant-001','provider-user-001','provider.profile.update','provider','provider-001','{\"description\": \"High-quality home with 10+ years \", \"businessName\": \"Premium Home Services\", \"kycDocuments\": [], \"businessNameAr\": \"خدمات المنزل المتميزة\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:57:49'),('bc2e9ecf-40c4-4c1e-a783-58fba78c5a52','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 19:28:11'),('bf0a786e-b2e9-4162-9a99-708b919dd85f','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 17:00:19'),('bfce534f-f705-4cb1-9c75-695eaf32c5de','demo-tenant-001','customer-001','customer.booking.create','booking','33672bf2-eec5-470f-9bb1-8cf2fbfd27b6','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:47'),('c0572a37-46fd-490f-8908-d16d0f09dec6','demo-tenant-001','provider-user-001','provider.service.delete','service','service-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:38:48'),('c09cc711-abdc-4711-aa9d-2f88de890613','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 12:25:47'),('c5e6f679-b1e3-4092-9d78-179d4cc619c4','demo-tenant-001','customer-001','customer.booking.create','booking','7784929b-a9c8-41be-97dc-cb297c3070ab','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:47'),('c7c46819-e332-4c94-a4db-89c97a544cfd','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 13:54:29'),('c92d87fd-c3a5-4a8e-9c48-bcdbfe870f45','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:09:50'),('cc2bc1e9-7b0c-46c9-bb09-cd99c470d1ff','demo-tenant-001','customer-001','customer.booking.create','booking','2305d69a-89bd-40c7-903e-923376656abc','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 16:14:23'),('d03d64cf-73d0-4ae6-a2fa-89be07071644','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-15 10:23:37'),('d40388ec-193e-459b-9e7d-99418d661136','demo-tenant-001','3a9092be-d7ee-47e9-b812-3832c43dae16','user.logout','user','3a9092be-d7ee-47e9-b812-3832c43dae16',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 07:57:33'),('d4aaea54-3892-4bf9-8cb9-21cc7811e29c','demo-tenant-001','customer-001','customer.booking.create','booking','aad30442-82c7-436b-838f-a68696d51983','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:44'),('d66e3a42-5245-48c4-a517-2968ed5b6c0c','demo-tenant-001','customer-001','customer.booking.create','booking','e78ad657-ac89-4246-8803-af68d7431e0f','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:20'),('d8813277-d96a-4635-9f9d-cac22742ac1c','demo-tenant-001','customer-001','customer.payment.create','payment','1999650f-86e2-4e8f-bd39-a48fefb45f08','{\"amount\": \"100.00\", \"method\": \"card\", \"bookingId\": \"8104360f-5a0f-4c77-beaa-95f7aff1bf3c\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 13:49:02'),('dd4c104a-034d-4b42-8349-71c6926b5bbf','demo-tenant-001','customer-001','customer.booking.create','booking','4399f79f-325c-4f9a-ab5a-29530b00ed51','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:43'),('ddb88925-0029-4fc4-b1af-fa5a4555713d','demo-tenant-001','3a9092be-d7ee-47e9-b812-3832c43dae16','user.register','user','3a9092be-d7ee-47e9-b812-3832c43dae16',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 07:56:28'),('dff9b5d7-c512-41fd-afdc-32812dc5e048','demo-tenant-001','customer-001','customer.booking.create','booking','65e70731-fc4a-4c0c-ad30-38a621650bde','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 16:42:51'),('e17d9235-760a-409f-9d17-0645b3a26136','demo-tenant-001','customer-001','customer.booking.create','booking','ddb15d50-8326-47a4-bb97-c5a7894a11a7','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:48'),('e1b8e80d-a480-4db6-8af1-b4171ac6be4b','demo-tenant-001','customer-001','customer.payment.create','payment','e7931b65-341d-4cc0-8885-7cd06557a780','{\"amount\": \"100.00\", \"method\": \"card\", \"bookingId\": \"ae409e1c-8537-460c-92b3-c2bf68a525d9\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:43:45'),('e305e44c-2ffa-4767-a597-d45a98927f64','demo-tenant-001','customer-001','customer.booking.create','booking','8a377e1f-ed93-40e6-b0fa-221d081d58ea','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:45'),('e61d75bc-155d-4f81-92e3-22c6d22c0b54','demo-tenant-001','customer-001','customer.payment.create','payment','00da72ee-8420-4a3f-b619-9db03effc05f','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"5b2ee12e-d673-47c0-8287-5be009d8bd0e\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:27:03'),('e728ea38-6174-46ec-8786-23afd0f761eb','demo-tenant-001','provider-user-001','user.logout','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-11 10:45:38'),('e7b4233e-f6bd-4d55-82e6-2e7fffe3a9b2','demo-tenant-001','customer-001','customer.booking.create','booking','668da8cf-7ea0-491a-8ca0-1cecbeb7cf4d','{\"serviceId\": \"service-002\", \"providerId\": \"provider-001\", \"totalAmount\": 150}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 11:57:59'),('ec9bce83-6e20-4cc4-a525-46e29ae34174','demo-tenant-001','provider-user-001','user.login','user','provider-user-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:56:25'),('ef992278-32b7-4fa2-af54-627e83b7120e','demo-tenant-001','customer-001','user.login','user','customer-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 16:30:50'),('f073916c-a986-49dd-885a-78fab618b3f5','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 17:55:31'),('f1bbb508-b80c-4ff7-8602-5cc03c6fd105','demo-tenant-001','admin-001','admin.category.update','category','cat-004','{\"name\": \"Carpentry\", \"nameAr\": \"النجارة\", \"iconUrl\": null, \"isActive\": false, \"parentId\": null, \"description\": \"Custom carpentry work\", \"displayOrder\": 0}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:54:52'),('f4012e17-5404-48ef-85a8-804262fd080a','demo-tenant-001','admin-001','user.logout','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 09:18:54'),('f4ff55e0-74fc-496a-a547-26a6b7dbfeef','demo-tenant-001','customer-001','customer.booking.create','booking','166dd406-aa71-464d-b2c4-f7389e7f39a7','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"paymentType\": \"cash_on_delivery\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 15:24:46'),('f5bfe471-bef9-4751-acae-fbbbcf4f8769','demo-tenant-001','customer-001','customer.booking.create','booking','564d8381-83dd-44e9-9c0d-78e000f6b084','{\"serviceId\": \"service-003\", \"providerId\": \"provider-001\", \"totalAmount\": 100}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:07:34'),('f6a5b6d6-5b84-4487-ba38-f27ff833bdfd','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-09 19:30:19'),('f75c73de-e44d-47b6-95f3-c83d08cbf65e','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-17 13:55:18'),('fa7287d2-9825-46e9-9d0d-096d8d3ce7d0','demo-tenant-001','customer-001','customer.payment.create','payment','469f25f1-3e02-4586-a365-3275b00aa0d9','{\"amount\": \"150.00\", \"method\": \"card\", \"bookingId\": \"033a9d51-b383-45ee-8228-9fdd5d77eb66\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-16 12:29:39'),('fb8d4c5a-5ad8-477e-89a5-f49a37b3e562','demo-tenant-001','admin-001','admin.provider.update','provider','provider-001','{\"featured\": 1, \"isActive\": 1, \"description\": \"High-quality home services with 10+ years \", \"businessName\": \"Premium Home Services\", \"businessNameAr\": \"خدمات المنزل المتميزة\", \"commissionRate\": 15, \"verificationStatus\": \"approved\"}','unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-13 18:09:31'),('ffe8c05f-23e0-4f5b-931a-5cb8cb84eb9a','demo-tenant-001','admin-001','user.login','user','admin-001',NULL,'unknown','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36','2026-01-10 07:58:36');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_addons`
--

DROP TABLE IF EXISTS `booking_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_addons` (
  `booking_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `addon_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`booking_id`,`addon_id`),
  KEY `addon_id` (`addon_id`),
  CONSTRAINT `booking_addons_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_addons_ibfk_2` FOREIGN KEY (`addon_id`) REFERENCES `service_addons` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_addons`
--

LOCK TABLES `booking_addons` WRITE;
/*!40000 ALTER TABLE `booking_addons` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_type` enum('one_time','recurring','emergency') COLLATE utf8mb4_unicode_ci DEFAULT 'one_time',
  `allow_urgent` tinyint(1) NOT NULL DEFAULT '0',
  `min_advance_hours` int NOT NULL DEFAULT '0',
  `status` enum('pending','confirmed','in_progress','completed','cancelled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `scheduled_at` timestamp NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `urgent_fee` decimal(10,2) DEFAULT '0.00',
  `commission_amount` decimal(10,2) DEFAULT NULL,
  `currency_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_type` enum('instant','cash_on_delivery') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'instant',
  `payment_methods` json DEFAULT NULL,
  `customer_address` json DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `cancellation_type` enum('percentage','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_value` decimal(10,2) DEFAULT NULL,
  `free_cancellation_hours` int DEFAULT '0',
  `recurrence` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `idx_tenant_status` (`tenant_id`,`status`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_scheduled` (`scheduled_at`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `fk_bookings_currency` (`currency_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bookings_ibfk_4` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('02f86ed6-b34c-4898-8faa-89fe7de85d56','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-01-30 22:00:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-17 11:42:48','2026-01-17 11:42:48'),('033a9d51-b383-45ee-8228-9fdd5d77eb66','demo-tenant-001','customer-001','provider-001','service-002','one_time','confirmed','2026-01-19 20:30:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 12:29:12','2026-01-16 12:29:40'),('166dd406-aa71-464d-b2c4-f7389e7f39a7','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:46','2026-01-16 15:24:46'),('1a415fbc-4b5c-4f2c-b454-87c3d2f88036','demo-tenant-001','customer-001','provider-001','service-002','one_time','confirmed','2026-02-06 20:30:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 12:23:14','2026-01-16 12:23:58'),('2305d69a-89bd-40c7-903e-923376656abc','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-28 19:00:00',NULL,150.00,22.50,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 16:14:23','2026-01-16 16:14:23'),('2d977e5a-b0cf-4ccf-8a26-a114ba33f8de','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:45','2026-01-16 15:24:45'),('33672bf2-eec5-470f-9bb1-8cf2fbfd27b6','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:47','2026-01-16 15:24:47'),('42d86cbc-fe1e-432b-b8fa-7e24c29c5799','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-17 09:01:00',NULL,150.00,22.50,'USD','pending','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 09:58:41','2026-01-16 09:58:41'),('4399f79f-325c-4f9a-ab5a-29530b00ed51','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:43','2026-01-16 15:24:43'),('564d8381-83dd-44e9-9c0d-78e000f6b084','demo-tenant-001','customer-001','provider-001','service-003','one_time','confirmed','2026-01-30 20:30:00',NULL,100.00,15.00,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 12:07:34','2026-01-16 12:08:03'),('56b36319-bfb1-4c89-92ee-d0d4bb296bd9','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-01-21 19:00:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-17 11:16:50','2026-01-17 11:16:50'),('5b2ee12e-d673-47c0-8287-5be009d8bd0e','demo-tenant-001','customer-001','provider-001','service-002','one_time','confirmed','2026-01-18 18:00:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 12:26:30','2026-01-16 12:27:04'),('5f223427-e030-4f37-8b1f-fac32cb03cd3','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-24 19:00:00',NULL,150.00,22.50,'USD','pending','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 10:45:15','2026-01-16 10:45:15'),('5fa53e0b-2ef5-47ba-aef0-80d3619ac2c0','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:43','2026-01-16 15:24:43'),('61175cd6-2397-450e-a9c9-e1debcf5ce84','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:42','2026-01-16 15:24:42'),('65b02623-c5b8-4b29-844c-7285c1f09d31','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-29 19:00:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 11:28:58','2026-01-16 11:29:38'),('65e70731-fc4a-4c0c-ad30-38a621650bde','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-03-26 19:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 16:42:51','2026-01-16 16:42:51'),('668da8cf-7ea0-491a-8ca0-1cecbeb7cf4d','demo-tenant-001','customer-001','provider-001','service-002','one_time','confirmed','2026-01-27 20:30:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 11:57:59','2026-01-16 11:58:27'),('6aa2db95-c8eb-43d0-a1c8-c273eb5cd0fa','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-25 20:00:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:11:54','2026-01-16 15:11:54'),('7784929b-a9c8-41be-97dc-cb297c3070ab','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:47','2026-01-16 15:24:47'),('8104360f-5a0f-4c77-beaa-95f7aff1bf3c','demo-tenant-001','customer-001','provider-001','service-003','one_time','confirmed','2026-01-20 17:00:00',NULL,100.00,15.00,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 13:47:32','2026-01-16 13:49:05'),('8a377e1f-ed93-40e6-b0fa-221d081d58ea','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:45','2026-01-16 15:24:45'),('8fb6ba8a-c9d2-4705-9b0a-623d7a5aab0a','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-03-26 18:00:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-17 11:11:52','2026-01-17 11:11:52'),('9983adc9-0842-4d4c-b875-fa476978e9f1','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-24 10:19:00',NULL,150.00,22.50,'USD','pending','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 10:14:16','2026-01-16 10:14:16'),('aad30442-82c7-436b-838f-a68696d51983','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:44','2026-01-16 15:24:44'),('ae409e1c-8537-460c-92b3-c2bf68a525d9','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-01-30 18:30:00',NULL,100.00,15.00,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 11:43:17','2026-01-16 11:43:45'),('b4698829-db90-4f1f-b156-b957d0ea52be','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-04 21:00:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 16:36:13','2026-01-16 16:36:13'),('bcf1f9b4-ff9d-4e35-b1ac-9fc44e99b484','demo-tenant-001','customer-001','provider-001','service-002','one_time','confirmed','2026-01-23 18:30:00',NULL,150.00,22.50,'USD','paid','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 10:57:27','2026-01-16 10:57:58'),('ccd2b5bb-49b4-49ed-8831-32cbf664814e','demo-tenant-001','customer-001','provider-001','service-002','one_time','pending','2026-01-17 19:00:00',NULL,150.00,22.50,'USD','pending','instant','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 11:04:02','2026-01-16 11:04:02'),('ddb15d50-8326-47a4-bb97-c5a7894a11a7','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:48','2026-01-16 15:24:48'),('e78ad657-ac89-4246-8803-af68d7431e0f','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:20','2026-01-16 15:24:20'),('ec601446-a99b-4536-aa9c-df0c64654288','demo-tenant-001','customer-001','provider-001','service-003','one_time','cancelled','2026-05-01 17:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,'customer-001','2026-01-17 12:37:59','2026-01-17 13:35:07'),('f6622477-f557-44fb-8895-b04220c221b9','demo-tenant-001','customer-001','provider-001','service-003','one_time','pending','2026-02-26 18:30:00',NULL,100.00,15.00,'USD','pending','cash_on_delivery','\"Salalah 125500\"',NULL,NULL,NULL,NULL,'2026-01-16 15:24:32','2026-01-16 15:24:32');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_ar` text COLLATE utf8mb4_unicode_ci,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('wallet','card','bank_transfer','cash') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_gateway_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_status` (`tenant_id`,`status`),
  KEY `idx_booking` (`booking_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES ('00da72ee-8420-4a3f-b619-9db03effc05f','demo-tenant-001','5b2ee12e-d673-47c0-8287-5be009d8bd0e','customer-001',150.00,'USD','card','CARD_5025','completed',NULL,'2026-01-16 12:27:03','2026-01-16 12:27:03'),('1999650f-86e2-4e8f-bd39-a48fefb45f08','demo-tenant-001','8104360f-5a0f-4c77-beaa-95f7aff1bf3c','customer-001',100.00,'USD','card','CARD_8555','completed',NULL,'2026-01-16 13:49:01','2026-01-16 13:49:01'),('1ac30570-834d-4d86-a9cd-90e319487598','demo-tenant-001','668da8cf-7ea0-491a-8ca0-1cecbeb7cf4d','customer-001',150.00,'USD','card','CARD_5588','completed',NULL,'2026-01-16 11:58:26','2026-01-16 11:58:26'),('35132700-30c3-4b1f-a4e2-08081c443029','demo-tenant-001','1a415fbc-4b5c-4f2c-b454-87c3d2f88036','customer-001',150.00,'USD','card','CARD_8205','completed',NULL,'2026-01-16 12:23:58','2026-01-16 12:23:58'),('469f25f1-3e02-4586-a365-3275b00aa0d9','demo-tenant-001','033a9d51-b383-45ee-8228-9fdd5d77eb66','customer-001',150.00,'USD','card','CARD_5411','completed',NULL,'2026-01-16 12:29:39','2026-01-16 12:29:39'),('7b0ead9f-67f6-45cc-a828-c7f1c21f722d','demo-tenant-001','bcf1f9b4-ff9d-4e35-b1ac-9fc44e99b484','customer-001',150.00,'USD','card','CARD_5855','completed',NULL,'2026-01-16 10:57:55','2026-01-16 10:57:55'),('8c4ca199-8699-43c7-86e5-14e4bdc626cd','demo-tenant-001','564d8381-83dd-44e9-9c0d-78e000f6b084','customer-001',100.00,'USD','card','CARD_8055','completed',NULL,'2026-01-16 12:08:01','2026-01-16 12:08:01'),('8e688da8-f04f-4456-82d2-b375f623501a','demo-tenant-001','65b02623-c5b8-4b29-844c-7285c1f09d31','customer-001',150.00,'USD','card','CARD_8544','completed',NULL,'2026-01-16 11:29:38','2026-01-16 11:29:38'),('e7931b65-341d-4cc0-8885-7cd06557a780','demo-tenant-001','ae409e1c-8537-460c-92b3-c2bf68a525d9','customer-001',100.00,'USD','card','CARD_8255','completed',NULL,'2026-01-16 11:43:45','2026-01-16 11:43:45');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promo_codes`
--

DROP TABLE IF EXISTS `promo_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_codes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `max_uses` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `valid_from` timestamp NOT NULL,
  `valid_until` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tenant_code` (`tenant_id`,`code`),
  KEY `idx_code` (`code`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `promo_codes_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promo_codes`
--

LOCK TABLES `promo_codes` WRITE;
/*!40000 ALTER TABLE `promo_codes` DISABLE KEYS */;
INSERT INTO `promo_codes` VALUES ('dfe21aa0-ea6d-11f0-974a-e4e749820a0e','demo-tenant-001','WELCOME10','percentage',10.00,100,0,'2026-01-05 19:36:47','2026-02-04 19:36:47',1,NULL,'2026-01-05 19:36:47','2026-01-05 19:36:47');
/*!40000 ALTER TABLE `promo_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_staff`
--

DROP TABLE IF EXISTS `provider_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_staff` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `provider_staff_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `provider_staff_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `provider_staff_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_staff`
--

LOCK TABLES `provider_staff` WRITE;
/*!40000 ALTER TABLE `provider_staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `provider_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `media` json DEFAULT NULL,
  `sentiment_score` decimal(3,2) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_flagged` tinyint(1) DEFAULT '0',
  `flag_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `service_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_booking_review` (`booking_id`),
  KEY `customer_id` (`customer_id`),
  KEY `provider_id` (`provider_id`),
  KEY `idx_tenant_provider` (`tenant_id`,`provider_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_flagged` (`is_flagged`),
  KEY `idx_reviews_service_id` (`service_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_4` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_addons`
--

DROP TABLE IF EXISTS `service_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_addons` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `service_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service` (`service_id`),
  CONSTRAINT `service_addons_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_addons`
--

LOCK TABLES `service_addons` WRITE;
/*!40000 ALTER TABLE `service_addons` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_categories`
--

DROP TABLE IF EXISTS `service_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_categories` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_active` (`tenant_id`,`is_active`),
  KEY `idx_parent` (`parent_id`),
  CONSTRAINT `service_categories_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_categories_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `service_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
INSERT INTO `service_categories` VALUES ('814d8337-b7a2-40d7-aa43-67e32f3037cd','demo-tenant-001','حدادة','حدادة','حدادة',NULL,NULL,5,1,'2026-01-13 18:48:09','2026-01-13 18:48:09'),('cat-001','demo-tenant-001','Home Cleaning','تنظيف المنزل','Professional home cleaning services',NULL,NULL,0,1,'2026-01-05 19:36:47','2026-01-05 19:36:47'),('cat-002','demo-tenant-001','Plumbing','السباكة','Expert plumbing and repairs',NULL,NULL,0,1,'2026-01-05 19:36:47','2026-01-05 19:36:47'),('cat-003','demo-tenant-001','Electrical','الكهرباء','Licensed electrical services',NULL,NULL,0,1,'2026-01-05 19:36:47','2026-01-05 19:36:47'),('cat-004','demo-tenant-001','Carpentry','النجارة','Custom carpentry work',NULL,NULL,0,0,'2026-01-05 19:36:47','2026-01-13 18:54:52'),('cat-005','demo-tenant-001','Painting','الدهان','Interior and exterior painting',NULL,NULL,0,1,'2026-01-05 19:36:47','2026-01-05 19:36:47');
/*!40000 ALTER TABLE `service_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_providers`
--

DROP TABLE IF EXISTS `service_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_providers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `kyc_documents` json DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `total_bookings` int DEFAULT '0',
  `commission_rate` decimal(5,2) DEFAULT '15.00',
  `is_active` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `main_activity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_tenant_status` (`tenant_id`,`verification_status`),
  KEY `idx_rating` (`rating`),
  KEY `idx_featured` (`featured`),
  KEY `idx_main_activity` (`main_activity`),
  CONSTRAINT `service_providers_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_providers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_providers`
--

LOCK TABLES `service_providers` WRITE;
/*!40000 ALTER TABLE `service_providers` DISABLE KEYS */;
INSERT INTO `service_providers` VALUES ('provider-001','demo-tenant-001','provider-user-001','Premium Home Services','خدمات المنزل المتميزة','High-quality home with 10+ years ',NULL,NULL,'pending','[]',4.80,127,7,15.00,1,1,'2026-01-05 19:36:47','2026-01-16 13:49:05');
/*!40000 ALTER TABLE `service_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `base_price` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT 'OMR',
  `duration_minutes` int DEFAULT NULL,
  `min_advance_hours` int DEFAULT '0',
  `free_cancellation_hours` int DEFAULT '0',
  `cancellation_type` enum('percentage','fixed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancellation_value` decimal(10,2) DEFAULT NULL,
  `pricing_type` enum('fixed','hourly','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'fixed',
  `booking_type` enum('instant','request','both') COLLATE utf8mb4_unicode_ci DEFAULT 'both',
  `allow_recurring` tinyint(1) DEFAULT '0',
  `allow_urgent` tinyint(1) DEFAULT '0',
  `urgent_fee` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `images` json DEFAULT NULL,
  `availability` json DEFAULT NULL COMMENT '\n[\n  {\n    "day": 1,\n    "periods": [\n      {"start": "09:00", "end": "13:00"},\n      {"start": "16:00", "end": "20:00"}\n    ]\n  }\n]\n',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_methods` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_active` (`tenant_id`,`is_active`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_price` (`base_price`),
  KEY `fk_services_currency` (`currency_id`),
  CONSTRAINT `fk_services_currency` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `service_providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `services_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('service-002','demo-tenant-001','provider-001','cat-001','Deep Cleaning','تنظيف عميق','Intensive deep cleaning service','خدمة تنظيف عميق مكثف',150.00,'USD',240,'fixed',1,NULL,NULL,'2026-01-05 19:36:47','2026-01-05 19:36:47'),('service-003','demo-tenant-001','provider-001','cat-002','Pipe Repair','إصلاح الأنابيب','Fix leaking or broken pipes','إصلاح الأنابيب المتسربة أو المكسورة',100.00,'USD',90,'fixed',1,NULL,NULL,'2026-01-05 19:36:47','2026-01-05 19:36:47');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subdomain` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscription_plan` enum('free','pro','enterprise') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `status` enum('active','suspended','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `branding_logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branding_primary_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#007BFF',
  `branding_secondary_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#6C757D',
  `settings` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subdomain` (`subdomain`),
  KEY `idx_subdomain` (`subdomain`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('demo-tenant-001','Demo Services Platform','demo','pro','active',NULL,'#007BFF','#6C757D',NULL,'2026-01-05 19:36:47','2026-01-05 19:36:47');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hashed password - NULL for OAuth-only users',
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('customer','provider','provider_staff','admin','super_admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','suspended','pending_verification') COLLATE utf8mb4_unicode_ci DEFAULT 'pending_verification',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Uploaded avatar URL',
  `profile_picture` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email_tenant` (`email`,`tenant_id`),
  UNIQUE KEY `idx_google_id` (`google_id`),
  KEY `idx_tenant_role` (`tenant_id`,`role`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3a9092be-d7ee-47e9-b812-3832c43dae16','demo-tenant-001','moh@gmail.com','97696016',NULL,'$2a$10$5dAVjUZ0rdSFSYgSC/TBf.jB3OJLah6B10MkmszjG.VUBefVTqlXa',NULL,'Mohamed','HUSSEIN','provider','active',NULL,NULL,NULL,NULL,'2026-01-10 07:56:28','2026-01-12 18:51:51'),('5c780883-ea72-11f0-974a-e4e749820a0e','demo-tenant-001','provider2@demo.com','97696016',NULL,'$2b$10$MGpZC1uzOVbcY7XaUsk48.Uhmp6aJVXeu.jXkVMcwY5UgKAObnJd6',NULL,'‪Mohamed','Abdelmahmoud‬‏','provider','active',NULL,NULL,NULL,NULL,'2026-01-05 20:08:54','2026-01-05 20:08:54'),('admin-001','demo-tenant-001','admin@demo.com',NULL,NULL,'$2b$10$qVGwmXxXtOrnc0x0v6KoHeYNHqI/ZIuMb68QGjIaBKy2aAjYwgDBO',NULL,'Admin','User','admin','active',NULL,NULL,NULL,'2026-01-17 13:55:18','2026-01-05 19:36:47','2026-01-17 13:55:18'),('customer-001','demo-tenant-001','customer@demo.com','+96897238047','Salalah 125500','$2b$10$qVGwmXxXtOrnc0x0v6KoHeYNHqI/ZIuMb68QGjIaBKy2aAjYwgDBO',NULL,'Sarah','Customer','customer','active',NULL,NULL,NULL,'2026-01-16 11:57:08','2026-01-05 19:36:47','2026-01-16 11:57:08'),('provider-user-001','demo-tenant-001','provider@demo.com',NULL,NULL,'$2b$10$qVGwmXxXtOrnc0x0v6KoHeYNHqI/ZIuMb68QGjIaBKy2aAjYwgDBO',NULL,'John','Provider','provider','active',NULL,NULL,NULL,'2026-01-17 13:45:58','2026-01-05 19:36:47','2026-01-17 13:45:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `wallet_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('credit','debit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wallet` (`wallet_id`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet_transactions`
--

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `currency_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wallet` (`tenant_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `currency_id` (`currency_id`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallets_ibfk_3` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (uuid()),
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tenant_code` (`tenant_id`,`code`),
  KEY `idx_tenant_active` (`tenant_id`,`is_active`),
  CONSTRAINT `currencies_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES ('omr-default','demo-tenant-001','OMR','Omani Riyal','ر.ع.',1,1,'2026-01-05 19:36:47','2026-01-05 19:36:47');
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
INSERT INTO `wallets` VALUES ('071725b3-40bd-4736-9e15-6e08d39d07c1','demo-tenant-001','customer-001',0.00,'SAR','2026-01-15 15:37:30','2026-01-15 15:37:30');
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-17  6:34:51
