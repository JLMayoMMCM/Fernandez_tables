--delete all data except for staff


DELETE FROM order_details_tbl;
ALTER TABLE order_details_tbl AUTO_INCREMENT = 40000001;

DELETE FROM assigned_worker_tbl;
ALTER TABLE assigned_worker_tbl AUTO_INCREMENT = 10000001;

DELETE FROM payment_tbl;
ALTER TABLE payment_tbl AUTO_INCREMENT = 30000001;

delete FROM liabilities_tbl;
ALTER TABLE liabilities_tbl AUTO_INCREMENT = 30000001;

DELETE FROM finance_tbl;
ALTER TABLE finance_tbl AUTO_INCREMENT = 30000001;

DELETE FROM event_info_tbl;
ALTER TABLE event_info_tbl AUTO_INCREMENT = 20000001;

DELETE FROM order_info_tbl;
ALTER TABLE order_info_tbl AUTO_INCREMENT = 20000001;

DELETE FROM customer_tbl;
ALTER TABLE customer_tbl AUTO_INCREMENT = 20000001;

delete FROM worker_tbl;
ALTER TABLE worker_tbl AUTO_INCREMENT = 10000001;

DELETE FROM staff_tbl WHERE staff_ID > 20000002;
ALTER TABLE staff_tbl AUTO_INCREMENT = 20000003;

DELETE FROM PERSON_tbl WHERE person_ID > 10000002;
ALTER TABLE person_tbl AUTO_INCREMENT = 10000003;

delete FROM supplier_tbl where supplier_id > 10000001;
ALTER TABLE supplier_tbl AUTO_INCREMENT = 10000002;

DELETE FROM item_stock_tbl;
ALTER TABLE item_stock_tbl AUTO_INCREMENT = 80000001;

UPDATE staff_tbl
SET staff_password = 'YXNkZmcxMjM0NQ==';
-- Password is 'asdfg12345' in bas64 encoding

INSERT INTO supplier_tbl (staff_id, supplier_source_name) VALUES
(20000007, 'Logistics Co'),
(20000008, 'Supplier Company 1');


ALTER TABLE payment_status_tbl AUTO_INCREMENT = 301;
INSERT INTO payment_status_tbl (payment_status_name) VALUES
('Paid'),
('Partial'),
('Pending'),
('Failed'),
('Cancelled');



        SELECT 
            l.finance_ID,
            l.liability_title, 
            i.item_name, 
            l.item_quantity, 
            l.liability_amount, 
            l.liability_description, 
            l.liability_date,
            l.manager_ID
        FROM liabilities_tbl l
        JOIN item_tbl i ON l.item_ID = i.item_ID
        WHERE l.finance_ID = 30000002
        ORDER BY l.liability_date DESC;