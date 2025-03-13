//TRUNCATE DATA INSIDE Tables
TRUNCATE TABLE payment_tbl;
TRUNCATE TABLE liabilities_tbl;
TRUNCATE TABLE finance_tbl;
TRUNCATE TABLE order_details_tbl;
TRUNCATE TABLE assigned_worker_tbl;
TRUNCATE TABLE event_info_tbl; 
TRUNCATE TABLE order_tbl; 
TRUNCATE TABLE customer_tbl; 
TRUNCATE TABLE worker_TBL; 
TRUNCATE TABLE person_TBL WHERE person_ID > 10000003;
TRUNCATE TABLE address_tbl
TRUNCATE TABLE item_stock_tbl;
TRUNCATE TABLE item_tbl;
TRUNCATE TABLE manager_tbl WHERE manager_ID > 30000002;
TRUNCATE TABLE supplier_tbl WHERE supplier_ID > 30000001;
TRUNCATE TABLE worker_tbl;
TRUNCATE TABLE staff_tbl WHERE staff_ID > 30000003;

ALTER TABLE address_TBL AUTO_INCREMENT = 10000001;
ALTER TABLE finance_TBL AUTO_INCREMENT = 60000001;
ALTER TABLE order_tbl AUTO_INCREMENT = 50000001;
ALTER TABLE person_tbl AUTO_INCREMENT = 10000004;
ALTER TABLE customer_TBL AUTO_INCREMENT = 20000001;
ALTER TABLE staff_TBL AUTO_INCREMENT = 30000004;
ALTER TABLE manager_TBL AUTO_INCREMENT = 30000002;
ALTER TABLE worker_TBL AUTO_INCREMENT = 30000001;
ALTER TABLE supplier_TBL AUTO_INCREMENT = 30000002;
ALTER TABLE item_TBL AUTO_INCREMENT = 40000001;
ALTER TABLE item_stock_TBL AUTO_INCREMENT = 40000001;






#Address_TBL
DROP TABLE IF EXISTS address_tbl;
CREATE TABLE address_tbl (
address_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
street_Name VARCHAR(32) NOT NULL,
barangay_Name VARCHAR(32) NOT NULL,
city_Name varChar(32));
ALTER TABLE address_TBL AUTO_INCREMENT = 10000001;

#Gender_TBL
DROP TABLE IF EXISTS gender_tbl;
CREATE TABLE gender_tbl (
gender_ID INT(3) PRIMARY KEY AUTO_INCREMENT,
gender_Name VARCHAR(16) NOT NULL
);
ALTER TABLE gender_tbl AUTO_INCREMENT = 101;

INSERT INTO gender_tbl (gender_Name) VALUES
('Male'),
('Female'),
('Others'),
('Prefer not to say');
#Person_TBL
DROP TABLE IF EXISTS person_TBL;
CREATE TABLE person_tbl (
person_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
first_Name VARCHAR(32) NOT NULL,
middle_Name VARCHAR(32),
last_Name VARCHAR(32) NOT NULL,
phone_Number INT(10) NOT NULL,
age INT(3) NOT NULL,
gender_ID INT(3) NOT NULL,
FOREIGN KEY (gender_ID) REFERENCES gender_tbl(gender_ID)
);
ALTER TABLE person_TBL AUTO_INCREMENT = 10000001;

INSERT INTO person_tbl (first_Name, middle_Name, last_Name, phone_Number, age, gender_ID) VALUES
('Jonathan Lance', 'Segura', 'Mayo', 9998887777, 21, 101),
('Joshua Robert', 'C', 'Sabuero', 1112223333, 21, 101),
('Mayrell', 'D', 'Olarte', 2224446666, 21, 102);

#Customer_TBL
DROP TABLE IF EXISTS customer_tbl;
CREATE TABLE customer_tbl (
customer_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
person_ID INT(8) NOT NULL,
FOREIGN KEY (person_ID) REFERENCES person_tbl(person_ID)
);
ALTER TABLE customer_TBL AUTO_INCREMENT = 20000001;

#Staff_TBL
DROP TABLE IF EXISTS staff_tbl;
CREATE TABLE staff_tbl (
staff_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
person_ID INT(8) NOT NULL,
staff_password VARCHAR(32) NOT NULL,
FOREIGN KEY (person_ID) REFERENCES person_tbl(person_ID)
);
ALTER TABLE staff_TBL AUTO_INCREMENT = 30000001;

INSERT INTO staff_tbl (person_ID, staff_password) VALUES
(10000001, '$2b$10$EDcPKsiVqDjUo3kkpVkbwO2kHsb9Qx5XQWI0Ny5dT5v9eayQ7KKKS'),
(10000002, '$2b$10$EDcPKsiVqDjUo3kkpVkbwO2kHsb9Qx5XQWI0Ny5dT5v9eayQ7KKKS'),
(10000003, '$2b$10$EDcPKsiVqDjUo3kkpVkbwO2kHsb9Qx5XQWI0Ny5dT5v9eayQ7KKKS');

#Manager_TBL
DROP TABLE IF EXISTS manager_tbl;
CREATE TABLE manager_tbl (
manager_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
staff_ID INT(8) NOT NULL,
FOREIGN KEY (staff_ID) REFERENCES staff_tbl(staff_ID)
);
ALTER TABLE manager_TBL AUTO_INCREMENT = 30000001;

INSERT INTO manager_tbl (staff_ID) VALUES
(30000001),
(30000002);

#worker_TBL
DROP TABLE IF EXISTS worker_tbl;
CREATE TABLE worker_tbl (
worker_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
staff_ID INT(8) NOT NULL,
manager_ID INT(8) NOT NULL,
FOREIGN KEY (staff_ID) REFERENCES staff_tbl(staff_ID),
FOREIGN KEY (manager_ID) REFERENCES manager_tbl(manager_ID)
);
ALTER TABLE worker_TBL AUTO_INCREMENT = 30000001;

#Supplier_TBL
DROP TABLE IF EXISTS supplier_tbl;
CREATE TABLE supplier_tbl (
supplier_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
staff_ID INT(8) NOT NULL,
manager_ID INT(8) NOT NULL,
supplier_Name VARCHAR(32) NOT NULL,
FOREIGN KEY (staff_ID) REFERENCES staff_tbl(staff_ID),
FOREIGN KEY (manager_ID) REFERENCES manager_tbl(manager_ID)
);
ALTER TABLE supplier_TBL AUTO_INCREMENT = 30000001;

INSERT INTO supplier_tbl (staff_id, manager_id, supplier_name) VALUES
(30000003, 30000001, 'Supply Co');

#Item_Type_TBL
DROP TABLE IF EXISTS item_type_tbl;
CREATE TABLE item_type_tbl (
item_type_ID INT(3) PRIMARY KEY AUTO_INCREMENT,
item_type_name VARCHAR(32) NOT NULL
);
ALTER TABLE item_type_TBL AUTO_INCREMENT = 201;

INSERT INTO item_type_tbl (item_type_name) VALUES
('Tables'),
('Chairs'),
('Others');

#Item_TBL
DROP TABLE IF EXISTS item_tbl;
CREATE TABLE item_tbl (
item_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
item_Name VARCHAR(32) NOT NULL,
item_type_ID INT(3) NOT NULL,
item_Price DECIMAL(10,2) NOT NULL,
item_description TEXT NOT NULL,
FOREIGN KEY (item_type_ID) REFERENCES item_type_tbl(item_type_ID)
);
ALTER TABLE item_TBL AUTO_INCREMENT = 40000001;

#Item_Stock_TBL
DROP TABLE IF EXISTS item_stock_tbl;
CREATE TABLE item_stock_tbl (
item_stock_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
item_ID INT(8) NOT NULL,
item_quantity INT(8) NOT NULL,
date_stocked TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
manager_ID INT(8) NOT NULL,
supplier_ID INT(8) NOT NULL,
FOREIGN KEY (supplier_ID) REFERENCES supplier_tbl(supplier_ID),
FOREIGN KEY (item_ID) REFERENCES item_tbl(item_ID),
FOREIGN KEY (manager_ID) REFERENCES manager_tbl(manager_ID)
);
ALTER TABLE item_stock_TBL AUTO_INCREMENT = 40000001;

#payment_type_TBL
DROP TABLE IF EXISTS payment_type_tbl;

CREATE TABLE payment_type_tbl (
payment_type_ID INT(3) PRIMARY KEY AUTO_INCREMENT,
payment_type VARCHAR(20) NOT NULL
);
ALTER TABLE payment_type_TBL AUTO_INCREMENT = 301;

INSERT INTO payment_type_tbl (payment_type) VALUES
('Cash'),
('Debit Card'),
('Credit Card'),
('Digital Bank'),
('Others');

#Payment_status_TBL

DROP TABLE IF EXISTS payment_status_tbl;
CREATE TABLE payment_status_tbl (
payment_status_ID INT(3) PRIMARY KEY AUTO_INCREMENT,
payment_status_name VARCHAR(32) NOT NULL
);
ALTER TABLE payment_status_TBL AUTO_INCREMENT = 301;

INSERT INTO payment_status_tbl (payment_status_name) VALUES
('Paid'),
('Partial'),
('Pending'),
('Refunded'),
('Cancelled');

#order_info_TBL
DROP TABLE IF EXISTS order_info_tbl;
CREATE TABLE order_info_tbl (
order_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
customer_ID INT(8) NOT NULL,
order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
manager_ID INT(8) NOT NULL,
FOREIGN KEY (customer_ID) REFERENCES customer_tbl(customer_ID),
FOREIGN KEY (manager_ID) REFERENCES manager_tbl(manager_ID)
);
ALTER TABLE order_info_TBL AUTO_INCREMENT = 50000001;

#event_info_TBL
DROP TABLE IF EXISTS event_info_tbl;
CREATE TABLE event_info_tbl (
order_ID INT(8) NOT NULL,
event_name VARCHAR(32) NOT NULL,
address_ID INT(8) NOT NULL,
event_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
end_event_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (order_ID) REFERENCES order_info_tbl(order_ID),
FOREIGN KEY (address_ID) REFERENCES address_tbl(address_ID)
);

#assigned_worker_TBL
DROP TABLE IF EXISTS assigned_worker_tbl;
CREATE TABLE assigned_worker_tbl (
order_ID INT(8) NOT NULL,
worker_ID INT(8) NOT NULL,
FOREIGN KEY (order_ID) REFERENCES order_info_tbl(order_ID),
FOREIGN KEY (worker_ID) REFERENCES worker_tbl(worker_ID)
);

#order_details_TBL
DROP TABLE IF EXISTS order_details_tbl;
CREATE TABLE order_details_tbl (
order_ID INT(8) NOT NULL,
item_ID INT(8) NOT NULL,
item_quantity INT(8) NOT NULL,
FOREIGN KEY (order_ID) REFERENCES order_info_tbl(order_ID),
FOREIGN KEY (item_ID) REFERENCES item_tbl(item_ID)
);

#finance_TBL
DROP TABLE IF EXISTS finance_tbl;

CREATE TABLE finance_tbl (
finance_ID INT(8) PRIMARY KEY AUTO_INCREMENT,
order_ID INT(8) NOT NULL UNIQUE,
extrea_fee DECIMAL(10,2) NOT NULL,
total_amount DECIMAL(10,2) NOT NULL,
payment_status_ID INT(3) NOT NULL,
FOREIGN KEY (order_ID) REFERENCES order_info_tbl(order_ID),
FOREIGN KEY (payment_status_ID) REFERENCES payment_status_tbl(payment_status_ID)
);
ALTER TABLE finance_TBL AUTO_INCREMENT = 60000001;

#liablities_TBL
DROP TABLE IF EXISTS liabilities_tbl;
CREATE TABLE liabilities_tbl (
finance_ID INT(8) NOT NULL,
liability_title VARCHAR(32) NOT NULL,
item_ID INT(8) NOT NULL,
item_quantity INT(8) NOT NULL,
liability_amount DECIMAL(10,2) NOT NULL,
liability_description TEXT NOT NULL,
liability_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
manager_ID INT(8) NOT NULL,
FOREIGN KEY (finance_ID) REFERENCES finance_tbl(finance_ID),
FOREIGN KEY (item_ID) REFERENCES item_tbl(item_ID),
FOREIGN KEY (manager_ID) REFERENCES manager_tbl(manager_ID)
);
#payment_TBL
DROP TABLE IF EXISTS payment_tbl;
CREATE TABLE payment_tbl (
finance_ID INT(8) NOT NULL,
payment_type_ID INT(3) NOT NULL,
payment_amount DECIMAL(10,2) NOT NULL,
payment_reference_no VARCHAR(32) NOT NULL DEFAULT '0000000000' ,
date_of_payment TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (finance_ID) REFERENCES finance_tbl(finance_ID),
FOREIGN KEY (payment_type_ID) REFERENCES payment_type_tbl(payment_type_ID)
);





