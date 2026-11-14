import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

// Static export only writes route handlers (robots.txt is one) that are explicitly static.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
