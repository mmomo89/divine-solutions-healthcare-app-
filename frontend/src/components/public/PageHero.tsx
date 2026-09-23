import React from "react";
import Breadcrumbs from "./Breadcrumbs";

interface Props {
  image?: string | null;
  heading: string;
  subheading?: string;
  breadcrumbLabel: string;
}

const PageHero: React.FC<Props> = ({ image, heading, subheading, breadcrumbLabel }) => (
  <div className="page-hero">
    {image && <img src={image} alt="" />}
    <div className="page-hero__content">
      <Breadcrumbs current={breadcrumbLabel} />
      <h1>{heading}</h1>
      {subheading && <p>{subheading}</p>}
    </div>
  </div>
);

export default PageHero;
