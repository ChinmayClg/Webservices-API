import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function formatINR(n) {
    return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function statusBadge(status) {
    const s = (status || "").toLowerCase();
    const cls = s === "active" ? "badge-active" : s === "transferred" ? "badge-transferred" : "badge-disputed";
    return <span className={`badge ${cls}`}>{status}</span>;
}

const FIELDS = [
    { key: "registration_id", label: "Registration ID" },
    { key: "registration_date", label: "Registration Date" },
    { key: "year_of_registration", label: "Year" },
    { key: "owner_name", label: "Owner Name" },
    { key: "owner_contact", label: "Owner Contact" },
    { key: "owner_aadhaar_last4", label: "Aadhaar (Last 4)" },
    { key: "survey_number", label: "Survey Number" },
    { key: "location", label: "Location" },
    { key: "taluka", label: "Taluka" },
    { key: "district", label: "District" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
    { key: "area_sqft", label: "Area (sq ft)" },
    { key: "land_type", label: "Land Type" },
    { key: "market_value_inr", label: "Market Value", format: formatINR },
    { key: "stamp_duty_inr", label: "Stamp Duty Paid", format: formatINR },
    { key: "sub_registrar_office", label: "Sub-Registrar Office" },
];

export default function LandDetail() {
    const { id } = useParams();
    const [land, setLand] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/lands/${id}`);
                const json = await res.json();
                if (json.success) setLand(json.data);
                else setError(json.error);
            } catch {
                setError("Failed to load land record.");
            }
            setLoading(false);
        })();
    }, [id]);

    if (loading)
        return (
            <div className="loading">
                <div className="spinner" />
                <p>Loading land details…</p>
            </div>
        );

    if (error)
        return (
            <div>
                <Link to="/" className="back-link">← Back to search</Link>
                <div className="alert alert-error">{error}</div>
            </div>
        );

    return (
        <div>
            <Link to="/" className="back-link">← Back to search</Link>

            <div className="page-header" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <h2>{land.registration_id}</h2>
                {statusBadge(land.status)}
            </div>

            <div className="card">
                <div className="detail-grid">
                    {FIELDS.map((f) => (
                        <div className="detail-item" key={f.key}>
                            <div className="label">{f.label}</div>
                            <div className="value">{f.format ? f.format(land[f.key]) : String(land[f.key] ?? "—")}</div>
                        </div>
                    ))}
                    <div className="detail-item">
                        <div className="label">Status</div>
                        <div className="value">{statusBadge(land.status)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
