import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@oshikatsu/types', '@oshikatsu/api-client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typedRoutes: true,
}

export default nextConfig
