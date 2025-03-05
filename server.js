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

  const query = 'SELECT staff_id, staff_password FROM staff_tbl WHERE staff_id = ? AND staff_password = ?';
  db.query(query, [userID, encryptedPassword], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      req.session.userID = userID; // Set session userID
      console.log('Login successful');
      res.send({ success: true, redirectUrl: '/dashboard' });
    } else {
      console.log('Invalid login credentials');
      res.send({ success: false, message: 'Invalid credentials' });
    }
  });
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

    const eventQuery = `
      SELECT event_date, end_event_date
      FROM event_info_tbl
      WHERE order_ID = ?
    `;

    db.query(eventQuery, [orderId], (err, eventResults) => {
      if (err) throw err;

      const { event_date, end_event_date } = eventResults[0];
      const daysRented = Math.ceil((new Date(end_event_date) - new Date(event_date)) / (1000 * 60 * 60 * 24));

      res.json({ items: results, daysRented });
    });
  });
});


// RETRIEVES WORKERS WITH ORDER_ID = SELECTED ROW
app.get('/getOrderDetails/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  // Query for the order and its associated details
  const orderQuery = `
    SELECT o.order_ID, e.event_Name, e.event_date AS event_timestamp, e.end_event_date,
           f.extra_Fee AS extra_fees,
           a.street_Name AS street, a.barangay_Name AS barangay, a.city_Name AS city,
           p.first_Name, p.middle_Name, p.last_Name, p.phone_Number AS phone_number, 
           p.age, p.gender_ID AS gender, o.manager_ID AS assigned_manager
    FROM order_info_tbl o
    JOIN event_info_tbl e ON o.order_ID = e.order_ID
    JOIN finance_tbl f ON o.order_ID = f.order_ID
    JOIN customer_tbl c ON o.customer_ID = c.customer_ID
    JOIN person_tbl p ON c.person_ID = p.person_id
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
    
    // Query all items with available stock and left-join with order_details_tbl
    const itemsQuery = `
      SELECT 
        i.item_ID, 
        i.item_name, 
        i.item_price, 
        s.item_quantity AS available_stock, 
        t.item_type_name,
        od.item_quantity AS selected_quantity,
        od.order_ID AS order_selected
      FROM item_tbl i
      JOIN item_stock_tbl s ON i.item_ID = s.item_ID
      JOIN item_type_tbl t ON i.item_type_ID = t.item_type_ID
      LEFT JOIN order_details_tbl od 
         ON i.item_ID = od.item_ID AND od.order_ID = ?
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
        LEFT JOIN assigned_worker_tbl aw 
          ON w.worker_ID = aw.worker_ID AND aw.order_ID = ?
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
            res.json({ order, items, workers, managers, genders });
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

                const deleteAddress = 'DELETE FROM address_tbl WHERE address_ID IN (SELECT address_ID FROM event_info_tbl WHERE order_ID = ?)';
                db.query(deleteAddress, [orderId], (err) => {
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


// NAVIGATION
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/dashboard', (_, res) => {
  res.sendFile(__dirname + '/mainPage/dashboard_main.html');
});

app.get('/login', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Access the website at http://localhost:4000');
});

