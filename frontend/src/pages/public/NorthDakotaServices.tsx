import React from "react";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import ServiceGrid from "../../components/public/ServiceGrid";
import OfficeInfo from "../../components/public/OfficeInfo";
import Reveal from "../../components/public/Reveal";

const NorthDakotaServices: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-north-dakota-office-services");
  if (loading || !page) return <PageLoading />;

  const intro = page.sections.find((s) => s.section_type === "intro");
  const serviceGridSection = page.sections.find((s) => s.section_type === "service_grid");
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

      {intro && (
        <section className="section" id={intro.anchor_id || undefined}>
          <Reveal as="div" className="text-section">
            <p>{intro.body}</p>
          </Reveal>
        </section>
      )}

      <section className="section section--alt" id={serviceGridSection?.anchor_id || undefined}>
        <div className="container">
          {serviceGridSection?.heading && <h2 className="text-center" style={{ marginBottom: 32 }}>{serviceGridSection.heading}</h2>}
          <ServiceGrid region="north_dakota" />
        </div>
      </section>

      {office && (
        <section className="section" id={office.anchor_id || undefined}>
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

export default NorthDakotaServices;
