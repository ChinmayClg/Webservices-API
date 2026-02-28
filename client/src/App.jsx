import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import SearchLands from "./pages/SearchLands.jsx";
import LandDetail from "./pages/LandDetail.jsx";
import RegisterLand from "./pages/RegisterLand.jsx";
import TransferOwnership from "./pages/TransferOwnership.jsx";
import UpdateLand from "./pages/UpdateLand.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                {/* ── Sidebar Nav ── */}
                <nav className="sidebar">
                    <div className="sidebar-brand">
                        <span className="brand-icon">🏛️</span>
                        <h1>Land Registry</h1>
                    </div>
                    <ul className="nav-links">
                        <li>
                            <NavLink to="/" end>
                                <span className="nav-icon">🔍</span> Search Lands
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/register">
                                <span className="nav-icon">📝</span> Register Land
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/transfer">
                                <span className="nav-icon">🔄</span> Transfer Ownership
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/update">
                                <span className="nav-icon">✏️</span> Update Land
                            </NavLink>
                        </li>
                    </ul>
                    <div className="sidebar-footer">
                        <p>MERN Stack API</p>
                        <p className="version">v1.0</p>
                    </div>
                </nav>

                {/* ── Main Content ── */}
                <main className="content">
                    <Routes>
                        <Route path="/" element={<SearchLands />} />
                        <Route path="/land/:id" element={<LandDetail />} />
                        <Route path="/register" element={<RegisterLand />} />
                        <Route path="/transfer" element={<TransferOwnership />} />
                        <Route path="/update" element={<UpdateLand />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
