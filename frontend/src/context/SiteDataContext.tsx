import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import type { NavigationItem, SiteSettings } from "../types";

interface SiteDataValue {
  settings: SiteSettings | null;
  headerNav: NavigationItem[];
  footerNav: NavigationItem[];
  loading: boolean;
}

const SiteDataContext = createContext<SiteDataValue>({
  settings: null,
  headerNav: [],
  footerNav: [],
  loading: true,
});

export const SiteDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [nav, setNav] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/settings/"), api.get("/navigation/")])
      .then(([s, n]) => {
        setSettings(s.data);
        setNav(n.data.results || n.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const headerNav = nav.filter((n) => n.location === "header").sort((a, b) => a.sort_order - b.sort_order);
  const footerNav = nav.filter((n) => n.location === "footer").sort((a, b) => a.sort_order - b.sort_order);

  return (
    <SiteDataContext.Provider value={{ settings, headerNav, footerNav, loading }}>
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = () => useContext(SiteDataContext);
