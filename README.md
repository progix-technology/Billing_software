# PRO Billing Software (Desktop & Cloud ERP System)

> **Enterprise-grade MERN + Electron Desktop Billing, Inventory, GST, and Accounting ERP System with Hardware-Locked Smart Licensing & SuperAdmin Cloud SaaS Engine.**

---

## 📌 Project Overview

**PRO Billing Software** is a complete, production-ready ERP and POS billing solution engineered for retail stores, wholesalers, supermarkets, and enterprise businesses. 

It functions seamlessly in two complementary modes:
1. **Offline Desktop Application (Electron + Embedded NeDB)**: Runs completely offline on client Windows PCs without requiring an external MongoDB server or cloud internet connection.
2. **SuperAdmin Cloud SaaS Portal (React + Express + MongoDB Atlas)**: Centralized cloud dashboard for software distributors to remotely manage clients, issue hardware-bound activation keys, track subscription validity, and configure licensing tiers.

---

## 🚀 Key Highlights & Business Capabilities

### 1. ⚡ POS Billing & Invoicing Terminal
* **Fast Scanner Checkout**: Instant product search by name, barcode scanner simulation, and real-time cart adjustments.
* **Multi-Format Printing**:
  * **A4 Full Tax Invoice**: Detailed GST breakdown, HSN/SAC table, banking info, and terms.
  * **A5 Compact Invoice**: Space-saving dual-slip format.
  * **80mm POS Thermal Receipt**: Optimized for thermal receipt printers with cut margins.
* **Vector PDF Generation**: Uses Electron native Chromium IPC (`save-invoice-pdf`) for pixel-perfect vector PDF output.
* **Flexible Payments**: Cash, Card, UPI, and **Credit (Udhari/Dues)** with automatic ledger reconciliation.

### 2. 📦 Inventory & Stock Management
* Full product catalog with Purchase Cost, Selling Price, MRP, GST rate, Unit, and Barcode.
* Real-time automated stock deduction on POS checkout sales.
* Low-stock warnings and critical inventory threshold alerts.
* Complete stock audit ledger (`InventoryLog`) recording all inward/outward adjustments with audit timestamps.

### 3. 👥 Customer & Supplier Khata (Ledger)
* Complete ledger balances for credit customers and wholesale suppliers.
* Partial payment receipts, outstanding balances, and settlement history.
* Export customer/supplier transaction statements.

### 4. 📊 GST Taxation & Financial Reports
* Automated calculation and split for **CGST**, **SGST**, and **IGST**.
* Profit & Loss (P&L) computation: Gross Turnover, Cost of Goods Sold (COGS), Operating Expenses, and Net Profit.
* One-click direct export of analytical reports to Microsoft Excel spreadsheets (`.xlsx`).

### 5. 💾 Database Backup & System Settings
* Full database JSON dump export and restore tools.
* Custom invoice design preferences, store logo upload, invoice prefixes, and thermal printer formatting.

---

## 🔒 Enterprise Hardware-Locked Licensing System

PRO Billing Software features a **5-layer cryptographic hardware licensing engine**:

```
+-------------------------------------------------------------------------------+
|                             CLIENT PC (OFFLINE)                               |
|                                                                               |
|  1. Fresh Install ----> Displays Unique Machine Hardware ID                   |
|                         (e.g., PRGX-776E-AB6E-25E9)                           |
|                                     │                                         |
|                                     ▼ (Sent to SuperAdmin)                    |
+─────────────────────────────────────┼─────────────────────────────────────────+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                         SUPERADMIN MASTER PORTAL                              |
|                                                                               |
|  2. SuperAdmin Enters: Machine ID + Plan + Validity + Client Credentials      |
|  3. Engine Encrypts: AES-256-CBC Smart License Key                            |
|     (Encodes: Machine ID, Username, Email, Password, Store Name, Validity)    |
|                                     │                                         |
|                                     ▼ (Sent back to Client)                   |
+─────────────────────────────────────┼─────────────────────────────────────────+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                             CLIENT PC (OFFLINE)                               |
|                                                                               |
|  4. Client Enters Key on /activate Screen                                     |
|  5. Local Backend Decrypts & Verifies Hardware Fingerprint                     |
|  6. SmartKey Auto-Provisions:                                                 |
|     • Creates Admin User with Encrypted Password                              |
|     • Marks Store Profile & Setup Completed                                   |
|     • Digitally Seals license.db with HMAC-SHA256                             |
|  7. Auto-redirects to Login Screen with Pre-filled Email                      |
|  8. Day 31 / Expiry: Software Freezes & Locks Backend with HTTP 403 Forbidden |
+-------------------------------------------------------------------------------+
```

### Security Defenses:
1. **Zero Public Registration**: Public signup is permanently disabled (`403 Forbidden`). Only SuperAdmin-issued keys can provision store accounts.
2. **Machine Hardware Fingerprint**: Cryptographically bound to the client's CPU, motherboard, and OS network identifiers. A key generated for PC-A **cannot be used on PC-B**.
3. **AES-256-CBC Encrypted Smart Keys**: Keys (`PRGX-KEY-...`) embed admin credentials and validity. Modifying any character invalidates the key.
4. **Anti-Clock Rollback Protection**: Detects manual Windows date/time rollback attempts to bypass expiry and immediately locks the software.
5. **HMAC-SHA256 Storage Seal**: Prevents manual editing of `license.db` using Notepad. Any unauthorized edit breaks the seal and revokes access.
6. **Backend Mutation Lockout**: All invoice, product, customer, supplier, and payment endpoints are shielded by `checkLicense` middleware.

---

## 🗂️ Folder Structure

```text
Billin_Softwarr_1/
├── assets/                     # Application icons and splash art
├── main.js                     # Electron main process (Window lifecycle & PDF IPC)
├── package.json                # Root Electron & electron-builder packaging config
│
├── backend/                    # Node.js + Express REST API Server
│   ├── config/
│   │   ├── db.js               # NeDB local database initialization
│   │   ├── nedbAdapter.js      # Mongoose-compatible NeDB adapter factory
│   │   └── autoSeed.js         # Offline seed controller
│   ├── controllers/            # Business logic (POS, Products, Customers, etc.)
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification & RBAC authorization
│   │   ├── licenseMiddleware.js# Hardware validity & subscription gatekeeper
│   │   └── errorMiddleware.js  # Global exception formatters
│   ├── models/                 # Database models (User, Invoice, Product, etc.)
│   ├── routes/                 # Express REST API endpoints
│   ├── services/
│   │   └── licenseService.js   # Cryptographic key generator, validator & seal engine
│   ├── superadmin/             # MongoDB Atlas Cloud SaaS engine & SuperAdmin APIs
│   │   ├── config/cloudDb.js   # MongoDB Atlas connection
│   │   ├── controllers/        # SuperAdmin auth & tenant onboarding
│   │   ├── models/             # Cloud models (SuperAdmin, ClientAdmin, LicenseKey)
│   │   └── routes/             # Protected SuperAdmin cloud endpoints
│   └── server.js               # Express server runner entrypoint (Port 5000)
│
├── frontend/                   # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/         # Splash screens, Activation modals
│   │   │   ├── Layout/         # Header, Sidebar, AdminLayout, SuperAdminLayout
│   │   │   └── UI/             # Skeleton loaders, interactive badges
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # JWT state & strict session separation
│   │   │   ├── SettingsContext.jsx # Store settings & invoice configuration
│   │   │   └── ThemeContext.jsx# Light/Dark mode state
│   │   ├── pages/
│   │   │   ├── ActivateSoftware.jsx # Hardware ID display & key activation
│   │   │   ├── Login.jsx            # Store admin sign-in (with secret SuperAdmin button)
│   │   │   ├── Dashboard.jsx        # Business statistics, chart metrics & widgets
│   │   │   ├── Billing.jsx          # POS terminal, barcode scanner & printing
│   │   │   ├── Products.jsx, Categories.jsx, Customers.jsx, Suppliers.jsx
│   │   │   ├── Inventory.jsx, Reports.jsx, Settings.jsx, Profile.jsx
│   │   │   └── SuperAdminDashboard.jsx # Multi-tenant management & key generation
│   │   ├── App.jsx             # React routing & license redirection rules
│   │   └── main.jsx            # React root mount
│   ├── vite.config.js          # Vite config (Port 3001, proxy to 5000)
│   └── package.json            # Frontend Vite React dependencies
│
└── dist/                       # Output directory for Windows NSIS .exe setup installer
```

---

## 🛠️ Local Development & Running

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher recommended).
* Windows 10/11 (for building NSIS `.exe` installers).

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express development server:
   ```bash
   npm run dev
   ```
   *The server starts on port `5000` with local storage at `%APPDATA%\billing-software\data`.*

### 2. Frontend Setup
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The UI will boot up on `http://localhost:3001`.*

### 3. Desktop Electron App (Local Test)
From the project root:
```bash
npm start
```
*Launches the application inside a native Electron desktop window.*

---

## 📦 Building the Production Windows Installer (.exe)

To bundle the entire software into a standalone, single-file Windows installer (`.exe`):

1. **Build the Frontend static bundle**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
2. **Package the Desktop Installer**:
   ```bash
   npm run dist
   ```

*The generated installer will be saved in the `dist/` directory:*
`dist/PRO Billing Software Setup 1.0.0.exe`

This `.exe` includes:
* Embedded Node.js runtime & Express backend
* Embedded NeDB zero-configuration local database
* Built React frontend distribution
* NSIS one-click desktop installer with automatic desktop shortcut

---

## 🔑 Software Activation & SuperAdmin Workflow

### Step 1: Client Installs Software
1. Client runs `PRO Billing Software Setup 1.0.0.exe`.
2. App opens directly to the **Software Activation Screen (`/activate`)**.
3. Client clicks **"Copy ID"** to copy their unique **Machine Hardware ID** (e.g. `PRGX-776E-AB6E-25E9`).
4. Client sends the Hardware ID to SuperAdmin via WhatsApp or Email.

### Step 2: SuperAdmin Generates Activation Key
1. SuperAdmin opens the **SuperAdmin Portal** (`/superadmin/login` or via the discreet button in the bottom-right corner of the login screen).
2. SuperAdmin logs in with master credentials.
3. Clicks **"+ Onboard New Tenant"** or **"Generate License Key"**.
4. Enters:
   * Client Business / Store Name
   * Client's Machine Hardware ID
   * Plan (Silver, Gold, Platinum, Lifetime) & Duration (e.g., 30 days, 365 days)
   * Admin Email & Admin Password
5. Clicks **Create**: A Smart Activation Key (`PRGX-KEY-...`) is generated.
6. SuperAdmin shares the **Key** and **Login Credentials** with the client.

### Step 3: Client Unlocks Software
1. Client pastes the Activation Key into the activation screen and clicks **"Verify & Activate Software"**.
2. Software verifies hardware binding, provisions the Admin account, marks store setup as complete, and redirects to the **Login Screen**.
3. Client signs in with their Email & Password and accesses their Store Dashboard!

---

## 🛡️ License

Proprietary Software — Developed by **Progix Technology**.  
All rights reserved. Unauthorized reproduction, modification, or distribution is strictly prohibited.
