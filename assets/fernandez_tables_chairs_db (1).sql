-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2025 at 09:18 AM
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
  `address_ID` int(11) NOT NULL,
  `street_Name` varchar(32) NOT NULL,
  `barangay_Name` varchar(24) NOT NULL,
  `city_Name` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `address_tbl`
--

INSERT INTO `address_tbl` (`address_ID`, `street_Name`, `barangay_Name`, `city_Name`) VALUES
(80000001, 'Camia street', 'Matina Crossing', 'Davao City'),
(80000002, 'Lanang street', 'Lanang', 'Davao City'),
(80000003, 'Mabini street', 'Poblacion', 'Davao City'),
(80000004, 'Rizal street', 'Poblacion', 'Davao City'),
(80000005, 'Roxas street', 'Poblacion', 'Davao City'),
(80000006, 'Dao street', 'Matina Crossing', 'Davao City');

-- --------------------------------------------------------

--
-- Table structure for table `assigned_worker_id`
--

CREATE TABLE `assigned_worker_id` (
  `order_ID` int(8) NOT NULL,
  `worker_ID` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_tbl`
--

CREATE TABLE `customer_tbl` (
  `customer_ID` int(11) NOT NULL,
  `person_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_info_tbl`
--

CREATE TABLE `event_info_tbl` (
  `event_ID` int(8) NOT NULL,
  `address_ID` int(8) NOT NULL,
  `customer_ID` int(8) NOT NULL,
  `event_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_tbl`
--

CREATE TABLE `finance_tbl` (
  `finance_ID` int(8) NOT NULL,
  `payment_status_ID` int(3) NOT NULL,
  `manager_ID` int(3) NOT NULL,
  `liabilities_ID` int(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gender_tbl`
--

CREATE TABLE `gender_tbl` (
  `gender_ID` int(11) NOT NULL,
  `gender_Name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gender_tbl`
--

INSERT INTO `gender_tbl` (`gender_ID`, `gender_Name`) VALUES
(101, 'Male'),
(102, 'Female'),
(103, 'Others');

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
(10000000, 10000000, 80, '2025-03-01 05:50:00', 101, 10000001),
(10000001, 10000001, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000002, 10000002, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000003, 10000003, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000004, 10000004, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000005, 10000005, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000006, 10000006, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000007, 10000007, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000008, 10000008, 100, '2025-03-01 05:50:40', 101, 10000001),
(10000009, 10000009, 100, '2025-03-01 05:50:40', 101, 10000001);

-- --------------------------------------------------------

--
-- Table structure for table `item_tbl`
--

CREATE TABLE `item_tbl` (
  `item_ID` int(8) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_price` decimal(10,2) NOT NULL,
  `item_description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_tbl`
--

INSERT INTO `item_tbl` (`item_ID`, `item_name`, `item_price`, `item_description`) VALUES
(10000000, 'square Table', 125.00, 'square portable table'),
(10000001, 'square Table w/ cloth', 150.00, 'square covered table'),
(10000002, 'Round Table', 150.00, 'round portable table'),
(10000003, 'Round Table w/ cloth', 175.00, 'round covered table'),
(10000004, 'Long Table', 200.00, 'long portable table'),
(10000005, 'Long Table w/ cloth', 200.00, 'long covered table'),
(10000006, 'Cocktail Table', 150.00, 'round covered cocktail table'),
(10000007, 'monoblock chairs', 50.00, 'basic monoblock chairs'),
(10000008, 'monoblock chairs w/ cloth', 75.00, 'covered monoblock chairs'),
(10000009, 'kid-size chairs', 40.00, 'kid size chairs');

-- --------------------------------------------------------

--
-- Table structure for table `liabilities_tbl`
--

CREATE TABLE `liabilities_tbl` (
  `liabilities_ID` int(8) NOT NULL,
  `item_ID` int(8) NOT NULL,
  `quantity` int(11) NOT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `manager_tbl`
--

CREATE TABLE `manager_tbl` (
  `manager_ID` int(11) NOT NULL,
  `staff_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `manager_tbl`
--

INSERT INTO `manager_tbl` (`manager_ID`, `staff_ID`) VALUES
(101, 1001);

-- --------------------------------------------------------

--
-- Table structure for table `order_details_tbl`
--

CREATE TABLE `order_details_tbl` (
  `order_ID` int(8) NOT NULL,
  `item_ID` int(8) NOT NULL,
  `item_quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_info_tbl`
--

CREATE TABLE `order_info_tbl` (
  `order_ID` int(8) NOT NULL,
  `address_ID` int(8) NOT NULL,
  `customer_ID` int(8) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL,
  `finance_ID` int(8) NOT NULL,
  `manager_ID` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_status_tbl`
--

CREATE TABLE `payment_status_tbl` (
  `payment_status_ID` int(3) NOT NULL,
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_tbl`
--

CREATE TABLE `payment_tbl` (
  `finance_ID` int(8) NOT NULL,
  `customer_ID` int(8) NOT NULL,
  `payment_type_ID` int(3) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_type_tbl`
--

CREATE TABLE `payment_type_tbl` (
  `payment_type_ID` int(3) NOT NULL,
  `payment_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `person_tbl`
--

CREATE TABLE `person_tbl` (
  `person_ID` int(11) NOT NULL,
  `first_Name` varchar(255) NOT NULL,
  `last_Name` varchar(255) NOT NULL,
  `middle_Name` varchar(255) DEFAULT NULL,
  `phone_Number` varchar(15) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `address_ID` int(11) DEFAULT NULL,
  `gender_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `person_tbl`
--

INSERT INTO `person_tbl` (`person_ID`, `first_Name`, `last_Name`, `middle_Name`, `phone_Number`, `age`, `address_ID`, `gender_ID`) VALUES
(10000001, 'Jonathan Lance', 'Mayo', 'Segura', '09205696575', 20, 80000001, 101),
(10000002, 'Jhon', 'Doe', 'Smith', '09205696575', 20, 80000002, 101),
(10000003, 'Jane', 'Doe', 'Smith', '09205696575', 20, 80000003, 102),
(10000004, 'Juan', 'Dela Cruz', 'Smith', '09205696575', 20, 80000004, 101),
(10000005, 'Pedro', 'Penduko', 'Smith', '09205696575', 20, 80000005, 101);

-- --------------------------------------------------------

--
-- Table structure for table `staff_tbl`
--

CREATE TABLE `staff_tbl` (
  `staff_ID` int(11) NOT NULL,
  `staff_Password` varchar(16) NOT NULL,
  `person_ID` int(11) DEFAULT NULL,
  `date_hired` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_tbl`
--

INSERT INTO `staff_tbl` (`staff_ID`, `staff_Password`, `person_ID`, `date_hired`) VALUES
(1001, 'Lance0516', 10000001, '2025-02-28 07:52:21'),
(1002, 'abcd1234', 10000002, '2025-02-28 08:04:04'),
(1003, '', 10000003, '2025-02-28 08:04:04'),
(1004, '', 10000004, '2025-02-28 08:04:04'),
(1005, '', 10000005, '2025-02-28 08:04:04');

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
(10000001, 1005, 'Logistics Co');

-- --------------------------------------------------------

--
-- Table structure for table `worker_tbl`
--

CREATE TABLE `worker_tbl` (
  `worker_ID` int(11) NOT NULL,
  `staff_ID` int(11) DEFAULT NULL,
  `manager_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `address_tbl`
--
ALTER TABLE `address_tbl`
  ADD PRIMARY KEY (`address_ID`);

--
-- Indexes for table `assigned_worker_id`
--
ALTER TABLE `assigned_worker_id`
  ADD PRIMARY KEY (`order_ID`);

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
  ADD KEY `customer_ID` (`customer_ID`);

--
-- Indexes for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  ADD PRIMARY KEY (`finance_ID`),
  ADD KEY `liabilities_ID` (`liabilities_ID`),
  ADD KEY `payment_status_ID` (`payment_status_ID`),
  ADD KEY `manager_ID` (`manager_ID`);

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
  ADD KEY `fk_item_id` (`item_ID`);

--
-- Indexes for table `item_tbl`
--
ALTER TABLE `item_tbl`
  ADD PRIMARY KEY (`item_ID`);

--
-- Indexes for table `liabilities_tbl`
--
ALTER TABLE `liabilities_tbl`
  ADD PRIMARY KEY (`liabilities_ID`),
  ADD KEY `item_ID` (`item_ID`);

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
  ADD KEY `address_ID` (`address_ID`),
  ADD KEY `customer_ID` (`customer_ID`),
  ADD KEY `finance_ID` (`finance_ID`),
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
  ADD PRIMARY KEY (`finance_ID`),
  ADD KEY `customer_ID` (`customer_ID`),
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
  ADD PRIMARY KEY (`person_ID`),
  ADD KEY `address_ID` (`address_ID`),
  ADD KEY `gender_ID` (`gender_ID`);

--
-- Indexes for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  ADD PRIMARY KEY (`staff_ID`),
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
  MODIFY `address_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80000007;

--
-- AUTO_INCREMENT for table `assigned_worker_id`
--
ALTER TABLE `assigned_worker_id`
  MODIFY `order_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000001;

--
-- AUTO_INCREMENT for table `customer_tbl`
--
ALTER TABLE `customer_tbl`
  MODIFY `customer_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_info_tbl`
--
ALTER TABLE `event_info_tbl`
  MODIFY `event_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000001;

--
-- AUTO_INCREMENT for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  MODIFY `finance_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000001;

--
-- AUTO_INCREMENT for table `gender_tbl`
--
ALTER TABLE `gender_tbl`
  MODIFY `gender_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `item_stock_tbl`
--
ALTER TABLE `item_stock_tbl`
  MODIFY `item_stock_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000010;

--
-- AUTO_INCREMENT for table `item_tbl`
--
ALTER TABLE `item_tbl`
  MODIFY `item_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000010;

--
-- AUTO_INCREMENT for table `liabilities_tbl`
--
ALTER TABLE `liabilities_tbl`
  MODIFY `liabilities_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000001;

--
-- AUTO_INCREMENT for table `manager_tbl`
--
ALTER TABLE `manager_tbl`
  MODIFY `manager_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- AUTO_INCREMENT for table `order_info_tbl`
--
ALTER TABLE `order_info_tbl`
  MODIFY `order_ID` int(8) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_status_tbl`
--
ALTER TABLE `payment_status_tbl`
  MODIFY `payment_status_ID` int(3) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_tbl`
--
ALTER TABLE `payment_tbl`
  MODIFY `finance_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000001;

--
-- AUTO_INCREMENT for table `payment_type_tbl`
--
ALTER TABLE `payment_type_tbl`
  MODIFY `payment_type_ID` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `person_tbl`
--
ALTER TABLE `person_tbl`
  MODIFY `person_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000006;

--
-- AUTO_INCREMENT for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  MODIFY `staff_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1008;

--
-- AUTO_INCREMENT for table `supplier_tbl`
--
ALTER TABLE `supplier_tbl`
  MODIFY `supplier_ID` int(8) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000002;

--
-- AUTO_INCREMENT for table `worker_tbl`
--
ALTER TABLE `worker_tbl`
  MODIFY `worker_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customer_tbl`
--
ALTER TABLE `customer_tbl`
  ADD CONSTRAINT `customer_tbl_ibfk_1` FOREIGN KEY (`person_ID`) REFERENCES `person_tbl` (`person_ID`);

--
-- Constraints for table `event_info_tbl`
--
ALTER TABLE `event_info_tbl`
  ADD CONSTRAINT `event_info_tbl_ibfk_1` FOREIGN KEY (`address_ID`) REFERENCES `address_tbl` (`address_ID`),
  ADD CONSTRAINT `event_info_tbl_ibfk_2` FOREIGN KEY (`customer_ID`) REFERENCES `customer_tbl` (`customer_ID`);

--
-- Constraints for table `finance_tbl`
--
ALTER TABLE `finance_tbl`
  ADD CONSTRAINT `finance_tbl_ibfk_1` FOREIGN KEY (`liabilities_ID`) REFERENCES `liabilities_tbl` (`liabilities_ID`),
  ADD CONSTRAINT `finance_tbl_ibfk_3` FOREIGN KEY (`payment_status_ID`) REFERENCES `payment_status_tbl` (`payment_status_ID`),
  ADD CONSTRAINT `finance_tbl_ibfk_4` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`);

--
-- Constraints for table `item_stock_tbl`
--
ALTER TABLE `item_stock_tbl`
  ADD CONSTRAINT `fk_item_id` FOREIGN KEY (`item_stock_ID`) REFERENCES `item_tbl` (`item_ID`),
  ADD CONSTRAINT `item_stock_tbl_ibfk_1` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`),
  ADD CONSTRAINT `item_stock_tbl_ibfk_2` FOREIGN KEY (`supplier_ID`) REFERENCES `supplier_tbl` (`supplier_ID`);

--
-- Constraints for table `liabilities_tbl`
--
ALTER TABLE `liabilities_tbl`
  ADD CONSTRAINT `liabilities_tbl_ibfk_1` FOREIGN KEY (`item_ID`) REFERENCES `item_tbl` (`item_ID`);

--
-- Constraints for table `manager_tbl`
--
ALTER TABLE `manager_tbl`
  ADD CONSTRAINT `manager_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_ID`);

--
-- Constraints for table `order_details_tbl`
--
ALTER TABLE `order_details_tbl`
  ADD CONSTRAINT `order_details_tbl_ibfk_1` FOREIGN KEY (`item_ID`) REFERENCES `item_tbl` (`item_ID`);

--
-- Constraints for table `order_info_tbl`
--
ALTER TABLE `order_info_tbl`
  ADD CONSTRAINT `order_info_tbl_ibfk_1` FOREIGN KEY (`address_ID`) REFERENCES `address_tbl` (`address_ID`),
  ADD CONSTRAINT `order_info_tbl_ibfk_2` FOREIGN KEY (`customer_ID`) REFERENCES `customer_tbl` (`customer_ID`),
  ADD CONSTRAINT `order_info_tbl_ibfk_3` FOREIGN KEY (`finance_ID`) REFERENCES `finance_tbl` (`finance_ID`),
  ADD CONSTRAINT `order_info_tbl_ibfk_4` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`);

--
-- Constraints for table `payment_tbl`
--
ALTER TABLE `payment_tbl`
  ADD CONSTRAINT `payment_tbl_ibfk_1` FOREIGN KEY (`customer_ID`) REFERENCES `customer_tbl` (`customer_ID`),
  ADD CONSTRAINT `payment_tbl_ibfk_2` FOREIGN KEY (`payment_type_ID`) REFERENCES `payment_type_tbl` (`payment_type_ID`);

--
-- Constraints for table `person_tbl`
--
ALTER TABLE `person_tbl`
  ADD CONSTRAINT `person_tbl_ibfk_1` FOREIGN KEY (`address_ID`) REFERENCES `address_tbl` (`address_ID`),
  ADD CONSTRAINT `person_tbl_ibfk_2` FOREIGN KEY (`gender_ID`) REFERENCES `gender_tbl` (`gender_ID`);

--
-- Constraints for table `staff_tbl`
--
ALTER TABLE `staff_tbl`
  ADD CONSTRAINT `staff_tbl_ibfk_1` FOREIGN KEY (`person_ID`) REFERENCES `person_tbl` (`person_ID`);

--
-- Constraints for table `supplier_tbl`
--
ALTER TABLE `supplier_tbl`
  ADD CONSTRAINT `supplier_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_ID`);

--
-- Constraints for table `worker_tbl`
--
ALTER TABLE `worker_tbl`
  ADD CONSTRAINT `worker_tbl_ibfk_1` FOREIGN KEY (`staff_ID`) REFERENCES `staff_tbl` (`staff_ID`),
  ADD CONSTRAINT `worker_tbl_ibfk_2` FOREIGN KEY (`manager_ID`) REFERENCES `manager_tbl` (`manager_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
