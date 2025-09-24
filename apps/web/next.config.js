/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared"],

  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
