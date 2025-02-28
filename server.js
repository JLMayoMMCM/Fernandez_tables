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




app.listen(4500);