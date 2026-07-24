import type { NextConfig } from "next";

const parseAllowedDevOrigins = () => {
  const envValue = process.env.NEXT_ALLOWED_DEV_ORIGINS || "";
  const fromEnv = envValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  // Allow common local and tunnel hosts used during development.
  const defaults = ["localhost", "127.0.0.1", "*.trycloudflare.com"];
  return Array.from(new Set([...defaults, ...fromEnv]));
};

const nextConfig: NextConfig = {
  allowedDevOrigins: parseAllowedDevOrigins(),
  async rewrites() {
    const nestApiOrigin = process.env.NEST_API_ORIGIN || "http://127.0.0.1:8787";

    return [
      {
        source: "/scores/:path*",
        destination: `${nestApiOrigin}/scores/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${nestApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
