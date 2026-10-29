import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";
import { adminPath } from "../../config";
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addingType, setAddingType] = useState("text");
  const [draftPreview, setDraftPreview] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    setPage(null);

    if (!slug) {
      setLoadError("No page slug was provided in the URL.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/pages/${slug}/`);
      const draftRes = await api.get(`/pages/${slug}/draft/`);
      const content = draftRes.data.content || {};
      const liveSections: PageSection[] = res.data.sections || [];

      let mediaById: Record<number, string> = {};
      try {
        const mediaRes = await api.get("/media/");
        const mediaItems = Array.isArray(mediaRes.data)
          ? mediaRes.data
          : mediaRes.data.results || [];
        mediaById = Object.fromEntries(
          mediaItems.filter((item: any) => item.url).map((item: any) => [item.id, item.url])
        );
      } catch {
        // Keep the editor usable if media listing is temporarily unavailable.
      }

      const draftSections: PageSection[] = (content.sections || []).map(
        (section: any, index: number) => {
          const liveSection = liveSections.find((item) => item.id === section.id);
          const imageUrl = section.image
            ? mediaById[section.image] ||
              (liveSection?.image === section.image ? liveSection?.image_url ?? null : null)
            : null;

          return {
            ...liveSection,
            ...section,
            id: section.id ?? -(Date.now() + index),
            page: res.data.id,
            image_url: imageUrl,
            slide_image_urls: liveSection?.slide_image_urls || [],
            data: section.data || {},
          };
        },
      );

      const draftHeroImageUrl = content.hero_image
        ? mediaById[content.hero_image] ||
          (content.hero_image === res.data.hero_image ? res.data.hero_image_url : null)
        : null;

      setPage({
        ...res.data,
        ...content,
        hero_image_url: draftHeroImageUrl,
        sections: draftSections,
      });
      setSections(draftSections.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setLoadError(`The CMS could not find a page with the slug "${slug}".`);
      } else if (status === 401 || status === 403) {
        setLoadError("You do not have permission to load this page. Please sign in again.");
      } else if (!err?.response) {
        setLoadError("The CMS could not reach the API. Check your connection and try again.");
      } else {
        setLoadError(`The page could not be loaded (HTTP ${status || "error"}). Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [slug]);

  if (loading) return <div className="adm-empty">Loading page…</div>;

  if (!page) {
    return (
      <div className="adm-panel">
        <h1>Unable to Open Page</h1>
        <p role="alert">{loadError || "The page could not be loaded."}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="adm-btn" onClick={() => void load()}>Try Again</button>
          <Link className="adm-btn secondary" to={adminPath("/pages")}>Back to Pages</Link>
        </div>
      </div>
    );
  }

  const updatePageField = (field: keyof Page, value: any) => {
    setPage((current) => current ? { ...current, [field]: value } : current);
  };

  const saveDraft = async (showMessage = true): Promise<boolean> => {
    if (!page) return false;
    setSaving(true);
    setMessage("");
    try {
      const content = {
        title: page.title,
        breadcrumb_label: page.breadcrumb_label,
        seo_title: page.seo_title,
        meta_description: page.meta_description,
        og_image: (page as any).og_image ?? null,
        hero_image: page.hero_image,
        hero_heading: page.hero_heading,
        hero_subheading: page.hero_subheading,
        status: page.status,
        sections: sections.map((section) => {
          const item: Record<string, any> = {
            section_type: section.section_type,
            heading: section.heading,
            subheading: section.subheading,
            body: section.body,
            image: section.image,
            cta_text: section.cta_text,
            cta_link: section.cta_link,
            anchor_id: section.anchor_id,
            data: section.data || {},
            is_visible: section.is_visible,
            sort_order: section.sort_order,
          };
          if (section.id > 0) item.id = section.id;
          return item;
        }),
      };

      await api.put(`/pages/${page.slug}/draft/`, { content });
      if (showMessage) setMessage("Draft saved. The live website has not changed.");
      return true;
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || "Could not save the draft.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async () => {
    if (!page) return;
    if (!confirm("Publish this saved draft to the live website? Visitors will see these changes.")) return;

    const saved = await saveDraft(false);
    if (!saved) return;

    setSaving(true);
    setMessage("");
    try {
      await api.post(`/pages/${page.slug}/publish-draft/`, {});
      setMessage("Draft published successfully.");
      setDraftPreview(false);
      await load();
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || "Could not publish the draft.");
    } finally {
      setSaving(false);
    }
  };


  const updateSectionField = (id: number, field: keyof PageSection, value: any) => {
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const saveSection = async (section: PageSection) => {
    setMessage(`Section "${SECTION_LABELS[section.section_type] || section.section_type}" updated locally. Select Save Draft to store your changes.`);
  };

  const uploadSectionImage = async (section: PageSection, file: File) => {
    setSaving(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `${page?.title || "Page"} — ${SECTION_LABELS[section.section_type] || section.section_type}`);
      const mediaRes = await api.post("/media/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSections((secs) => secs.map((item) => item.id === section.id
        ? { ...item, image: mediaRes.data.id, image_url: mediaRes.data.url }
        : item));
      setMessage("Image uploaded to media library and selected for this draft. Save Draft to store the change.");
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || "Could not upload image.");
    } finally {
      setSaving(false);
    }
  };

  const removeSectionImage = async (section: PageSection) => {
    setSections((secs) => secs.map((item) => item.id === section.id
      ? { ...item, image: null, image_url: null }
      : item));
    setMessage("Image removal selected for this draft. Save Draft to store the change.");
  };

  const addSection = async () => {
    if (!page) return;
    const newSection: PageSection = {
      id: -Date.now(),
      page: page.id,
      section_type: addingType,
      heading: "",
      subheading: "",
      body: "",
      image: null,
      image_url: null,
      slide_image_urls: [],
      cta_text: "",
      cta_link: "",
      anchor_id: "",
      data: addingType === "card_grid" ? { cards: [] } : {},
      is_visible: true,
      sort_order: sections.length,
    };
    setSections((current) => [...current, newSection]);
    setMessage("Section added to the draft. Select Save Draft to store your changes.");
  };

  const deleteSection = async (section: PageSection) => {
    if (!confirm(`Remove this ${SECTION_LABELS[section.section_type] || section.section_type} section from the draft?`)) return;
    setSections((current) => current
      .filter((item) => item.id !== section.id)
      .map((item, index) => ({ ...item, sort_order: index })));
    setMessage("Section removed from the draft. Select Save Draft to store your changes.");
  };

  const handleReorder = async (newOrder: PageSection[]) => {
    setSections(newOrder.map((section, index) => ({ ...section, sort_order: index })));
    setMessage("Section order updated locally. Select Save Draft to store your changes.");
  };

  const publicUrl = page.slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div>
      <div className="adm-page-title">
        <h1>Edit Page: {page.title}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="adm-btn secondary" href={publicUrl} target="_blank" rel="noreferrer">View Live Page</a>
          <button className="adm-btn secondary" onClick={() => setDraftPreview((value) => !value)} disabled={saving}>
            {draftPreview ? "Hide Draft Preview" : "Preview Draft"}
          </button>
          <button className="adm-btn" onClick={() => void saveDraft()} disabled={saving}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button className="adm-btn" onClick={() => void publishDraft()} disabled={saving}>
            Publish
          </button>
        </div>
      </div>

      {message && <div className="adm-alert success">{message}</div>}

      {draftPreview && (
        <div className="adm-panel" style={{ marginBottom: 18 }}>
          <h2>Draft Preview</h2>
          <p className="muted">This is a content preview of your unpublished draft. The public page is unchanged until you publish.</p>
          <h3>{page.hero_heading || page.title}</h3>
          {page.hero_subheading && <p>{page.hero_subheading}</p>}
          {page.hero_image_url && (
            <img src={page.hero_image_url} alt="" style={{ maxWidth: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8 }} />
          )}
          {sections.filter((section) => section.is_visible).map((section) => (
            <div key={section.id} style={{ borderTop: "1px solid var(--adm-border, #ddd)", paddingTop: 12, marginTop: 12 }}>
              {section.heading && <h3>{section.heading}</h3>}
              {section.subheading && <h4>{section.subheading}</h4>}
              {section.body && <p style={{ whiteSpace: "pre-wrap" }}>{section.body}</p>}
              {section.image_url && (
                <img src={section.image_url} alt="" style={{ maxWidth: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }} />
              )}
              {section.cta_text && <p><strong>{section.cta_text}</strong> {section.cta_link}</p>}
            </div>
          ))}
        </div>
      )}

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
                    onClick={() => { updatePageField("hero_image", null); updatePageField("hero_image_url" as keyof Page, null); setMessage("Hero image removal selected for this draft. Save Draft to store the change."); }}
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
                      updatePageField("hero_image", mediaRes.data.id);
                      updatePageField("hero_image_url" as keyof Page, mediaRes.data.url);
                      setMessage("Hero image uploaded and selected for this draft. Save Draft to store the change.");
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
