import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = "https://774ng.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lgas, projects, newsItems] = await Promise.all([
    db.lGA.findMany({ where: { status: "APPROVED" }, select: { lgaName: true, updatedAt: true } }),
    db.project.findMany({ where: { isPublished: true, approvalStatus: "APPROVED" }, select: { id: true, updatedAt: true } }),
    db.pressRelease.findMany({ where: { status: "PUBLISHED" }, select: { id: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/lgas`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/projects`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/invest`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/allocations`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/news`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/about`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/how-it-works`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faqs`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/support`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/cookies`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE_URL}/data-policy`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];

  const lgaRoutes: MetadataRoute.Sitemap = lgas.map((l) => ({
    url: `${BASE_URL}/lgas/${l.lgaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE_URL}/projects/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const newsRoutes: MetadataRoute.Sitemap = newsItems.map((n) => ({
    url: `${BASE_URL}/news/${n.id}`,
    lastModified: n.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...lgaRoutes, ...projectRoutes, ...newsRoutes];
}
