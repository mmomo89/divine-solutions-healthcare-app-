import { useEffect } from "react";

interface Props {
  title: string;
  description?: string;
}

/** Minimal SEO head manager — sets document title + meta description/OG tags per page. */
export function Helmet({ title, description }: Props) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);

      let og = document.querySelector('meta[property="og:description"]');
      if (!og) {
        og = document.createElement("meta");
        og.setAttribute("property", "og:description");
        document.head.appendChild(og);
      }
      og.setAttribute("content", description);
    }
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);
  }, [title, description]);

  return null;
}
