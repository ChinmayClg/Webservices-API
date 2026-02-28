const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    registration_id:       { type: String, required: true, unique: true, index: true },
    registration_date:     { type: String, required: true },
    year_of_registration:  { type: Number, required: true, index: true },
    owner_name:            { type: String, required: true },
    owner_contact:         { type: String, required: true },
    owner_aadhaar_last4:   { type: String, required: true },
    survey_number:         { type: String, required: true },
    location:              { type: String, required: true },
    taluka:                { type: String, required: true },
    district:              { type: String, required: true, index: true },
    state:                 { type: String, required: true, index: true },
    pincode:               { type: String, required: true },
    area_sqft:             { type: Number, required: true },
    land_type:             { type: String, required: true, enum: ["Residential", "Commercial", "Agricultural"] },
    market_value_inr:      { type: Number, required: true },
    stamp_duty_inr:        { type: Number, required: true },
    sub_registrar_office:  { type: String, required: true },
    status:                { type: String, required: true, enum: ["Active", "Transferred", "Disputed"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Land", landSchema);
