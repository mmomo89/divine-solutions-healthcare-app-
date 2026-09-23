import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { SiteSettings } from "../../types";

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/settings/").then((res) => setSettings(res.data));
  }, []);

  if (!settings) return <div className="adm-empty">Loading\u2026</div>;

  const field = (key: keyof SiteSettings, value: any) => setSettings({ ...settings, [key]: value });

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.patch("/settings/", {
        company_name: settings.company_name,
        phone: settings.phone,
        email_primary: settings.email_primary,
        email_secondary: settings.email_secondary,
        address: settings.address,
        map_embed_url: settings.map_embed_url,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        footer_tagline: settings.footer_tagline,
        copyright_text: settings.copyright_text,
        designer_credit: settings.designer_credit,
        seo_site_title: settings.seo_site_title,
        seo_meta_description: settings.seo_meta_description,
      });
      setSettings(data);
      setMessage("Settings saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="adm-page-title">
        <h1>Site Settings</h1>
        <button className="adm-btn" onClick={save} disabled={saving}>Save Settings</button>
      </div>
      {message && <div className="adm-alert success">{message}</div>}

      <div className="adm-two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="adm-panel">
          <h2>Company</h2>
          <div className="adm-field"><label>Company Name</label><input value={settings.company_name} onChange={(e) => field("company_name", e.target.value)} /></div>
          <div className="adm-field"><label>Phone</label><input value={settings.phone} onChange={(e) => field("phone", e.target.value)} /></div>
          <div className="adm-field"><label>Primary Email</label><input value={settings.email_primary} onChange={(e) => field("email_primary", e.target.value)} /></div>
          <div className="adm-field"><label>Secondary Email</label><input value={settings.email_secondary} onChange={(e) => field("email_secondary", e.target.value)} /></div>
          <div className="adm-field"><label>Address</label><input value={settings.address} onChange={(e) => field("address", e.target.value)} /></div>
          <div className="adm-field"><label>Map Embed URL (optional)</label><input value={settings.map_embed_url} onChange={(e) => field("map_embed_url", e.target.value)} /></div>
        </div>

        <div>
          <div className="adm-panel">
            <h2>Social Media</h2>
            <div className="adm-field"><label>Facebook URL</label><input value={settings.facebook_url} onChange={(e) => field("facebook_url", e.target.value)} /></div>
            <div className="adm-field"><label>Instagram URL</label><input value={settings.instagram_url} onChange={(e) => field("instagram_url", e.target.value)} /></div>
          </div>

          <div className="adm-panel">
            <h2>Footer</h2>
            <div className="adm-field"><label>Footer Tagline</label><textarea rows={2} value={settings.footer_tagline} onChange={(e) => field("footer_tagline", e.target.value)} /></div>
            <div className="adm-field"><label>Copyright Text</label><input value={settings.copyright_text} onChange={(e) => field("copyright_text", e.target.value)} /></div>
            <div className="adm-field"><label>Designer Credit</label><input value={settings.designer_credit} onChange={(e) => field("designer_credit", e.target.value)} /></div>
          </div>

          <div className="adm-panel">
            <h2>SEO</h2>
            <div className="adm-field"><label>Default Site Title</label><input value={settings.seo_site_title} onChange={(e) => field("seo_site_title", e.target.value)} /></div>
            <div className="adm-field"><label>Default Meta Description</label><textarea rows={3} value={settings.seo_meta_description} onChange={(e) => field("seo_meta_description", e.target.value)} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
