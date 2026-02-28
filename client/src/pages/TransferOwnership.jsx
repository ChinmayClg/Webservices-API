import { useState } from "react";

export default function TransferOwnership() {
    const [form, setForm] = useState({
        registration_id: "",
        new_owner_name: "",
        new_owner_contact: "",
        new_owner_aadhaar_last4: "",
        reason: "",
    });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/lands/${form.registration_id}/transfer`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    new_owner_name: form.new_owner_name,
                    new_owner_contact: form.new_owner_contact,
                    new_owner_aadhaar_last4: form.new_owner_aadhaar_last4,
                    reason: form.reason,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setMsg({ type: "success", text: `✅ Ownership transferred to ${json.data.new_owner}` });
                setForm({ registration_id: "", new_owner_name: "", new_owner_contact: "", new_owner_aadhaar_last4: "", reason: "" });
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
                <h2>🔄 Transfer Ownership</h2>
                <p>Change the owner of a registered land parcel</p>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <form className="card" onSubmit={submit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Registration ID <span style={{ color: "var(--red)" }}>*</span></label>
                        <input
                            type="text"
                            placeholder="e.g. LR-2019-10021"
                            value={form.registration_id}
                            onChange={(e) => set("registration_id", e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>New Owner Name <span style={{ color: "var(--red)" }}>*</span></label>
                        <input
                            type="text"
                            placeholder="Full name"
                            value={form.new_owner_name}
                            onChange={(e) => set("new_owner_name", e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>New Owner Contact <span style={{ color: "var(--red)" }}>*</span></label>
                        <input
                            type="text"
                            placeholder="10-digit mobile"
                            value={form.new_owner_contact}
                            onChange={(e) => set("new_owner_contact", e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>New Owner Aadhaar (Last 4)</label>
                        <input
                            type="text"
                            placeholder="e.g. 5591"
                            value={form.new_owner_aadhaar_last4}
                            onChange={(e) => set("new_owner_aadhaar_last4", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <select value={form.reason} onChange={(e) => set("reason", e.target.value)}>
                            <option value="">Select reason…</option>
                            <option value="Sale">Sale</option>
                            <option value="Inheritance">Inheritance</option>
                            <option value="Gift">Gift</option>
                            <option value="Court Order">Court Order</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="btn-row">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Transferring…" : "🔄 Transfer Ownership"}
                    </button>
                </div>
            </form>
        </div>
    );
}
