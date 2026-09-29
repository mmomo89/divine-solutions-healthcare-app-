import React from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { resolveMediaUrl } from "../../config";

interface CardData { title: string; text: string; link: string; }

// A link is an internal SPA route only when it points at another CMS page.
// Links into /media/ (uploaded files such as PDFs) must be plain <a> tags so
// the browser requests them directly instead of being swallowed by the
// client-side router (which has no matching route and would 404).
const isInternal = (link: string) => link.startsWith("/") && !link.includes("/media/");

const CardGrid: React.FC<{ cards: CardData[] }> = ({ cards }) => (
  <div className="card-grid">
    {cards.map((c, i) => (
      <Reveal key={i} delay={i * 90}>
        {isInternal(c.link) ? (
          <Link to={c.link} className="card">
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </Link>
        ) : (
          <a href={resolveMediaUrl(c.link)} className="card" target="_blank" rel="noopener noreferrer">
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </a>
        )}
      </Reveal>
    ))}
  </div>
);

export default CardGrid;
