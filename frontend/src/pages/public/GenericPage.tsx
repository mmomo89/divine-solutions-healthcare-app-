import React from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import Reveal from "../../components/public/Reveal";
import CardGrid from "../../components/public/CardGrid";
import type { PageSection } from "../../types";

/**
 * Renders any CMS Page by slug that doesn't have a bespoke layout \u2014
 * Privacy Policy, internal destination pages referenced in the source site
 * whose full HTML wasn't supplied, and any brand-new page an admin creates
 * from the Pages screen. Loops through every visible section generically
 * (rather than picking out just one "text" and one "cta"), so pages built
 * with multiple sections via "Add Section" render everything, in order.
 */
const GenericPage: React.FC<{ slugOverride?: string }> = ({ slugOverride }) => {
  const params = useParams();
  const slug = slugOverride || params.slug || "";
  const { page, loading, error } = usePageData(slug);

  if (loading) return <PageLoading />;
  if (error || !page) {
    return (
      <section className="section container text-center">
        <h1>Page Not Found</h1>
        <p>The page you're looking for isn't available.</p>
        <Link to="/" className="btn">Back to Home</Link>
      </section>
    );
  }

  const visibleSections = page.sections.filter((s) => s.is_visible !== false);

  const renderSection = (section: PageSection, index: number) => {
    const alt = index % 2 === 1 ? " section--alt" : "";
    const anchorId = section.anchor_id || undefined;

    switch (section.section_type) {
      case "cta":
        return (
          <section key={section.id} className={`section${alt}`} id={anchorId}>
            <div className="container">
              <Reveal>
                <div className="cta-band">
                  <p>{section.body}</p>
                  <Link to={section.cta_link || "/home-health-care-contact-us"} className="btn btn-accent">
                    {section.cta_text || "Contact Us"}
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>
        );
      case "card_grid":
        return (
          <section key={section.id} className={`section${alt}`} id={anchorId}>
            <div className="container">
              {section.subheading && (
                <Reveal as="div" className="section-heading">
                  {section.heading && <span className="eyebrow">{section.heading}</span>}
                  <h2>{section.subheading}</h2>
                  {section.body && <p>{section.body}</p>}
                </Reveal>
              )}
              <CardGrid cards={section.data?.cards || []} />
            </div>
          </section>
        );
      case "intro":
        return (
          <section key={section.id} className="container" id={anchorId}>
            <div className="intro-section">
              {section.image_url && (
                <Reveal as="div">
                  <img src={section.image_url} alt="" />
                </Reveal>
              )}
              <Reveal delay={120}>
                {section.heading && <span className="eyebrow">{section.heading}</span>}
                <h2>{section.subheading}</h2>
                {section.body.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
            </div>
          </section>
        );
      default:
        // text / custom / anything else: heading + body, optional image
        return (
          <section key={section.id} className={`section${alt}`} id={anchorId}>
            <Reveal as="div" className="text-section">
              {section.heading && <h2 className="text-center">{section.heading}</h2>}
              {section.image_url && (
                <img src={section.image_url} alt="" style={{ borderRadius: "var(--radius-lg)", marginBottom: 24, width: "100%" }} />
              )}
              {section.body && <p>{section.body}</p>}
            </Reveal>
          </section>
        );
    }
  };

  return (
    <>
      <Helmet title={page.seo_title || page.title} description={page.meta_description} />
      <PageHero
        image={page.hero_image_url}
        heading={page.hero_heading || page.title}
        subheading={page.hero_subheading}
        breadcrumbLabel={page.breadcrumb_label || page.title}
      />

      {visibleSections.length === 0 && page.hero_subheading && (
        <section className="section">
          <div className="text-section">
            <p className="text-center muted">{page.hero_subheading}</p>
          </div>
        </section>
      )}

      {visibleSections.map((section, i) => renderSection(section, i))}
    </>
  );
};

export default GenericPage;
