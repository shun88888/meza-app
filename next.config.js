/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSG対応のためのoutputを無効化
  output: undefined,
  
  // 最適化設定
  experimental: {
    optimizeCss: false, // CSSの最適化を無効化してcritters問題を回避
  },

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
  webpack: (config) => {
    // ファイルシステムの依存を無効化（Vercel対応）
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    }
    return config
  },
}

module.exports = nextConfig 