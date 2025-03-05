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
