# Enterprise Billing, Inventory, GST, and Customer ERP Management System

This is a complete production-ready, modular enterprise-grade ERP system built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). 

---

## Technical Stack & Features

*   **Frontend**: React.js (Vite single page app) + Tailwind CSS + Lucide Icons.
*   **Backend**: Node.js + Express.js REST API + Mongoose ODM.
*   **Database**: MongoDB (Atlas or local server).
*   **Security & Auth**: JWT-based session protection, Bcrypt hashing, Role-Based Access Control (`admin`, `manager`, `staff`).
*   **POS Terminal**: Interactive checkout scanner simulation, auto invoice serial number generator, instant printable invoices (A4 invoice layout and 80mm POS receipt layout), and direct PDF downloads.
*   **GST Taxation**: CGST, SGST, and IGST computations, tax categories summary slabs, and invoice breakdowns.
*   **Inventory Logs & Ledger**: Global stock transaction logs, automatic inventory adjustments on checkout sales, manual stock auditive inward records, and customer/supplier ledger balances.
*   **Analytical Reports**: Profit & Loss calculations (Gross turnover, COGS cost, Overheads expenses, Net clean profit), and direct exports to Excel spreadsheets.
*   **Settings Backup**: Export and Import entire database collections as JSON dumps.

---

## Folder Architecture

```text
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # User register, login, reset tokens
│   │   ├── categoryController.js
│   │   ├── customerController.js
│   │   ├── dashboardController.js
│   │   ├── expenseController.js
│   │   ├── invoiceController.js# Sales POS billing, PDF rendering
│   │   ├── paymentController.js# Inbound & outbound clear dues
│   │   ├── productController.js# Product CRUD & stock alerts
│   │   ├── reportController.js # GST slabs, profit calculations, Excel sheets
│   │   └── settingsController.js# DB JSON backups
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT guards, Role authorization
│   │   └── errorMiddleware.js  # Global exception formatters
│   ├── models/
│   │   ├── User.js, Product.js, Category.js, Customer.js, Supplier.js,
│   │   ├── Invoice.js, Payment.js, Expense.js, InventoryLog.js, ActivityLog.js
│   ├── routes/                 # Express API routes mappings
│   ├── .env                    # Secret environment values
│   ├── package.json            # Node backend dependencies
│   └── server.js               # Express server runner entrypoint
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/         # Sidebar, Header, AdminLayout wrappers
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # JWT state, Axios interceptor
│   │   │   └── ThemeContext.jsx# Dark/Light mode manager
│   │   ├── pages/
│   │   │   ├── Login.jsx, Signup.jsx, ForgotPassword.jsx, ResetPassword.jsx
│   │   │   ├── Dashboard.jsx   # Stats widgets, SVG line chart
│   │   │   ├── Billing.jsx     # POS Terminal, Checkout, Printouts (A4/POS)
│   │   │   ├── Products.jsx, Categories.jsx, Customers.jsx, Suppliers.jsx,
│   │   ├── App.jsx             # React routing configurations
│   │   ├── index.css           # Tailwind base styles, custom scrollbars
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML base templates
│   ├── postcss.config.js
│   ├── tailwind.config.js      # Dark mode selector theme configurations
│   ├── vite.config.js          # Port 3001 mapping, API proxies configuration
│   └── package.json            # Frontend Vite React dependencies
```

---

## Local Setup Instructions

### Prerequisites
1. Install [Node.js](https://nodejs.org) (v18+ recommended).
2. Install and start [MongoDB Local Server](https://www.mongodb.com/try/download/community) or prepare a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI string.

### 1. Setup Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm package dependencies:
   ```bash
   npm install
   ```
3. Verify environment variables in the `backend/.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/billing-software
   JWT_SECRET=supersecretjwtkeyforbillingsoftware12345
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Start the server in hot-reload development mode:
   ```bash
   npm run dev
   ```
   *The server will boot up and print: `Server running in development mode on port 5000`.*

### 2. Setup Frontend
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot up the Vite dev server locally:
   ```bash
   npm run dev
   ```
   *Vite will boot up on `http://localhost:3001`.*

---

## Testing Simulation Walkthrough

1. Open `http://localhost:3001` in your web browser.
2. Select **Sign Up** from the footer link. Register your first account (choose `Admin` role to obtain unrestricted master control).
3. Log in with your new email/username and password.
4. Go to **Categories** and add standard groups (e.g., *Electronics*, *Groceries*).
5. Go to **Products** and register a few items (e.g. *LED Monitor*, Cost: 8000, Sell: 12000, GST: 18%, stock: 20 units).
6. Go to **Customers** and register a walk-in or wholesale client (e.g. *Rajesh Kumar*).
7. Navigate to the **POS Billing** page:
    *   Search for "Rajesh" in the customer search input and select him.
    *   Search for "LED" in the product input, adjust the cart quantity, and apply an item discount if desired.
    *   Select your payment method (e.g., *Credit Billing* to test customer balance tracking, or *Cash payment*).
    *   Click **Execute POS Checkout**.
    *   The print layout preview modal will pop open. Review the **A4 Invoice format** or the **80mm Thermal Receipt layout**, trigger the print command, or test the **Download PDF** option.
8. Check **Dashboard** to see the turnover update, outstanding dues balances, and the daily sales analytical graph.
9. Export custom logs under **Reports** to Excel spreadsheets or verify the database **Settings** backup options.

---

## Production Deployment Guide

To deploy this billing software to a cloud production hosting provider:

### 1. Database (MongoDB Atlas)
1. Register on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free shared cluster.
2. Under "Network Access", allow your server IP (or `0.0.0.0/0` for initial testing).
3. Under "Database Access", create a readWrite db user and copy the connection URI string.

### 2. Backend API Hosting (e.g. Render, Railway, AWS EC2)
1. Link your Git repository containing the codebase.
2. Deploy the `backend` subdirectory.
3. Configure the environment variables in the dashboard:
   *   `NODE_ENV=production`
   *   `PORT=80` (or leave default port mapping)
   *   `MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname`
   *   `JWT_SECRET=use_a_very_long_secure_random_hash_string`
   *   `JWT_EXPIRE=30d`
4. Deploy the build. The web app service will start listening.

### 3. Frontend Static Hosting (e.g. Vercel, Netlify)
1. Change the base URL configuration in `frontend/src/context/AuthContext.jsx` from blank to your live deployed backend API URL (e.g. `https://my-billing-api.onrender.com`).
2. Build the production build output files:
   ```bash
   cd frontend
   npm run build
   ```
3. Deploy the resulting `/dist` folder output to Vercel or Netlify.
4. Set up custom URL rewrite rules (e.g. `_redirects` file with `/* /index.html 200` in Netlify) to support React Router single-page navigation.
