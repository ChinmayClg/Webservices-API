const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const landRoutes = require("./routes/landRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/lands", landRoutes);

// Health check
app.get("/", (_req, res) => {
    res.json({ status: "Land Registry API is running", version: "1.0.0" });
});

// Start server
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    });