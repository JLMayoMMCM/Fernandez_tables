// This file can be used for testing server-side operations

/**
 * Example function to test database operations
 */
function testDatabaseConnection() {
  const mysql = require('mysql');
  
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fernandez_tables_chairs_db'
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to database successfully');
    
    // Test a simple query
    db.query('SELECT * FROM item_tbl LIMIT 5', (err, results) => {
      if (err) {
        console.error('Query error:', err);
        return;
      }
      console.log('Sample items:', results);
      db.end();
    });
  });
}

// Export functions for potential use in other files
module.exports = {
  testDatabaseConnection
};

// To run this file directly, uncomment the following line:
// testDatabaseConnection();
