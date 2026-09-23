import { useEffect, useRef, useState } from "react";

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/**
 * Reveals an element (fade + slight rise) the first time it scrolls into
 * view, using IntersectionObserver. Falls back to "always visible" when the
 * user has prefers-reduced-motion set, or if IntersectionObserver isn't
 * available for some reason.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion || visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // threshold: 0 fires as soon as even 1px is visible, rather than
      // requiring a percentage of the element's total area -- a percentage
      // threshold silently never fires for elements taller than a few
      // viewport-heights (e.g. a long form), leaving them permanently
      // opacity:0 and invisible.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, visible };
}
