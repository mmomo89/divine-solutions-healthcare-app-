import React, { useEffect } from "react";
import { Link } from "react-router-dom";

interface Crumb {
  name: string;
  url?: string; // absolute or relative path; omit for the current (non-linked) page
}

interface Props {
  /** Simple case: just the current page's label (breadcrumb is Home > current). */
  current?: string;
  /** Advanced case: full trail for multi-level breadcrumbs, e.g. Home > Region > Service.
   * The last item is treated as the current page and is not linked. */
  items?: Crumb[];
}

const SITE_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

/**
 * Renders the visible breadcrumb trail and emits a matching BreadcrumbList
 * JSON-LD block for SEO structured data (per spec item 36).
 */
const Breadcrumbs: React.FC<Props> = ({ current, items }) => {
  const trail: Crumb[] = items && items.length > 0 ? items : [{ name: "Home", url: "/" }, { name: current || "" }];

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        ...(crumb.url ? { item: `${SITE_ORIGIN}${crumb.url}` } : {}),
      })),
    };

    let script = document.getElementById("breadcrumb-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "breadcrumb-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      script?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(trail)]);

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {trail.map((crumb, index) => {
        const isLast = index === trail.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="sep">{"\u00bb"}</span>}
            {isLast || !crumb.url ? (
              <span className="current" aria-current="page">{crumb.name}</span>
            ) : (
              <Link to={crumb.url}>{crumb.name}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
