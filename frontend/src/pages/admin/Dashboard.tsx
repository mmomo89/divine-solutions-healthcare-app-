import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import type { DashboardStats } from "../../types";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get("/admin/dashboard/").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <div className="adm-empty">Loading dashboard\u2026</div>;

  const cards = [
    { label: "Total Pages", value: stats.total_pages },
    { label: "Published Pages", value: stats.published_pages },
    { label: "Draft Pages", value: stats.draft_pages },
    { label: "Total Submissions", value: stats.total_submissions },
    { label: "New Submissions", value: stats.new_submissions },
    { label: "Read Submissions", value: stats.read_submissions },
    { label: "Archived Submissions", value: stats.archived_submissions },
    { label: "Services", value: stats.total_services },
    { label: "Resources", value: stats.total_resources },
  ];

  return (
    <div>
      <div className="adm-page-title"><h1>Dashboard</h1></div>

      <div className="adm-cards">
        {cards.map((c) => (
          <div className="adm-card" key={c.label}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        <div className="adm-panel">
          <h2>Recent Submissions</h2>
          {stats.recent_submissions.length === 0 && <div className="adm-empty">No submissions yet.</div>}
          {stats.recent_submissions.length > 0 && (
            <table className="adm-table">
              <thead>
                <tr><th>Name</th><th>Type</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {stats.recent_submissions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>{s.form_type}</td>
                    <td><span className={`adm-badge ${s.status}`}>{s.status.replace("_", " ")}</span></td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td><Link className="row-link" to={`/admin/submissions/${s.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-panel">
          <h2>Recent Activity</h2>
          {stats.recent_activity.length === 0 && <div className="adm-empty">No activity yet.</div>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {stats.recent_activity.map((a) => (
              <li key={a.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--adm-border)", fontSize: "0.85rem" }}>
                <strong>{a.user_display}</strong> {a.description || a.action}
                <div className="muted" style={{ fontSize: "0.75rem" }}>{new Date(a.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
