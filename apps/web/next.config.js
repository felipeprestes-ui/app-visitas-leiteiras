/** @type {import('next').NextConfig} */
const path = require('path');

const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = 'app-visitas-leiteiras';
const basePath = isGithubPages ? `/${repoName}` : '';

const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
