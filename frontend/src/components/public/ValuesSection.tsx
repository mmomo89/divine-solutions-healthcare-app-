import React from "react";
import Reveal from "./Reveal";

interface ValueItem { name: string; description: string; }

const ValuesSection: React.FC<{ heading: string; subheading?: string; body: string; values: ValueItem[]; closing?: string }> = ({
  heading, subheading, body, values, closing,
}) => (
  <div className="text-section">
    <div className="text-center" style={{ marginBottom: 24 }}>
      <h2>{heading}{subheading ? ` ${subheading}` : ""}</h2>
      <p>{body}</p>
    </div>
    <div className="values-list">
      {values.map((v, i) => (
        <Reveal key={i} delay={i * 80}>
          <div className="value-item">
            <div className="value-item__badge">{String(i + 1).padStart(2, "0")}</div>
            <h4>{v.name}</h4>
            <p>{v.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
    {closing && <p className="text-center" style={{ marginTop: 28 }}>{closing}</p>}
  </div>
);

export default ValuesSection;
