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
