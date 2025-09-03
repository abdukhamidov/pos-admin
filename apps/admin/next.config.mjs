/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure workspace packages with Client Components are transpiled and
  // share the same React instance to avoid invalid hook calls.
  transpilePackages: ['@mini/ui', '@mini/auth', '@mini/utils', '@mini/db'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
