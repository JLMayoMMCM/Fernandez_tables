const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// ---------- Middleware ----------
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Serve Static Files ----------
app.use("/mainPage", express.static(__dirname + "/mainPage"));
app.use("/design", express.static(__dirname + "/design"));
app.use("/assets", express.static(__dirname + "/Assets"));
app.use(express.static(__dirname));

// ---------- MySQL Connection ----------
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fernandez_tables_chairs_db'
});
connection.connect(error => {
  if (error) console.error('Error connecting to DB:', error);
  else console.log('Connected to DB');
});

// ---------- Routes ----------

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Login route
app.post("/", (req, res) => {
  const { userID, staffPassword } = req.body;
  connection.query(
    'SELECT * FROM staff_tbl WHERE staff_ID = ? AND staff_Password = ?',
    [userID, staffPassword],
    (error, results) => {
      if (results && results.length > 0) {
        connection.query(
          `SELECT p.first_Name, p.middle_Name, p.last_Name 
           FROM person_tbl p 
           JOIN staff_tbl s ON p.person_ID = s.person_ID 
           WHERE s.staff_ID = ?`,
          [userID],
          (err, userResults) => {
            if (err || userResults.length === 0) {
              return res.send('Login failed');
            }
            const user = userResults[0];
            req.session.userID = userID;
            req.session.userName = `${user.first_Name} ${user.middle_Name ? user.middle_Name + ' ' : ''}${user.last_Name}`;
            res.send(`
              <script>
                localStorage.setItem('userID', '${userID}');
                localStorage.setItem('firstName', '${user.first_Name}');
                localStorage.setItem('middleName', '${user.middle_Name}');
                localStorage.setItem('lastName', '${user.last_Name}');
                window.location.href = "/dashboard";
              </script>
            `);
          }
        );
      } else {
        res.send(`
          <script>
            alert('Invalid login credentials');
            window.location.href = '/';
          </script>
        `);
      }
    }
  );
});

// Dashboard route with session check
app.get('/dashboard', (req, res) => {
  if (!req.session.userID) return res.redirect('/');
  res.sendFile(__dirname + '/mainPage/dashboard.html');
});

// GET /getItems endpoint
app.get('/getItems', (req, res) => {
  const query = `
    SELECT i.item_ID, i.item_name, i.item_price, i.item_type_ID, 
           COALESCE(SUM(s.item_quantity), 0) AS stock_quantity
    FROM item_tbl i
    LEFT JOIN item_stock_tbl s ON i.item_ID = s.item_ID
    GROUP BY i.item_ID
    ORDER BY i.item_type_ID
  `;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching items:", error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// GET /getManagers endpoint
app.get('/getManagers', (req, res) => {
  const query = `
    SELECT m.manager_ID, p.first_Name, p.middle_Name, p.last_Name
    FROM manager_tbl m
    JOIN staff_tbl s ON m.staff_ID = s.staff_ID
    JOIN person_tbl p ON s.person_ID = p.person_ID
  `;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching managers:", error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// GET /getWorkers endpoint
app.get('/getWorkers', (req, res) => {
  const query = `
    SELECT w.worker_ID, p.first_Name, p.last_Name, p.middle_Name
    FROM worker_tbl w
    JOIN staff_tbl s ON w.staff_ID = s.staff_ID
    JOIN person_tbl p ON s.person_ID = p.person_ID
  `;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching workers:", error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// GET /getGenders endpoint
app.get('/getGenders', (req, res) => {
  const query = `SELECT gender_ID, gender_name FROM gender_tbl`;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching genders:", error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// GET /getActiveOrders endpoint
app.get('/getActiveOrders', (req, res) => {
  const query = `
    SELECT 
      o.order_ID,
      CONCAT(p.first_Name, ' ', COALESCE(p.middle_Name, ''), ' ', p.last_Name) AS customer_name,
      e.event_Name,
      e.event_date AS event_start,
      e.end_event_date AS event_end,
      f.total_Amount AS total_price,
      ps.payment_status_name AS payment_status,
      CONCAT(mgr_p.first_Name, ' ', COALESCE(mgr_p.middle_Name, ''), ' ', mgr_p.last_Name) AS manager_name,
      CONCAT(a.street_Name, ', ', a.barangay_Name, ', ', a.city_Name) AS address
    FROM order_info_tbl o
    JOIN customer_tbl c ON o.customer_ID = c.customer_ID
    JOIN person_tbl p ON c.person_ID = p.person_ID
    JOIN event_info_tbl e ON o.order_ID = e.order_ID
    JOIN address_tbl a ON e.address_ID = a.address_ID
    JOIN manager_tbl m ON o.manager_ID = m.manager_ID
    JOIN staff_tbl s ON m.staff_ID = s.staff_ID
    JOIN person_tbl mgr_p ON s.person_ID = mgr_p.person_ID
    JOIN finance_tbl f ON o.order_ID = f.order_ID
    JOIN payment_status_tbl ps ON f.payment_status_ID = ps.payment_status_ID
  `;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching active orders:", error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// POST /createOrder endpoint
app.post('/createOrder', async (req, res) => {
  try {
    const {
      eventName, eventTimestamp, eventDuration, assignedManager,
      street, barangay, city,
      firstName, middleName, lastName, phoneNumber, age, gender,
      extraFees, grandSubtotal, items, workers
    } = req.body;
    const startDateObj = new Date(eventTimestamp);
    const durationDays = parseInt(eventDuration) || 0;
    const endDateObj = new Date(startDateObj.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const formatDateTime = (date) => {
      const yyyy = date.getFullYear();
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const hh = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      const ss = date.getSeconds().toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };
    const startDateFormatted = formatDateTime(startDateObj);
    const endDateFormatted = formatDateTime(endDateObj);
    let finalSubtotal = parseFloat(extraFees) || 0;
    if (Array.isArray(items)) {
      items.forEach(item => {
        finalSubtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
      });
    }
    const addressId = await insertAddress(street, barangay, city);
    const personId = await insertPerson(firstName, lastName, middleName, phoneNumber, age, gender);
    const customerId = await insertCustomer(personId);
    const orderId = await insertOrder(customerId, assignedManager);
    await insertEvent(orderId, eventName, addressId, startDateFormatted, endDateFormatted);
    await insertFinance(orderId, extraFees, grandSubtotal);
    await Promise.all([
      insertWorkers(orderId, workers),
      insertOrderDetails(orderId, items)
    ]);
    res.json({ message: "Order created successfully", orderId });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});
function insertAddress(street, barangay, city) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO address_tbl (street_Name, barangay_Name, city_Name) VALUES (?, ?, ?)";
    connection.query(sql, [street, barangay, city], (err, result) => { if (err) return reject(err); resolve(result.insertId); });
  });
}
function insertPerson(firstName, lastName, middleName, phoneNumber, age, gender) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO person_tbl (first_Name, last_Name, middle_Name, phone_Number, age, gender_ID) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql, [firstName, lastName, middleName, phoneNumber, age, gender], (err, result) => { if (err) return reject(err); resolve(result.insertId); });
  });
}
function insertCustomer(personId) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO customer_tbl (person_ID) VALUES (?)";
    connection.query(sql, [personId], (err, result) => { if (err) return reject(err); resolve(result.insertId); });
  });
}
function insertOrder(customerId, assignedManager) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO order_info_tbl (customer_ID, manager_ID) VALUES (?, ?)";
    connection.query(sql, [customerId, assignedManager], (err, result) => { if (err) return reject(err); resolve(result.insertId); });
  });
}
function insertEvent(orderId, eventName, addressId, startDateFormatted, endDateFormatted) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO event_info_tbl (order_Id, event_Name, address_ID, event_date, end_event_date) VALUES (?, ?, ?, ?, ?)";
    connection.query(sql, [orderId, eventName, addressId, startDateFormatted, endDateFormatted], (err) => { if (err) return reject(err); resolve(true); });
  });
}
function insertFinance(orderId, extraFees, grandSubtotal) {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO finance_tbl (order_ID, extra_Fee, total_Amount) VALUES (?, ?, ?)";
    connection.query(sql, [orderId, extraFees, grandSubtotal], (err) => { if (err) return reject(err); resolve(true); });
  });
}
function insertWorkers(orderId, workers = []) {
  return Promise.all(workers.map(workerId => {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO assigned_worker_tbl (worker_ID, order_ID) VALUES (?, ?)";
      connection.query(sql, [workerId, orderId], (err) => { if (err) return reject(err); resolve(true); });
    });
  }));
}
function insertOrderDetails(orderId, items = []) {
  return Promise.all(items.map(item => {
    return new Promise((resolve, reject) => {
      if (parseInt(item.quantity) > 0) {
        const sql = "INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES (?, ?, ?)";
        connection.query(sql, [orderId, item.item_ID, parseInt(item.quantity)], (err) => { if (err) return reject(err); resolve(true); });
      } else { resolve(true); }
    });
  }));
}
// GET /getOrderDetails endpoint
app.get('/getOrderDetails', (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });
  const orderQuery = `
    SELECT o.order_ID, o.customer_ID, o.manager_ID,
           e.event_Name, e.event_date, e.end_event_date,
           f.extra_Fee, f.total_Amount
    FROM order_info_tbl o
    JOIN event_info_tbl e ON o.order_ID = e.order_Id
    JOIN finance_tbl f ON o.order_ID = f.order_ID
    WHERE o.order_ID = ?
  `;
  connection.query(orderQuery, [orderId], (err, orderResults) => {
    if (err || orderResults.length === 0) return res.status(500).json({ error: "Order not found" });
    const orderData = orderResults[0];
    const customerQuery = `
      SELECT p.first_Name, p.middle_Name, p.last_Name, p.phone_Number, p.age, p.gender_ID
      FROM customer_tbl c
      JOIN person_tbl p ON c.person_ID = p.person_ID
      WHERE c.customer_ID = ?
    `;
    connection.query(customerQuery, [orderData.customer_ID], (err, customerResults) => {
      if (err || customerResults.length === 0) return res.status(500).json({ error: "Customer not found" });
      const customerData = customerResults[0];
      const detailsQuery = `SELECT * FROM order_details_tbl WHERE order_ID = ?`;
      connection.query(detailsQuery, [orderId], (err, detailsResults) => {
        if (err) return res.status(500).json({ error: "Error fetching order details" });
        const workersQuery = `SELECT worker_ID FROM assigned_worker_tbl WHERE order_ID = ?`;
        connection.query(workersQuery, [orderId], (err, workersResults) => {
          if (err) return res.status(500).json({ error: "Error fetching assigned workers" });
          res.json({
            order: orderData,
            customer: customerData,
            orderDetails: detailsResults,
            assignedWorkers: workersResults
          });
        });
      });
    });
  });
});
// PUT /updateOrder endpoint
app.put('/updateOrder', async (req, res) => {
  try {
    const { orderId, eventName, eventTimestamp, eventDuration, assignedManager,
      firstName, middleName, lastName, phoneNumber, age, gender,
      extraFees, grandSubtotal, items, workers } = req.body;
    const startDate = new Date(eventTimestamp);
    const durationDays = parseInt(eventDuration);
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const formatDateTime = date => {
      const yyyy = date.getFullYear();
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const hh = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      const ss = date.getSeconds().toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };
    const startDateFormatted = formatDateTime(startDate);
    const endDateFormatted = formatDateTime(endDate);
    const orderUpdateQuery = `UPDATE order_info_tbl SET manager_ID = ? WHERE order_ID = ?`;
    connection.query(orderUpdateQuery, [assignedManager, orderId]);
    const eventUpdateQuery = `UPDATE event_info_tbl SET event_Name = ?, event_date = ?, end_event_date = ? WHERE order_Id = ?`;
    connection.query(eventUpdateQuery, [eventName, startDateFormatted, endDateFormatted, orderId]);
    const financeUpdateQuery = `UPDATE finance_tbl SET extra_Fee = ?, total_Amount = ? WHERE order_ID = ?`;
    connection.query(financeUpdateQuery, [extraFees, grandSubtotal, orderId]);
    connection.query(`DELETE FROM order_details_tbl WHERE order_ID = ?`, [orderId], err => {
      if (err) console.error(err);
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (parseInt(item.quantity) > 0) {
            const sql = "INSERT INTO order_details_tbl (order_ID, item_ID, item_quantity) VALUES (?, ?, ?)";
            connection.query(sql, [orderId, item.item_ID, parseInt(item.quantity)]);
          }
        });
      }
    });
    connection.query(`DELETE FROM assigned_worker_tbl WHERE order_ID = ?`, [orderId], err => {
      if (err) console.error(err);
      if (Array.isArray(workers)) {
        workers.forEach(workerId => {
          const sql = "INSERT INTO assigned_worker_tbl (worker_ID, order_ID) VALUES (?, ?)";
          connection.query(sql, [workerId, orderId]);
        });
      }
    });
    res.json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});
// DELETE /deleteOrder endpoint
app.delete('/deleteOrder', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });
  const queries = [
    { query: "DELETE FROM order_details_tbl WHERE order_ID = ?", params: [orderId] },
    { query: "DELETE FROM assigned_worker_tbl WHERE order_ID = ?", params: [orderId] },
    { query: "DELETE FROM event_info_tbl WHERE order_Id = ?", params: [orderId] },
    { query: "DELETE FROM finance_tbl WHERE order_ID = ?", params: [orderId] },
    { query: "DELETE FROM order_info_tbl WHERE order_ID = ?", params: [orderId] }
  ];
  let promiseChain = Promise.resolve();
  queries.forEach(q => {
    promiseChain = promiseChain.then(() => {
      return new Promise((resolve, reject) => {
        connection.query(q.query, q.params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });
  });
  promiseChain
    .then(() => res.json({ message: "Order deleted successfully" }))
    .catch(err => {
      console.error("Error deleting order:", err);
      res.status(500).json({ error: "Failed to delete order" });
    });
});
app.listen(4500, () => {
  console.log("Server listening on port 4500");
});
