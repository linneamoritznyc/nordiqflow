import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading AF taxonomy data from parent directory
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // For CV uploads
    },
  },
};

export default nextConfig;
