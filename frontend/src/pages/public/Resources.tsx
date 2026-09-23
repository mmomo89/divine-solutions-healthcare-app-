import React from "react";
import { Helmet } from "./Helmet";
import { usePageData, PageLoading } from "./PageSkeleton";
import PageHero from "../../components/public/PageHero";
import ResourceList from "../../components/public/ResourceList";

const Resources: React.FC = () => {
  const { page, loading } = usePageData("home-health-care-resources");
  if (loading || !page) return <PageLoading />;

  return (
    <>
      <Helmet title={page.seo_title || page.title} description={page.meta_description} />
      <PageHero
        image={page.hero_image_url}
        heading={page.hero_heading}
        subheading={page.hero_subheading}
        breadcrumbLabel={page.breadcrumb_label}
      />
      <section className="section">
        <div className="container">
          <ResourceList />
        </div>
      </section>
    </>
  );
};

export default Resources;
