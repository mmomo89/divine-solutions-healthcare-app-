import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import type { Page, PageSection } from "../../types";
import DragReorderList from "../../components/admin/DragReorderList";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero", hero_slider: "Hero Slider", breadcrumb: "Breadcrumb", intro: "Intro", text: "Text Section",
  mission: "Mission", vision: "Vision", values: "Values", service_grid: "Service Grid",
  card_grid: "Card Grid", cta: "CTA", contact_form: "Contact Form",
  resource_list: "Resource List", office_info: "Office Info", custom: "Custom",
};

const ADDABLE_TYPES = ["text", "intro", "cta", "custom", "card_grid"];

const PageEditor: React.FC = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addingType, setAddingType] = useState("text");

  const load = () => {
    api.get(`/pages/${slug}/`).then((res) => {
      setPage(res.data);
      setSections([...res.data.sections].sort((a: PageSection, b: PageSection) => a.sort_order - b.sort_order));
    });
  };

  useEffect(load, [slug]);

  if (!page) return <div className="adm-empty">Loading{"\u2026"}</div>;

  const updatePageField = (field: keyof Page, value: any) => setPage({ ...page, [field]: value });

  const savePage = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/pages/${page.slug}/`, {
        title: page.title,
        seo_title: page.seo_title,
        meta_description: page.meta_description,
        hero_heading: page.hero_heading,
        hero_subheading: page.hero_subheading,
        breadcrumb_label: page.breadcrumb_label,
        status: page.status,
      });
      setMessage("Page saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateSectionField = (id: number, field: keyof PageSection, value: any) => {
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const saveSection = async (section: PageSection) => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/page-sections/${section.id}/`, {
        heading: section.heading,
        subheading: section.subheading,
        body: section.body,
        cta_text: section.cta_text,
        cta_link: section.cta_link,
        anchor_id: section.anchor_id,
        is_visible: section.is_visible,
        sort_order: section.sort_order,
      });
      setMessage(`Section "${SECTION_LABELS[section.section_type] || section.section_type}" saved.`);
    } finally {
      setSaving(false);
    }
  };

  const uploadSectionImage = async (section: PageSection, file: File) => {
    setSaving(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `${page.title} \u2014 ${SECTION_LABELS[section.section_type] || section.section_type}`);
      const mediaRes = await api.post("/media/", form, { headers: { "Content-Type": "multipart/form-data" } });
      await api.patch(`/page-sections/${section.id}/`, { image: mediaRes.data.id });
      setMessage("Image uploaded.");
      load();
    } catch {
      setMessage("Could not upload image.");
    } finally {
      setSaving(false);
    }
  };

  const removeSectionImage = async (section: PageSection) => {
    await api.patch(`/page-sections/${section.id}/`, { image: null });
    load();
  };

  const addSection = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.post("/page-sections/", {
        page: page.id,
        section_type: addingType,
        heading: "",
        subheading: "",
        body: "",
        cta_text: "",
        cta_link: "",
        anchor_id: "",
        is_visible: true,
        sort_order: sections.length,
        data: addingType === "card_grid" ? { cards: [] } : {},
      });
      setMessage("Section added \u2014 edit its content below.");
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || "Could not add section.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (section: PageSection) => {
    if (!confirm(`Delete this ${SECTION_LABELS[section.section_type] || section.section_type} section? This cannot be undone.`)) return;
    try {
      await api.delete(`/page-sections/${section.id}/`);
      load();
    } catch {
      setMessage("Could not delete this section.");
    }
  };

  const handleReorder = async (newOrder: PageSection[]) => {
    const withOrder = newOrder.map((s, i) => ({ ...s, sort_order: i }));
    setSections(withOrder);
    try {
      await api.post("/page-sections/reorder/", {
        items: withOrder.map((s) => ({ id: s.id, sort_order: s.sort_order })),
      });
      setMessage("Section order updated.");
    } catch {
      setMessage("Could not save the new order \u2014 please try again.");
    }
  };

  const publicUrl = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div>
      <div className="adm-page-title">
        <h1>Edit Page: {page.title}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="adm-btn secondary" href={publicUrl} target="_blank" rel="noreferrer">Preview</a>
          <button className="adm-btn" onClick={savePage} disabled={saving}>Save Page Details</button>
        </div>
      </div>

      {message && <div className="adm-alert success">{message}</div>}

      <div className="adm-two-col">
        <div>
          <div className="adm-panel">
            <h2>Sections</h2>
            <p className="muted" style={{ marginTop: -8, fontSize: "0.85rem" }}>
              Edit each section's content below, or drag the {"\u2630"} handle to reorder sections on the page.
              Give a section an Anchor ID to link a menu item or CTA directly to it (e.g. <code>#mission</code>).
            </p>
            <DragReorderList
              items={sections}
              keyField="id"
              onReorder={handleReorder}
              renderItem={(s) => (
              <div className="adm-section-row" key={s.id}>
                <div className="adm-section-row__head">
                  <strong>{SECTION_LABELS[s.section_type] || s.section_type}</strong>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: "0.8rem", fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        checked={s.is_visible}
                        onChange={(e) => updateSectionField(s.id, "is_visible", e.target.checked)}
                      />
                      Visible
                    </label>
                    <button className="adm-btn small danger" onClick={() => deleteSection(s)}>Delete</button>
                  </div>
                </div>

                {["intro", "text", "mission", "vision", "values", "cta", "contact_form", "office_info"].includes(s.section_type) && (
                  <div className="adm-field">
                    <label>Heading</label>
                    <input value={s.heading} onChange={(e) => updateSectionField(s.id, "heading", e.target.value)} />
                  </div>
                )}
                {(s.section_type === "intro" || s.section_type === "values") && (
                  <div className="adm-field">
                    <label>Subheading</label>
                    <input value={s.subheading} onChange={(e) => updateSectionField(s.id, "subheading", e.target.value)} />
                  </div>
                )}
                {s.section_type !== "service_grid" && s.section_type !== "resource_list" && (
                  <div className="adm-field">
                    <label>Body</label>
                    <textarea rows={4} value={s.body} onChange={(e) => updateSectionField(s.id, "body", e.target.value)} />
                  </div>
                )}
                {s.section_type === "cta" && (
                  <>
                    <div className="adm-field">
                      <label>CTA Button Text</label>
                      <input value={s.cta_text} onChange={(e) => updateSectionField(s.id, "cta_text", e.target.value)} />
                    </div>
                    <div className="adm-field">
                      <label>CTA Link</label>
                      <input value={s.cta_link} onChange={(e) => updateSectionField(s.id, "cta_link", e.target.value)} />
                    </div>
                  </>
                )}

                <div className="adm-field">
                  <label>Image / Graphic</label>
                  {s.image_url ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={s.image_url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                      <button className="adm-btn small secondary" onClick={() => removeSectionImage(s)}>Remove Image</button>
                    </div>
                  ) : (
                    <label className="adm-btn small secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSectionImage(s, f); }}
                      />
                    </label>
                  )}
                </div>

                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="adm-field">
                    <label>Anchor ID <span className="hint">(for linking)</span></label>
                    <input
                      value={s.anchor_id}
                      onChange={(e) => updateSectionField(s.id, "anchor_id", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                      placeholder="e.g. mission"
                    />
                  </div>
                  <div className="adm-field">
                    <label>Sort Order <span className="hint">(or drag {"\u2630"})</span></label>
                    <input
                      type="number"
                      value={s.sort_order}
                      onChange={(e) => updateSectionField(s.id, "sort_order", Number(e.target.value))}
                    />
                  </div>
                </div>
                <button className="adm-btn small" onClick={() => saveSection(s)} disabled={saving}>Save Section</button>
              </div>
              )}
            />
            {sections.length === 0 && <div className="adm-empty">No sections on this page yet \u2014 add one below.</div>}

            <div className="adm-section-row" style={{ background: "var(--adm-panel)", borderStyle: "dashed" }}>
              <div className="adm-section-row__head"><strong>Add a Section</strong></div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="adm-field" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>Section Type</label>
                  <select value={addingType} onChange={(e) => setAddingType(e.target.value)}>
                    {ADDABLE_TYPES.map((t) => (
                      <option key={t} value={t}>{SECTION_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <button className="adm-btn small" onClick={addSection} disabled={saving}>Add Section</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="adm-panel">
            <h2>Page Details</h2>
            <div className="adm-field">
              <label>Title</label>
              <input value={page.title} onChange={(e) => updatePageField("title", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Breadcrumb Label</label>
              <input value={page.breadcrumb_label} onChange={(e) => updatePageField("breadcrumb_label", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Hero Heading</label>
              <input value={page.hero_heading} onChange={(e) => updatePageField("hero_heading", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Hero Subheading</label>
              <textarea rows={2} value={page.hero_subheading} onChange={(e) => updatePageField("hero_subheading", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Hero Image</label>
              {page.hero_image_url ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={page.hero_image_url} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6 }} />
                  <button
                    className="adm-btn small secondary"
                    onClick={async () => { await api.patch(`/pages/${page.slug}/`, { hero_image: null }); load(); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="adm-btn small secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
                  Upload Hero Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const form = new FormData();
                      form.append("file", f);
                      form.append("title", `${page.title} hero`);
                      const mediaRes = await api.post("/media/", form, { headers: { "Content-Type": "multipart/form-data" } });
                      await api.patch(`/pages/${page.slug}/`, { hero_image: mediaRes.data.id });
                      load();
                    }}
                  />
                </label>
              )}
            </div>
            <div className="adm-field">
              <label>Status</label>
              <select value={page.status} onChange={(e) => updatePageField("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="adm-panel">
            <h2>SEO</h2>
            <div className="adm-field">
              <label>SEO Title</label>
              <input value={page.seo_title} onChange={(e) => updatePageField("seo_title", e.target.value)} />
            </div>
            <div className="adm-field">
              <label>Meta Description</label>
              <textarea rows={3} value={page.meta_description} onChange={(e) => updatePageField("meta_description", e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
