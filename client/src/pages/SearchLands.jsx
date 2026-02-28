import { useState } from "react";
import { Link } from "react-router-dom";

const FILTERS = [
    { key: "location", label: "Location", placeholder: "e.g. Andheri" },
    { key: "taluka", label: "Taluka", placeholder: "e.g. Haveli" },
    { key: "district", label: "District", placeholder: "e.g. Mumbai Suburban" },
    { key: "state", label: "State", placeholder: "e.g. Maharashtra" },
    { key: "pincode", label: "Pincode", placeholder: "e.g. 400069" },
    { key: "owner_name", label: "Owner Name", placeholder: "e.g. Ramesh" },
    { key: "land_type", label: "Land Type", placeholder: "Residential / Commercial / Agricultural", type: "select" },
    { key: "status", label: "Status", placeholder: "Active / Transferred / Disputed", type: "select" },
    { key: "year", label: "Exact Year", placeholder: "e.g. 2020" },
    { key: "year_from", label: "Year From", placeholder: "e.g. 2018" },
    { key: "year_to", label: "Year To", placeholder: "e.g. 2023" },
    { key: "min_value", label: "Min Value (₹)", placeholder: "e.g. 5000000" },
    { key: "max_value", label: "Max Value (₹)", placeholder: "e.g. 20000000" },
];

function statusBadge(status) {
    const s = (status || "").toLowerCase();
    const cls = s === "active" ? "badge-active" : s === "transferred" ? "badge-transferred" : "badge-disputed";
    return <span className={`badge ${cls}`}>{status}</span>;
}

function formatINR(n) {
    return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function SearchLands() {
    const [filters, setFilters] = useState({});
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (key, val) => {
        setFilters((f) => ({ ...f, [key]: val }));
    };

    const search = async () => {
        setLoading(true);
        setMessage("");
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => {
                if (v) params.append(k, v);
            });
            const res = await fetch(`https://land-registry-api.onrender.com/api/lands?${params}`);
            const json = await res.json();
            setResults(json.data || []);
            setMessage(json.message);
        } catch {
            setMessage("Failed to fetch data.");
        }
        setLoading(false);
    };

    const clear = () => {
        setFilters({});
        setResults(null);
        setMessage("");
    };

    return (
        <div>
            <div className="page-header">
                <h2>🔍 Search Land Records</h2>
                <p>Filter by location, owner, year, value, and more</p>
            </div>

            <div className="card">
                <div className="form-grid">
                    {FILTERS.map((f) => (
                        <div className="form-group" key={f.key}>
                            <label>{f.label}</label>
                            {f.type === "select" ? (
                                <select
                                    value={filters[f.key] || ""}
                                    onChange={(e) => handleChange(f.key, e.target.value)}
                                >
                                    <option value="">All</option>
                                    {f.key === "land_type" ? (
                                        <>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Agricultural">Agricultural</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Active">Active</option>
                                            <option value="Transferred">Transferred</option>
                                            <option value="Disputed">Disputed</option>
                                        </>
                                    )}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={f.placeholder}
                                    value={filters[f.key] || ""}
                                    onChange={(e) => handleChange(f.key, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="btn-row">
                    <button className="btn btn-primary" onClick={search} disabled={loading}>
                        {loading ? "Searching…" : "🔎 Search"}
                    </button>
                    <button className="btn btn-secondary" onClick={clear}>
                        Clear Filters
                    </button>
                </div>
            </div>

            {message && <p className="result-count">{message}</p>}

            {loading && (
                <div className="loading">
                    <div className="spinner" />
                    <p>Searching records…</p>
                </div>
            )}

            {results && !loading && (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Reg. ID</th>
                                <th>Date</th>
                                <th>Owner</th>
                                <th>Location</th>
                                <th>District</th>
                                <th>State</th>
                                <th>Type</th>
                                <th>Area (sqft)</th>
                                <th>Market Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                                        No records found. Try adjusting your filters.
                                    </td>
                                </tr>
                            ) : (
                                results.map((r) => (
                                    <tr key={r.registration_id}>
                                        <td>
                                            <Link className="link" to={`/land/${r.registration_id}`}>
                                                {r.registration_id}
                                            </Link>
                                        </td>
                                        <td>{r.registration_date}</td>
                                        <td>{r.owner_name}</td>
                                        <td>{r.location}</td>
                                        <td>{r.district}</td>
                                        <td>{r.state}</td>
                                        <td>{r.land_type}</td>
                                        <td className="currency">{Number(r.area_sqft).toLocaleString("en-IN")}</td>
                                        <td className="currency">{formatINR(r.market_value_inr)}</td>
                                        <td>{statusBadge(r.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
