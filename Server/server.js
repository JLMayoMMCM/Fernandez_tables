// ------------------ SERVER-SIDE JAVASCRIPT ------------------ //
//DOCUMENTATION BY: JONATHAN LANCE MAYO

// ------------------ NODE MODULES ------------------ //
//IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// CREATE EXPRESS APP
const app = express();
const port = 4000;

// MIDDLEWARE FOR STATIC FILES
app.use(express.static(path.join(__dirname, "../")));

// MIDDLEWARE FOR BODY PARSER
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MIDDLEWARE FOR SESSION 
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// CONNECTION TO MYSQL DATABASE
const db = mysql.createConnection({
    host: 'fernandezdb.clskew0myhmb.ap-southeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'JLM12345',
    database: 'fernandez_tables_chairs_db',
    multipleStatements: true
});

// CONNECT TO DATABASE
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});


// LOGIN USER AND SET SESSION VARIABLES
app.post('/login', (req, res) => {
    const { userID, staffPassword } = req.body;

    console.log (staffPassword);
    const query = `
        SELECT s.staff_id, s.staff_password, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS fullName
        FROM staff_tbl s
        JOIN person_tbl p ON s.person_ID = p.person_id
        WHERE s.staff_id = ?
    `;
    
    db.query(query, [userID], (err, results) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        
        if (results.length > 0) {
            const storedPassword = results[0].staff_password;
            console.log('Stored password:', storedPassword);
            bcrypt.compare(staffPassword, storedPassword, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).json({ success: false, message: 'Internal server error' });
                }
                
                if (isMatch) {
                    req.session.userID = userID;
                    req.session.userName = results[0].fullName;
                    console.log('Login successful');
                    res.json({ success: true, redirectUrl: '/dashboard' });
                } else {
                    console.log('Invalid login credentials');
                    res.json({ success: false, message: 'Invalid credentials' });
                }
            });
        } else {
            console.log('Invalid login credentials');
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});


// CHECK SESSION STATUS
app.get('/checkSession', (req, res) => {
    if (req.session.userID) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// LOGOUT ENDPOINT
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error during logout' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ success: true, message: 'Logged out successfully' });
    });
});




// --------------------------------- DASHBOARD --------------------------------- //

// GETS USER'S NAME AND ID FROM SESSION AND UPDATES DASHBOARD USERNAME
app.get('/getCurrentUser', (req, res) => {
    if (req.session.userID) {

        const query = `
            SELECT s.staff_id, 
            CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS fullName
            FROM staff_tbl s
            JOIN person_tbl p ON s.person_ID = p.person_id
            WHERE s.staff_id = ?
        `;
        
        db.query(query, [req.session.userID], (err, results) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.json({ 
                    loggedIn: true, 
                    userID: req.session.userID,
                    userName: 'User'
                });
            }
            
            if (results.length > 0) {
                res.json({ 
                    loggedIn: true, 
                    userID: req.session.userID,
                    userName: results[0].fullName || 'User'
                });
            } else {
                res.json({ 
                    loggedIn: true, 
                    userID: req.session.userID,
                    userName: 'User'
                });
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// RETRIEVES ITEMS, WORKERS, MANAGERS, AND GENDER AND POPULATES THE DROPDOWNS AND TABLES
app.get('/getItemsAndWorkers', (req, res) => {
    const itemsQuery = `
        SELECT 
            i.item_ID AS id, 
            i.item_name, 
            i.item_price, 
            COALESCE(SUM(s.item_quantity), 0) AS item_quantity, 
            t.item_type_name,
            i.item_type_ID
        FROM item_tbl i
        JOIN item_type_tbl t ON i.item_type_ID = t.item_type_ID
        LEFT JOIN item_stock_tbl s ON i.item_ID = s.item_ID
        GROUP BY i.item_ID, i.item_name, i.item_price, t.item_type_name, i.item_type_ID
    `;
    const workersQuery = `
        SELECT w.worker_ID, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS worker_name
        FROM worker_tbl w
        JOIN staff_tbl s ON w.staff_ID = s.staff_id
        JOIN person_tbl p ON s.person_ID = p.person_id
    `;
    const managersQuery = `
        SELECT m.manager_ID AS id, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS name
        FROM manager_tbl m
        JOIN staff_tbl s ON m.staff_ID = s.staff_id
        JOIN person_tbl p ON s.person_ID = p.person_id
    `;
    const gendersQuery = `
        SELECT gender_ID AS id, gender_Name AS name
        FROM gender_tbl
    `;
    const suppliersQuery = `
        SELECT supplier_ID as id, supplier_name as name 
        FROM supplier_tbl
    `;
    const selectorQuery = `
        SELECT item_id as id, item_name AS name
        FROM item_tbl
    `;
    // MULTIPLE QUERIES
    db.query(`${itemsQuery}; ${workersQuery}; ${managersQuery}; ${gendersQuery}; ${suppliersQuery}; ${selectorQuery}`, (err, results) => {
        if (err) throw err;
        const [items, workers, managers, genders, suppliers, selector] = results;
        const sortedItems = {
            tables: items.filter(item => item.item_type_name === 'Tables'),
            chairs: items.filter(item => item.item_type_name === 'Chairs'),
            miscellaneous: items.filter(item => item.item_type_name === 'Others')
        };
        res.json({ items: sortedItems, workers, managers, genders, suppliers, selector});
    });
});

// ADD ORDERS TO DATABASE
app.post('/addOrder', (req, res) => {
    const {
        event_name, event_timestamp, event_duration, assigned_manager,
        street, barangay, city, first_name, middle_name, last_name, phone_number,
        age, gender, extra_fees, items, workers
    } = req.body;

    db.beginTransaction(err => {
        if (err) throw err;

        const addressQuery = 'INSERT INTO address_tbl (street_Name, barangay_Name, city_Name) VALUES (?, ?, ?)';
        db.query(addressQuery, [street, barangay, city], (err, addressResult) => {
            if (err) return db.rollback(() => { throw err; });

            const addressId = addressResult.insertId;

            const personQuery = 'INSERT INTO person_tbl (first_Name, last_Name, middle_Name, phone_Number, age, gender_ID) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(personQuery, [first_name, last_name, middle_name, phone_number, age, gender], (err, personResult) => {
                if (err) return db.rollback(() => { throw err; });

                const personId = personResult.insertId;

                const customerQuery = 'INSERT INTO customer_tbl (person_ID) VALUES (?)';
                db.query(customerQuery, [personId], (err, customerResult) => {
                    if (err) return db.rollback(() => { throw err; });

                    const customerId = customerResult.insertId;

                    const orderQuery = 'INSERT INTO order_info_tbl (customer_ID, manager_ID) VALUES (?, ?)';
                    db.query(orderQuery, [customerId, assigned_manager], (err, orderResult) => {
                        if (err) return db.rollback(() => { throw err; });

                        const orderId = orderResult.insertId;

                        const orderDetailsQuery = 'INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES ?';
                        const orderDetailsValues = items.map(item => [orderId, item.item_id, item.quantity]);
                        db.query(orderDetailsQuery, [orderDetailsValues], (err) => {
                            if (err) return db.rollback(() => { throw err; });

                            const assignedWorkersQuery = 'INSERT INTO assigned_worker_tbl (order_ID, worker_ID) VALUES ?';
                            const assignedWorkersValues = workers.map(workerId => [orderId, workerId]);
                            db.query(assignedWorkersQuery, [assignedWorkersValues], (err) => {
                                if (err) return db.rollback(() => { throw err; });

                                const financeQuery = 'INSERT INTO finance_tbl (order_ID, extra_Fee, total_amount) VALUES (?, ?, ?)';
                                const subtotalPrice = items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * (parseFloat(event_duration) || 1);
                                const totalPrice = subtotalPrice + parseFloat(extra_fees);
                                db.query(financeQuery, [orderId, extra_fees, totalPrice], (err) => {
                                    if (err) return db.rollback(() => { throw err; });



                                    const eventQuery = 'INSERT INTO event_info_tbl (order_ID, event_Name, address_ID, event_date, end_event_date) VALUES (?, ?, ?, ?, ?)';
                                    const endEventDate = new Date(new Date(event_timestamp).getTime() + (event_duration * 24 * 60 * 60 * 1000));
                                    db.query(eventQuery, [orderId, event_name, addressId, event_timestamp, endEventDate], (err) => {
                                        if (err) return db.rollback(() => { throw err; });

                                        db.commit(err => {
                                            if (err) return db.rollback(() => { throw err; });
                                            res.json({ success: true });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// RETRIEVES ALL ORDERS FROM DATABASE FOR THE ACTIVE ORDER TABLE
app.get('/getActiveOrders', (req, res) => {
    const query = `
        SELECT o.order_ID, e.event_Name, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS customer_name,
                     ps.payment_status_name AS order_status, 
                     DATE_FORMAT(e.event_date, '%Y-%m-%d %h:%i %p') AS event_date, 
                     DATE_FORMAT(e.end_event_date, '%Y-%m-%d %h:%i %p') AS end_event_date, 
                     CONCAT(pm.first_Name, ' ', pm.middle_Name, ' ', pm.last_Name) AS manager_name, 
                     (f.total_amount + IFNULL(l.total_liabilities, 0)) AS total_amount
        FROM order_info_tbl o
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        JOIN customer_tbl c ON o.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_id
        JOIN finance_tbl f ON o.order_ID = f.order_ID
        JOIN payment_status_tbl ps ON f.payment_status_id = ps.payment_status_ID
        JOIN manager_tbl m ON o.manager_ID = m.manager_ID
        JOIN staff_tbl s ON m.staff_ID = s.staff_id
        JOIN person_tbl pm ON s.person_ID = pm.person_id
        LEFT JOIN (
            SELECT finance_ID, SUM(liability_amount) AS total_liabilities
            FROM liabilities_tbl
            GROUP BY finance_ID
        ) l ON f.finance_ID = l.finance_ID
        WHERE e.end_event_date >= NOW() AND (f.payment_status_id = 301 OR f.payment_status_id = 302)
    `;

    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// RETRIEVES ALL ORDERS FROM DATABASE FOR THE ORDER HISTORY TABLE
app.get('/getOrderHistory', (req, res) => {
    const query = `
        SELECT o.order_ID, e.event_Name, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS customer_name,
                     ps.payment_status_name AS order_status, 
                     DATE_FORMAT(e.event_date, '%Y-%m-%d %h:%i %p') AS event_date, 
                     DATE_FORMAT(e.end_event_date, '%Y-%m-%d %h:%i %p') AS end_event_date, 
                     CONCAT(pm.first_Name, ' ', pm.middle_Name, ' ', pm.last_Name) AS manager_name, f.total_amount,
                     CONCAT(a.street_Name, ', ', a.barangay_Name, ', ', a.city_Name) AS address
        FROM order_info_tbl o
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        JOIN customer_tbl c ON o.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_id
        JOIN finance_tbl f ON o.order_ID = f.order_ID
        JOIN payment_status_tbl ps ON f.payment_status_id = ps.payment_status_ID
        JOIN manager_tbl m ON o.manager_ID = m.manager_ID
        JOIN staff_tbl s ON m.staff_ID = s.staff_id
        JOIN person_tbl pm ON s.person_ID = pm.person_id
        JOIN address_tbl a ON e.address_ID = a.address_ID
        ORDER BY o.order_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching order history:', err);
            return res.status(500).send({ error: 'Failed to fetch order history' });
        }
        res.json(results);
    });
});





// DELETES ORDER AND ALL RELATED RECORDS
app.delete('/deleteOrder/:orderId', (req, res) => {
    const { orderId } = req.params;
    db.beginTransaction(err => {
        if (err) throw err;
        // Get IDs of related records
        const getIdsQuery = `
            SELECT e.address_ID, c.person_ID, c.customer_ID
            FROM order_info_tbl o
            JOIN event_info_tbl e ON o.order_ID = e.order_ID
            JOIN customer_tbl c ON o.customer_ID = c.customer_ID
            WHERE o.order_ID = ?
        `;

        db.query(getIdsQuery, [orderId], (err, idResults) => {
            if (err) return db.rollback(() => { throw err; });
            
            if (idResults.length === 0) {
                return db.rollback(() => res.status(404).json({ success: false, message: 'Order not found' }));
            }

            const { address_ID, person_ID, customer_ID } = idResults[0];

            const deleteQueries = [
                'DELETE FROM order_details_tbl WHERE order_ID = ?',
                'DELETE FROM payment_tbl WHERE finance_ID IN (SELECT finance_ID FROM finance_tbl WHERE order_ID = ?)',
                'DELETE FROM finance_tbl WHERE order_ID = ?',
                'DELETE FROM assigned_worker_tbl WHERE order_ID = ?',
                'DELETE FROM event_info_tbl WHERE order_ID = ?',
                'DELETE FROM order_info_tbl WHERE order_ID = ?',
                'DELETE FROM customer_tbl WHERE customer_ID = ?',
                'DELETE FROM address_tbl WHERE address_ID = ?',
                'DELETE FROM person_tbl WHERE person_ID = ?'
            ];

            let queryIndex = 0;

            function executeQuery() {
                if (queryIndex < deleteQueries.length) {
                    db.query(deleteQueries[queryIndex], [orderId], (err) => {
                        if (err) return db.rollback(() => { throw err; });
                        queryIndex++;
                        executeQuery();
                    });
                } else {
                    db.commit(err => {
                        if (err) return db.rollback(() => { throw err; });
                        res.json({ success: true, message: 'Order and all related records deleted successfully' });
                    });
                }
            }

            executeQuery();
        });
    });
});

// RETRIEVES ORDER DETAILS FOR MODIFICATION
app.post('/modifyOrder', (req, res) => {
    const {
        order_ID, event_name, event_timestamp, event_duration, assigned_manager,
        street, barangay, city, first_name, middle_name, last_name, phone_number,
        age, gender, extra_fees, items, workers
    } = req.body;

    db.beginTransaction(err => {
        if (err) throw err;
        
        const fetchQuery = `
            SELECT e.address_ID, o.customer_ID 
            FROM order_info_tbl o 
            JOIN event_info_tbl e ON o.order_ID = e.order_ID 
            WHERE o.order_ID = ?
        `;
        db.query(fetchQuery, [order_ID], (err, results) => {
            if (err) return db.rollback(() => { throw err; });
            if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
            
            const address_ID = results[0].address_ID;
            const customer_ID = results[0].customer_ID;
            
            const updateAddress = 'UPDATE address_tbl SET street_Name = ?, barangay_Name = ?, city_Name = ? WHERE address_ID = ?';
            db.query(updateAddress, [street, barangay, city, address_ID], (err) => {
                if (err) return db.rollback(() => { throw err; });
                
                const fetchPersonQuery = 'SELECT person_ID FROM customer_tbl WHERE customer_ID = ?';
                db.query(fetchPersonQuery, [customer_ID], (err, personResults) => {
                    if (err) return db.rollback(() => { throw err; });
                    if (personResults.length === 0) return res.status(404).json({ error: 'Customer not found' });
                    
                    const person_ID = personResults[0].person_ID;
                    const updatePerson = 'UPDATE person_tbl SET first_Name = ?, middle_Name = ?, last_Name = ?, phone_Number = ?, age = ?, gender_ID = ? WHERE person_id = ?';
                    db.query(updatePerson, [first_name, middle_name, last_name, phone_number, age, gender, person_ID], (err) => {
                        if (err) return db.rollback(() => { throw err; });
                        
                        const updateOrderInfo = 'UPDATE order_info_tbl SET manager_ID = ? WHERE order_ID = ?';
                        db.query(updateOrderInfo, [assigned_manager, order_ID], (err) => {
                            if (err) return db.rollback(() => { throw err; });
                            
                            const endEventDate = new Date(new Date(event_timestamp).getTime() + (event_duration * 24 * 60 * 60 * 1000));
                            const updateEvent = 'UPDATE event_info_tbl SET event_Name = ?, event_date = ?, end_event_date = ? WHERE order_ID = ?';
                            db.query(updateEvent, [event_name, event_timestamp, endEventDate, order_ID], (err) => {
                                if (err) return db.rollback(() => { throw err; });
                                
                                const subtotalPrice = items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * (parseFloat(event_duration) || 1);
                                const totalPrice = subtotalPrice + parseFloat(extra_fees);
                                const updateFinance = 'UPDATE finance_tbl SET extra_Fee = ?, total_amount = ? WHERE order_ID = ?';
                                db.query(updateFinance, [extra_fees, totalPrice, order_ID], (err) => {
                                    if (err) return db.rollback(() => { throw err; });
                                    
                                    const deleteOrderDetails = 'DELETE FROM order_details_tbl WHERE order_ID = ?';
                                    db.query(deleteOrderDetails, [order_ID], (err) => {
                                        if (err) return db.rollback(() => { throw err; });
                                        
                                        if (items.length > 0) {
                                            const orderDetailsQuery = 'INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES ?';
                                            const orderDetailsValues = items.map(item => [order_ID, item.item_id, item.quantity]);
                                            db.query(orderDetailsQuery, [orderDetailsValues], (err) => {
                                                if (err) return db.rollback(() => { throw err; });
                                                
                                                const deleteWorkers = 'DELETE FROM assigned_worker_tbl WHERE order_ID = ?';
                                                db.query(deleteWorkers, [order_ID], (err) => {
                                                    if (err) return db.rollback(() => { throw err; });
                                                    
                                                    if (workers.length > 0) {
                                                        const insertWorkers = 'INSERT INTO assigned_worker_tbl (order_ID, worker_ID) VALUES ?';
                                                        const workerValues = workers.map(workerId => [order_ID, workerId]);
                                                        db.query(insertWorkers, [workerValues], (err) => {
                                                            if (err) return db.rollback(() => { throw err; });
                                                            db.commit(err => {
                                                                if (err) return db.rollback(() => { throw err; });
                                                                res.json({ success: true });
                                                            });
                                                        });
                                                    } else {
                                                        db.commit(err => {
                                                            if (err) return db.rollback(() => { throw err; });
                                                            res.json({ success: true });
                                                        });
                                                    }
                                                });
                                            });
                                        } else {
                                            res.status(400).json({ error: 'No items provided' });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// CHANGES STATUS ID TO CANCELLED
app.put('/cancelOrder/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    
    const updateQuery = `
        UPDATE finance_tbl
        SET payment_status_id = 305
        WHERE order_ID = ?
    `;
    
    db.query(updateQuery, [orderId], (err, result) => {
        if (err) {
            console.error('Error cancelling order:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, message: 'Order cancelled successfully' });
    });
});

// RETRIEVES STOCK INFO FOR DISPLAY
app.get('/getInventoryItems', (req, res) => {
    const query = `
        SELECT i.item_ID, i.item_name, i.item_description, t.item_type_name AS item_type, 
                     i.item_price, SUM(s.item_quantity) AS total_stock
        FROM item_tbl i
        JOIN item_type_tbl t ON i.item_type_ID = t.item_type_ID
        LEFT JOIN item_stock_tbl s ON i.item_ID = s.item_ID
        GROUP BY i.item_ID
        ORDER BY i.item_ID
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching inventory items:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json(results);
    });
});

// DELETE ITEM FROM ORDER DETAILS, ITEM STOCK, AND ITEM TABLES
app.delete('/deleteItem/:itemId', (req, res) => {
    const { itemId } = req.params;
    
    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        const checkOrdersQuery = `
            SELECT COUNT(*) AS count FROM order_details_tbl od
            JOIN order_info_tbl o ON od.order_ID = o.order_ID
            JOIN event_info_tbl e ON o.order_ID = e.order_ID
            JOIN finance_tbl f ON o.order_ID = f.order_ID
            WHERE od.item_ID = ? 
            AND e.end_event_date >= NOW() 
            AND f.payment_status_id IN (301, 302)
        `;
        
        db.query(checkOrdersQuery, [itemId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error checking active orders:', err);
                    res.status(500).json({ success: false, message: err.message });
                });
            }
            
            if (results[0].count > 0) {
                return db.rollback(() => {
                    res.status(400).json({ 
                        success: false, 
                        message: 'Cannot delete item: it is used in active orders' 
                    });
                });
            }
            
            const deleteOrderDetailsQuery = 'DELETE FROM order_details_tbl WHERE item_ID = ?';
            db.query(deleteOrderDetailsQuery, [itemId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting from order_details_tbl:', err);
                        res.status(500).json({ success: false, message: err.message });
                    });
                }

                const deleteStockQuery = 'DELETE FROM item_stock_tbl WHERE item_ID = ?';
                db.query(deleteStockQuery, [itemId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error deleting from item_stock_tbl:', err);
                            res.status(500).json({ success: false, message: err.message });
                        });
                    }
                    
                    const deleteItemQuery = 'DELETE FROM item_tbl WHERE item_ID = ?';
                    db.query(deleteItemQuery, [itemId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error deleting from item_tbl:', err);
                                res.status(500).json({ success: false, message: err.message });
                            });
                        }
                        
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error committing transaction:', err);
                                    res.status(500).json({ success: false, message: err.message });
                                });
                            }
                            
                            res.json({ success: true, message: 'Item deleted successfully' });
                        });
                    });
                });
            });
        });
    });
});
// REMOVES STOCK FROM THE ITEM STOCK TABLE
app.delete('/deleteStock/:stockId', (req, res) => {
    const { stockId } = req.params;
    
    const query = 'DELETE FROM item_stock_tbl WHERE item_stock_ID = ?';
    
    db.query(query, [stockId], (err, result) => {
        if (err) {
            console.error('Error deleting stock:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Stock entry not found' });
        }
        
        res.json({ success: true, message: 'Stock entry deleted successfully' });
    });
});

// GET ITEM TYPES FOR DROPDOWN
app.get('/getItemTypes', (req, res) => {
    const query = 'SELECT item_type_ID AS id, item_type_name AS name FROM item_type_tbl';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching item types:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        res.json(results);
    });
});

// ADDS AN ITEM TO THE ITEM TABLE
app.post('/addItem', (req, res) => {
    const { name, description, price, itemType } = req.body;
    
    if (!name || !price || !itemType) {
        return res.status(400).json({ success: false, message: 'Name, price, and item type are required' });
    }
        
    // Corrected the query to have 4 placeholders.
    const query = 'INSERT INTO item_tbl (item_name, item_description, item_type_ID, item_price) VALUES (?, ?, ?, ?)';
    
    db.query(query, [name, description || '', itemType, price], (err, result) => {
        if (err) {
            console.error('Error adding item:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        res.json({ 
            success: true, 
            message: 'Item added successfully', 
            itemId: result.insertId 
        });
    });
});



// ADDS STOCK TO THE ITEM STOCK TABLE
app.post('/addStock', (req, res) => {
    const { itemId, quantity, managerId, supplierId } = req.body;
    
    if (!itemId || !quantity || !managerId || !supplierId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Item ID, quantity, manager ID, and supplier ID are required' 
        });
    }
    
    const parsedItemId = parseInt(itemId, 10);
    if (isNaN(parsedItemId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid Item ID' 
        });
    }
    
    const query = `
        INSERT INTO item_stock_tbl (item_ID, item_quantity, manager_ID, supplier_ID, date_stocked) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    db.query(query, [parsedItemId, quantity, managerId, supplierId], (err, result) => {
        if (err) {
            console.error('Error adding stock:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        res.json({ 
            success: true, 
            message: 'Stock added successfully', 
            stockId: result.insertId 
        });
    });
});

                

// RETRIEVES WORKERS WITH ORDER_ID = SELECTED ROW
app.get('/getStaffInfo', (req, res) => {
    const query = `
SELECT 
        s.staff_id, 
        CONCAT(p.first_Name, ' ', IFNULL(p.middle_Name, ''), ' ', p.last_Name) AS worker_name,
        p.age,
        p.phone_Number,
        w.worker_ID
        FROM worker_tbl w
        JOIN staff_tbl s ON w.staff_ID = s.staff_id
        JOIN person_tbl p ON s.person_ID = p.person_id
        ORDER BY s.staff_id
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching staff information:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        console.log('Staff info results:', results);
        res.json(results);
    });
});

// REMOVES A WORKER AND ALL RELATED RECORDS
app.delete('/fireWorker/:workerId', (req, res) => {
    const workerId = req.params.workerId;

    db.beginTransaction(err => {
        if (err) throw err;

        const getIdsQuery = `
            SELECT s.staff_id, s.person_ID
            FROM worker_tbl w
            JOIN staff_tbl s ON w.staff_ID = s.staff_id
            WHERE w.worker_ID = ?
        `;

        db.query(getIdsQuery, [workerId], (err, idResults) => {
            if (err) return db.rollback(() => { throw err; });
            
            if (idResults.length === 0) {
                return db.rollback(() => res.status(404).json({ success: false, message: 'Worker not found' }));
            }

            const { staff_id, person_ID } = idResults[0];

            const deleteAssignedWorkersQuery = 'DELETE FROM assigned_worker_tbl WHERE worker_ID = ?';
            db.query(deleteAssignedWorkersQuery, [workerId], (err) => {
                if (err) return db.rollback(() => { throw err; });

                const deleteWorkerQuery = 'DELETE FROM worker_tbl WHERE worker_ID = ?';
                db.query(deleteWorkerQuery, [workerId], (err) => {
                    if (err) return db.rollback(() => { throw err; });

                    const deleteStaffQuery = 'DELETE FROM staff_tbl WHERE staff_id = ?';
                    db.query(deleteStaffQuery, [staff_id], (err) => {
                        if (err) return db.rollback(() => { throw err; });

                        const deletePersonQuery = 'DELETE FROM person_tbl WHERE person_id = ?';
                        db.query(deletePersonQuery, [person_ID], (err) => {
                            if (err) return db.rollback(() => { throw err; });

                            db.commit(err => {
                                if (err) return db.rollback(() => { throw err; });
                                res.json({ success: true, message: 'Worker and all related records deleted successfully' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// RETRIEVES ASSIGNED WORKERS FOR A SPECIFIC ORDER
app.get('/getAssignedOrders/:workerId', (req, res) => {
    const workerId = req.params.workerId;
    
    const query = `
        SELECT 
            o.order_ID, 
            e.event_Name, 
            e.event_date, 
            e.end_event_date
        FROM assigned_worker_tbl aw
        JOIN order_info_tbl o ON aw.order_ID = o.order_ID
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        WHERE aw.worker_ID = ? 
        AND e.end_event_date > NOW()
        ORDER BY e.event_date DESC

    `;
    
    db.query(query, [workerId], (err, results) => {
        if (err) {
            console.error('Error fetching assigned orders:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json(results);
    });
});

// ADDS WORKS IN THE ADD WORKER STAFF INFO
app.post('/addWorker', (req, res) => {
	const { first_name, middle_name, last_name, phone_number, age, gender, manager_id, password } = req.body;

	const personQuery = `
		INSERT INTO person_tbl (first_Name, middle_Name, last_Name, phone_Number, age, gender_ID)
		VALUES (?, ?, ?, ?, ?, ?)
	`;
	db.query(personQuery, [first_name, middle_name, last_name, phone_number, age, gender], (err, personResult) => {
		if (err) {
		console.error('Error adding person:', err);
		return res.json({ success: false, message: 'Error adding person' });
		}
		const personId = personResult.insertId;

		const passwordToUse = password || 'password';
		const encryptedPassword = bcrypt.hashSync(passwordToUse, 12);
		
		const staffQuery = 'INSERT INTO staff_tbl (staff_password, person_ID) VALUES (?, ?)';
		db.query(staffQuery, [encryptedPassword, personId], (err, staffResult) => {
		if (err) {
			console.error('Error adding staff:', err);
			return res.json({ success: false, message: 'Error adding staff' });
		}
		const staffId = staffResult.insertId;

		const workerQuery = 'INSERT INTO worker_tbl (staff_ID, manager_ID) VALUES (?, ?)';
		db.query(workerQuery, [staffId, manager_id], (err, workerResult) => {
			if (err) {
			console.error('Error adding worker:', err);
			return res.json({ success: false, message: 'Error adding worker' });
			}
			res.json({ success: true, message: 'Worker added successfully' });
		});
	});
});
});
// Get assigned workers for an order
app.get('/getOrderWorkers/:orderId', (req, res) => {
    const { orderId } = req.params;
    
    const query = `
        SELECT w.worker_ID, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS worker_name
        FROM assigned_worker_tbl aw
        JOIN worker_tbl w ON aw.worker_ID = w.worker_ID
        JOIN staff_tbl s ON w.staff_ID = s.staff_id
        JOIN person_tbl p ON s.person_ID = p.person_id
        WHERE aw.order_ID = ?
        ORDER BY worker_name
    `;
    
    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order workers:', err);
            return res.status(500).json({ error: 'Failed to fetch order workers' });
        }
        res.json(results);
    });
});

//RETREIVES ALL PAYMENT ORDERS THAT ARE EITHER ACTIVE, PARTIAL, OR PENDING
app.get('/getPaymentOrders', (req, res) => {
    const query = `
        SELECT 
            f.finance_ID, 
            o.order_ID, 
            CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS customer_name,
            DATE_FORMAT(e.event_date, '%Y-%m-%d %h:%i %p') AS event_date,
            DATE_FORMAT(e.end_event_date, '%Y-%m-%d %h:%i %p') AS end_event_date,
            od.item_subtotal AS item_subtotal,
            f.extra_Fee AS extra_fees,
            IFNULL(l.total_liabilities, 0) AS liabilities,
            (f.extra_Fee + IFNULL(l.total_liabilities, 0) + od.item_subtotal) AS total_amount,
            ((f.extra_Fee + IFNULL(l.total_liabilities, 0) + od.item_subtotal)
            - IFNULL(pmt.total_payment, 0)) AS balance,
            f.payment_status_id,
            ps.payment_status_name AS status,
            '' AS actions
        FROM finance_tbl f
        JOIN order_info_tbl o ON f.order_ID = o.order_ID
        JOIN customer_tbl c ON o.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_id
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        JOIN payment_status_tbl ps ON f.payment_status_id = ps.payment_status_ID
        JOIN (
            SELECT od.order_ID, 
                   SUM(od.item_quantity * i.item_price * DATEDIFF(e.end_event_date, e.event_date)) AS item_subtotal
            FROM order_details_tbl od
            JOIN item_tbl i ON od.item_ID = i.item_ID
            JOIN event_info_tbl e ON od.order_ID = e.order_ID
            GROUP BY od.order_ID
        ) od ON o.order_ID = od.order_ID
        LEFT JOIN (
            SELECT finance_ID, SUM(payment_amount) AS total_payment
            FROM payment_tbl
            GROUP BY finance_ID
        ) pmt ON f.finance_ID = pmt.finance_ID
        LEFT JOIN (
            SELECT finance_ID, SUM(liability_amount) AS total_liabilities
            FROM liabilities_tbl
            GROUP BY finance_ID
        ) l ON f.finance_ID = l.finance_ID
        WHERE f.payment_status_id IN (301, 302, 303, 304)
        ORDER BY f.finance_ID DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching payment orders:', err);
            res.status(500).json({ error: 'Failed to fetch payment orders' });
        } else {
            res.json(results);
        }
    });
});

// GETS PAYMENT TYPES FOR DROPDOWN
app.get('/getPaymentTypes', (req, res) => {
    const query = 'SELECT payment_type_ID AS id, payment_type AS name FROM payment_type_tbl';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching payment types:', err);
            return res.status(500).json({ error: 'Failed to fetch payment types' });
        }
        res.json(results);
    });
});

// GETS ORDER ITEMS FOR LIABILITY
app.get('/getOrderItemsForLiability/:orderId', (req, res) => {
    const { orderId } = req.params;
    
    const query = `
        SELECT 
            od.item_ID, 
            i.item_name, 
            od.item_quantity as total_quantity,
            od.item_quantity - COALESCE(
                (SELECT SUM(l.item_quantity) 
                FROM liabilities_tbl l 
                JOIN finance_tbl f ON l.finance_ID = f.finance_ID
                WHERE l.item_ID = od.item_ID 
                AND f.order_ID = ?), 
                0
            ) as available_quantity
        FROM order_details_tbl od
        JOIN item_tbl i ON od.item_ID = i.item_ID
        WHERE od.order_ID = ?
        HAVING available_quantity > 0
    `;
    
    db.query(query, [orderId, orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order items for liability:', err);
            return res.status(500).json({ error: 'Failed to fetch order items' });
        }
        res.json(results);
    });
});

// GETS FINANCE INFO FOR SELECTED ORDER
app.get('/getTransactions/:financeId', (req, res) => {
    const { financeId } = req.params;
    

    const transactionsQuery = `
        SELECT 
            p.finance_ID,
            pt.payment_type AS payment_type, 
            p.payment_amount, 
            p.payment_reference_no, 
            p.date_of_payment
        FROM payment_tbl p
        JOIN payment_type_tbl pt ON p.payment_type_ID = pt.payment_type_ID
        WHERE p.finance_ID = ?
        ORDER BY p.date_of_payment DESC
    `;
    
    const balanceQuery = `
        SELECT f.total_amount,
               (f.total_amount - IFNULL((SELECT SUM(payment_amount) 
                                       FROM payment_tbl 
                                       WHERE finance_ID = f.finance_ID), 0) +
                IFNULL((SELECT SUM(liability_amount) 
                       FROM liabilities_tbl 
                       WHERE order_ID = f.order_ID), 0)) AS balance
        FROM finance_tbl f
        WHERE f.finance_ID = ?
    `;
    
    db.query(transactionsQuery, [financeId], (err, transactions) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            return res.status(500).json({ error: 'Failed to fetch transactions' });
        }
        
        db.query(balanceQuery, [financeId], (err, balanceResult) => {
            if (err) {
                console.error('Error calculating balance:', err);
                return res.status(500).json({ error: 'Failed to calculate balance' });
            }
            
            res.json({
                transactions,
                balance: balanceResult.length > 0 ? balanceResult[0].balance : 0
            });
        });
    });
});

// LOADS LIABILITIES FOR SELECTED FINANCE ID ROW
app.get('/getLiabilities/:financeId', (req, res) => {
    const { financeId } = req.params;
    
    const query = `
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
        WHERE l.finance_ID = ?
        ORDER BY l.liability_date DESC
    `;
    
    db.query(query, [financeId], (err, results) => {
        if (err) {
            console.error('Error fetching liabilities by finance ID:', err);
            return res.status(500).json({ error: 'Failed to fetch liabilities' });
        }
        res.json(results);
    });
});

// ADDS A TRANSACTION TO THE PAYMENT TABLE ATTACHED TO SELECTED FINANCE ID
app.post('/addTransaction', (req, res) => {
    const { financeId, paymentTypeId, paymentAmount, referenceNumber } = req.body;
    
    if (!financeId || !paymentTypeId || !paymentAmount) {
        return res.status(400).json({ 
            success: false, 
            message: 'Finance ID, payment type, and payment amount are required' 
        });
    }
    
    const query = `
        INSERT INTO payment_tbl 
            (finance_ID, payment_type_ID, payment_amount, payment_reference_No, date_of_payment) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    db.query(query, [financeId, paymentTypeId, paymentAmount, referenceNumber || null], (err, result) => {
        if (err) {
            console.error('Error adding transaction:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        const updateStatusQuery = `
            UPDATE finance_tbl f
            SET f.payment_status_id = 
                CASE 
                    WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) < 0 
                    THEN 304
                    WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) = 0 
                    THEN 301
                    WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) > 0 
                    AND (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) < f.total_amount
                    THEN 302
                    ELSE 303
                END
            WHERE f.finance_ID = ?
        `;
        
        db.query(updateStatusQuery, [financeId], (err) => {
            if (err) {
                console.error('Error updating payment status:', err);
            }
            
            res.json({ 
                success: true, 
                message: 'Transaction added successfully', 
                paymentId: result.insertId 
            });
        });
    });
});

// ADDS A LIABILITY TO THE LIABILITIES TABLE ATTACHED TO SELECTED FINANCE ID
app.post('/addLiability', (req, res) => {
    const { 
        financeId, title, itemId, quantity, amount, description, date, managerId 
    } = req.body;
    
    if (!financeId || !title || !itemId || !quantity || !amount || !description || !date || !managerId) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required including manager ID' 
        });
    }

    // First check available quantity
    const checkQuantityQuery = `
        SELECT 
            od.item_quantity as total_quantity,
            od.item_quantity - COALESCE(
                (SELECT SUM(l.item_quantity) 
                FROM liabilities_tbl l 
                WHERE l.item_ID = od.item_ID 
                AND l.finance_ID = f.finance_ID), 
                0
            ) as available_quantity
        FROM order_details_tbl od
        JOIN finance_tbl f ON od.order_ID = f.order_ID
        WHERE f.finance_ID = ? AND od.item_ID = ?
    `;

    db.query(checkQuantityQuery, [financeId, itemId], (err, quantityResults) => {
        if (err) {
            console.error('Error checking available quantity:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        if (quantityResults.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Item not found in order'
            });
        }

        const availableQuantity = quantityResults[0].available_quantity;

        if (quantity > availableQuantity) {
            return res.status(400).json({
                success: false,
                message: `Cannot add liability. Only ${availableQuantity} items available.`
            });
        }

        // If quantity is valid, proceed with adding liability
        const query = `
            INSERT INTO liabilities_tbl 
                (finance_ID, liability_title, item_ID, item_quantity, liability_amount, liability_description, liability_date, manager_ID) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [financeId, title, itemId, quantity, amount, description, date, managerId], (err, result) => {
            if (err) {
                console.error('Error adding liability:', err);
                return res.status(500).json({ success: false, message: err.message });
            }
            
            const updateStatusQuery = `
                UPDATE finance_tbl f
                SET f.payment_status_id = 
                    CASE 
                        WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) < 0 
                        THEN 304
                        WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) = 0 
                        THEN 301
                        WHEN (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) > 0 
                        AND (f.total_amount - (SELECT SUM(payment_amount) FROM payment_tbl WHERE finance_ID = f.finance_ID)) < f.total_amount
                        THEN 302
                        ELSE 303
                    END
                WHERE f.finance_ID = ?
            `;
            
            db.query(updateStatusQuery, [financeId], (err) => {
                if (err) {
                    console.error('Error updating payment status:', err);
                }
                
                res.json({ 
                    success: true, 
                    message: 'Liability added successfully', 
                    liabilityId: result.insertId 
                });
            });
        });
    });
});

// DELETE TRANSACTION
app.delete('/deleteTransaction/:financeId/:paymentAmount', (req, res) => {
    const { financeId, paymentAmount } = req.params;

    if (!financeId) {
        return res.status(400).json({ success: false, message: 'Finance ID is required' });
    }

    const query = 'DELETE FROM payment_tbl WHERE finance_ID = ? AND payment_amount = ?';

    db.query(query, [financeId, paymentAmount], (err, result) => {
        if (err) {
            console.error('Error deleting transaction:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, message: 'Transaction deleted successfully' });
    });
});

// DELETE LIABILITY
app.delete('/deleteLiability/:financeId/:liabilityTitle', (req, res) => {
    const { financeId, liabilityTitle } = req.params;

    if (!financeId) {
        return res.status(400).json({ success: false, message: 'Finance ID is required' });
    }

    const query = 'DELETE FROM liabilities_tbl WHERE finance_ID = ? AND liability_title = ?';

    db.query(query, [financeId, liabilityTitle], (err, result) => {
        if (err) {
            console.error('Error deleting liability:', err);
            return res.status(500).json({ success: false, message: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Liability not found' });
        }

        res.json({ success: true, message: 'Liability deleted successfully' });
    });
});


// Route to update item details
app.put('/updateItem/:id', (req, res) => {
    const itemId = req.params.id;
    const { itemName, itemDescription, itemPrice, itemType } = req.body;
    const query = 'UPDATE item_tbl SET item_name = ?, item_description = ?, item_price = ?, item_type_ID = ? WHERE item_ID = ?';
    db.query(query, [itemName, itemDescription, itemPrice, itemType, itemId], (error, results) => {
        if (error) {
            console.error('Error updating item:', error);
            res.status(500).json({ error: 'Error updating item' });
        } else {
            res.json({ success: true, message: 'Item updated successfully' });
        }
    });
});

// Route to update stock details
app.put('/updateStock/:id', (req, res) => {
    const stockId = req.params.id;
    const { itemQuantity, supplierId, managerId } = req.body;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, error: 'Error starting transaction' });
        }

        // First, get the item ID associated with this stock
        const getItemIdQuery = 'SELECT item_ID FROM item_stock_tbl WHERE item_stock_ID = ?';
        db.query(getItemIdQuery, [stockId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error getting item ID:', err);
                    res.status(500).json({ success: false, error: 'Error getting item ID' });
                });
            }
            
            if (results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ success: false, error: 'Stock not found' });
                });
            }
            
            const itemId = results[0].item_ID;
            
            // Update the stock entry
            const updateStockQuery = 'UPDATE item_stock_tbl SET item_quantity = ?, supplier_ID = ?, manager_ID = ? WHERE item_stock_ID = ?';
            db.query(updateStockQuery, [itemQuantity, supplierId, managerId, stockId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating stock:', err);
                        res.status(500).json({ success: false, error: 'Error updating stock' });
                    });
                }
                
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ success: false, error: 'Error committing transaction' });
                        });
                    }
                    res.json({ success: true, message: 'Stock updated successfully', itemId });
                });
            });
        });
    });
});

// Route to get stock details for modification
app.get('/getStockDetails/:id', (req, res) => {
    const stockId = req.params.id;
    const query = `
        SELECT s.item_stock_ID, s.item_ID, i.item_name, s.item_quantity, sup.supplier_name, sup.supplier_ID,
               CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS manager_name,
               m.manager_ID
        FROM item_stock_tbl s
        JOIN item_tbl i ON s.item_ID = i.item_ID
        JOIN supplier_tbl sup ON s.supplier_ID = sup.supplier_ID
        JOIN manager_tbl m ON s.manager_ID = m.manager_ID
        JOIN staff_tbl st ON m.staff_ID = st.staff_id
        JOIN person_tbl p ON st.person_ID = p.person_id
        WHERE s.item_stock_ID = ?
    `;
    db.query(query, [stockId], (error, results) => {
        if (error) {
            console.error('Error fetching stock details:', error);
            res.status(500).json({ error: 'Error fetching stock details' });
        } else {
            res.json(results[0]);
        }
    });
});


// Route to update stock details
app.put('/updateStock/:id', (req, res) => {
    const stockId = req.params.id;
    const { itemQuantity, supplierId, managerId } = req.body;
    
    const query = 'UPDATE item_stock_tbl SET item_quantity = ?, supplier_ID = ?, manager_ID = ? WHERE item_stock_ID = ?';
    db.query(query, [itemQuantity, supplierId, managerId, stockId], (error, results) => {
        if (error) {
            console.error('Error updating stock:', error);
            res.status(500).json({ success: false, error: 'Error updating stock' });
        } else {
            res.json({ success: true, message: 'Stock updated successfully' });
        }
    });
});

// RETRIEVES STOCK INFO FOR DISPLAY
app.get('/getStockInfo', (req, res) => {
    const query = `
        SELECT s.item_stock_ID, s.item_ID, i.item_name, s.item_quantity, sup.supplier_name, sup.supplier_ID,
               CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS manager_name,
               m.manager_ID
        FROM item_stock_tbl s
        JOIN item_tbl i ON s.item_ID = i.item_ID
        LEFT JOIN supplier_tbl sup ON s.supplier_ID = sup.supplier_ID
        JOIN manager_tbl m ON s.manager_ID = m.manager_ID
        JOIN staff_tbl st ON m.staff_ID = st.staff_id
        JOIN person_tbl p ON st.person_ID = p.person_id
        ORDER BY s.item_stock_ID
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching stock information:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json(results);
    });
});

// Get finance ID by order ID
app.get('/getFinanceIdByOrderId/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const query = `
        SELECT f.finance_ID as financeId
        FROM finance_tbl f
        WHERE f.order_ID = ?
    `;
    
    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching finance ID:', err);
            return res.status(500).json({ error: 'Failed to fetch finance ID' });
        }
        
        if (results.length > 0) {
            res.json({ financeId: results[0].financeId });
        } else {
            res.status(404).json({ error: 'Finance ID not found for this order' });
        }
    });
});

// Fetch order items and details
app.get('/fetchOrderItems/:orderId', (req, res) => {
    const { orderId } = req.params;

    const query = `
        SELECT 
            i.item_name, 
            i.item_description, 
            i.item_price, 
            od.item_quantity, 
            (i.item_price * od.item_quantity) AS item_subtotal,
            f.extra_Fee AS extra_fees,
            DATEDIFF(e.end_event_date, e.event_date) AS days_rented
        FROM order_details_tbl od
        JOIN item_tbl i ON od.item_ID = i.item_ID
        JOIN finance_tbl f ON od.order_ID = f.order_ID
        JOIN event_info_tbl e ON od.order_ID = e.order_ID
        WHERE od.order_ID = ?
    `;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ error: 'Failed to fetch order items' });
        }
        
        // Ensure all numeric values are actual numbers
        const formattedResults = results.map(item => ({
            ...item,
            item_price: parseFloat(item.item_price),
            item_quantity: parseInt(item.item_quantity),
            item_subtotal: parseFloat(item.item_subtotal),
            extra_fees: parseFloat(item.extra_fees || 0),
            days_rented: parseInt(item.days_rented || 0)
        }));
        
        res.json({ 
            items: formattedResults, 
            daysRented: formattedResults[0]?.days_rented || 0, 
            extraFees: formattedResults[0]?.extra_fees || 0 
        });
    });
});

// FETCH ORDER DETAILS FOR MODIFICATION
app.get('/fetchOrderDetails/:orderId', (req, res) => {
    const { orderId } = req.params;

    // Complex query to fetch all information for an order
    const orderQuery = `
        SELECT 
            o.order_ID, 
            e.event_Name, 
            e.event_date, 
            DATEDIFF(e.end_event_date, e.event_date) AS event_duration,
            o.manager_ID,
            a.street_Name, 
            a.barangay_Name, 
            a.city_Name,
            p.first_Name,
            p.middle_Name,
            p.last_Name,
            p.phone_Number,
            p.age,
            p.gender_ID,
            f.extra_Fee
        FROM order_info_tbl o
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        JOIN customer_tbl c ON o.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_id
        JOIN address_tbl a ON e.address_ID = a.address_ID
        JOIN finance_tbl f ON o.order_ID = f.order_ID
        WHERE o.order_ID = ?
    `;

    // Enhanced query to fetch order items with type info
    const itemsQuery = `
        SELECT 
            i.item_ID,
            i.item_name,
            i.item_price,
            i.item_type_ID,
            it.item_type_name,
            COALESCE(od.item_quantity, 0) as selected_quantity,
            (SELECT SUM(s.item_quantity) 
             FROM item_stock_tbl s 
             WHERE s.item_ID = i.item_ID) as available_stock
        FROM item_tbl i
        JOIN item_type_tbl it ON i.item_type_ID = it.item_type_ID
        LEFT JOIN order_details_tbl od ON i.item_ID = od.item_ID AND od.order_ID = ?
        ORDER BY i.item_type_ID, i.item_name
    `;

    // Query to fetch assigned workers
    const workersQuery = `
        SELECT worker_ID
        FROM assigned_worker_tbl
        WHERE order_ID = ?
    `;

    // Fetch all details in parallel
    db.query(`${orderQuery}; ${itemsQuery}; ${workersQuery}`, [orderId, orderId, orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching order details' 
            });
        }

        // Extract results from the multiple queries
        const orderDetails = results[0][0] || {};
        const items = results[1] || [];
        const workers = results[2].map(w => w.worker_ID) || [];

        res.json({
            success: true,
            orderDetails,
            items,
            workers
        });
    });
});

// LOGIN NAVIGATION
app.get('/', (_, res) => {
    res.redirect('/login');
});

app.get('/login', (_, res) => {
    res.sendFile(path.join(__dirname, '/../index.html'));
});

// DASHBOARD NAVIGATION
app.get('/dashboard', (req, res) => {
	if (req.session.userID) {
		res.sendFile(path.join(__dirname, '/../Pages/dashboard.html'));
	} else {
		res.redirect('/login');
	}
});

// Get Order History Details
app.get('/getOrderHistoryDetails/:orderId', (req, res) => {
    const { orderId } = req.params;

    // Main query to get order details with customer and event info
    const orderDetailsQuery = `
        SELECT 
            o.order_ID,
            e.event_Name,
            DATE_FORMAT(e.event_date, '%Y-%m-%d %H:%i') as event_date,
            DATE_FORMAT(e.end_event_date, '%Y-%m-%d %H:%i') as end_event_date,
            CONCAT(p.first_Name, ' ', IFNULL(p.middle_Name, ''), ' ', p.last_Name) as customer_name,
            CONCAT(a.street_Name, ', ', a.barangay_Name, ', ', a.city_Name) as full_address,
            p.phone_Number,
            (SELECT CONCAT(p2.first_Name, ' ', p2.last_Name) 
             FROM person_tbl p2 
             JOIN staff_tbl s ON p2.person_ID = s.person_ID 
             JOIN manager_tbl m ON s.staff_ID = m.staff_ID 
             WHERE m.manager_ID = o.manager_ID) as manager_name,
            f.finance_ID,
            f.extra_fee as extraFees,
            DATEDIFF(e.end_event_date, e.event_date) as daysRented
        FROM order_info_tbl o
        JOIN event_info_tbl e ON o.order_ID = e.order_ID
        JOIN customer_tbl c ON o.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_ID
        JOIN address_tbl a ON e.address_ID = a.address_ID
        JOIN finance_tbl f ON o.order_ID = f.order_ID
        WHERE o.order_ID = ?
    `;

    // Query to get transactions
    const transactionsQuery = `
        SELECT 
            pt.payment_type,
            p.payment_amount,
            p.payment_reference_no,
            DATE_FORMAT(p.date_of_payment, '%Y-%m-%d %H:%i') as date_of_payment
        FROM payment_tbl p
        JOIN payment_type_tbl pt ON p.payment_type_ID = pt.payment_type_ID
        JOIN finance_tbl f ON p.finance_ID = f.finance_ID
        WHERE f.order_ID = ?
        ORDER BY p.date_of_payment DESC
    `;

    // Query to get liabilities
    const liabilitiesQuery = `
        SELECT 
            l.liability_title,
            i.item_name,
            l.item_quantity,
            l.liability_amount,
            l.liability_description,
            DATE_FORMAT(l.liability_date, '%Y-%m-%d %H:%i') as liability_date
        FROM liabilities_tbl l
        JOIN finance_tbl f ON l.finance_ID = f.finance_ID
        JOIN item_tbl i ON l.item_ID = i.item_ID
        WHERE f.order_ID = ?
        ORDER BY l.liability_date DESC
    `;

    // Query to get order items with missing requirements
    const itemsQuery = `
        SELECT 
            i.item_name,
            i.item_description,
            i.item_price,
            od.item_quantity,
            (i.item_price * od.item_quantity) as item_subtotal,
            (SELECT SUM(item_quantity) 
             FROM item_stock_tbl 
             WHERE item_ID = i.item_ID) as available_stock,
            CASE 
                WHEN (SELECT SUM(item_quantity) 
                      FROM item_stock_tbl 
                      WHERE item_ID = i.item_ID) < od.item_quantity 
                THEN od.item_quantity - (SELECT SUM(item_quantity) 
                                       FROM item_stock_tbl 
                                       WHERE item_ID = i.item_ID)
                ELSE 0 
            END as missing_quantity
        FROM order_details_tbl od
        JOIN item_tbl i ON od.item_ID = i.item_ID
        WHERE od.order_ID = ?
    `;

    // Execute all queries in parallel
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(orderDetailsQuery, [orderId], (err, results) => {
                if (err) reject(err);
                resolve(results[0]); // Get first row since it's a single order
            });
        }),
        new Promise((resolve, reject) => {
            db.query(transactionsQuery, [orderId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(liabilitiesQuery, [orderId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(itemsQuery, [orderId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        })
    ])
    .then(([orderDetails, transactions, liabilities, items]) => {
        // Calculate missing requirements summary
        const missingRequirements = items
            .filter(item => item.missing_quantity > 0)
            .map(item => ({
                item_name: item.item_name,
                required_quantity: item.item_quantity,
                available_quantity: item.available_stock || 0,
                missing_quantity: item.missing_quantity
            }));

        res.json({
            orderDetails,
            transactions,
            liabilities,
            items,
            missingRequirements
        });
    })
    .catch(error => {
        console.error('Error fetching order history details:', error);
        res.status(500).json({ error: 'Failed to fetch order history details' });
    });
});

// Route to get item details for modification
app.get('/getItemDetails/:id', (req, res) => {
    const itemId = req.params.id;
    const query = `
        SELECT i.item_ID, i.item_name, i.item_description, i.item_price, i.item_type_ID,
               t.item_type_name
        FROM item_tbl i
        JOIN item_type_tbl t ON i.item_type_ID = t.item_type_ID
        WHERE i.item_ID = ?
    `;
    
    db.query(query, [itemId], (error, results) => {
        if (error) {
            console.error('Error fetching item details:', error);
            res.status(500).json({ error: 'Error fetching item details' });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'Item not found' });
        } else {
            res.json(results[0]);
        }
    });
});

// START THE SERVER 
app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
	console.log('Access the website at http://localhost:4000');
});            


