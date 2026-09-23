import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import type { FormSubmission } from "../../types";

const Submissions: React.FC = () => {
  const [items, setItems] = useState<FormSubmission[]>([]);
  const [status, setStatus] = useState("");
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = () => {
    setLoading(true);
    api
      .get("/submissions/", { params: { status: status || undefined, form_type: formType || undefined, search: search || undefined } })
      .then((res) => setItems(res.data.results || res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, formType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const exportCsv = () => {
    const token = localStorage.getItem("dsh_access");
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (formType) params.set("form_type", formType);
    fetch(`${base}/admin/submissions/export/csv/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "submissions.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const downloadBulkPdf = () => {
    const token = localStorage.getItem("dsh_access");
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const params = new URLSearchParams();
    if (selected.size > 0) {
      params.set("ids", Array.from(selected).join(","));
    } else {
      if (status) params.set("status", status);
      if (formType) params.set("form_type", formType);
    }
    fetch(`${base}/admin/submissions/export/pdf-bulk/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("No matching submissions.");
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "submissions-pdf-export.zip";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert("No matching submissions to export."));
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Form Submissions</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="adm-btn secondary" onClick={exportCsv}>Export CSV</button>
          <button className="adm-btn" onClick={downloadBulkPdf}>
            {selected.size > 0 ? `Download ${selected.size} as PDF (zip)` : "Download Filtered as PDF (zip)"}
          </button>
        </div>
      </div>

      <form className="adm-toolbar" onSubmit={handleSearch}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <select value={formType} onChange={(e) => setFormType(e.target.value)}>
          <option value="">All Types</option>
          <option value="contact">Contact</option>
          <option value="careers">Careers</option>
        </select>
        <input placeholder="Search name or email\u2026" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="adm-btn small secondary" type="submit">Search</button>
      </form>

      <div className="adm-panel">
        {loading && <div className="adm-empty">Loading\u2026</div>}
        {!loading && items.length === 0 && <div className="adm-empty">No submissions found.</div>}
        {!loading && items.length > 0 && (
          <table className="adm-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleSelectAll} /></th>
                <th>Name</th><th>Email</th><th>Type</th><th>Status</th><th>Source Page</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelected(s.id)} /></td>
                  <td><Link className="row-link" to={`/admin/submissions/${s.id}`}>{s.full_name}</Link></td>
                  <td className="muted">{s.email}</td>
                  <td>{s.form_type}</td>
                  <td><span className={`adm-badge ${s.status}`}>{s.status.replace("_", " ")}</span></td>
                  <td className="muted">{s.source_page}</td>
                  <td className="muted">{new Date(s.created_at).toLocaleString()}</td>
                  <td><Link className="adm-btn small secondary" to={`/admin/submissions/${s.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Submissions;
