/**
 * The admin area's base path is configurable (VITE_ADMIN_PATH) rather than
 * hardcoded to "/admin", so a deployment can use a custom, hard-to-guess
 * path instead of the obvious default. Set VITE_ADMIN_PATH in your .env to
 * something private before deploying -- e.g. VITE_ADMIN_PATH=mgmt-7f2a91.
 *
 * This is one layer of defense (keeps casual/automated scanners of
 * "/admin", "/wp-admin" etc. from even finding a login form) -- it is NOT a
 * substitute for real auth, which is still fully enforced server-side
 * regardless of which path reaches it.
 */
export const ADMIN_BASE = (import.meta as any).env?.VITE_ADMIN_PATH || "admin";

/** Builds a path under the admin base, e.g. adminPath("/login") -> "/mgmt-7f2a91/login" */
export const adminPath = (sub: string = ""): string => `/${ADMIN_BASE}${sub}`;

/**
 * The backend's own origin (no /api suffix), derived from VITE_API_URL.
 * The frontend and backend are deployed as two separate services with two
 * separate domains (e.g. on Render), unlike local dev where one Caddy
 * proxy makes them look same-origin. A server-stored relative link such
 * as "/media/media_library/brochure.pdf" must be resolved against the
 * BACKEND's origin, not the page's own origin, or the browser requests it
 * from the frontend's static site and gets a 404.
 */
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/**
 * Resolves a link that may be a bare "/media/..." path (as stored raw in
 * PageSection.data, e.g. a card_grid card's "link") into an absolute URL
 * against the backend's origin. Leaves already-absolute URLs and ordinary
 * app-internal routes (anything not under /media/) untouched.
 */
export const resolveMediaUrl = (link: string): string => {
  if (!link) return link;
  if (/^https?:\/\//i.test(link)) return link;
  if (link.startsWith("/media/")) return `${API_ORIGIN}${link}`;
  return link;
};
