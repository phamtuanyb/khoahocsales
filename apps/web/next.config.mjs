/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const outputMode = process.env.NEXT_OUTPUT || undefined;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mkt-academy/types'],
  basePath,
  output: outputMode,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
