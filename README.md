# Land Registry API — MERN Stack Lab Guide

> **Stack:** MongoDB, Express.js, React (Vite), Node.js (MERN)
> **Domain:** Land / Property Registration System

---

## Aim

To build, run, and test a full-stack Land Registry application using the MERN stack, replacing the previous Google Apps Script and Google Sheets implementation.

---

## Architecture Overview

### Backend (Node.js + Express + MongoDB)
- **Database:** MongoDB (`mongodb://localhost:27017/landregistry`)
- **Server:** Express API running on port `5000`
- **Models:** Built with Mongoose (`Land`, `Transaction`)
- **Endpoints:** Located in `server/routes/landRoutes.js`

### Frontend (React + Vite)
- **Framework:** React 19 (via Vite)
- **Server:** Dev server running on port `5173`
- **Styling:** Custom CSS with dark theme (glassmorphism)
- **Routing:** React Router v7

---

## Prerequisites

1. **Node.js** v18+ installed
2. **MongoDB** installed and running locally on port 27017
   - *Alternatively, edit `server/index.js` and `server/seed.js` to use a MongoDB Atlas URI.*

---

## Setup & Running Instructions

### 1. Start MongoDB
Ensure your local MongoDB server is running.

### 2. Setup the Backend
Open a terminal in the `server` directory:

```bash
cd server
npm install
npm run seed   # This will create the DB and insert 10 dummy lands + 1 transaction
npm run dev    # Starts the Express API on http://localhost:5000
```

### 3. Setup the Frontend
Open another terminal in the `client` directory:

```bash
cd client
npm install
npm run dev    # Starts the Vite React app on http://localhost:5173
```

### 4. Access the App
Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

## Publishing the API & App (Deployment)

To make your Land Registry available on the public internet, you can deploy it for free using services like Render or Vercel, paired with MongoDB Atlas.

### 1. Database Hosting (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Build a new free shared cluster.
3. Under **Database Access**, create a user and password.
4. Under **Network Access**, click "Add IP Address" and allow access from anywhere (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** and copy your `MONGO_URI` connection string.
   *(It will look like: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/landregistry`)*

### 2. Backend Hosting (Render)
1. Push your `WebServices API` folder to a GitHub repository.
2. Go to [Render.com](https://render.com) and create an account.
3. Click **New** → **Web Service** and connect your GitHub repo.
4. Settings:
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node index.js`
5. Click **Advanced**, add an Environment Variable:
   - Key: `MONGO_URI`
   - Value: `(Paste your MongoDB Atlas connection string here)`
6. Click **Create Web Service**. Render will give you a public URL for your API (e.g., `https://land-registry-api.onrender.com`).

### 3. Frontend Hosting (Vercel)
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New** → **Project** and import your repository.
3. Edit the settings:
   - Framework Preset: `Vite`
   - Root Directory: `client`
4. Before clicking Deploy, update your Vite proxy or hardcode the backend URL in your React app so it points to your new Render API URL instead of `localhost:5000`.
5. Click **Deploy**. Your React interface is now live!

---

## API Endpoints Reference

Base URL (when running locally): `http://localhost:5000/api/lands`

### 1. `GET /api/lands` — List / Filter Records
List all records. Supports extensive query string filtering:
- Partial text match: `location`, `taluka`, `district`, `state`, `owner_name`, `land_type`, `sub_registrar_office`
- Exact match: `survey_number`, `pincode`, `status`, `year`
- Number ranges: `year_from`, `year_to`, `min_value`, `max_value`, `min_area`, `max_area`

**Example:** `GET /api/lands?state=Maharashtra&status=Active&min_value=5000000`

### 2. `GET /api/lands/:id` — Get Single Record
Fetch a single land record by its `registration_id`.

**Example:** `GET /api/lands/LR-2019-10021`

### 3. `POST /api/lands` — Register New Land
Creates a new record. Auto-generates `registration_id` if successful.

**Required JSON Body Fields:**
`owner_name`, `owner_contact`, `owner_aadhaar_last4`, `survey_number`, `location`, `taluka`, `district`, `state`, `pincode`, `area_sqft`, `land_type`, `market_value_inr`, `stamp_duty_inr`, `sub_registrar_office`

### 4. `PUT /api/lands/:id/transfer` — Transfer Ownership
Transfers ownership and automatically writes to the `Transaction` collection.

**Required JSON Body Fields:**
`new_owner_name`, `new_owner_contact`
*(Optional: `new_owner_aadhaar_last4`, `reason`)*

### 5. `PATCH /api/lands/:id` — Update Land Details
Patch any subset of fields on an existing record.

**Updatable Fields:**
`location`, `taluka`, `district`, `state`, `pincode`, `area_sqft`, `land_type`, `market_value_inr`, `stamp_duty_inr`, `sub_registrar_office`, `status`, `owner_contact`

---

## Client Features (React UI)

| Page | Path | Description |
|------|------|-------------|
| **Search Lands** | `/` | 13-field dynamic filter + results data table |
| **Land Detail** | `/land/:id` | Detailed grid view of all 18 fields for a specific property |
| **Register Land**| `/register` | 14-field form with client-side validation |
| **Transfer** | `/transfer` | Dedicated ownership transfer workflow |
| **Update Land** | `/update` | Fetch-modify-save two-step workflow |

---

## Technical Notes

- The React frontend uses Vite's built-in proxy (configured in `vite.config.js`) to route requests to `/api/*` to the Express backend (`http://localhost:5000`) to avoid CORS errors during development.
- Data structures map closely to the former spreadsheet model but now utilize proper Mongoose schemas with data types, enums, required fields, and DB indexes.
