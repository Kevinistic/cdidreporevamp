import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Car and box data is fetched as part of each build, so this is also when the data was last refreshed.
  env: {
    BUILD_DATE: new Date().toISOString(),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
