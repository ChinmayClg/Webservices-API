const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        registration_id: { type: String, required: true, index: true },
        previous_owner: { type: String, required: true },
        new_owner: { type: String, required: true },
        new_owner_contact: { type: String, required: true },
        reason: { type: String, default: "" },
    },
    { timestamps: true }              // createdAt acts as the transfer timestamp
);

module.exports = mongoose.model("Transaction", transactionSchema);
