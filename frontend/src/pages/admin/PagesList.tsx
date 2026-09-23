import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import type { Page } from "../../types";

interface NewPageForm {
  slug: string;
  title: string;
  breadcrumb_label: string;
  status: "draft" | "published";
}

const emptyNewPage: NewPageForm = { slug: "", title: "", breadcrumb_label: "", status: "draft" };

const PagesList: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<NewPageForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.get("/pages/").then((res) => {
      setPages(res.data.results || res.data);
      setLoading(false);
    });
  };

  React.useEffect(load, []);

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const createPage = async () => {
    if (!creating) return;
    const slug = creating.slug.trim() || slugify(creating.title);
    if (!creating.title.trim() || !slug) {
      setMessage({ ok: false, text: "A title is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.post("/pages/", {
        slug,
        title: creating.title,
        breadcrumb_label: creating.breadcrumb_label || creating.title,
        status: creating.status,
      });
      navigate(`/admin/pages/${res.data.slug}`);
    } catch (err: any) {
      const data = err?.response?.data;
      setMessage({ ok: false, text: (data && Object.values(data).flat().join(" ")) || "Could not create page." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Page) => {
    if (!confirm(`Delete page "${p.title}"? This also deletes all its sections. This cannot be undone.`)) return;
    try {
      await api.delete(`/pages/${p.slug}/`);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not delete this page.");
    }
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Pages</h1>
        <button className="adm-btn" onClick={() => { setCreating({ ...emptyNewPage }); setMessage(null); }}>Create Page</button>
      </div>

      {message && <div className={`adm-alert ${message.ok ? "success" : "error"}`}>{message.text}</div>}

      {creating && (
        <div className="adm-panel">
          <h2>New Page</h2>
          <p className="muted" style={{ marginTop: -4, fontSize: "0.85rem" }}>
            After creating the page, you'll land in the editor where you can add sections (text, images, CTAs,
            service grids, etc.) and link a menu item to it from the Navigation page.
          </p>
          <div className="adm-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="adm-field">
                <label>Page Title</label>
                <input value={creating.title} onChange={(e) => setCreating({ ...creating, title: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>URL Slug <span className="hint">(auto-generated from title if left blank)</span></label>
                <input value={creating.slug} onChange={(e) => setCreating({ ...creating, slug: e.target.value })} placeholder="e.g. our-story" />
              </div>
            </div>
            <div>
              <div className="adm-field">
                <label>Breadcrumb Label</label>
                <input value={creating.breadcrumb_label} onChange={(e) => setCreating({ ...creating, breadcrumb_label: e.target.value })} placeholder="Defaults to the title" />
              </div>
              <div className="adm-field">
                <label>Status</label>
                <select value={creating.status} onChange={(e) => setCreating({ ...creating, status: e.target.value as NewPageForm["status"] })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="adm-btn" onClick={createPage} disabled={saving}>{saving ? "Creating\u2026" : "Create & Edit"}</button>
            <button className="adm-btn secondary" onClick={() => setCreating(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="adm-panel">
        {loading && <div className="adm-empty">Loading\u2026</div>}
        {!loading && (
          <table className="adm-table">
            <thead>
              <tr><th>Title</th><th>Slug</th><th>Status</th><th>Sections</th><th>Updated</th><th></th></tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td><Link className="row-link" to={`/admin/pages/${p.slug}`}>{p.title}</Link></td>
                  <td className="muted">/{p.slug === "home" ? "" : p.slug}</td>
                  <td><span className={`adm-badge ${p.status}`}>{p.status}</span></td>
                  <td>{p.sections?.length ?? 0}</td>
                  <td className="muted">{"updated_at" in p ? new Date((p as any).updated_at).toLocaleDateString() : ""}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <Link className="adm-btn small secondary" to={`/admin/pages/${p.slug}`}>Edit</Link>
                    <button className="adm-btn small danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PagesList;
