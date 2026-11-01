import type { MetadataRoute } from "next";
import { getCars } from "./lib/cars";

const SITE_URL = "https://cdidrepo.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await getCars();
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/car`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/box`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...cars.map((car) => ({
      url: `${SITE_URL}/car/${car.token}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
