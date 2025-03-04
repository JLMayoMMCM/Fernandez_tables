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

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fernandez_tables_chairs_db'
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

