import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { ActivityLogEntry } from "../../types";

const ActivityLogPage: React.FC = () => {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    api.get("/admin/activity-log/").then((res) => setItems(res.data.results || res.data));
  }, []);

  return (
    <div>
      <div className="adm-page-title"><h1>Activity Log</h1></div>
      <div className="adm-panel">
        <table className="adm-table">
          <thead><tr><th>User</th><th>Action</th><th>Description</th><th>Date</th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.user_display}</td>
                <td style={{ textTransform: "capitalize" }}>{a.action.replace(/_/g, " ")}</td>
                <td className="muted">{a.description}</td>
                <td className="muted">{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="adm-empty">No activity recorded yet.</div>}
      </div>
    </div>
  );
};

export default ActivityLogPage;
