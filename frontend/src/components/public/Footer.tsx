import React from "react";
import { Link } from "react-router-dom";
import { useSiteData } from "../../context/SiteDataContext";

const Footer: React.FC = () => {
  const { settings, footerNav } = useSiteData();
  if (!settings) return null;

  const phoneHref = `tel:${settings.phone.replace(/[^\d+]/g, "")}`;

  return (
    <footer className="site-footer">
      {settings.map_embed_url && (
        <div className="map-section">
          <iframe
            src={settings.map_embed_url}
            title="Divine Solutions Healthcare LLC location map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>Get In Touch</h3>
            <p className="muted" style={{ color: "rgba(255,255,255,0.75)" }}>{settings.footer_tagline}</p>

            <div className="footer-contact-line">
              <div>
                <span className="label">Call Us Today!</span>
                <a href={phoneHref}>{settings.phone}</a>
              </div>
            </div>
            <div className="footer-contact-line">
              <div>
                <span className="label">Message Us</span>
                <div><a href={`mailto:${settings.email_primary}`}>{settings.email_primary}</a></div>
                <div><a href={`mailto:${settings.email_secondary}`}>{settings.email_secondary}</a></div>
              </div>
            </div>
            <div className="footer-contact-line">
              <div>
                <span className="label">Visit Us</span>
                <span>{settings.address}</span>
              </div>
            </div>

            <div className="social-row">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">ig</a>
              )}
            </div>
          </div>

          <div>
            <h3>Navigation</h3>
            <ul className="footer-nav">
              {footerNav.map((item) => (
                <li key={item.id}><Link to={item.url}>{item.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Like, Share, or Comment</h3>
            <p style={{ color: "rgba(255,255,255,0.75)" }}>
              Follow along for updates, care tips, and stories from our community.
            </p>
            <div className="social-row">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">ig</a>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{settings.display_copyright} <Link to="/privacy-policy">Privacy Policy</Link></span>
          <span>{settings.designer_credit}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
