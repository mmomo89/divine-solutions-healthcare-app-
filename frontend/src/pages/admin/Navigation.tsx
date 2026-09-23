import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { NavigationItem, Page } from "../../types";

interface NewItemForm {
  label: string;
  linkMode: "page" | "custom";
  pageSlug: string;
  customUrl: string;
  location: "header" | "footer";
  opens_new_tab: boolean;
}

const emptyNewItem = (location: "header" | "footer"): NewItemForm => ({
  label: "", linkMode: "page", pageSlug: "", customUrl: "", location, opens_new_tab: false,
});

const Navigation: React.FC = () => {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [adding, setAdding] = useState<NewItemForm | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get("/navigation/").then((res) => setItems(res.data.results || res.data));
    api.get("/pages/").then((res) => setPages(res.data.results || res.data));
  };
  useEffect(() => { load(); }, []);

  const update = (id: number, field: keyof NavigationItem, value: any) => {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const save = async (item: NavigationItem) => {
    setMessage(null);
    try {
      await api.patch(`/navigation/${item.id}/`, {
        label: item.label, url: item.url, sort_order: item.sort_order,
        is_visible: item.is_visible, opens_new_tab: item.opens_new_tab,
      });
      setMessage({ ok: true, text: `"${item.label}" saved.` });
    } catch (err: any) {
      setMessage({ ok: false, text: err?.response?.data?.detail || "Could not save this menu item." });
    }
  };

  const uploadIcon = async (item: NavigationItem, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", `${item.label} icon`);
    try {
      const mediaRes = await api.post("/media/", form, { headers: { "Content-Type": "multipart/form-data" } });
      await api.patch(`/navigation/${item.id}/`, { icon: mediaRes.data.id });
      setMessage({ ok: true, text: `Icon updated for "${item.label}".` });
      load();
    } catch {
      setMessage({ ok: false, text: "Could not upload icon." });
    }
  };

  const removeIcon = async (item: NavigationItem) => {
    await api.patch(`/navigation/${item.id}/`, { icon: null });
    load();
  };

  const remove = async (item: NavigationItem) => {
    if (!confirm(`Delete menu item "${item.label}"?`)) return;
    await api.delete(`/navigation/${item.id}/`);
    load();
  };

  const createItem = async () => {
    if (!adding) return;
    const url = adding.linkMode === "page" ? adding.pageSlug : adding.customUrl;
    if (!adding.label.trim() || !url.trim()) {
      setMessage({ ok: false, text: "Label and a link (page or custom URL) are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const siblingCount = items.filter((i) => i.location === adding.location).length;
      await api.post("/navigation/", {
        label: adding.label,
        url,
        location: adding.location,
        opens_new_tab: adding.opens_new_tab,
        sort_order: siblingCount,
        is_visible: true,
      });
      setMessage({ ok: true, text: `"${adding.label}" added to the ${adding.location} menu.` });
      setAdding(null);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage({ ok: false, text: (data && Object.values(data).flat().join(" ")) || "Could not create menu item." });
    } finally {
      setSaving(false);
    }
  };

  const grouped = { header: items.filter((i) => i.location === "header"), footer: items.filter((i) => i.location === "footer") };

  return (
    <div>
      <div className="adm-page-title"><h1>Navigation</h1></div>
      {message && <div className={`adm-alert ${message.ok ? "success" : "error"}`}>{message.text}</div>}
      <p className="muted" style={{ marginTop: -8, marginBottom: 20 }}>
        Menu items can link to any page you've created, or to a specific section on a page by adding{" "}
        <code>#anchor-id</code> to the end (set each section's Anchor ID in the Pages editor).
      </p>

      {(["header", "footer"] as const).map((loc) => (
        <div className="adm-panel" key={loc}>
          <div className="adm-section-row__head" style={{ marginBottom: 10 }}>
            <h2 style={{ textTransform: "capitalize", margin: 0 }}>{loc} Navigation</h2>
            <button className="adm-btn small" onClick={() => setAdding(emptyNewItem(loc))}>Add Menu Item</button>
          </div>

          {adding && adding.location === loc && (
            <div className="adm-section-row">
              <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="adm-field">
                  <label>Label</label>
                  <input value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
                </div>
                <div className="adm-field">
                  <label>Link Type</label>
                  <select value={adding.linkMode} onChange={(e) => setAdding({ ...adding, linkMode: e.target.value as "page" | "custom" })}>
                    <option value="page">Link to a page</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>
              </div>
              {adding.linkMode === "page" ? (
                <div className="adm-field">
                  <label>Page</label>
                  <select value={adding.pageSlug} onChange={(e) => setAdding({ ...adding, pageSlug: e.target.value })}>
                    <option value="">Select a page\u2026</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.slug === "home" ? "/" : `/${p.slug}`}>{p.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="adm-field">
                  <label>Custom URL</label>
                  <input value={adding.customUrl} onChange={(e) => setAdding({ ...adding, customUrl: e.target.value })} placeholder="/some-path or https://external.com" />
                </div>
              )}
              <div className="adm-field checkbox">
                <input type="checkbox" id="opens_new_tab" checked={adding.opens_new_tab} onChange={(e) => setAdding({ ...adding, opens_new_tab: e.target.checked })} />
                <label htmlFor="opens_new_tab" style={{ marginBottom: 0 }}>Open in new tab</label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="adm-btn small" onClick={createItem} disabled={saving}>{saving ? "Adding\u2026" : "Add"}</button>
                <button className="adm-btn small secondary" onClick={() => setAdding(null)}>Cancel</button>
              </div>
            </div>
          )}

          <table className="adm-table">
            <thead><tr><th>Icon</th><th>Label</th><th>URL</th><th>Order</th><th>New Tab</th><th>Visible</th><th></th></tr></thead>
            <tbody>
              {grouped[loc].sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.icon_url ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <img src={item.icon_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 6 }} />
                        <button className="adm-btn small secondary" onClick={() => removeIcon(item)} title="Remove icon">{"\u2715"}</button>
                      </div>
                    ) : (
                      <label className="adm-btn small secondary" style={{ cursor: "pointer" }}>
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadIcon(item, f); }}
                        />
                      </label>
                    )}
                  </td>
                  <td><input value={item.label} onChange={(e) => update(item.id, "label", e.target.value)} style={{ width: 140 }} /></td>
                  <td><input value={item.url} onChange={(e) => update(item.id, "url", e.target.value)} style={{ width: 220 }} /></td>
                  <td><input type="number" value={item.sort_order} onChange={(e) => update(item.id, "sort_order", Number(e.target.value))} style={{ width: 60 }} /></td>
                  <td><input type="checkbox" checked={item.opens_new_tab} onChange={(e) => update(item.id, "opens_new_tab", e.target.checked)} /></td>
                  <td><input type="checkbox" checked={item.is_visible} onChange={(e) => update(item.id, "is_visible", e.target.checked)} /></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="adm-btn small secondary" onClick={() => save(item)}>Save</button>
                    <button className="adm-btn small danger" onClick={() => remove(item)}>Delete</button>
                  </td>
                </tr>
              ))}
              {grouped[loc].length === 0 && (
                <tr><td colSpan={7} className="adm-empty">No {loc} menu items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Navigation;
