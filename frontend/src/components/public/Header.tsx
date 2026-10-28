import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSiteData } from "../../context/SiteDataContext";
import SocialLinks from "./SocialLinks";

const Header: React.FC = () => {
  const { settings, headerNav } = useSiteData();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url;
  };

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo" onClick={() => setOpen(false)}>
          {settings?.logo_light_url ? (
            <img src={settings.logo_light_url} alt={settings.company_name} />
          ) : (
            <span className="site-header__logo-text">Divine Solutions<br />Healthcare LLC</span>
          )}
        </Link>

        <nav className={`main-nav${open ? " open" : ""}`} aria-label="Primary">
          {headerNav.map((item) => (
            <Link
              key={item.id}
              to={item.url}
              className={isActive(item.url) ? "active" : ""}
              aria-current={isActive(item.url) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <SocialLinks settings={settings} className="nav-social" />
        </nav>

        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
};

export default Header;
