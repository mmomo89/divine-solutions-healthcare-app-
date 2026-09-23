import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { Resource } from "../../types";
import Reveal from "./Reveal";

const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    api.get("/resources/").then((res) => {
      const list: Resource[] = res.data.results || res.data;
      setResources(list.sort((a, b) => a.sort_order - b.sort_order));
    });
  }, []);

  return (
    <div className="card-grid">
      {resources.map((r, i) => (
        <Reveal key={r.id} delay={i * 90}>
          <a
            className="card"
            href={r.external_url || r.document_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>{r.title}</h3>
            {r.description && <p>{r.description}</p>}
            {r.external_url && <p className="muted">{r.external_url.replace(/^https?:\/\//, "")}</p>}
          </a>
        </Reveal>
      ))}
    </div>
  );
};

export default ResourceList;
