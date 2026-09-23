import React from "react";

interface AddressEntry {
  label?: string;
  address: string;
}

interface Props {
  heading: string;
  body: string;
  addresses: AddressEntry[];
  phones: string[];
}

const OfficeInfo: React.FC<Props> = ({ heading, body, addresses, phones }) => (
  <div className="text-section">
    <h2 className="text-center">{heading}</h2>
    <div className="cta-band" style={{ background: "var(--color-bg-alt)", color: "var(--color-text)" }}>
      {addresses.map((a, i) => (
        <p key={i} style={{ color: "var(--color-text)" }}>
          <strong>{a.label ? `${a.label}: ` : addresses.length > 1 ? `Address ${i + 1}: ` : "Address: "}</strong>
          {a.address}
        </p>
      ))}
      <p style={{ color: "var(--color-text)" }}>
        <strong>Phone:</strong>{" "}
        {phones.map((p, i) => (
          <a key={i} href={`tel:${p.replace(/[^\d+]/g, "")}`} style={{ marginRight: 10, color: "var(--color-tertiary)" }}>
            {p}
          </a>
        ))}
      </p>
      <p style={{ color: "var(--color-text)" }}>{body}</p>
    </div>
  </div>
);

export default OfficeInfo;
