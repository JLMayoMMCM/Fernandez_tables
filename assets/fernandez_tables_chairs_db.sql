-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 03, 2025 at 06:38 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fernandez_tables_chairs_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `person_tbl`
--

CREATE TABLE `person_tbl` (
  `person_id` int(8) NOT NULL,
  `first_Name` varchar(255) NOT NULL,
  `last_Name` varchar(255) NOT NULL,
  `middle_Name` varchar(255) DEFAULT NULL,
  `phone_Number` varchar(15) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `person_tbl`
--

INSERT INTO `person_tbl` (`person_id`, `first_Name`, `last_Name`, `middle_Name`, `phone_Number`, `age`, `gender_ID`) VALUES
(10000001, 'Jonathan Lance', 'Mayo', 'S', '09123456789', 25, 901),
(10000002, 'Joshua Roberts', 'Sabuero', 'C', '09123456789', 25, 901),
(10000003, 'Mayrell', 'Olarte', 'D', '09123456789', 25, 902),
(10000004, 'Jenica', 'Lopez', 'E', '09123456789', 25, 902),
(10000005, 'Alex', 'Smith', 'F', '09123456789', 25, 901),
(10000006, 'Taylor', 'Johnson', 'G', '09123456789', 25, 901),
(10000007, 'Morgan', 'Brown', 'H', '09123456789', 25, 901),
(10000008, 'Jordan', 'Davis', 'I', '09123456789', 25, 901),
(10000009, 'wqer', 'zxcv', 'sadf', '124332', 21, 901),
(10000010, 'wqer', 'zxcv', 'sadf', '124332', 21, 901);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `person_tbl`
--
ALTER TABLE `person_tbl`
  ADD PRIMARY KEY (`person_id`),
  ADD KEY `gender_ID` (`gender_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `person_tbl`
--
ALTER TABLE `person_tbl`
  MODIFY `person_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000011;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `person_tbl`
--
ALTER TABLE `person_tbl`
  ADD CONSTRAINT `person_tbl_ibfk_2` FOREIGN KEY (`gender_ID`) REFERENCES `gender_tbl` (`gender_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
