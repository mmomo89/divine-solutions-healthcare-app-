import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { Service } from "../../types";
import DragReorderList from "../../components/admin/DragReorderList";

const REGION_LABELS: Record<string, string> = {
  ohio: "Ohio Office Services",
  north_dakota: "North Dakota Office Services",
  home: "Home Highlight",
};

const emptyService: Partial<Service> = {
  title: "", slug: "", description: "", link_url: "", region: "ohio", status: "published", sort_order: 0,
};

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/services/").then((res) => setServices(res.data.results || res.data));
  };
  useEffect(() => { load(); }, []);

  const reorderRegion = async (region: string, newOrder: Service[]) => {
    const withOrder = newOrder.map((s, i) => ({ ...s, sort_order: i }));
    setServices((all) => {
      const others = all.filter((s) => s.region !== region);
      return [...others, ...withOrder];
    });
    await api.post("/services/reorder/", {
      items: withOrder.map((s) => ({ id: s.id, sort_order: s.sort_order })),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      let imageId: number | undefined;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", editing.title || "service-image");
        form.append("alt_text", editing.title || "");
        const mediaRes = await api.post("/media/", form, { headers: { "Content-Type": "multipart/form-data" } });
        imageId = mediaRes.data.id;
      }
      const payload = { ...editing, ...(imageId ? { image: imageId } : {}) };
      if (editing.id) {
        await api.patch(`/services/${editing.id}/`, payload);
      } else {
        await api.post("/services/", payload);
      }
      setEditing(null);
      setFile(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    await api.delete(`/services/${id}/`);
    load();
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Services</h1>
        <button className="adm-btn" onClick={() => setEditing(emptyService)}>Add Service</button>
      </div>

      {editing && (
        <div className="adm-panel">
          <h2>{editing.id ? "Edit Service" : "New Service"}</h2>
          <div className="adm-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="adm-field">
                <label>Title</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>Slug (used in URL)</label>
                <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>Description</label>
                <textarea rows={6} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                <div className="hint">Separate paragraphs with a blank line \u2014 this is the full text shown on the service's own detail page (a shorter preview shows automatically on the grid card).</div>
              </div>
            </div>
            <div>
              <div className="adm-field">
                <label>Region / Page</label>
                <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value as any })}>
                  <option value="ohio">Ohio Office Services</option>
                  <option value="north_dakota">North Dakota Office Services</option>
                  <option value="home">Home Highlight</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Status</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Sort Order</label>
                <input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <div className="adm-field">
                <label>Image</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={save} disabled={saving}>Save</button>
            <button className="adm-btn secondary" onClick={() => { setEditing(null); setFile(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {(["ohio", "north_dakota", "home"] as const).map((region) => {
        const regionServices = services.filter((s) => s.region === region).sort((a, b) => a.sort_order - b.sort_order);
        if (regionServices.length === 0) return null;
        return (
          <div className="adm-panel" key={region}>
            <h2>{REGION_LABELS[region]}</h2>
            <p className="muted" style={{ marginTop: -8, fontSize: "0.82rem" }}>
              Drag the {"\u2630"} handle to reorder how these services appear on the public page.
            </p>
            <DragReorderList
              items={regionServices}
              keyField="id"
              onReorder={(newOrder) => reorderRegion(region, newOrder)}
              renderItem={(s) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--adm-border)" }}>
                  {s.image_url && (
                    <img src={s.image_url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>{s.description}</div>
                  </div>
                  <span className={`adm-badge ${s.status}`}>{s.status}</span>
                  <button className="adm-btn small secondary" onClick={() => setEditing(s)}>Edit</button>
                  <button className="adm-btn small danger" onClick={() => remove(s.id)}>Delete</button>
                </div>
              )}
            />
          </div>
        );
      })}
      {services.length === 0 && <div className="adm-panel adm-empty">No services yet.</div>}
    </div>
  );
};

export default Services;
