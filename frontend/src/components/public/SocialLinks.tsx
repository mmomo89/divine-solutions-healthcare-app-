import React from "react";
import type { SiteSettings } from "../../types";

interface SocialLinksProps {
  settings: Pick<SiteSettings, "facebook_url" | "instagram_url" | "linkedin_url"> | null;
  className: string;
}

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM8 19H5V9h3v10ZM6.5 7.7A1.75 1.75 0 1 1 6.5 4.2a1.75 1.75 0 0 1 0 3.5ZM19 19h-3v-4.87c0-1.16-.02-2.65-1.62-2.65-1.62 0-1.87 1.27-1.87 2.57V19h-3V9h2.88v1.37h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.73 2 3.73 4.6V19Z" />
  </svg>
);

const SocialLinks: React.FC<SocialLinksProps> = ({ settings, className }) => {
  if (!settings) return null;

  return (
    <div className={className} aria-label="Social media links">
      {settings.facebook_url && (
        <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">
          <FacebookIcon />
        </a>
      )}
      {settings.instagram_url && (
        <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
          <InstagramIcon />
        </a>
      )}
      {settings.linkedin_url && (
        <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
          <LinkedInIcon />
        </a>
      )}
    </div>
  );
};

export default SocialLinks;
