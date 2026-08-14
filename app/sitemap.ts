import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = "https://774ng.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lgas, projects] = await Promise.all([
    db.lGA.findMany({ where: { status: "APPROVED" }, select: { lgaName: true, updatedAt: true } }),
    db.project.findMany({ where: { isPublished: true, approvalStatus: "APPROVED" }, select: { id: true, slug: true, updatedAt: true }, take: 500 }),
  ]).catch(() => [[], []]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                         lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/lgas`,               lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/projects`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/allocations`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/invest`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/news`,               lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/leaderboard`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/map`,                lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/about`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/how-it-works`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faqs`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/signup`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/lga-signup`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/lga-verify`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/support`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/report`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`,              lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/privacy`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/cookies`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/data-policy`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  const lgaPages: MetadataRoute.Sitemap = (lgas as { lgaName: string; updatedAt: Date }[]).map((l) => ({
    url: `${BASE}/lgas/${l.lgaName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const projectPages: MetadataRoute.Sitemap = (projects as { id: string; slug: string | null; updatedAt: Date }[]).map((p) => ({
    url: `${BASE}/projects/${p.slug ?? p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...lgaPages, ...projectPages];
}
