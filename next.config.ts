import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/portal',
        destination: '/admin',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
