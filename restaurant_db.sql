-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 22, 2026 at 06:15 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `user_type` enum('super_admin','restaurant_user') NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `user_type`, `token`, `expires_at`, `created_at`) VALUES
(1, 1, 'super_admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzc1MzI4NDEzLCJleHAiOjE3NzU5MzMyMTN9.-a7M1CUAnjBydCuRHeRsgwOvYt7D3czi-MX7i77tuTA', '2026-04-12 00:16:53', '2026-04-04 18:46:53'),
(2, 1, 'super_admin', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzc2Njk1NjM5LCJleHAiOjE3NzczMDA0Mzl9.TVnV1qcwk-B5zehGNF2YCkvfP6qMgr5zbNkhxafUHbo', '2026-04-27 20:03:59', '2026-04-20 14:33:59'),
(4, 1, 'restaurant_user', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzc2ODMwMjQ5LCJleHAiOjE3Nzc0MzUwNDl9.7UbOw5V7ByTz6u9QTWUlOMF7jB-LWAXCdVW-SazHH2s', '2026-04-29 09:27:29', '2026-04-22 03:57:29');

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `owner_name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `timezone` varchar(60) NOT NULL DEFAULT 'Asia/Kolkata',
  `restaurant_type` enum('veg','non_veg','both') NOT NULL DEFAULT 'both',
  `service_type` enum('dine_in','takeaway','both') NOT NULL DEFAULT 'both',
  `operating_hours_open` varchar(10) DEFAULT NULL,
  `operating_hours_close` varchar(10) DEFAULT NULL,
  `gst_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `gst_no` varchar(20) DEFAULT NULL,
  `gst_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` varchar(100) NOT NULL,
  `updated_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`id`, `name`, `owner_name`, `slug`, `logo_url`, `address`, `phone`, `email`, `currency`, `timezone`, `restaurant_type`, `service_type`, `operating_hours_open`, `operating_hours_close`, `gst_enabled`, `gst_no`, `gst_percentage`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ramesh Dhaba', 'Ramesh', 'ramesh-dhaba', NULL, 'Indore', '9876543210', 'ramesh@gmail.com', 'INR', 'Asia/Kolkata', 'both', 'both', NULL, NULL, 0, NULL, 0.00, 1, '2026-04-20 20:05:55', '2026-04-20 20:05:55');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_subscriptions`
--

CREATE TABLE `restaurant_subscriptions` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `plan` enum('free','basic','pro') NOT NULL DEFAULT 'free',
  `status` enum('trial','active','expired') NOT NULL DEFAULT 'trial',
  `subscription_start_date` varchar(100) NOT NULL,
  `subscription_expires_at` varchar(100) DEFAULT NULL,
  `created_at` varchar(100) NOT NULL,
  `updated_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_subscriptions`
--

INSERT INTO `restaurant_subscriptions` (`id`, `restaurant_id`, `plan`, `status`, `subscription_start_date`, `subscription_expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'free', 'trial', '2026-04-20 20:05:55', '2026-04-23 20:05:55', '2026-04-20 20:05:55', '2026-04-20 20:05:55');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_users`
--

CREATE TABLE `restaurant_users` (
  `id` int(10) UNSIGNED NOT NULL,
  `restaurant_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('owner','manager','staff','kitchen') NOT NULL DEFAULT 'staff',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` varchar(100) DEFAULT NULL,
  `created_at` varchar(100) NOT NULL,
  `updated_at` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_users`
--

INSERT INTO `restaurant_users` (`id`, `restaurant_id`, `name`, `email`, `password_hash`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ramesh', 'ramesh@gmail.com', '$2b$12$2N1rl758zuZ5XJkPt70S9OkSNCT.BULRQYq2ElD/elYTdVEMjM2lC', 'owner', 1, '2026-04-22 09:27:29', '2026-04-20 20:05:55', '2026-04-22 09:27:29');

-- --------------------------------------------------------

--
-- Table structure for table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` varchar(100) NOT NULL,
  `updated_at` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `super_admins`
--

INSERT INTO `super_admins` (`id`, `name`, `email`, `password_hash`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Dev Ansh', 'dev@gmail.com', '$2b$12$29DGvhmmbMlNVcZHeg/xJeotqd0KkkJoxw4nPr6E5h.WwNx9t2.Cu', 1, '2026-04-05 00:14:40', '2026-04-20 20:03:59');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_rt_user` (`user_id`,`user_type`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Indexes for table `restaurant_subscriptions`
--
ALTER TABLE `restaurant_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `idx_sub_restaurant` (`restaurant_id`);

--
-- Indexes for table `restaurant_users`
--
ALTER TABLE `restaurant_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_restaurant_email` (`restaurant_id`,`email`);

--
-- Indexes for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `restaurant_subscriptions`
--
ALTER TABLE `restaurant_subscriptions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `restaurant_users`
--
ALTER TABLE `restaurant_users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `super_admins`
--
ALTER TABLE `super_admins`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `restaurant_subscriptions`
--
ALTER TABLE `restaurant_subscriptions`
  ADD CONSTRAINT `fk_sub_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `restaurant_users`
--
ALTER TABLE `restaurant_users`
  ADD CONSTRAINT `fk_ru_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
