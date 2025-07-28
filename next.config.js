/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // Improve error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Optimize webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Configure cache to handle big strings warning
    if (dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxMemoryGenerations: 1,
      }
    }
    
    // Prevent chunk loading errors
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }
    
    // Improve error handling for development
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    
    return config
  },
  
  // PWA configuration
  experimental: {
    // Disable app directory features that might cause hydration issues
    serverComponentsExternalPackages: ['leaflet'],
  },
  
  // Improve build performance
  swcMinify: true,
  
  // Handle environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Fix font preload optimization
  optimizeFonts: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Optimize images
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Handle redirects
  async redirects() {
    return [
      {
        source: '/auth/signin',
        destination: '/login',
        permanent: false,
      },
    ]
  },
  
  // Custom headers for better performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 