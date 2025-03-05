const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 4000;

app.use("/mainPage", express.static(__dirname + "/mainPage"));
app.use("/design", express.static(__dirname + "/design"));
app.use("/assets", express.static(__dirname + "/Assets"));
app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fernandez_tables_chairs_db',
  multipleStatements: true
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

app.post('/login', (req, res) => {
  const { userID, staffPassword } = req.body;
  const encryptedPassword = Buffer.from(staffPassword).toString('base64');

  const query = 'SELECT staff_id, staff_password FROM staff_tbl WHERE staff_id = ? AND staff_password = ?';
  db.query(query, [userID, encryptedPassword], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      console.log('Login successful');
      res.send({ success: true, redirectUrl: '/dashboard' });
    } else {
      console.log('Invalid login credentials');
      res.send({ success: false, message: 'Invalid credentials' });
    }
  });
});

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

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/dashboard', (_, res) => {
  res.sendFile(__dirname + '/mainPage/dashboard_main.html');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Access the website at http://localhost:4000');
});

