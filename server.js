// server.js
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware for parsing URL-encoded and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (dashboard, design, assets, etc.)
app.use("/mainPage", express.static(__dirname + "/mainPage"));
app.use("/design", express.static(__dirname + "/design"));
app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.static(__dirname));

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fernandez_tables_chairs_db'
});

connection.connect(function(error) {
    if (error) {
        console.error('Error connecting to DB:', error);
    } else {
        console.log('Connected to DB');
    }
});

// Serve the main index page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// LOGIN route (existing functionality)
app.post("/", bodyParser.urlencoded({ extended: true }), (req, res) => {
    const userID = req.body.userID;
    const staffPassword = req.body.staffPassword;

    connection.query(
        'SELECT * FROM staff_TBL WHERE staff_ID = ? AND staff_Password = ?',
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

// Serve dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/mainPage/dashboard.html');
});

// GET /getItems endpoint: returns items with name, price, type and stock quantity, sorted by item_type_ID
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

// GET /getWorkers endpoint: returns worker_ID and worker name (from joined person_tbl)
app.get('/getWorkers', (req, res) => {
    const query = `
    SELECT
    p.first_Name,
    p.last_Name,
    p.middle_Name
    FROM
    worker_tbl w
    JOIN
    staff_tbl s ON w.staff_ID = s.staff_ID
    JOIN
    person_tbl p ON s.person_ID = p.person_ID;
    `;
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching workers:", error);
            return res.status(500).send(error);
        }
        res.json(results);
    });
});

// POST /createOrder endpoint: processes the order form submission and inserts into multiple tables
app.post('/createOrder', (req, res) => {
    const {
        eventName,
        eventDate,
        eventLocation,
        street,
        barangay,
        city,
        firstName,
        middleName,
        lastName,
        phoneNumber,
        age,
        gender,
        extraFees,
        items,
        workers
    } = req.body;

    // Insert customer/person information
    const personSql = `
        INSERT INTO person_tbl (first_Name, middle_Name, last_Name, phone_Number, age, gender)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(
        personSql,
        [firstName, middleName, lastName, phoneNumber, age, gender],
        (err, personResult) => {
            if (err) {
                console.error("Error inserting person:", err);
                return res.status(500).json({ error: "Failed to create order" });
            }
            const personId = personResult.insertId;

            // Insert customer record
            const customerSql = `INSERT INTO customer_tbl (person_ID) VALUES (?)`;
            connection.query(customerSql, [personId], (err, customerResult) => {
                if (err) {
                    console.error("Error inserting customer:", err);
                    return res.status(500).json({ error: "Failed to create order" });
                }
                const customerId = customerResult.insertId;

                // Insert address record
                const addressSql = `
                    INSERT INTO address_tbl (street_Name, barangay_Name, city_Name)
                    VALUES (?, ?, ?)
                `;
                connection.query(addressSql, [street, barangay, city], (err, addressResult) => {
                    if (err) {
                        console.error("Error inserting address:", err);
                        return res.status(500).json({ error: "Failed to create order" });
                    }
                    const addressId = addressResult.insertId;

                    // Insert event information (using eventLocation as event_description)
                    const eventSql = `
                        INSERT INTO event_info_tbl (event_date, address_ID, customer_ID, event_description)
                        VALUES (?, ?, ?, ?)
                    `;
                    connection.query(
                        eventSql,
                        [eventDate, addressId, customerId, eventLocation],
                        (err, eventResult) => {
                            if (err) {
                                console.error("Error inserting event info:", err);
                                return res.status(500).json({ error: "Failed to create order" });
                            }
                            const eventId = eventResult.insertId;

                            // Insert order record (staff_ID is assumed; here using a placeholder value 1)
                            const staffID = 1;
                            const orderSql = `
                                INSERT INTO order_info_tbl (event_ID, staff_ID, extra_fees)
                                VALUES (?, ?, ?)
                            `;
                            connection.query(
                                orderSql,
                                [eventId, staffID, extraFees],
                                (err, orderResult) => {
                                    if (err) {
                                        console.error("Error inserting order info:", err);
                                        return res.status(500).json({ error: "Failed to create order" });
                                    }
                                    const orderId = orderResult.insertId;

                                    // Insert order details for each selected item
                                    let orderDetailsPromises = items.map(item => {
                                        return new Promise((resolve, reject) => {
                                            if (item.quantity > 0) {
                                                const detailsSql = `
                                                    INSERT INTO order_details_tbl (order_ID, item_ID, quantity, price)
                                                    VALUES (?, ?, ?, ?)
                                                `;
                                                connection.query(
                                                    detailsSql,
                                                    [orderId, item.item_ID, item.quantity, item.price],
                                                    (err, detailsResult) => {
                                                        if (err) return reject(err);
                                                        resolve(detailsResult);
                                                    }
                                                );
                                            } else {
                                                resolve();
                                            }
                                        });
                                    });

                                    Promise.all(orderDetailsPromises)
                                      .then(() => {
                                          // If there are assigned workers, insert each into the assigned_worker_tbl
                                          if (workers && workers.length > 0) {
                                              let workerPromises = workers.map(workerId => {
                                                  return new Promise((resolve, reject) => {
                                                      const workerSql = `
                                                          INSERT INTO assigned_worker_tbl (worker_ID, order_ID)
                                                          VALUES (?, ?)
                                                      `;
                                                      connection.query(
                                                          workerSql,
                                                          [workerId, orderId],
                                                          (err, workerResult) => {
                                                              if (err) return reject(err);
                                                              resolve(workerResult);
                                                          }
                                                      );
                                                  });
                                              });

                                              Promise.all(workerPromises)
                                                .then(() => {
                                                    res.json({ message: "Order created successfully", orderId });
                                                })
                                                .catch(err => {
                                                    console.error("Error inserting assigned workers:", err);
                                                    res.status(500).json({ error: "Failed to create order" });
                                                });
                                          } else {
                                              res.json({ message: "Order created successfully", orderId });
                                          }
                                      })
                                      .catch(err => {
                                          console.error("Error inserting order details:", err);
                                          res.status(500).json({ error: "Failed to create order" });
                                      });
                                }
                            );
                        }
                    );
                });
            });
        }
    );
});

// Listen on port 4500
app.listen(4500, () => {
    console.log("Server listening on port 4500");
});