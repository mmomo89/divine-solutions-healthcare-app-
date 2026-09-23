import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import type { Service } from "../../types";
import Reveal from "./Reveal";

const ServiceGrid: React.FC<{ region: "ohio" | "north_dakota" }> = ({ region }) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get("/services/", { params: { region } }).then((res) => {
      const list: Service[] = res.data.results || res.data;
      setServices(list.sort((a, b) => a.sort_order - b.sort_order));
    });
  }, [region]);

  if (!services.length) return null;

  return (
    <div className="card-grid">
      {services.map((s, i) => {
        const to = s.link_url || `/${s.slug}`;
        return (
          <Reveal key={s.id} delay={i * 90}>
            <Link to={to} className="service-card">
              {s.image_url && (
                <div className="service-card__img-wrap">
                  <img className="service-card__img" src={s.image_url} alt={s.title} />
                </div>
              )}
              <div className="service-card__body">
                <h3>{s.title}</h3>
                {s.description && <p>{s.description}</p>}
                <span className="service-card__link">Learn More {"\u2192"}</span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
};

export default ServiceGrid;
