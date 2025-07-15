/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSG対応のためのoutputを無効化
  output: undefined,
  
  // 最適化設定
  experimental: {
    optimizeCss: true, // CSS最適化を有効化
    webVitalsAttribution: ['CLS', 'LCP'], // Core Web Vitals追跡
    optimizePackageImports: ['leaflet', 'react-leaflet'], // 外部パッケージ最適化
  },
  
  // パフォーマンス最適化
  swcMinify: true,
  compress: true,
  
  // CSS最適化
  optimizeFonts: true,

  // PWA対応
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // 画像最適化
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: false,
  },

  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack設定
  webpack: (config, { isServer }) => {
    // ファイルシステムの依存を無効化（Vercel対応）
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    }
    
    // CSS最適化設定
    if (!isServer) {
      config.optimization.splitChunks.chunks = 'all'
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        styles: {
          name: 'styles',
          test: /\.(css|scss|sass)$/,
          chunks: 'all',
          enforce: true,
        },
        leaflet: {
          name: 'leaflet',
          test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
          chunks: 'all',
          priority: 10,
        }
      }
    }
    
    return config
  },
}

module.exports = nextConfig 