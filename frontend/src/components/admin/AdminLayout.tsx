import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { adminPath } from "../../config";

export const ProtectedRoute: React.FC<{ children: React.ReactNode; superAdminOnly?: boolean }> = ({
  children,
  superAdminOnly,
}) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading\u2026</div>;
  if (!user) return <Navigate to={adminPath("/login")} replace />;
  if (superAdminOnly && user.role !== "super_admin") {
    return <div style={{ padding: 40 }}>You don't have permission to view this page.</div>;
  }
  return <>{children}</>;
};

const NAV = [
  { to: adminPath(), label: "Dashboard", end: true },
  { to: adminPath("/pages"), label: "Pages" },
  { to: adminPath("/services"), label: "Services" },
  { to: adminPath("/resources"), label: "Resources" },
  { to: adminPath("/submissions"), label: "Form Submissions" },
  { to: adminPath("/media"), label: "Media Library" },
  { to: adminPath("/navigation"), label: "Navigation" },
  { to: adminPath("/settings"), label: "Site Settings" },
  { to: adminPath("/users"), label: "Users", superAdminOnly: true },
  { to: adminPath("/account"), label: "My Account" },
  { to: adminPath("/activity-log"), label: "Activity Log" },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      api.get("/admin/search/", { params: { q: query } }).then((res) => {
        setResults(res.data);
        setShowResults(true);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">Divine Solutions<br />Admin CMS</div>
        <nav>
          {NAV.filter((n) => !n.superAdminOnly || user?.role === "super_admin").map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          Signed in as<br /><strong style={{ color: "#fff" }}>{user?.username}</strong> ({user?.role.replace("_", " ")})
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div ref={searchRef} style={{ position: "relative" }}>
            <input
              type="search"
              placeholder="Search pages, services, submissions\u2026"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results && setShowResults(true)}
            />
            {showResults && results && (
              <div className="adm-panel" style={{ position: "absolute", top: 40, left: 0, width: 360, zIndex: 50, maxHeight: 400, overflowY: "auto" }}>
                {["pages", "services", "resources", "submissions", "media"].map((key) =>
                  results[key]?.length ? (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--adm-muted)", marginBottom: 4 }}>{key}</div>
                      {results[key].map((r: any) => (
                        <div key={r.id} style={{ padding: "6px 0", fontSize: "0.85rem" }}>
                          {r.title || r.full_name}
                        </div>
                      ))}
                    </div>
                  ) : null
                )}
                {["pages", "services", "resources", "submissions", "media"].every((k) => !results[k]?.length) && (
                  <div className="muted" style={{ fontSize: "0.85rem" }}>No results.</div>
                )}
              </div>
            )}
          </div>
          <div className="admin-topbar__right">
            <Link to="/" target="_blank" className="adm-btn secondary small">View Site</Link>
            <span className="admin-profile">{user?.email}</span>
            <button
              className="adm-btn secondary small"
              onClick={() => {
                logout();
                navigate(adminPath("/login"));
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
