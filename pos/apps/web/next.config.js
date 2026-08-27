/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  transpilePackages: [
    "@retailflow/ui",
    "@retailflow/shared-types",
    "@retailflow/database",
    "@retailflow/business-core",
    "@retailflow/validation",
    "@retailflow/sync-engine",
  ],
};

module.exports = nextConfig;
