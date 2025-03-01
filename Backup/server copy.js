//to install just type npm install {insert package name here}
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const encoder = bodyParser.urlencoded();
const app = express();

app.use("/mainPage", express.static(__dirname + "/mainPage"));
app.use("/design", express.static(__dirname + "/design"));
app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.static(__dirname));


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fernandez_tables_chairs_db'
});

connection.connect(function(error) {
    if (error) {
        console.log('Error');
    } else {
        console.log('Connected');
    }
}); 

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post("/", encoder, function(req, res) {
    var userID = req.body.userID;
    var staffPassword = req.body.staffPassword;

    connection.query('SELECT * FROM staff_TBL WHERE staff_ID = ? AND staff_Password = ?', 
    [userID, staffPassword], function(error, results) {
        if (results.length > 0) {
            // User is authenticated, now fetch personal details
            connection.query(
                `SELECT p.first_Name, p.middle_Name, p.last_Name 
                 FROM person_tbl p 
                 JOIN staff_tbl s ON p.person_ID = s.person_ID 
                 WHERE s.staff_ID = ?`,
                [userID],
                function(err, userResults) {
                    if (err || userResults.length === 0) {
                        return res.send('Login failed');
                    }

                    let user = userResults[0];
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
            res.send(
                `<script>
                    alert('Invalid login credentials');
                    window.location.href = '/';
                </script>`
            );
        }
    });
});

app.get('/dashboard', function(req, res) {
    res.sendFile(__dirname + '/mainPage/dashboard.html');
});


app.get('/getEventCustomerInfo/:customerID', (req, res) => {
    const customerID = req.params.customerID;

    const query = `
        SELECT e.event_ID, e.event_date, a.street_Name, a.barangay_Name, a.city_Name,
               c.customer_ID, p.first_Name, p.middle_Name, p.last_Name, p.phone_Number
        FROM event_info_tbl e
        JOIN address_tbl a ON e.address_ID = a.address_ID
        JOIN customer_tbl c ON e.customer_ID = c.customer_ID
        JOIN person_tbl p ON c.person_ID = p.person_ID
        WHERE e.customer_ID = ?`;

    connection.query(query, [customerID], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.json(results.length > 0 ? results[0] : {});
        }
    });
});

app.get('/getItems', (req, res) => {
    const query = `
        SELECT i.item_ID, i.item_name, i.item_price, i.item_type_ID, 
               COALESCE(SUM(s.item_quantity), 0) AS stock_quantity
        FROM item_tbl i
        LEFT JOIN item_stock_tbl s ON i.item_ID = s.item_ID
        GROUP BY i.item_ID`;

    connection.query(query, (error, results) => {
        if (error) res.status(500).send(error);
        else res.json(results);
    });
});




app.listen(4500);