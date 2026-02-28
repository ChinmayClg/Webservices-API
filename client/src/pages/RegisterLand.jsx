import { useState } from "react";

const FIELDS = [
    { key: "owner_name", label: "Owner Name", required: true, placeholder: "Full name" },
    { key: "owner_contact", label: "Owner Contact", required: true, placeholder: "10-digit mobile" },
    { key: "owner_aadhaar_last4", label: "Aadhaar (Last 4)", required: true, placeholder: "e.g. 7742" },
    { key: "survey_number", label: "Survey Number", required: true, placeholder: "e.g. SUR/AND/0421" },
    { key: "location", label: "Location", required: true, placeholder: "Locality / Area" },
    { key: "taluka", label: "Taluka", required: true, placeholder: "Sub-district" },
    { key: "district", label: "District", required: true, placeholder: "District name" },
    { key: "state", label: "State", required: true, placeholder: "State name" },
    { key: "pincode", label: "Pincode", required: true, placeholder: "6-digit code" },
    { key: "area_sqft", label: "Area (sq ft)", required: true, placeholder: "e.g. 1200" },
    { key: "land_type", label: "Land Type", required: true, type: "select" },
    { key: "market_value_inr", label: "Market Value (₹)", required: true, placeholder: "e.g. 8500000" },
    { key: "stamp_duty_inr", label: "Stamp Duty (₹)", required: true, placeholder: "e.g. 510000" },
    { key: "sub_registrar_office", label: "Sub-Registrar Office", required: true, placeholder: "e.g. SRO Andheri" },
    { key: "registration_date", label: "Registration Date", required: false, placeholder: "DD/MM/YYYY (auto if empty)" },
];

export default function RegisterLand() {
    const [form, setForm] = useState({});
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch("/api/lands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.success) {
                setMsg({ type: "success", text: `✅ Land registered! ID: ${json.data.registration_id}` });
                setForm({});
            } else {
                setMsg({ type: "error", text: `❌ ${json.error}` });
            }
        } catch {
            setMsg({ type: "error", text: "Network error." });
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <h2>📝 Register New Land</h2>
                <p>Fill in all required fields to register a new land parcel</p>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <form className="card" onSubmit={submit}>
                <div className="form-grid">
                    {FIELDS.map((f) => (
                        <div className="form-group" key={f.key}>
                            <label>
                                {f.label} {f.required && <span style={{ color: "var(--red)" }}>*</span>}
                            </label>
                            {f.type === "select" ? (
                                <select value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} required={f.required}>
                                    <option value="">Select type…</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Agricultural">Agricultural</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={f.placeholder}
                                    value={form[f.key] || ""}
                                    onChange={(e) => set(f.key, e.target.value)}
                                    required={f.required}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="btn-row">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Registering…" : "📄 Register Land"}
                    </button>
                    <button type="reset" className="btn btn-secondary" onClick={() => { setForm({}); setMsg(null); }}>
                        Clear Form
                    </button>
                </div>
            </form>
        </div>
    );
}
