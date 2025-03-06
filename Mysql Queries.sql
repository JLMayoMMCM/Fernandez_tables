--delete all data except for staff
DELETE FROM customer_tbl;
ALTER TABLE customer_tbl AUTO_INCREMENT = 10000001;

DELETE FROM assigned_worker_tbl;
ALTER TABLE assigned_worker_tbl AUTO_INCREMENT = 10000001;

DELETE FROM event_info_tbl;
ALTER TABLE event_info_tbl AUTO_INCREMENT = 10000001;

DELETE FROM finance_tbl;
ALTER TABLE finance_tbl AUTO_INCREMENT = 10000001;

DELETE FROM order_info_tbl;
ALTER TABLE order_info_tbl AUTO_INCREMENT = 10000001;

DELETE FROM payment_tbl;
ALTER TABLE payment_tbl AUTO_INCREMENT = 10000001;

DELETE FROM PERSON_tbl WHERE person_ID > 10000008;
ALTER TABLE person_tbl AUTO_INCREMENT = 10000009;

DELETE FROM finance_tbl WHERE finance_ID > 10000000;
ALTER TABLE finance_tbl AUTO_INCREMENT = 10000001;

DELETE FROM customer_tbl;
ALTER TABLE customer_tbl AUTO_INCREMENT = 10000001;


--Drop all tables
DROP TABLE assigned_worker_tbl;
DROP TABLE customer_tbl;
DROP TABLE event_info_tbl;
DROP TABLE finance_tbl;
DROP TABLE item_stock_tbl;
DROP TABLE item_tbl;
DROP TABLE item_type_TBL;
DROP TABLE liability_tbl;


UPDATE staff_tbl
SET staff_password = 'WVhOa1ptYz0=';


CREATE TABLE liabilities_tbl (
    finance_ID INT(8) NOT NULL,
    liability_title VARCHAR(50) NOT NULL,
    item_ID INT(8) NOT NULL,
    item_quantity INT NOT NULL,
    liability_description VARCHAR(100) NOT NULL,
    liability_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    manager_ID INT NOT NULL,
    FOREIGN KEY (manager_ID) REFERENCES manager_tbl (manager_ID),
    FOREIGN KEY (item_ID) REFERENCES item_tbl (item_ID),
    FOREIGN KEY (finance_ID) REFERENCES finance_tbl (finance_ID)
);
