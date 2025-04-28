// Load environment variables from .env file
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net', 'localhost'],
    unoptimized: true
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'bcrypt'];
    return config;
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Explicitly set environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Add serverRuntimeConfig and publicRuntimeConfig
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  publicRuntimeConfig: {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Experimental features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig; 