# PRO Billing Software — SuperAdmin Cloud Portal & License Server

Cloud-centralized management portal for PRO Billing Software desktop installations across India. Connects directly to **MongoDB Atlas Cloud**.

---

## 🚀 Live Cloud Deployment Guide (2 Minutes)

### 1. Deploy Backend on Render (Free Tier)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **"New +" -> "Web Service"**.
2. Connect your Git repository.
3. Configure the service:
   - **Root Directory:** `superadmin-portal/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add **Environment Variables** in Render:
   - `MONGO_URI`: `mongodb+srv://progixtechnology_db_user:H7uh3siFqBmeqveH@cluster0.eb6dcjz.mongodb.net/billing-software?retryWrites=true&w=majority&appName=cluster0`
   - `JWT_SECRET`: `superadmin_cloud_secret_jwt_key_progix_2026_secure`
   - `SUPERADMIN_EMAIL`: `superadmin@gmail.com`
   - `SUPERADMIN_PASSWORD`: `Password@123`
   - `NODE_ENV`: `production`
5. Click **"Deploy Web Service"**.
6. Render will generate your live backend API URL (e.g., `https://progix-billing-api.onrender.com`).

---

### 2. Deploy Frontend on Vercel (Free Tier)
1. Go to [vercel.com](https://vercel.com/) and click **"Add New" -> "Project"**.
2. Select your repository.
3. In **Root Directory**, click Edit and select: `superadmin-portal/frontend`.
4. In **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://progix-billing-api.onrender.com`).
5. Click **"Deploy"**.
6. You will get your SuperAdmin Portal live link (e.g., `https://progix-admin.vercel.app`).
   - You can now open this link in any **Mobile or Desktop browser** anywhere in the world!

---

## 💻 Running Locally (For Testing)

### Backend:
```bash
cd superadmin-portal/backend
npm install
node server.js
# Runs on http://localhost:5001
```

### Frontend:
```bash
cd superadmin-portal/frontend
npm install
npm run dev
# Opens on http://localhost:3001
```

---

## 🔑 Default SuperAdmin Credentials:
- **Email:** `superadmin@gmail.com`
- **Password:** `Password@123`
*(You can change your password anytime from the Settings page in the portal).*
