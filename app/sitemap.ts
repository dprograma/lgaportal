import { MetadataRoute } from "next";

const BASE_URL = "https://774ng.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/how-it-works`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/faqs`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/lgas`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/projects`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/allocations`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/invest`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${BASE_URL}/news`, priority: 0.8, changeFrequency: "daily" },
    { url: `${BASE_URL}/leaderboard`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/map`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/signup`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/lga-signup`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/contact`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE_URL}/report`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE_URL}/support`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE_URL}/privacy`, priority: 0.4, changeFrequency: "yearly" },
    { url: `${BASE_URL}/terms`, priority: 0.4, changeFrequency: "yearly" },
    { url: `${BASE_URL}/cookies`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/data-policy`, priority: 0.3, changeFrequency: "yearly" },
  ] as MetadataRoute.Sitemap;

  return staticRoutes.map((r) => ({
    ...r,
    lastModified: new Date(),
  }));
}
