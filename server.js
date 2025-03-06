const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');

// CREATE EXPRESS APP
const app = express();
const port = 4000;

// MIDDLEWARE FOR STATIC FILES
app.use("/mainPage", express.static(__dirname + "/mainPage"));
app.use("/design", express.static(__dirname + "/design"));
app.use("/assets", express.static(__dirname + "/Assets"));
app.use(express.static(__dirname));

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
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fernandez_tables_chairs_db',
  multipleStatements: true
});

// CONNECT TO DATABASE
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});


// CHECK IF USER IS LOGGED IN. FORCES /dashboard TO /login IF NOT
app.get('/checkSession', (req, res) => {
  if (req.session.userID) { res.json({ loggedIn: true });
} else { res.json({ loggedIn: false }); } });


// LOGIN USER TO DASHBOARD USING PASSWORD ENCRYPTION AND COMPARISON
app.post('/login', (req, res) => {
  const { userID, staffPassword } = req.body;
  const encryptedPassword = Buffer.from(staffPassword).toString('base64');

  // Modified query to also fetch user's name
  const query = `
    SELECT s.staff_id, s.staff_password, CONCAT(p.first_Name, ' ', p.last_Name) AS fullName
    FROM staff_tbl s
    JOIN person_tbl p ON s.person_ID = p.person_id
    WHERE s.staff_id = ? AND s.staff_password = ?
  `;
  
  db.query(query, [userID, encryptedPassword], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      // Store both user ID and name in session
      req.session.userID = userID;
      req.session.userName = results[0].fullName;
      console.log('Login successful');
      res.send({ success: true, redirectUrl: '/dashboard' });
    } else {
      console.log('Invalid login credentials');
      res.send({ success: false, message: 'Invalid credentials' });
    }
  });
});

// New endpoint to get current user information
app.get('/getCurrentUser', (req, res) => {
  if (req.session.userID) {
    // Query to get full name from the database using proper table relationships
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
          userName: 'User' // Default name in case of error
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
          userName: 'User' // Default name if user not found
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
    SELECT i.item_ID, i.item_name, i.item_price, s.item_quantity, t.item_type_name
    FROM item_tbl i
    JOIN item_stock_tbl s ON i.item_ID = s.item_ID
    JOIN item_type_tbl t ON i.item_type_ID = t.item_type_ID
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

  // RUN ALL QUERIES
  db.query(`${itemsQuery}; ${workersQuery}; ${managersQuery}; ${gendersQuery}`, (err, results) => {
    if (err) throw err;
    const [items, workers, managers, genders] = results;
    const sortedItems = {
      tables: items.filter(item => item.item_type_name === 'Tables'),
      chairs: items.filter(item => item.item_type_name === 'Chairs'),
      miscellaneous: items.filter(item => item.item_type_name === 'Others')
    };
    res.json({ items: sortedItems, workers, managers, genders });
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
           ps.payment_status_name AS order_status, e.event_date, e.end_event_date, 
           CONCAT(pm.first_Name, ' ', pm.middle_Name, ' ', pm.last_Name) AS manager_name, f.total_amount
    FROM order_info_tbl o
    JOIN event_info_tbl e ON o.order_ID = e.order_ID
    JOIN customer_tbl c ON o.customer_ID = c.customer_ID
    JOIN person_tbl p ON c.person_ID = p.person_id
    JOIN finance_tbl f ON o.order_ID = f.order_ID
    JOIN payment_status_tbl ps ON f.payment_status_id = ps.payment_status_ID
    JOIN manager_tbl m ON o.manager_ID = m.manager_ID
    JOIN staff_tbl s ON m.staff_ID = s.staff_id
    JOIN person_tbl pm ON s.person_ID = pm.person_id
    WHERE e.end_event_date >= NOW() AND (f.payment_status_id = 301 OR f.payment_status_id = 302)
  `;

  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// New endpoint to fetch order history
app.get('/getOrderHistory', (req, res) => {
  const query = `
    SELECT o.order_ID, e.event_Name, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS customer_name,
           ps.payment_status_name AS order_status, e.event_date, e.end_event_date, 
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

//RETREIVES ITEMS WITH ORDER_ID = SELECTED ROW
app.get('/getOrderItems/:orderId', (req, res) => {
  const { orderId } = req.params;

  const query = `
    SELECT i.item_ID, i.item_name, i.item_description, i.item_price, od.item_quantity,
           (i.item_price * od.item_quantity) AS subtotal
    FROM order_details_tbl od
    JOIN item_tbl i ON od.item_ID = i.item_ID
    WHERE od.order_ID = ?
  `;

  db.query(query, [orderId], (err, results) => {
    if (err) throw err;

    const orderInfoQuery = `
      SELECT e.event_date, e.end_event_date, f.extra_Fee
      FROM event_info_tbl e
      JOIN finance_tbl f ON e.order_ID = f.order_ID
      WHERE e.order_ID = ?
    `;

    db.query(orderInfoQuery, [orderId], (err, orderResults) => {
      if (err) throw err;

      if (orderResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const { event_date, end_event_date, extra_Fee } = orderResults[0];
      const daysRented = Math.ceil((new Date(end_event_date) - new Date(event_date)) / (1000 * 60 * 60 * 24));

      res.json({ 
        items: results, 
        daysRented, 
        extraFees: extra_Fee 
      });
    });
  });
});


// RETRIEVES WORKERS WITH ORDER_ID = SELECTED ROW
app.get('/getOrderDetails/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  // Query for the order and its associated details
  const orderQuery = `
    SELECT o.order_ID, 
          e.event_Name AS event_name, 
          e.event_date AS event_timestamp, 
          e.end_event_date,
          f.extra_Fee AS extra_fees,
          a.street_Name AS street, 
          a.barangay_Name AS barangay, 
          a.city_Name AS city,
          p.first_Name AS first_name, 
          p.middle_Name AS middle_name, 
          p.last_Name AS last_name, 
          p.phone_Number AS phone_number, 
          p.age, 
          p.gender_ID AS gender, 
          o.manager_ID AS assigned_manager
    FROM order_info_tbl o
    JOIN event_info_tbl e ON o.order_ID = e.order_ID
    JOIN finance_tbl f ON o.order_ID = f.order_ID
    JOIN customer_tbl c ON o.customer_ID = c.customer_ID
    JOIN person_tbl p ON c.person_ID = p.person_ID
    JOIN address_tbl a ON e.address_ID = a.address_ID
    WHERE o.order_ID = ?
  `;

  db.query(orderQuery, [orderId], (err, orderResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!orderResults.length) return res.status(404).json({ error: 'Order not found' });
    const order = orderResults[0];
    // Calculate event duration if needed
    order.event_duration = Math.ceil(
      (new Date(order.end_event_date) - new Date(order.event_timestamp)) / (1000 * 60 * 60 * 24)
    );
    
    // Modified query to get items grouped by item type
    const itemsQuery = `
      SELECT 
        i.item_ID, 
        i.item_name, 
        i.item_price,
        i.item_type_ID,
        it.item_type_name,
        s.item_quantity AS available_stock, 
        od.item_quantity AS selected_quantity,
        od.order_ID AS order_selected
      FROM item_tbl i
      JOIN item_type_tbl it ON i.item_type_ID = it.item_type_ID
      JOIN item_stock_tbl s ON i.item_ID = s.item_ID
      LEFT JOIN order_details_tbl od ON i.item_ID = od.item_ID AND od.order_ID = ?
      ORDER BY i.item_type_ID, i.item_name
    `;
    
    db.query(itemsQuery, [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Query all workers and mark those assigned to the order
      const workersQuery = `
        SELECT 
          w.worker_ID, 
          CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS worker_name,
          CASE WHEN aw.worker_ID IS NULL THEN 0 ELSE 1 END AS selected
        FROM worker_tbl w
        JOIN staff_tbl s ON w.staff_ID = s.staff_id
        JOIN person_tbl p ON s.person_ID = p.person_id
        LEFT JOIN assigned_worker_tbl aw ON w.worker_ID = aw.worker_ID AND aw.order_ID = ?
      `;
      
      db.query(workersQuery, [orderId], (err, workers) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Also get managers and genders for dropdown selectors if needed
        const managersQuery = `
          SELECT m.manager_ID AS id, CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS name
          FROM manager_tbl m
          JOIN staff_tbl s ON m.staff_ID = s.staff_id
          JOIN person_tbl p ON s.person_ID = p.person_id
        `;
        
        db.query(managersQuery, (err, managers) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const gendersQuery = `SELECT gender_ID AS id, gender_Name AS name FROM gender_tbl`;
          
          db.query(gendersQuery, (err, genders) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Group items by type for client-side convenience
            const tablesItems = items.filter(item => item.item_type_ID === 401);
            const chairsItems = items.filter(item => item.item_type_ID === 402);
            const miscItems = items.filter(item => item.item_type_ID === 403);
            
            res.json({ 
              order, 
              itemsByType: {
                tables: tablesItems,
                chairs: chairsItems,
                misc: miscItems
              },
              items,  // Keep the original array for backward compatibility
              workers, 
              managers, 
              genders 
            });
          });
        });
      });
    });
  });
});

app.delete('/deleteOrder/:orderId', (req, res) => {
  const { orderId } = req.params;

  db.beginTransaction(err => {
    if (err) throw err;

    // First, retrieve all IDs we need to delete at the end
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

      // Delete in the correct order to maintain referential integrity
      const deleteOrderDetails = 'DELETE FROM order_details_tbl WHERE order_ID = ?';
      db.query(deleteOrderDetails, [orderId], (err) => {
        if (err) return db.rollback(() => { throw err; });

        const deletePayment = 'DELETE FROM payment_tbl WHERE finance_ID IN (SELECT finance_ID FROM finance_tbl WHERE order_ID = ?)';
        db.query(deletePayment, [orderId], (err) => {
          if (err) return db.rollback(() => { throw err; });

          const deleteFinance = 'DELETE FROM finance_tbl WHERE order_ID = ?';
          db.query(deleteFinance, [orderId], (err) => {
            if (err) return db.rollback(() => { throw err; });

            const deleteAssignedWorkers = 'DELETE FROM assigned_worker_tbl WHERE order_ID = ?';
            db.query(deleteAssignedWorkers, [orderId], (err) => {
              if (err) return db.rollback(() => { throw err; });

              const deleteEventInfo = 'DELETE FROM event_info_tbl WHERE order_ID = ?';
              db.query(deleteEventInfo, [orderId], (err) => {
                if (err) return db.rollback(() => { throw err; });

                const deleteOrderInfo = 'DELETE FROM order_info_tbl WHERE order_ID = ?';
                db.query(deleteOrderInfo, [orderId], (err) => {
                  if (err) return db.rollback(() => { throw err; });

                  // Now delete the customer record
                  const deleteCustomer = 'DELETE FROM customer_tbl WHERE customer_ID = ?';
                  db.query(deleteCustomer, [customer_ID], (err) => {
                    if (err) return db.rollback(() => { throw err; });

                    // Delete the address record
                    const deleteAddress = 'DELETE FROM address_tbl WHERE address_ID = ?';
                    db.query(deleteAddress, [address_ID], (err) => {
                      if (err) return db.rollback(() => { throw err; });

                      // Finally delete the person record
                      const deletePerson = 'DELETE FROM person_tbl WHERE person_id = ?';
                      db.query(deletePerson, [person_ID], (err) => {
                        if (err) return db.rollback(() => { throw err; });

                        db.commit(err => {
                          if (err) return db.rollback(() => { throw err; });
                          res.json({ success: true, message: 'Order and all related records deleted successfully' });
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
  });
});

app.post('/modifyOrder', (req, res) => {
  const {
    order_ID, event_name, event_timestamp, event_duration, assigned_manager,
    street, barangay, city, first_name, middle_name, last_name, phone_number,
    age, gender, extra_fees, items, workers
  } = req.body;

  db.beginTransaction(err => {
    if (err) throw err;
    
    // Get current address and customer IDs
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
      
      // Update address_tbl
      const updateAddress = 'UPDATE address_tbl SET street_Name = ?, barangay_Name = ?, city_Name = ? WHERE address_ID = ?';
      db.query(updateAddress, [street, barangay, city, address_ID], (err) => {
        if (err) return db.rollback(() => { throw err; });
        
        // Update person_tbl via customer_tbl
        const fetchPersonQuery = 'SELECT person_ID FROM customer_tbl WHERE customer_ID = ?';
        db.query(fetchPersonQuery, [customer_ID], (err, personResults) => {
          if (err) return db.rollback(() => { throw err; });
          if (personResults.length === 0) return res.status(404).json({ error: 'Customer not found' });
          
          const person_ID = personResults[0].person_ID;
          const updatePerson = 'UPDATE person_tbl SET first_Name = ?, middle_Name = ?, last_Name = ?, phone_Number = ?, age = ?, gender_ID = ? WHERE person_id = ?';
          db.query(updatePerson, [first_name, middle_name, last_name, phone_number, age, gender, person_ID], (err) => {
            if (err) return db.rollback(() => { throw err; });
            
            // Update order_info_tbl (update assigned manager if needed)
            const updateOrderInfo = 'UPDATE order_info_tbl SET manager_ID = ? WHERE order_ID = ?';
            db.query(updateOrderInfo, [assigned_manager, order_ID], (err) => {
              if (err) return db.rollback(() => { throw err; });
              
              // Update event_info_tbl with new event details
              const endEventDate = new Date(new Date(event_timestamp).getTime() + (event_duration * 24 * 60 * 60 * 1000));
              const updateEvent = 'UPDATE event_info_tbl SET event_Name = ?, event_date = ?, end_event_date = ? WHERE order_ID = ?';
              db.query(updateEvent, [event_name, event_timestamp, endEventDate, order_ID], (err) => {
                if (err) return db.rollback(() => { throw err; });
                
                // Update finance_tbl with recalculated amounts
                const subtotalPrice = items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * (parseFloat(event_duration) || 1);
                const totalPrice = subtotalPrice + parseFloat(extra_fees);
                const updateFinance = 'UPDATE finance_tbl SET extra_Fee = ?, total_amount = ? WHERE order_ID = ?';
                db.query(updateFinance, [extra_fees, totalPrice, order_ID], (err) => {
                  if (err) return db.rollback(() => { throw err; });
                  
                  // Replace order items: delete existing then insert new ones
                  const deleteOrderDetails = 'DELETE FROM order_details_tbl WHERE order_ID = ?';
                  db.query(deleteOrderDetails, [order_ID], (err) => {
                    if (err) return db.rollback(() => { throw err; });
                    
                    if (items.length > 0) {
                      const orderDetailsQuery = 'INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES ?';
                      const orderDetailsValues = items.map(item => [order_ID, item.item_id, item.quantity]);
                      db.query(orderDetailsQuery, [orderDetailsValues], (err) => {
                        if (err) return db.rollback(() => { throw err; });
                        
                        // Replace assigned workers similarly
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


// UPDATE ORDER ENDPOINT
app.put('/updateOrder/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const {
    event_name, event_timestamp, event_duration, assigned_manager,
    street, barangay, city, first_name, middle_name, last_name, phone_number,
    age, gender, extra_fees, items, workers
  } = req.body;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    // Get current order info to retrieve linked IDs
    const getOrderInfoQuery = `
      SELECT o.customer_ID, c.person_ID, e.address_ID, f.finance_ID
      FROM order_info_tbl o
      JOIN customer_tbl c ON o.customer_ID = c.customer_ID
      JOIN event_info_tbl e ON o.order_ID = e.order_ID
      JOIN finance_tbl f ON o.order_ID = f.order_ID
      WHERE o.order_ID = ?
    `;
    
    db.query(getOrderInfoQuery, [orderId], (err, orderInfo) => {
      if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
      
      if (!orderInfo.length) {
        return db.rollback(() => res.status(404).json({ success: false, message: 'Order not found' }));
      }
      
      const { customer_ID, person_ID, address_ID, finance_ID } = orderInfo[0];
      
      // 1. Update address
      const updateAddressQuery = `
        UPDATE address_tbl 
        SET street_Name = ?, barangay_Name = ?, city_Name = ?
        WHERE address_ID = ?
      `;
      
      db.query(updateAddressQuery, [street, barangay, city, address_ID], err => {
        if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
        
        // 2. Update person info
        const updatePersonQuery = `
          UPDATE person_tbl
          SET first_Name = ?, last_Name = ?, middle_Name = ?, phone_Number = ?, age = ?, gender_ID = ?
          WHERE person_id = ?
        `;
        
        db.query(updatePersonQuery, [first_name, last_name, middle_name, phone_number, age, gender, person_ID], err => {
          if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
          
          // 3. Update order manager if changed
          const updateOrderQuery = `
            UPDATE order_info_tbl
            SET manager_ID = ?
            WHERE order_ID = ?
          `;
          
          db.query(updateOrderQuery, [assigned_manager, orderId], err => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
            
            // 4. Update event details
            const updateEventQuery = `
              UPDATE event_info_tbl
              SET event_Name = ?, event_date = ?, end_event_date = ?
              WHERE order_ID = ?
            `;
            
            const endEventDate = new Date(new Date(event_timestamp).getTime() + (event_duration * 24 * 60 * 60 * 1000));
            
            db.query(updateEventQuery, [event_name, event_timestamp, endEventDate, orderId], err => {
              if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
              
              // 5. Delete existing order details (items) to recreate them
              const deleteOrderDetailsQuery = 'DELETE FROM order_details_tbl WHERE order_ID = ?';
              
              db.query(deleteOrderDetailsQuery, [orderId], err => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                
                // 6. Insert updated order details
                if (items.length > 0) {
                  const orderDetailsQuery = 'INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES ?';
                  const orderDetailsValues = items.map(item => [orderId, item.item_id, item.quantity]);
                  
                  db.query(orderDetailsQuery, [orderDetailsValues], err => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                    
                    // 7. Delete existing worker assignments
                    const deleteWorkersQuery = 'DELETE FROM assigned_worker_tbl WHERE order_ID = ?';
                    
                    db.query(deleteWorkersQuery, [orderId], err => {
                      if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                      
                      // 8. Insert updated worker assignments
                      if (workers.length > 0) {
                        const assignedWorkersQuery = 'INSERT INTO assigned_worker_tbl (order_ID, worker_ID) VALUES ?';
                        const assignedWorkersValues = workers.map(workerId => [orderId, workerId]);
                        
                        db.query(assignedWorkersQuery, [assignedWorkersValues], err => {
                          if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                          
                          // 9. Update finance information
                          const subtotalPrice = items.reduce((sum, item) => sum + (item.quantity * item.price), 0) * (parseFloat(event_duration) || 1);
                          const totalPrice = subtotalPrice + parseFloat(extra_fees);
                          
                          const updateFinanceQuery = `
                            UPDATE finance_tbl
                            SET extra_Fee = ?, total_amount = ?
                            WHERE finance_ID = ?
                          `;
                          
                          db.query(updateFinanceQuery, [extra_fees, totalPrice, finance_ID], err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                            
                            // Commit the transaction
                            db.commit(err => {
                              if (err) return db.rollback(() => res.status(500).json({ success: false, message: err.message }));
                              
                              res.json({ success: true, message: 'Order updated successfully' });
                            });
                          });
                        });
                      } else {
                        db.rollback(() => res.status(400).json({ success: false, message: 'At least one worker must be selected' }));
                      }
                    });
                  });
                } else {
                  db.rollback(() => res.status(400).json({ success: false, message: 'At least one item must be selected' }));
                }
              });
            });
          });
        });
      });
    });
  });
});

// CANCEL ORDER ENDPOINT - Sets payment_status to 305 (Others)
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

// INVENTORY MANAGEMENT ENDPOINTS

// Get all inventory items
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

// Get all stock information
app.get('/getStockInfo', (req, res) => {
  const query = `
    SELECT s.item_stock_ID, s.item_ID, i.item_name, s.item_quantity,
           sup.supplier_source_name, sup.supplier_ID,
           CONCAT(p.first_Name, ' ', p.middle_Name, ' ', p.last_Name) AS manager_name
    FROM item_stock_tbl s
    JOIN item_tbl i ON s.item_ID = i.item_ID
    JOIN supplier_tbl sup ON s.supplier_ID = sup.supplier_ID
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

// Delete item (with cascade)
app.delete('/deleteItem/:itemId', (req, res) => {
  const { itemId } = req.params;
  
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    
    // First, check if this item is used in any active orders
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
      
      // Delete from order_details_tbl first
      const deleteOrderDetailsQuery = 'DELETE FROM order_details_tbl WHERE item_ID = ?';
      db.query(deleteOrderDetailsQuery, [itemId], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error deleting from order_details_tbl:', err);
            res.status(500).json({ success: false, message: err.message });
          });
        }
        
        // Delete from item_stock_tbl next
        const deleteStockQuery = 'DELETE FROM item_stock_tbl WHERE item_ID = ?';
        db.query(deleteStockQuery, [itemId], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error deleting from item_stock_tbl:', err);
              res.status(500).json({ success: false, message: err.message });
            });
          }
          
          // Finally delete the item itself
          const deleteItemQuery = 'DELETE FROM item_tbl WHERE item_ID = ?';
          db.query(deleteItemQuery, [itemId], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error deleting from item_tbl:', err);
                res.status(500).json({ success: false, message: err.message });
              });
            }
            
            // Commit the transaction
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

// Delete specific stock entry
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

// Get item types for dropdown
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

// Get suppliers for dropdown
app.get('/getSuppliers', (req, res) => {
  const query = 'SELECT supplier_ID as id, supplier_source_name as name FROM supplier_tbl';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching suppliers:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    
    res.json(results);
  });
});

// Add new item
app.post('/addItem', (req, res) => {
  const { name, description, price, itemType } = req.body;
  
  if (!name || !price || !itemType) {
    return res.status(400).json({ success: false, message: 'Name, price, and item type are required' });
  }
  
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

// Add new stock
app.post('/addStock', (req, res) => {
  const { itemId, quantity, managerId, supplierId } = req.body;
  
  if (!itemId || !quantity || !managerId || !supplierId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Item ID, quantity, manager ID, and supplier ID are required' 
    });
  }
  
  const query = `
    INSERT INTO item_stock_tbl (item_ID, item_quantity, manager_ID, supplier_ID, date_stocked) 
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  db.query(query, [itemId, quantity, managerId, supplierId], (err, result) => {
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

// Get staff information - corrected version with proper address relationship
app.get('/getStaffInfo', (req, res) => {
  const query = `
SELECT 
    s.staff_id, 
    CONCAT(p.first_Name, ' ', IFNULL(p.middle_Name, ''), ' ', p.last_Name) AS worker_name,
    p.age,
    p.phone_Number,
    w.worker_ID,
    CASE 
        WHEN a.address_ID IS NOT NULL THEN CONCAT(a.street_Name, ', ', a.barangay_Name, ', ', a.city_Name)
        ELSE 'No address available'
    END AS address
    FROM worker_tbl w
    JOIN staff_tbl s ON w.staff_ID = s.staff_id
    JOIN person_tbl p ON s.person_ID = p.person_id
    LEFT JOIN address_tbl a ON a.address_ID = p.person_id
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

// Endpoint to fire a worker
app.delete('/fireWorker/:workerId', (req, res) => {
  const workerId = req.params.workerId;

  db.beginTransaction(err => {
    if (err) throw err;

    // First, retrieve all IDs we need to delete at the end
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

      // Delete from assigned_worker_tbl first
      const deleteAssignedWorkersQuery = 'DELETE FROM assigned_worker_tbl WHERE worker_ID = ?';
      db.query(deleteAssignedWorkersQuery, [workerId], (err) => {
        if (err) return db.rollback(() => { throw err; });

        // Delete from worker_tbl
        const deleteWorkerQuery = 'DELETE FROM worker_tbl WHERE worker_ID = ?';
        db.query(deleteWorkerQuery, [workerId], (err) => {
          if (err) return db.rollback(() => { throw err; });

          // Delete from staff_tbl
          const deleteStaffQuery = 'DELETE FROM staff_tbl WHERE staff_id = ?';
          db.query(deleteStaffQuery, [staff_id], (err) => {
            if (err) return db.rollback(() => { throw err; });

            // Finally delete the person record
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

// Get assigned orders for a worker
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

// Get genders (for worker form)
app.get('/getGenders', (req, res) => {
  const query = 'SELECT gender_ID AS id, gender_Name AS name FROM gender_tbl';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching genders:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json(results);
  });
});

// Add new worker
app.post('/addWorker', (req, res) => {
  const {
    first_name, middle_name, last_name, phone_number,
    age, gender, password
  } = req.body;
  
  if (!first_name || !last_name || !phone_number || !age || !gender || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'All required fields must be provided' 
    });
  }
  
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    
    // 1. Insert person record
    const personQuery = 'INSERT INTO person_tbl (first_Name, last_Name, middle_Name, phone_Number, age, gender_ID) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(personQuery, [first_name, last_name, middle_name, phone_number, age, gender], (err, personResult) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error adding person:', err);
          res.status(500).json({ success: false, message: err.message });
        });
      }
      
      const personId = personResult.insertId;
      const encryptedPassword = Buffer.from(Buffer.from(password).toString('base64')).toString('base64');
      
      // 2. Insert staff record
      const staffQuery = 'INSERT INTO staff_tbl (staff_Password, person_ID, date_hired) VALUES (?, ?, NOW())';
      db.query(staffQuery, [encryptedPassword, personId], (err, staffResult) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error adding staff:', err);
            res.status(500).json({ success: false, message: err.message });
          });
        }
        
        const staffId = staffResult.insertId;
        
        // 3. Insert worker record
        const workerQuery = 'INSERT INTO worker_tbl (staff_ID) VALUES (?)';
        db.query(workerQuery, [staffId], (err, workerResult) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error adding worker:', err);
              res.status(500).json({ success: false, message: err.message });
            });
          }
          
          // Commit the transaction
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error committing transaction:', err);
                res.status(500).json({ success: false, message: err.message });
              });
            }
            
            res.json({ 
              success: true, 
              message: 'Worker added successfully',
              workerId: workerResult.insertId,
              staffId: staffId
            });
          });
        });
      });
    });
  });
});

// NAVIGATION
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/dashboard', (req, res) => {
  if (req.session.userID) {
    res.sendFile(path.join(__dirname, '/mainPage/dashboard_main.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Access the website at http://localhost:4000');
});

