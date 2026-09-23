import React from "react";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import CardGrid from "../../components/public/CardGrid";
import ServiceGrid from "../../components/public/ServiceGrid";
import ContactForm from "../../components/public/ContactForm";
import Reveal from "../../components/public/Reveal";
import HeroSlider from "../../components/public/HeroSlider";

const Home: React.FC = () => {
  const { page, loading } = usePageData("home");

  if (loading || !page) return <PageLoading />;

  const heroSlider = page.sections.find((s) => s.section_type === "hero_slider");
  const intro = page.sections.find((s) => s.section_type === "intro");
  const cardSections = page.sections.filter((s) => s.section_type === "card_grid");
  const serviceGridSections = page.sections.filter((s) => s.section_type === "service_grid");
  const mission = page.sections.find((s) => s.section_type === "mission");
  const vision = page.sections.find((s) => s.section_type === "vision");
  const contact = page.sections.find((s) => s.section_type === "contact_form");

  return (
    <>
      <Helmet title={page.seo_title || page.title} description={page.meta_description} />

      {heroSlider && heroSlider.slide_image_urls?.length > 0 && (
        <HeroSlider
          images={heroSlider.slide_image_urls}
          heading={heroSlider.heading}
          body={heroSlider.body}
          ctaText={heroSlider.cta_text}
          ctaLink={heroSlider.cta_link}
        />
      )}

      {intro && (
        <section className="container">
          <div className="intro-section">
            {intro.image_url && (
              <Reveal as="div">
                <img src={intro.image_url} alt="" />
              </Reveal>
            )}
            <Reveal delay={120}>
              <span className="eyebrow">{intro.heading}</span>
              <h2>{intro.subheading}</h2>
              {intro.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {cardSections.map((section) => (
        <section className="container" key={section.id} id={section.anchor_id || undefined} style={{ paddingBottom: "var(--space-4)" }}>
          {section.subheading && (
            <Reveal as="div" className="section-heading">
              <span className="eyebrow">{section.heading}</span>
              <h2>{section.subheading}</h2>
              {section.body && <p>{section.body}</p>}
            </Reveal>
          )}
          <CardGrid cards={section.data?.cards || []} />
        </section>
      ))}

      {serviceGridSections.map((section) => (
        <section className="section section--alt" key={section.id} id={section.anchor_id || undefined}>
          <div className="container">
            {section.subheading && (
              <Reveal as="div" className="section-heading">
                <span className="eyebrow">{section.heading}</span>
                <h2>{section.subheading}</h2>
                {section.body && <p>{section.body}</p>}
              </Reveal>
            )}
            <ServiceGrid region={(section.data?.region as "ohio" | "north_dakota") || "north_dakota"} />
          </div>
        </section>
      ))}

      {mission && (
        <section className="section section--alt">
          <Reveal as="div" className="text-section">
            <h2 className="text-center">{mission.heading}</h2>
            <p>{mission.body}</p>
            {mission.cta_text && mission.cta_link && (
              <div className="text-center">
                <a href={mission.cta_link} className="btn btn-outline">{mission.cta_text}</a>
              </div>
            )}
          </Reveal>
        </section>
      )}

      {vision && (
        <section className="section">
          <Reveal as="div" className="text-section">
            <h2 className="text-center">{vision.heading}</h2>
            <p>{vision.body}</p>
          </Reveal>
        </section>
      )}

      {contact && (
        <section className="section section--alt">
          <div className="container">
            <div className="contact-block">
              <Reveal>
                <span className="eyebrow">{contact.heading}</span>
                <h2>{contact.subheading}</h2>
                <p>{contact.body}</p>
              </Reveal>
              <Reveal delay={120}>
                <ContactForm formType="contact" sourcePage="/" />
              </Reveal>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
