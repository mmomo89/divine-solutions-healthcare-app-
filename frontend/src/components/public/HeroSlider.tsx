import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  images: string[];
  heading: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  intervalMs?: number;
}

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/** Auto-rotating full-bleed hero image slider with a fixed headline overlay
 * (matches the live site: background photos cycle, text/CTA stay constant). */
const HeroSlider: React.FC<Props> = ({ images, heading, body, ctaText, ctaLink, intervalMs = 6000 }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || images.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className="hero-slider">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`hero-slider__img${i === active ? " is-active" : ""}`}
        />
      ))}
      <div className="hero-slider__content">
        <h1>{heading}</h1>
        {body && <p>{body}</p>}
        {ctaText && ctaLink && (
          <Link to={ctaLink} className="btn btn-accent">
            {ctaText}
          </Link>
        )}
      </div>
      {images.length > 1 && (
        <div className="hero-slider__dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`hero-slider__dot${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
