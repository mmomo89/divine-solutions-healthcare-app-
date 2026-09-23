import React, { useEffect, useState } from "react";
import api from "../../api/client";
import type { Page } from "../../types";

/** Shared data-loading hook used by every public page. */
export function usePageData(slug: string) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .get(`/pages/${slug}/`)
      .then((res) => setPage(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return { page, loading, error };
}

export const PageLoading: React.FC = () => (
  <div className="container section text-center muted">Loading{"\u2026"}</div>
);
