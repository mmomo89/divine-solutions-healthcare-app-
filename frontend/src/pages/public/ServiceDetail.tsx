import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/client";
import { Helmet } from "./Helmet";
import { PageLoading } from "./PageSkeleton";
import type { Service } from "../../types";
import Breadcrumbs from "../../components/public/Breadcrumbs";

const ServiceDetail: React.FC = () => {
  const { slug } = useParams();
  const [service, setService] = useState<Service | null | undefined>(undefined);

  useEffect(() => {
    api.get("/services/").then((res) => {
      const list: Service[] = res.data.results || res.data;
      setService(list.find((s) => s.slug === slug) || null);
    });
  }, [slug]);

  if (service === undefined) return <PageLoading />;
  if (service === null) {
    return (
      <section className="section container text-center">
        <h1>Service Not Found</h1>
        <Link to="/home-health-care-ohio-office-services" className="btn">View All Services</Link>
      </section>
    );
  }

  const regionPath = service.region === "north_dakota"
    ? "/home-health-care-north-dakota-office-services"
    : "/home-health-care-ohio-office-services";
  const regionLabel = service.region === "north_dakota" ? "North Dakota Office Services" : "Ohio Office Services";

  return (
    <>
      <Helmet title={`${service.title} | Divine Solutions Healthcare LLC`} description={service.description} />
      <div className="page-hero">
        {service.image_url && <img src={service.image_url} alt={service.title} />}
        <div className="page-hero__content">
          <Breadcrumbs
            items={[
              { name: "Home", url: "/" },
              { name: regionLabel, url: regionPath },
              { name: service.title },
            ]}
          />
          <h1>{service.title}</h1>
        </div>
      </div>

      <section className="section">
        <div className="text-section">
          {service.description.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="text-center" style={{ marginTop: 32 }}>
            <Link to="/home-health-care-contact-us" className="btn">Contact Us About This Service</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceDetail;
