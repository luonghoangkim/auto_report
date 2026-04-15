import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mongoose must run only on the server; exclude it from client bundles
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
