import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const nestApiOrigin = process.env.NEST_API_ORIGIN || "http://127.0.0.1:4002";

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
