-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 03, 2025 at 05:15 PM
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
-- Table structure for table `address_tbl`
--

CREATE TABLE `address_tbl` (
  `address_ID` int(8) NOT NULL,
  `street_Name` varchar(32) NOT NULL,
  `barangay_Name` varchar(24) NOT NULL,
  `city_Name` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `address_tbl`
--

INSERT INTO `address_tbl` (`address_ID`, `street_Name`, `barangay_Name`, `city_Name`) VALUES
(20000002, 'qwerty', 'zxcvc', 'asdfg'),
(20000003, 'qwerty', 'zxcvc', 'asdfg'),
(20000004, '123', '456', '789'),
(20000005, '123', '456', '789'),
(20000006, '123', '456', '789'),
(20000007, '123', '456', '789'),
(20000008, '123', '456', '789'),
(20000026, 'Camia, Juna', 'Matina Crossing', 'Davao'),
(20000027, '123', '456', '789'),
(20000028, 'Acacia, Juna', 'Matina', 'Davao'),
(20000029, 'Camia', 'Matina', 'Davao'),
(20000030, 'Camia', 'Matina', 'Davao'),
(20000031, 'Camia', 'Matina', 'Davao'),
(20000032, 'abc', 'def', 'ghi'),
(20000033, 'Dao', 'Matina', 'Davao'),
(20000034, 'Camia', 'Juna Subdivision', 'Davao');

-- --------------------------------------------------------

--
-- Table structure for table `assigned_worker_tbl`
--

CREATE TABLE `assigned_worker_tbl` (
  `order_ID` int(8) NOT NULL,
  `worker_ID` int(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assigned_worker_tbl`
--

INSERT INTO `assigned_worker_tbl` (`order_ID`, `worker_ID`) VALUES
(10000001, 40000002);

-- --------------------------------------------------------

--
-- Table structure for table `customer_tbl`
--

CREATE TABLE `customer_tbl` (
  `customer_ID` int(8) NOT NULL,
  `person_ID` int(8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_tbl`
--

INSERT INTO `customer_tbl` (`customer_ID`, `person_ID`) VALUES
(10000001, 10000009);

-- --------------------------------------------------------

--
-- Table structure for table `event_info_tbl`
--

CREATE TABLE `event_info_tbl` (
  `event_ID` int(8) NOT NULL,
  `order_ID` int(11) NOT NULL,
  `event_Name` varchar(24) NOT NULL,
  `address_ID` int(8) NOT NULL,
  `event_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `end_event_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_info_tbl`
--

INSERT INTO `event_info_tbl` (`event_ID`, `order_ID`, `event_Name`, `address_ID`, `event_date`, `end_event_date`) VALUES
(10000001, 10000001, 'Party', 20000034, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `finance_tbl`
--

CREATE TABLE `finance_tbl` (
  `finance_ID` int(8) NOT NULL,
  `order_ID` int(8) NOT NULL,
  `extra_Fee` int(8) NOT NULL,
  `total_amount` int(8) NOT NULL,
  `payment_status_id` int(3) DEFAULT 301
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `finance_tbl`
--

INSERT INTO `finance_tbl` (`finance_ID`, `order_ID`, `extra_Fee`, `total_amount`, `payment_status_id`) VALUES
(10000001, 10000001, 1200, 4640, 301);

-- --------------------------------------------------------

--
-- Table structure for table `gender_tbl`
--

CREATE TABLE `gender_tbl` (
  `gender_ID` int(3) NOT NULL,
  `gender_Name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gender_tbl`
--

INSERT INTO `gender_tbl` (`gender_ID`, `gender_Name`) VALUES
(901, 'Male'),
(902, 'Female'),
(903, 'Non_Binary'),
(904, 'Others'),
(905, 'Prefer_Not_To_Say');

-- --------------------------------------------------------

--
-- Table structure for table `item_stock_tbl`
--

CREATE TABLE `item_stock_tbl` (
  `item_stock_ID` int(8) NOT NULL,
  `item_ID` int(8) NOT NULL,
  `item_quantity` int(11) NOT NULL,
  `date_stocked` timestamp NOT NULL DEFAULT current_timestamp(),
  `manager_ID` int(3) NOT NULL,
  `supplier_ID` int(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_stock_tbl`
--

INSERT INTO `item_stock_tbl` (`item_stock_ID`, `item_ID`, `item_quantity`, `date_stocked`, `manager_ID`, `supplier_ID`) VALUES
(90000001, 80000001, 12, '2025-03-02 13:05:09', 30000001, 50000002),
(90000002, 80000002, 20, '2025-03-02 13:05:09', 30000001, 50000002),
(90000003, 80000003, 16, '2025-03-02 13:05:09', 30000001, 50000002),
(90000004, 80000004, 4, '2025-03-02 13:05:09', 30000002, 50000002),
(90000005, 80000005, 4, '2025-03-02 13:05:09', 30000002, 50000002),
(90000006, 80000006, 4, '2025-03-02 13:05:09', 30000001, 50000002),
(90000007, 80000007, 200, '2025-03-02 13:05:09', 30000002, 50000002),
(90000008, 80000008, 120, '2025-03-02 13:05:09', 30000001, 50000002),
(90000009, 80000009, 160, '2025-03-02 13:05:09', 30000001, 50000002),
(90000010, 80000010, 80, '2025-03-02 13:05:09', 30000002, 50000002),
(90000011, 80000011, 60, '2025-03-02 13:05:09', 30000001, 50000002),
(90000012, 80000012, 40, '2025-03-02 13:05:09', 30000001, 50000002),
(90000013, 80000013, 40, '2025-03-02 13:05:09', 30000002, 50000002),
(90000014, 80000014, 40, '2025-03-02 13:05:09', 30000001, 50000002),
(90000015, 80000015, 8, '2025-03-02 13:05:09', 30000001, 50000002);

-- --------------------------------------------------------

--
-- Table structure for table `item_tbl`
--

CREATE TABLE `item_tbl` (
  `item_ID` int(8) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_type_ID` int(3) DEFAULT NULL,
  `item_price` decimal(10,2) NOT NULL,
  `item_description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_tbl`
--

INSERT INTO `item_tbl` (`item_ID`, `item_name`, `item_type_ID`, `item_price`, `item_description`) VALUES
(80000001, 'Rectangular Table', 401, 200.00, 'Long Table (can fit 8 chairs)'),
(80000002, 'Round Table', 401, 150.00, 'Round Table (can fit 6 chairs)'),
(80000003, 'Square Table', 401, 120.00, 'Square Table (can fit 4 chairs)'),
(80000004, 'Rectangular Table w/tablecloth', 401, 250.00, 'Long Table (can fit 8 chairs)'),
(80000005, 'Round Table w/tablecloth', 401, 200.00, 'Round Table (can fit 6 chairs)'),
(80000006, 'Square Table w/tablecloth', 401, 150.00, 'Square Table (can fit 4 chairs)'),
(80000007, 'Monoblock Chair', 402, 20.00, 'Plastic Chair (can fit 1 person)'),
(80000008, 'Wooden Chair', 402, 25.00, 'Wooden Chair (can fit 1 person)'),
(80000009, 'Metal Chair', 402, 25.00, 'Metal Chair (can fit 1 person)'),
(80000010, 'Monoblock Chair w/cover', 402, 30.00, 'Plastic Chair (can fit 1 person)'),
(80000011, 'Wooden Chair w/cover', 402, 35.00, 'Wooden Chair (can fit 1 person)'),
(80000012, 'Metal Chair w/cover', 402, 35.00, 'Metal Chair (can fit 1 person)'),
(80000013, 'flower vase', 403, 50.00, 'flower vase (can fit 1 flower)'),
(80000014, 'flower vase w/flowers', 403, 100.00, 'flower vase (can fit 1 flower)'),
(80000015, 'Lights', 403, 200.00, 'flower vase (can fit 1 flower)');

-- --------------------------------------------------------

--
-- Table structure for table `item_type_tbl`
--

CREATE TABLE `item_type_tbl` (
  `item_type_ID` int(3) NOT NULL,
  `item_type_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_type_tbl`
--

INSERT INTO `item_type_tbl` (`item_type_ID`, `item_type_name`) VALUES
(401, 'Tables'),
(402, 'Chairs'),
(403, 'Others');

-- --------------------------------------------------------

--
-- Table structure for table `manager_tbl`
--

CREATE TABLE `manager_tbl` (
  `manager_ID` int(4) NOT NULL,
  `staff_ID` int(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `manager_tbl`
--

INSERT INTO `manager_tbl` (`manager_ID`, `staff_ID`) VALUES
(30000001, 20000001),
(30000002, 20000002);

-- --------------------------------------------------------

--
-- Table structure for table `order_details_tbl`
--

CREATE TABLE `order_details_tbl` (
  `order_ID` int(8) NOT NULL,
  `item_ID` int(8) NOT NULL,
  `item_quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_details_tbl`
--

INSERT INTO `order_details_tbl` (`order_ID`, `item_ID`, `item_quantity`) VALUES
(10000003, 80000002, 15),
(10000003, 80000009, 12),
(10000003, 80000013, 12),
(10000004, 80000001, 3),
(10000004, 80000007, 24),
(10000004, 80000015, 2),
(10000005, 80000001, 12),
(10000005, 80000002, 6),
(10000005, 80000011, 12),
(10000005, 80000007, 96),
(10000005, 80000013, 12),
(10000005, 80000015, 4),
(10000001, 80000001, 12),
(10000001, 80000007, 12),
(10000001, 80000015, 4);

-- --------------------------------------------------------

--
-- Table structure for table `order_info_tbl`
--

CREATE TABLE `order_info_tbl` (
  `order_ID` int(8) NOT NULL,
  `customer_ID` int(8) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `manager_ID` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_info_tbl`
--

INSERT INTO `order_info_tbl` (`order_ID`, `customer_ID`, `order_date`, `manager_ID`) VALUES
(10000001, 10000001, '2025-03-03 14:30:30', 30000002);

-- --------------------------------------------------------

--
-- Table structure for table `payment_status_tbl`
--

CREATE TABLE `payment_status_tbl` (
  `payment_status_ID` int(3) NOT NULL,
  `payment_status_name` varchar(12) DEFAULT 'Not Paid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_status_tbl`
--

INSERT INTO `payment_status_tbl` (`payment_status_ID`, `payment_status_name`) VALUES
(301, 'Pending'),
(302, 'Paid'),
(303, 'Failed'),
(304, 'Refunded'),
(305, 'Others');

-- --------------------------------------------------------

--
-- Table structure for table `payment_tbl`
--

CREATE TABLE `payment_tbl` (
  `customer_ID` int(8) NOT NULL,
  `finance_ID` int(8) NOT NULL,
  `payment_type_ID` int(3) NOT NULL,
  `payment_Reference_No` varchar(50) DEFAULT NULL,
  `date_of_payment` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_type_tbl`
--

CREATE TABLE `payment_type_tbl` (
  `payment_type_ID` int(3) NOT NULL,
  `payment_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_type_tbl`
--

INSERT INTO `payment_type_tbl` (`payment_type_ID`, `payment_type`) VALUES
(201, 'Cash'),
(202, 'Credit Card'),
(203, 'Debit Card'),
(204, 'Mobile Payment'),
(205, 'Online Payment'),
(206, 'Others');

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
(10000009, 'Jonathan', 'May', 'S', '09205696575', 21, 901);

-- --------------------------------------------------------

--
-- Table structure for table `staff_tbl`
--

CREATE TABLE `staff_tbl` (
  `staff_id` int(8) NOT NULL,
  `staff_Password` varchar(16) NOT NULL,
  `person_ID` int(8) DEFAULT NULL,
  `date_hired` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_tbl`
--

INSERT INTO `staff_tbl` (`staff_id`, `staff_Password`, `person_ID`, `date_hired`) VALUES
(20000001, 'password', 10000001, '2025-03-02 12:29:13'),
(20000002, 'password', 10000002, '2025-03-02 12:29:13'),
(20000003, 'password', 10000003, '2025-03-02 12:29:13'),
(20000004, 'password', 10000004, '2025-03-02 12:29:13'),
(20000005, 'password', 10000005, '2025-03-02 12:29:13'),
(20000006, 'password', 10000006, '2025-03-02 12:29:13'),
(20000007, 'password', 10000007, '2025-03-02 12:29:13'),
(20000008, 'password', 10000008, '2025-03-02 12:29:13');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_tbl`
--

CREATE TABLE `supplier_tbl` (
  `supplier_ID` int(8) NOT NULL,
  `staff_ID` int(4) NOT NULL,
  `supplier_source_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier_tbl`
--

INSERT INTO `supplier_tbl` (`supplier_ID`, `staff_ID`, `supplier_source_name`) VALUES
(50000002, 20000003, 'Logistics Co');

-- --------------------------------------------------------

--
-- Table structure for table `worker_tbl`
--

CREATE TABLE `worker_tbl` (
  `worker_ID` int(4) NOT NULL,
  `staff_ID` int(4) DEFAULT NULL,
  `manager_ID` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `worker_tbl`
--

INSERT INTO `worker_tbl` (`worker_ID`, `staff_ID`, `manager_ID`) VALUES
(40000002, 20000004, NULL),
(40000003, 20000005, NULL),
(40000004, 20000006, NULL),
(40000005, 20000007, NULL),
(40000006, 20000008, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `address_tbl`
--
ALTER TABLE `address_tbl`
  ADD PRIMARY KEY (`address_ID`);

--
-- Indexes for table `assigned_worker_tbl`
--
ALTER TABLE `assigned_worker_tbl`
  ADD KEY `order_ID` (`order_ID`),
  ADD KEY `worker_ID` (`worker_ID`);

--
-- Indexes for table `customer_tbl`
--
ALTER TABLE `customer_tbl`
  ADD PRIMARY KEY (`customer_ID`),
  ADD KEY `person_ID` (`person_ID`);

--
-- Indexes for table `event_info_tbl`
--
ALTER TABLE `event_info_tbl`
  ADD PRIMARY KEY (`event_ID`),
  ADD KEY `address_ID` (`address_ID`),
  ADD KEY `fk_order_ID` (`order_ID`);

--
-- Indexes for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  ADD PRIMARY KEY (`finance_ID`),
  ADD UNIQUE KEY `order_ID` (`order_ID`),
  ADD KEY `payment_status_ID` (`payment_status_id`);

--
-- Indexes for table `gender_tbl`
--
ALTER TABLE `gender_tbl`
  ADD PRIMARY KEY (`gender_ID`);

--
-- Indexes for table `item_stock_tbl`
--
ALTER TABLE `item_stock_tbl`
  ADD PRIMARY KEY (`item_stock_ID`),
  ADD KEY `manager_ID` (`manager_ID`),
  ADD KEY `supplier_ID` (`supplier_ID`),
  ADD KEY `item_ID` (`item_ID`);

--
-- Indexes for table `item_tbl`
--
ALTER TABLE `item_tbl`
  ADD PRIMARY KEY (`item_ID`),
  ADD KEY `item_type_ID` (`item_type_ID`);

--
-- Indexes for table `item_type_tbl`
--
ALTER TABLE `item_type_tbl`
  ADD PRIMARY KEY (`item_type_ID`);

--
-- Indexes for table `manager_tbl`
--
ALTER TABLE `manager_tbl`
  ADD PRIMARY KEY (`manager_ID`),
  ADD KEY `staff_ID` (`staff_ID`);

--
-- Indexes for table `order_details_tbl`
--
ALTER TABLE `order_details_tbl`
  ADD KEY `item_ID` (`item_ID`);

--
-- Indexes for table `order_info_tbl`
--
ALTER TABLE `order_info_tbl`
  ADD PRIMARY KEY (`order_ID`),
  ADD KEY `customer_ID` (`customer_ID`),
  ADD KEY `manager_ID` (`manager_ID`);

--
-- Indexes for table `payment_status_tbl`
--
ALTER TABLE `payment_status_tbl`
  ADD PRIMARY KEY (`payment_status_ID`);

--
-- Indexes for table `payment_tbl`
--
ALTER TABLE `payment_tbl`
  ADD KEY `customer_ID` (`customer_ID`),
  ADD KEY `finance_ID` (`finance_ID`),
  ADD KEY `payment_type_ID` (`payment_type_ID`);

--
-- Indexes for table `payment_type_tbl`
--
ALTER TABLE `payment_type_tbl`
  ADD PRIMARY KEY (`payment_type_ID`);

--
-- Indexes for table `person_tbl`
--
ALTER TABLE `person_tbl`
  ADD PRIMARY KEY (`person_id`),
  ADD KEY `gender_ID` (`gender_ID`);

--
-- Indexes for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `unique_person_id` (`person_ID`);

--
-- Indexes for table `supplier_tbl`
--
ALTER TABLE `supplier_tbl`
  ADD PRIMARY KEY (`supplier_ID`),
  ADD KEY `staff_ID` (`staff_ID`);

--
-- Indexes for table `worker_tbl`
--
ALTER TABLE `worker_tbl`
  ADD PRIMARY KEY (`worker_ID`),
  ADD KEY `staff_ID` (`staff_ID`),
  ADD KEY `manager_ID` (`manager_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `address_tbl`
--
ALTER TABLE `address_tbl`
  MODIFY `address_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20000035;

--
-- AUTO_INCREMENT for table `customer_tbl`
--
ALTER TABLE `customer_tbl`
  MODIFY `customer_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000002;

--
-- AUTO_INCREMENT for table `event_info_tbl`
--
ALTER TABLE `event_info_tbl`
  MODIFY `event_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000002;

--
-- AUTO_INCREMENT for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  MODIFY `finance_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000002;

--
-- AUTO_INCREMENT for table `gender_tbl`
--
ALTER TABLE `gender_tbl`
  MODIFY `gender_ID` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=906;

--
-- AUTO_INCREMENT for table `item_stock_tbl`
--
ALTER TABLE `item_stock_tbl`
  MODIFY `item_stock_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90000016;

--
-- AUTO_INCREMENT for table `item_tbl`
--
ALTER TABLE `item_tbl`
  MODIFY `item_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80000016;

--
-- AUTO_INCREMENT for table `item_type_tbl`
--
ALTER TABLE `item_type_tbl`
  MODIFY `item_type_ID` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=404;

--
-- AUTO_INCREMENT for table `manager_tbl`
--
ALTER TABLE `manager_tbl`
  MODIFY `manager_ID` int(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30000003;

--
-- AUTO_INCREMENT for table `order_info_tbl`
--
ALTER TABLE `order_info_tbl`
  MODIFY `order_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000002;

--
-- AUTO_INCREMENT for table `payment_status_tbl`
--
ALTER TABLE `payment_status_tbl`
  MODIFY `payment_status_ID` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=306;

--
-- AUTO_INCREMENT for table `payment_type_tbl`
--
ALTER TABLE `payment_type_tbl`
  MODIFY `payment_type_ID` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=207;

--
-- AUTO_INCREMENT for table `person_tbl`
--
ALTER TABLE `person_tbl`
  MODIFY `person_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000010;

--
-- AUTO_INCREMENT for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  MODIFY `staff_id` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20000009;

--
-- AUTO_INCREMENT for table `supplier_tbl`
--
ALTER TABLE `supplier_tbl`
  MODIFY `supplier_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50000003;

--
-- AUTO_INCREMENT for table `worker_tbl`
--
ALTER TABLE `worker_tbl`
  MODIFY `worker_ID` int(4) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40000007;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assigned_worker_tbl`
--
ALTER TABLE `assigned_worker_tbl`
  ADD CONSTRAINT `assigned_worker_tbl_ibfk_1` FOREIGN KEY (`order_ID`) REFERENCES `order_info_tbl` (`order_ID`),
  ADD CONSTRAINT `assigned_worker_tbl_ibfk_2` FOREIGN KEY (`worker_ID`) REFERENCES `worker_tbl` (`worker_ID`);

--
-- Constraints for table `event_info_tbl`
--
ALTER TABLE `event_info_tbl`
  ADD CONSTRAINT `event_info_tbl_ibfk_1` FOREIGN KEY (`address_ID`) REFERENCES `address_tbl` (`address_ID`),
  ADD CONSTRAINT `fk_order_ID` FOREIGN KEY (`order_ID`) REFERENCES `order_info_tbl` (`order_ID`);

--
-- Constraints for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  ADD CONSTRAINT `finance_tbl_ibfk_1` FOREIGN KEY (`order_ID`) REFERENCES `order_info_tbl` (`order_ID`),
  ADD CONSTRAINT `finance_tbl_ibfk_2` FOREIGN KEY (`payment_status_id`) REFERENCES `payment_status_tbl` (`payment_status_ID`);

--
-- Constraints for table `item_stock_tbl`
--
ALTER TABLE `item_stock_tbl`
  ADD CONSTRAINT `item_stock_tbl_ibfk_1` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`),
  ADD CONSTRAINT `item_stock_tbl_ibfk_2` FOREIGN KEY (`supplier_ID`) REFERENCES `supplier_tbl` (`supplier_ID`),
  ADD CONSTRAINT `item_stock_tbl_ibfk_3` FOREIGN KEY (`item_ID`) REFERENCES `item_tbl` (`item_ID`);

--
-- Constraints for table `item_tbl`
--
ALTER TABLE `item_tbl`
  ADD CONSTRAINT `item_tbl_ibfk_1` FOREIGN KEY (`item_type_ID`) REFERENCES `item_type_tbl` (`item_type_ID`);

--
-- Constraints for table `manager_tbl`
--
ALTER TABLE `manager_tbl`
  ADD CONSTRAINT `manager_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_id`);

--
-- Constraints for table `order_details_tbl`
--
ALTER TABLE `order_details_tbl`
  ADD CONSTRAINT `order_details_tbl_ibfk_1` FOREIGN KEY (`item_ID`) REFERENCES `item_tbl` (`item_ID`);

--
-- Constraints for table `order_info_tbl`
--
ALTER TABLE `order_info_tbl`
  ADD CONSTRAINT `order_info_tbl_ibfk_2` FOREIGN KEY (`customer_ID`) REFERENCES `customer_tbl` (`customer_ID`),
  ADD CONSTRAINT `order_info_tbl_ibfk_4` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`);

--
-- Constraints for table `payment_tbl`
--
ALTER TABLE `payment_tbl`
  ADD CONSTRAINT `payment_tbl_ibfk_1` FOREIGN KEY (`customer_ID`) REFERENCES `customer_tbl` (`customer_ID`),
  ADD CONSTRAINT `payment_tbl_ibfk_2` FOREIGN KEY (`finance_ID`) REFERENCES `finance_tbl` (`finance_ID`),
  ADD CONSTRAINT `payment_tbl_ibfk_3` FOREIGN KEY (`payment_type_ID`) REFERENCES `payment_type_tbl` (`payment_type_ID`);

--
-- Constraints for table `person_tbl`
--
ALTER TABLE `person_tbl`
  ADD CONSTRAINT `person_tbl_ibfk_2` FOREIGN KEY (`gender_ID`) REFERENCES `gender_tbl` (`gender_ID`);

--
-- Constraints for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  ADD CONSTRAINT `staff_tbl_ibfk_1` FOREIGN KEY (`person_ID`) REFERENCES `person_tbl` (`person_id`);

--
-- Constraints for table `supplier_tbl`
--
ALTER TABLE `supplier_tbl`
  ADD CONSTRAINT `supplier_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_id`);

--
-- Constraints for table `worker_tbl`
--
ALTER TABLE `worker_tbl`
  ADD CONSTRAINT `worker_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_id`),
  ADD CONSTRAINT `worker_tbl_ibfk_2` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
