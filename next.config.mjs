/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GORUT_CANONICAL_PDF_ENABLED: process.env.GORUT_CANONICAL_PDF_ENABLED ?? 'false',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
