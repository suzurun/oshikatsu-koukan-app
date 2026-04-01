import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@oshikatsu/types', '@oshikatsu/api-client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig


export default nextConfig

