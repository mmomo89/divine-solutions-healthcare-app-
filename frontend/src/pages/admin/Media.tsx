import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { MediaItem } from "../../types";

const Media: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => api.get("/media/", { params: { search: search || undefined } }).then((res) => setItems(res.data.results || res.data));
  useEffect(() => { load(); }, [search]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name);
      form.append("alt_text", "");
      await api.post("/media/", form, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateAlt = async (item: MediaItem, alt_text: string) => {
    await api.patch(`/media/${item.id}/`, { alt_text });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this media item?")) return;
    await api.delete(`/media/${id}/`);
    load();
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Media Library</h1>
        <label className="adm-btn" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading\u2026" : "Upload Image"}
          <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={upload} />
        </label>
      </div>

      <div className="adm-toolbar">
        <input placeholder="Search media\u2026" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="adm-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {items.map((item) => (
          <div className="adm-card" key={item.id}>
            {item.url && /\.(png|jpe?g|gif|webp)$/i.test(item.url) ? (
              <img src={item.url} alt={item.alt_text} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
            ) : (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2", borderRadius: 6, marginBottom: 8 }}>
                File
              </div>
            )}
            <input
              defaultValue={item.alt_text}
              placeholder="Alt text"
              style={{ width: "100%", fontSize: "0.8rem", padding: 6, marginBottom: 6, border: "1px solid var(--adm-border)", borderRadius: 6 }}
              onBlur={(e) => updateAlt(item, e.target.value)}
            />
            <button className="adm-btn small danger" style={{ width: "100%" }} onClick={() => remove(item.id)}>Delete</button>
          </div>
        ))}
        {items.length === 0 && <div className="adm-empty">No media uploaded yet.</div>}
      </div>
    </div>
  );
};

export default Media;
