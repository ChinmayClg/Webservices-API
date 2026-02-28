const express = require("express");
const router = express.Router();
const Land = require("../models/Land");
const Transaction = require("../models/Transaction");

// ─── Helper: generate a unique registration ID ──────────────
async function generateRegistrationId(year) {
    let id;
    let exists = true;
    while (exists) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        id = `LR-${year}-${rand}`;
        exists = await Land.findOne({ registration_id: id });
    }
    return id;
}

// ─── 1. GET /api/lands  —  List all with optional filters ────
router.get("/", async (req, res) => {
    try {
        const q = req.query;
        const filter = {};

        // String partial-match filters (case-insensitive regex)
        const partialFields = [
            "location", "taluka", "district", "state",
            "owner_name", "land_type", "sub_registrar_office",
        ];
        partialFields.forEach((f) => {
            if (q[f]) filter[f] = { $regex: q[f], $options: "i" };
        });

        // Exact-match filters
        if (q.survey_number) filter.survey_number = q.survey_number;
        if (q.pincode) filter.pincode = q.pincode;
        if (q.status) filter.status = { $regex: `^${q.status}$`, $options: "i" };

        // Year filters
        if (q.year) filter.year_of_registration = Number(q.year);
        else {
            const yearRange = {};
            if (q.year_from) yearRange.$gte = Number(q.year_from);
            if (q.year_to) yearRange.$lte = Number(q.year_to);
            if (Object.keys(yearRange).length) filter.year_of_registration = yearRange;
        }

        // Value range
        const valRange = {};
        if (q.min_value) valRange.$gte = Number(q.min_value);
        if (q.max_value) valRange.$lte = Number(q.max_value);
        if (Object.keys(valRange).length) filter.market_value_inr = valRange;

        // Area range
        const areaRange = {};
        if (q.min_area) areaRange.$gte = Number(q.min_area);
        if (q.max_area) areaRange.$lte = Number(q.max_area);
        if (Object.keys(areaRange).length) filter.area_sqft = areaRange;

        const lands = await Land.find(filter).sort({ year_of_registration: -1 });

        res.json({
            success: true,
            message: `${lands.length} record(s) found.`,
            data: lands,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 2. GET /api/lands/:id  —  Single record by registration_id ─
router.get("/:id", async (req, res) => {
    try {
        const land = await Land.findOne({ registration_id: req.params.id });
        if (!land)
            return res.status(404).json({ success: false, error: "Land not found." });

        res.json({ success: true, message: "Land record retrieved.", data: land });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 3. POST /api/lands  —  Register a new land ─────────────
router.post("/", async (req, res) => {
    try {
        const required = [
            "owner_name", "owner_contact", "owner_aadhaar_last4",
            "survey_number", "location", "taluka", "district", "state",
            "pincode", "area_sqft", "land_type", "market_value_inr",
            "stamp_duty_inr", "sub_registrar_office",
        ];
        for (const f of required) {
            if (!req.body[f])
                return res.status(400).json({ success: false, error: `Missing: ${f}` });
        }

        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const mon = String(now.getMonth() + 1).padStart(2, "0");
        const year = req.body.year || now.getFullYear();

        const registration_id = await generateRegistrationId(year);

        const land = await Land.create({
            registration_id,
            registration_date: req.body.registration_date || `${day}/${mon}/${year}`,
            year_of_registration: year,
            owner_name: req.body.owner_name,
            owner_contact: req.body.owner_contact,
            owner_aadhaar_last4: req.body.owner_aadhaar_last4,
            survey_number: req.body.survey_number,
            location: req.body.location,
            taluka: req.body.taluka,
            district: req.body.district,
            state: req.body.state,
            pincode: req.body.pincode,
            area_sqft: Number(req.body.area_sqft),
            land_type: req.body.land_type,
            market_value_inr: Number(req.body.market_value_inr),
            stamp_duty_inr: Number(req.body.stamp_duty_inr),
            sub_registrar_office: req.body.sub_registrar_office,
            status: "Active",
        });

        res.status(201).json({
            success: true,
            message: "Land registered successfully.",
            data: { registration_id: land.registration_id },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 4. PUT /api/lands/:id/transfer  —  Transfer ownership ──
router.put("/:id/transfer", async (req, res) => {
    try {
        const { new_owner_name, new_owner_contact, new_owner_aadhaar_last4, reason } = req.body;

        if (!new_owner_name || !new_owner_contact)
            return res.status(400).json({
                success: false,
                error: "new_owner_name and new_owner_contact are required.",
            });

        const land = await Land.findOne({ registration_id: req.params.id });
        if (!land)
            return res.status(404).json({ success: false, error: "Land not found." });

        const previousOwner = land.owner_name;

        // Update owner in lands collection
        land.owner_name = new_owner_name;
        land.owner_contact = new_owner_contact;
        if (new_owner_aadhaar_last4) land.owner_aadhaar_last4 = new_owner_aadhaar_last4;
        land.status = "Transferred";
        await land.save();

        // Log transaction
        await Transaction.create({
            registration_id: req.params.id,
            previous_owner: previousOwner,
            new_owner: new_owner_name,
            new_owner_contact,
            reason: reason || "",
        });

        res.json({
            success: true,
            message: "Ownership transferred successfully.",
            data: { registration_id: req.params.id, new_owner: new_owner_name },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── 5. PATCH /api/lands/:id  —  Update land fields ─────────
router.patch("/:id", async (req, res) => {
    try {
        const updatable = [
            "location", "taluka", "district", "state", "pincode",
            "area_sqft", "land_type", "market_value_inr",
            "stamp_duty_inr", "sub_registrar_office", "status", "owner_contact",
        ];

        const updates = {};
        const updatedFields = [];
        updatable.forEach((f) => {
            if (req.body[f] !== undefined && req.body[f] !== "") {
                updates[f] = req.body[f];
                updatedFields.push(f);
            }
        });

        if (updatedFields.length === 0)
            return res.status(400).json({ success: false, error: "No valid fields to update." });

        const land = await Land.findOneAndUpdate(
            { registration_id: req.params.id },
            { $set: updates },
            { new: true }
        );

        if (!land)
            return res.status(404).json({ success: false, error: "Land not found." });

        res.json({
            success: true,
            message: "Land record updated.",
            data: { registration_id: req.params.id, updated_fields: updatedFields },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
