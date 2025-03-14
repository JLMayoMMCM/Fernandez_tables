# Fernandez Tables - Event Equipment Rental Management System

A comprehensive web-based management system for Fernandez Tables, designed to streamline the process of managing event equipment rentals, staff, inventory, and financial transactions.

## Features

### 1. Order Management
- Create and modify event equipment rental orders
- Track order status and history
- Manage event details including dates, duration, and location
- Assign managers and workers to events

### 2. Inventory Management
- Track equipment stock levels (tables, chairs, and miscellaneous items)
- Add and modify inventory items
- Monitor stock movements
- Manage supplier information

### 3. Staff Management
- Maintain staff information and profiles
- Track worker assignments to events
- Manage staff availability
- Handle staff authentication and access control

### 4. Financial Management
- Process payments and track transactions
- Handle multiple payment methods
- Monitor order balances
- Track liabilities and extra fees
- Generate financial summaries

### 5. Customer Management
- Store and manage customer information
- Track customer order history
- Maintain customer contact details

## Technical Stack

- **Frontend:**
  - HTML5
  - CSS3 (with responsive design)
  - JavaScript (Vanilla)
  
- **Backend:**
  - Node.js
  - Express.js
  - MySQL Database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Fernandez_tables.git
```

2. Install dependencies:
```bash
cd Fernandez_tables/Server/
npm install mysql
npm install express
npm install express-session
npm install body-parser
npm install bcrypt
```

3. Set up the database:
- Create a MySQL database
- Import the provided SQL schema
- Configure database connection in `Server/server.js`

4. Start the server:
```bash
node server.js
```

5. Access the application:
- Open your browser and navigate to `http://localhost:4000`

## Project Structure

```
Fernandez_tables/
├── CSS/                 # Stylesheet files
├── Images/             # Image assets
├── Pages/              # HTML pages
├── Scripts/            # Client-side JavaScript
├── Server/             # Server-side code
├── models/             # Database models
├── controllers/        # Business logic
└── src/               # Source files
```

## Usage

1. **Login System**
   - Secure authentication for staff members
   - Role-based access control

2. **Dashboard**
   - Overview of active orders
   - Quick access to all main features
   - Real-time updates

3. **Order Processing**
   - Create new orders with customer details
   - Select equipment and quantities
   - Assign staff to orders
   - Track order status

4. **Inventory Control**
   - Add/modify inventory items
   - Track stock levels
   - Manage suppliers
   - Stock movement history

5. **Financial Operations**
   - Process payments
   - Track transactions
   - Manage liabilities
   - Generate reports

## Security Features

- Password encryption
- Session management
- Input validation
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact [jlmayo@mcm.edu.ph].

## Acknowledgments

- Development Team
- Fernandez Tables management
- All contributors to this project
