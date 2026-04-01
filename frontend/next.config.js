/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api-billing.mawinkings.com/api',
  },
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig