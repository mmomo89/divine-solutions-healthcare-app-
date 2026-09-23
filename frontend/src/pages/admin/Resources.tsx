import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { Resource } from "../../types";
import DragReorderList from "../../components/admin/DragReorderList";

const empty: Partial<Resource> = { title: "", description: "", external_url: "", status: "published", sort_order: 0 };

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/resources/").then((res) => setResources(res.data.results || res.data));
  useEffect(() => { load(); }, []);

  const reorder = async (newOrder: Resource[]) => {
    const withOrder = newOrder.map((r, i) => ({ ...r, sort_order: i }));
    setResources(withOrder);
    await api.post("/resources/reorder/", {
      items: withOrder.map((r) => ({ id: r.id, sort_order: r.sort_order })),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) await api.patch(`/resources/${editing.id}/`, editing);
      else await api.post("/resources/", editing);
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this resource?")) return;
    await api.delete(`/resources/${id}/`);
    load();
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Resources</h1>
        <button className="adm-btn" onClick={() => setEditing(empty)}>Add Resource</button>
      </div>

      {editing && (
        <div className="adm-panel">
          <h2>{editing.id ? "Edit Resource" : "New Resource"}</h2>
          <div className="adm-field">
            <label>Title</label>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>Description</label>
            <textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>External URL</label>
            <input value={editing.external_url} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>Status</label>
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={save} disabled={saving}>Save</button>
            <button className="adm-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="adm-panel">
        <p className="muted" style={{ marginTop: -8, fontSize: "0.82rem" }}>
          Drag the {"\u2630"} handle to reorder how resources appear on the public Resources page.
        </p>
        <DragReorderList
          items={[...resources].sort((a, b) => a.sort_order - b.sort_order)}
          keyField="id"
          onReorder={reorder}
          renderItem={(r) => (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--adm-border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>{r.external_url}</div>
              </div>
              <span className={`adm-badge ${r.status}`}>{r.status}</span>
              <button className="adm-btn small secondary" onClick={() => setEditing(r)}>Edit</button>
              <button className="adm-btn small danger" onClick={() => remove(r.id)}>Delete</button>
            </div>
          )}
        />
        {resources.length === 0 && <div className="adm-empty">No resources yet.</div>}
      </div>
    </div>
  );
};

export default Resources;
