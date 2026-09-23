import React from "react";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import CareersApplicationForm from "../../components/public/CareersApplicationForm";
import Reveal from "../../components/public/Reveal";

const Careers: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-careers");
  if (loading || !page) return <PageLoading />;

  const intro = page.sections.find((s) => s.section_type === "intro");
  const form = page.sections.find((s) => s.section_type === "contact_form");

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

      {form && (
        <section className="section section--alt" id={form.anchor_id || undefined}>
          <div className="container">
            <div className="text-section">
              {form.heading && <h2 className="text-center">{form.heading}</h2>}
              {form.body && <p className="text-center">{form.body}</p>}
              <CareersApplicationForm sourcePage="/home-health-care-careers" />
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Careers;
