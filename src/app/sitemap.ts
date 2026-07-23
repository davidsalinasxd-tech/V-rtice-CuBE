import type { MetadataRoute } from "next";
import { getDisenosPublicados } from "@/lib/supabase/queries";

const SITE_URL = "https://verticecube.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const disenos = await getDisenosPublicados();

  const rutasEstaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/#catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/suscripcion`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/vendedor`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/registro`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const rutasDisenos: MetadataRoute.Sitemap = disenos.map((d) => ({
    url: `${SITE_URL}/producto/${d.id}`,
    lastModified: d.created_at,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...rutasEstaticas, ...rutasDisenos];
}
