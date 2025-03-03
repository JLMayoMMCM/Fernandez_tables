--Gender Initialization

ALTER TABLE gender_tbl AUTO_INCREMENT = 901;

INSERT INTO gender_tbl (gender_Name) VALUES
("Male"),
("Female"),
("Non_Binary"),
( "Others"),
("Prefer_Not_To_Say");

ALTER TABLE payment_type_tbl AUTO_INCREMENT = 201;

INSERT INTO payment_type_tbl (payment_type) VALUES
("Cash"),
("Credit Card"),
("Debit Card"),
("Mobile Payment"),
("Online Payment"),
("Others");

ALTER TABLE payment_status_tbl AUTO_INCREMENT = 301;

INSERT INTO payment_status_tbl (payment_status_name) VALUES
("Pending"),
("Paid"),
("Failed"),
("Refunded"),
("Others");

ALTER TABLE item_type_tbl AUTO_INCREMENT = 401;

INSERT INTO item_type_tbl (item_type_name) VALUES
("Tables"),
("Chairs"),
("Others");

ALTER TABLE person_tbl AUTO_INCREMENT = 10000001;

INSERT INTO person_tbl (first_Name, last_Name, middle_Name, phone_number, age, gender_ID) VALUES
("Jonathan Lance", "Mayo", "S", "09123456789", 25, 901),
("Joshua Roberts", "Sabuero", "C", "09123456789", 25, 901),
("Mayrell", "Olarte", "D", "09123456789", 25, 902),
("Jenica", "Lopez", "E", "09123456789", 25, 902),
("Alex", "Smith", "F", "09123456789", 25, 901),
("Taylor", "Johnson", "G", "09123456789", 25, 901),
("Morgan", "Brown", "H", "09123456789", 25, 901),
("Jordan", "Davis", "I", "09123456789", 25, 901);

ALTER TABLE staff_TBL AUTO_INCREMENT = 20000001;

INSERT INTO staff_TBL (staff_password, person_ID, date_hired) VALUES
("password", 10000001, CURRENT_TIMESTAMP),
("password", 10000002, CURRENT_TIMESTAMP),
("password", 10000003, CURRENT_TIMESTAMP),
("password", 10000004, CURRENT_TIMESTAMP),
("password", 10000005, CURRENT_TIMESTAMP),
("password", 10000006, CURRENT_TIMESTAMP),
("password", 10000007, CURRENT_TIMESTAMP),
("password", 10000008, CURRENT_TIMESTAMP);

ALTER TABLE manager_tbl AUTO_INCREMENT = 30000001;

INSERT INTO manager_tbl (staff_ID) VALUES
(20000001),
(20000002);

ALTER TABLE worker_tbl AUTO_INCREMENT = 40000001;

INSERT INTO worker_tbl (staff_ID) VALUES
(20000003),
(20000004),
(20000005),
(20000006),
(20000007),
(20000008);

ALTER TABLE supplier_tbl AUTO_INCREMENT = 50000001;

INSERT INTO supplier_tbl (staff_ID, supplier_source_name) VALUES
(20000003, "Logistics Co");

ALTER TABLE customer_tbl AUTO_INCREMENT = 60000001;

ALTER TABLE item_tbl AUTO_INCREMENT = 80000001;

INSERT INTO item_tbl (item_name, item_price, item_type_ID, item_description) VALUES
("Rectangular Table", 200, 401, "Long Table (can fit 8 chairs)"),
("Round Table", 150, 401, "Round Table (can fit 6 chairs)"),
("Square Table", 120, 401, "Square Table (can fit 4 chairs)"),
("Rectangular Table w/tablecloth", 250, 401, "Long Table (can fit 8 chairs)"),
("Round Table w/tablecloth", 200, 401, "Round Table (can fit 6 chairs)"),
("Square Table w/tablecloth", 150, 401, "Square Table (can fit 4 chairs)"),
("Monoblock Chair", 20, 402, "Plastic Chair (can fit 1 person)"),
("Wooden Chair", 25, 402, "Wooden Chair (can fit 1 person)"),
("Metal Chair", 25, 402, "Metal Chair (can fit 1 person)"),
("Monoblock Chair w/cover", 30, 402, "Plastic Chair (can fit 1 person)"),
("Wooden Chair w/cover", 35, 402, "Wooden Chair (can fit 1 person)"),
("Metal Chair w/cover", 35, 402, "Metal Chair (can fit 1 person)"),
("flower vase", 50, 403, "flower vase (can fit 1 flower)"),
("flower vase w/flowers", 100, 403, "flower vase (can fit 1 flower)"),
("Lights", 200, 403, "flower vase (can fit 1 flower)");

ALTER TABLE item_stock_tbl AUTO_INCREMENT = 90000001;

INSERT INTO item_stock_tbl (item_ID, item_quantity, manager_ID, supplier_ID) VALUES
(80000001, 12, 30000001, 50000002),
(80000002, 20, 30000001, 50000002),
(80000003, 16, 30000001, 50000002),
(80000004, 4, 30000002, 50000002),
(80000005, 4, 30000002, 50000002),
(80000006, 4, 30000001, 50000002),
(80000007, 200, 30000002, 50000002),
(80000008, 120, 30000001, 50000002),
(80000009, 160, 30000001, 50000002),
(80000010, 80, 30000002, 50000002),
(80000011, 60, 30000001, 50000002),
(80000012, 40, 30000001, 50000002),
(80000013, 40, 30000002, 50000002),
(80000014, 40, 30000001, 50000002),
(80000015, 8, 30000001, 50000002);

ALTER table event_info_tbl AUTO_INCREMENT = 70000001;

ALTER TABLE event_info_tbl ADD order_ID INT NOT NULL AFTER event_ID;

ALTER TABLE event_info_tbl ADD CONSTRAINT FOREIGN KEY (order_ID) REFERENCES order_tbl(order_ID);