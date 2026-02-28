import { useState } from "react";

const UPDATABLE = [
    { key: "location", label: "Location", placeholder: "New locality" },
    { key: "taluka", label: "Taluka", placeholder: "New taluka" },
    { key: "district", label: "District", placeholder: "New district" },
    { key: "state", label: "State", placeholder: "New state" },
    { key: "pincode", label: "Pincode", placeholder: "New pincode" },
    { key: "area_sqft", label: "Area (sq ft)", placeholder: "Updated area" },
    { key: "land_type", label: "Land Type", type: "select" },
    { key: "market_value_inr", label: "Market Value (₹)", placeholder: "Revised value" },
    { key: "stamp_duty_inr", label: "Stamp Duty (₹)", placeholder: "Revised stamp duty" },
    { key: "sub_registrar_office", label: "Sub-Registrar Office", placeholder: "Updated SRO" },
    { key: "status", label: "Status", type: "status-select" },
    { key: "owner_contact", label: "Owner Contact", placeholder: "Updated contact" },
];

export default function UpdateLand() {
    const [regId, setRegId] = useState("");
    const [form, setForm] = useState({});
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [currentData, setCurrentData] = useState(null);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const fetchCurrent = async () => {
        if (!regId) return;
        setFetching(true);
        setMsg(null);
        setCurrentData(null);
        try {
            const res = await fetch(`/api/lands/${regId}`);
            const json = await res.json();
            if (json.success) {
                setCurrentData(json.data);
                // Pre-fill form with current values
                const pre = {};
                UPDATABLE.forEach((f) => {
                    pre[f.key] = String(json.data[f.key] ?? "");
                });
                setForm(pre);
            } else {
                setMsg({ type: "error", text: `❌ ${json.error}` });
            }
        } catch {
            setMsg({ type: "error", text: "Network error." });
        }
        setFetching(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/lands/${regId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.success) {
                setMsg({ type: "success", text: `✅ Updated fields: ${json.data.updated_fields.join(", ")}` });
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
                <h2>✏️ Update Land Details</h2>
                <p>Fetch existing record, modify fields, and save</p>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            {/* Step 1: Fetch */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Registration ID <span style={{ color: "var(--red)" }}>*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. LR-2019-10021"
                            value={regId}
                            onChange={(e) => setRegId(e.target.value)}
                        />
                    </div>
                </div>
                <div className="btn-row">
                    <button className="btn btn-secondary" onClick={fetchCurrent} disabled={fetching || !regId}>
                        {fetching ? "Loading…" : "📥 Fetch Current Data"}
                    </button>
                </div>
            </div>

            {/* Step 2: Edit */}
            {currentData && (
                <form className="card" onSubmit={submit}>
                    <p style={{ marginBottom: 16, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Editing <strong style={{ color: "var(--accent)" }}>{regId}</strong> — Owner: {currentData.owner_name}
                    </p>

                    <div className="form-grid">
                        {UPDATABLE.map((f) => (
                            <div className="form-group" key={f.key}>
                                <label>{f.label}</label>
                                {f.type === "select" ? (
                                    <select value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}>
                                        <option value="">No change</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Agricultural">Agricultural</option>
                                    </select>
                                ) : f.type === "status-select" ? (
                                    <select value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}>
                                        <option value="">No change</option>
                                        <option value="Active">Active</option>
                                        <option value="Transferred">Transferred</option>
                                        <option value="Disputed">Disputed</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={f.placeholder}
                                        value={form[f.key] || ""}
                                        onChange={(e) => set(f.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="btn-row">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving…" : "💾 Save Changes"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
