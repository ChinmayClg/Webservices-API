const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const landRoutes = require("./routes/landRoutes");

const PORT = 5000;
const MONGO_URI = "mongodb://localhost:27017/landregistry";

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────
app.use("/api/lands", landRoutes);

// ── Health check ──────────────────────────────────────────
app.get("/", (_req, res) => {
    res.json({ status: "Land Registry API is running", version: "1.0.0" });
});

// ── Start ─────────────────────────────────────────────────
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`API base:  http://localhost:${PORT}/api/lands`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });
