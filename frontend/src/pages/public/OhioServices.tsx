import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import ServiceGrid from "../../components/public/ServiceGrid";
import Reveal from "../../components/public/Reveal";

const OhioServices: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-ohio-office-services");
  if (loading || !page) return <PageLoading />;

  const intro = page.sections.find((s) => s.section_type === "intro");
  const cta = page.sections.find((s) => s.section_type === "cta");

  return (
    <>
      <Helmet title={page.seo_title || page.title} description={page.meta_description} />
      <PageHero
        image={page.hero_image_url}
        heading={page.hero_heading}
        subheading={page.hero_subheading}
        breadcrumbLabel={page.breadcrumb_label}
      />

      {intro && (
        <section className="section" id={intro.anchor_id || undefined}>
          <Reveal as="div" className="text-section">
            <p>{intro.body}</p>
          </Reveal>
        </section>
      )}

      <section className="section section--alt">
        <div className="container">
          <ServiceGrid region="ohio" />
        </div>
      </section>

      {cta && (
        <section className="section" id={cta.anchor_id || undefined}>
          <div className="container">
            <Reveal>
              <div className="cta-band">
                <p>{cta.body}</p>
                <Link to={cta.cta_link || "/home-health-care-contact-us"} className="btn btn-accent">
                  {cta.cta_text || "Contact Us"}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
};

export default OhioServices;
