import React from "react";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import ContactForm from "../../components/public/ContactForm";
import OfficeInfo from "../../components/public/OfficeInfo";
import { useSiteData } from "../../context/SiteDataContext";
import Reveal from "../../components/public/Reveal";

const Contact: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-contact-us");
  const { settings } = useSiteData();
  if (loading || !page) return <PageLoading />;

  const form = page.sections.find((s) => s.section_type === "contact_form");
  const office = page.sections.find((s) => s.section_type === "office_info");

  return (
    <>
      <Helmet title={page.seo_title || page.title} description={page.meta_description} />
      <PageHero
        image={page.hero_image_url}
        heading={page.hero_heading}
        subheading={page.hero_subheading}
        breadcrumbLabel={page.breadcrumb_label}
      />
      <section className="section" id={form?.anchor_id || undefined}>
        <div className="container">
          <div className="contact-block">
            <Reveal>
              {form && (
                <>
                  <h2>{form.heading}</h2>
                  <p>{form.body}</p>
                </>
              )}
              <ContactForm formType="contact" sourcePage="/home-health-care-contact-us" />
            </Reveal>
            <Reveal delay={120}>
              {settings && (
                <div className="card">
                  <h3>Visit Us</h3>
                  <p>{settings.address}</p>
                  <h3>Call Us Today!</h3>
                  <p><a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a></p>
                  <h3>Message Us</h3>
                  <p><a href={`mailto:${settings.email_primary}`}>{settings.email_primary}</a></p>
                  <p style={{ marginBottom: 0 }}><a href={`mailto:${settings.email_secondary}`}>{settings.email_secondary}</a></p>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {office && (
        <section className="section section--alt" id={office.anchor_id || undefined}>
          <div className="container">
            <Reveal>
              <OfficeInfo
                heading={office.heading}
                body={office.body}
                addresses={office.data?.addresses || []}
                phones={office.data?.phones || []}
              />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
};

export default Contact;
