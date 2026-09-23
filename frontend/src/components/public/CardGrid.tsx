import React from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";

interface CardData { title: string; text: string; link: string; }

const isInternal = (link: string) => link.startsWith("/");

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
          <a href={c.link} className="card">
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </a>
        )}
      </Reveal>
    ))}
  </div>
);

export default CardGrid;
