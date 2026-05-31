-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 31, 2026 at 10:51 AM
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
-- Database: `serm`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `booking_id` int(10) UNSIGNED NOT NULL,
  `client_name` varchar(200) NOT NULL,
  `client_phone` varchar(20) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `event_date` date NOT NULL,
  `location` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `event_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`booking_id`, `client_name`, `client_phone`, `event_type`, `event_date`, `location`, `description`, `status`, `created_by`, `created_at`, `event_id`) VALUES
(3, 'Shyaka', '0782737821', 'Birthday', '2026-06-01', 'Khana Kazana', 'Birthday Party\n', 'cancelled', 2, '2026-05-30 12:54:21', 7);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int(10) UNSIGNED NOT NULL,
  `event_name` varchar(200) NOT NULL,
  `event_start_date` date NOT NULL,
  `event_end_date` date NOT NULL,
  `event_budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','inprogress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `event_name`, `event_start_date`, `event_end_date`, `event_budget`, `status`, `created_at`) VALUES
(1, 'Kigali Music Festival', '2026-05-29', '2026-06-01', 6000000.00, 'pending', '2026-05-23 22:28:23'),
(6, 'Wedding ceremony', '2026-05-30', '2026-05-31', 1000000.00, 'pending', '2026-05-28 10:30:07'),
(7, 'Shyaka Birthday', '2026-06-01', '2026-06-01', 100000.00, 'cancelled', '2026-05-30 23:28:33');

-- --------------------------------------------------------

--
-- Table structure for table `event_assignments`
--

CREATE TABLE `event_assignments` (
  `ea_id` int(10) UNSIGNED NOT NULL,
  `event_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `n_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`n_id`, `user_id`, `message`, `is_read`, `created_at`) VALUES
(5, 1, 'You have been assigned a new task: Renew Equipment Insurance', 1, '2026-05-28 12:49:58');

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `resource_id` int(10) UNSIGNED NOT NULL,
  `resource_name` varchar(200) NOT NULL,
  `resource_category` varchar(100) NOT NULL,
  `resource_serialNumber` varchar(100) NOT NULL,
  `resource_status` enum('available','inuse','damaged') NOT NULL DEFAULT 'available',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`resource_id`, `resource_name`, `resource_category`, `resource_serialNumber`, `resource_status`, `created_at`) VALUES
(1, 'Hp Computers', 'Computers', 'F238712SG', 'available', '2026-05-25 16:09:20'),
(5, '450K Speakers', 'Speakers', 'K62381723331', 'available', '2026-05-29 16:22:39'),
(6, 'Mitsubishi', 'Vehicles', 'RAG 071 H', 'available', '2026-05-29 16:23:35'),
(7, 'Big Tents 1234 X 12', 'Tents', '0001', 'available', '2026-05-29 16:33:47'),
(8, 'Mac book Air', 'Computers', 'G27981923C', 'available', '2026-05-29 16:34:36'),
(9, '4k Speaker', 'Speakers', 'O3982327D', 'available', '2026-05-29 16:35:47');

-- --------------------------------------------------------

--
-- Table structure for table `resource_assignments`
--

CREATE TABLE `resource_assignments` (
  `ra_id` int(10) UNSIGNED NOT NULL,
  `resource_id` int(10) UNSIGNED NOT NULL,
  `event_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp(),
  `returned_at` datetime DEFAULT NULL
) ;

--
-- Dumping data for table `resource_assignments`
--

INSERT INTO `resource_assignments` (`ra_id`, `resource_id`, `event_id`, `assigned_at`, `returned_at`) VALUES
(1, 1, 1, '2026-05-28 14:45:17', '2026-05-28 14:46:06'),
(2, 1, 1, '2026-05-29 16:21:22', '2026-05-29 16:21:50'),
(3, 1, 1, '2026-05-30 12:58:47', '2026-05-30 23:36:26'),
(4, 9, 7, '2026-05-30 23:36:46', '2026-05-30 23:53:03'),
(5, 8, 7, '2026-05-30 23:52:24', '2026-05-30 23:53:03'),
(6, 6, 7, '2026-05-30 23:52:35', '2026-05-30 23:53:03'),
(7, 5, 7, '2026-05-30 23:52:41', '2026-05-30 23:53:03');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `task_id` int(10) UNSIGNED NOT NULL,
  `task_name` varchar(200) NOT NULL,
  `task_deadline` date NOT NULL,
  `track_progress` enum('pending','inprogress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `event_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `task_name`, `task_deadline`, `track_progress`, `event_id`, `created_at`) VALUES
(1, 'Renew Equipment Insurance', '2026-06-20', 'pending', NULL, '2026-05-25 14:54:39');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `ta_id` int(10) UNSIGNED NOT NULL,
  `task_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`ta_id`, `task_id`, `user_id`, `assigned_at`) VALUES
(1, 1, 1, '2026-05-28 12:49:58');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `t_id` int(10) UNSIGNED NOT NULL,
  `transaction_category` enum('expense','revenue') NOT NULL,
  `transaction_name` varchar(200) NOT NULL,
  `transaction_amount` decimal(15,2) NOT NULL,
  `date_of_transaction` date NOT NULL,
  `event_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`t_id`, `transaction_category`, `transaction_name`, `transaction_amount`, `date_of_transaction`, `event_id`, `user_id`, `created_at`) VALUES
(2, 'revenue', 'Budget', 120000.00, '2026-05-30', 6, 2, '2026-05-30 02:23:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','manager','staff') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `firstname`, `lastname`, `username`, `password`, `role`, `created_at`) VALUES
(1, 'Shukuru', 'Kamanzi', 'staff1', '$2b$10$Lil4XgAmepByfHTXqHandOG77frX2gbWEw7ax436rvRilGUAZN0G6', 'staff', '2026-05-22 22:14:41'),
(2, 'manager', 'manager', 'manager', '$2b$10$CP8ToBrvsYex7cKVXdw4huVfsZitQHiZxMkmEwU.X4ryPL.fRJble', 'manager', '2026-05-23 11:20:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`);

--
-- Indexes for table `event_assignments`
--
ALTER TABLE `event_assignments`
  ADD PRIMARY KEY (`ea_id`),
  ADD UNIQUE KEY `uq_event_user` (`event_id`,`user_id`),
  ADD KEY `fk_ea_user` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`n_id`),
  ADD KEY `fk_notif_user` (`user_id`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`resource_id`),
  ADD UNIQUE KEY `resource_serialNumber` (`resource_serialNumber`);

--
-- Indexes for table `resource_assignments`
--
ALTER TABLE `resource_assignments`
  ADD PRIMARY KEY (`ra_id`),
  ADD KEY `fk_ra_resource` (`resource_id`),
  ADD KEY `fk_ra_event` (`event_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `fk_task_event` (`event_id`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`ta_id`),
  ADD UNIQUE KEY `uq_task_user` (`task_id`,`user_id`),
  ADD KEY `fk_ta_user` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`t_id`),
  ADD KEY `fk_txn_event` (`event_id`),
  ADD KEY `fk_txn_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `booking_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_assignments`
--
ALTER TABLE `event_assignments`
  MODIFY `ea_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `n_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `resource_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `resource_assignments`
--
ALTER TABLE `resource_assignments`
  MODIFY `ra_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `task_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `ta_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `t_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`);

--
-- Constraints for table `event_assignments`
--
ALTER TABLE `event_assignments`
  ADD CONSTRAINT `fk_ea_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ea_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `resource_assignments`
--
ALTER TABLE `resource_assignments`
  ADD CONSTRAINT `fk_ra_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ra_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`resource_id`) ON UPDATE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `fk_ta_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ta_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_txn_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_txn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
