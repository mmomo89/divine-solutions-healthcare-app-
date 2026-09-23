import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import ValuesSection from "../../components/public/ValuesSection";
import Reveal from "../../components/public/Reveal";

const AboutUs: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-about-us");
  if (loading || !page) return <PageLoading />;

  const who = page.sections.find((s) => s.heading === "Who We Are");
  const mission = page.sections.find((s) => s.section_type === "mission");
  const vision = page.sections.find((s) => s.section_type === "vision");
  const values = page.sections.find((s) => s.section_type === "values");
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

      {who && (
        <section className="section" id={who.anchor_id || undefined}>
          <Reveal as="div" className="text-section">
            <h2 className="text-center">{who.heading}</h2>
            <p>{who.body}</p>
          </Reveal>
        </section>
      )}

      {mission && (
        <section className="section section--alt" id={mission.anchor_id || "mission"}>
          <Reveal as="div" className="text-section">
            <h2 className="text-center">{mission.heading}</h2>
            <p>{mission.body}</p>
          </Reveal>
        </section>
      )}

      {vision && (
        <section className="section" id={vision.anchor_id || undefined}>
          <Reveal as="div" className="text-section">
            <h2 className="text-center">{vision.heading}</h2>
            <p>{vision.body}</p>
          </Reveal>
        </section>
      )}

      {values && (
        <section className="section section--alt" id={values.anchor_id || undefined}>
          <div className="container">
            <ValuesSection
              heading={values.heading}
              subheading={values.subheading}
              body={values.body}
              values={values.data?.values || []}
              closing={values.data?.closing}
            />
          </div>
        </section>
      )}

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

export default AboutUs;
