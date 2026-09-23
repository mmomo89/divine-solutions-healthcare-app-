import React from "react";
import { useReveal } from "../../hooks/useReveal";

interface Props {
  children: React.ReactNode;
  delay?: number; // ms, for staggered lists
  className?: string;
  as?: React.ElementType;
}

/** Wraps content so it fades/rises into view on scroll (or renders instantly
 * if the user prefers reduced motion). Use `delay` to stagger items in a list. */
const Reveal: React.FC<Props> = ({ children, delay = 0, className = "", as = "div" }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
