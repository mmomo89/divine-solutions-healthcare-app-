import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client";
import { PageLoading } from "./PageSkeleton";
import GenericPage from "./GenericPage";
import ServiceDetail from "./ServiceDetail";

const PublicSlugResolver: React.FC = () => {
  const { slug } = useParams();
  const [isCmsPage, setIsCmsPage] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    if (!slug) {
      setIsCmsPage(false);
      return () => {
        active = false;
      };
    }

    setIsCmsPage(null);

    api.get(`/pages/${slug}/`)
      .then(() => {
        if (active) setIsCmsPage(true);
      })
      .catch(() => {
        if (active) setIsCmsPage(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isCmsPage === null) return <PageLoading />;

  return isCmsPage ? <GenericPage /> : <ServiceDetail />;
};

export default PublicSlugResolver;
