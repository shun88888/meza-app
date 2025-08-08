/**
 * Navigation Control Configuration
 * Defines allowed and blocked URI patterns for the application
 */

export interface NavigationRule {
  pattern: string | RegExp
  type: 'allow' | 'block'
  description: string
  requiresAuth?: boolean
  redirectTo?: string
}

// Define allowed internal routes
export const ALLOWED_ROUTES: NavigationRule[] = [
  // Authentication routes
  { pattern: '/auth/signin', type: 'allow', description: 'ログインページ' },
  { pattern: '/auth/signup', type: 'allow', description: '新規登録ページ' },
  { pattern: '/auth/callback', type: 'allow', description: 'OAuth コールバック' },
  { pattern: '/auth/forgot-password', type: 'allow', description: 'パスワードリセット' },
  { pattern: '/auth/reset-password', type: 'allow', description: 'パスワード再設定' },
  
  // Public routes
  { pattern: '/welcome', type: 'allow', description: 'ウェルカムページ' },
  { pattern: '/privacy', type: 'allow', description: 'プライバシーポリシー' },
  { pattern: '/terms', type: 'allow', description: '利用規約' },
  { pattern: '/about', type: 'allow', description: 'アバウトページ' },
  { pattern: '/login', type: 'allow', description: 'ログインページ' },
  { pattern: '/signup', type: 'allow', description: 'サインアップページ' },
  
  // Error and system pages (always allowed)
  { pattern: '/not-found', type: 'allow', description: '404エラーページ' },
  { pattern: '/error', type: 'allow', description: 'エラーページ' },
  { pattern: '/blocked', type: 'allow', description: 'ブロックページ' },
  { pattern: '/unauthorized', type: 'allow', description: '認証エラーページ' },
  { pattern: '/external-link-blocked', type: 'allow', description: '外部リンクブロックページ' },
  
  // Protected routes (require authentication)
  { pattern: '/', type: 'allow', description: 'ホームページ', requiresAuth: true },
  { pattern: '/stats', type: 'allow', description: '統計ページ', requiresAuth: true },
  { pattern: '/analytics', type: 'allow', description: 'アナリティクスページ', requiresAuth: true },
  { pattern: '/history', type: 'allow', description: '履歴ページ', requiresAuth: true },
  { pattern: '/settings', type: 'allow', description: '設定ページ', requiresAuth: true },
  { pattern: '/create-challenge', type: 'allow', description: 'チャレンジ作成', requiresAuth: true },
  { pattern: '/active-challenge', type: 'allow', description: 'アクティブチャレンジ', requiresAuth: true },
  { pattern: /^\/challenge\/[a-zA-Z0-9-]+/, type: 'allow', description: 'チャレンジ詳細', requiresAuth: true },
  { pattern: '/onboarding', type: 'allow', description: 'オンボーディング', requiresAuth: true },
  { pattern: '/help', type: 'allow', description: 'ヘルプページ', requiresAuth: true },
  { pattern: '/faq', type: 'allow', description: 'よくある質問', requiresAuth: true },
  
  // API routes
  { pattern: /^\/api\//, type: 'allow', description: 'API エンドポイント' },
]

// Define blocked patterns (external links and potentially harmful routes)
export const BLOCKED_PATTERNS: NavigationRule[] = [
  // External social media platforms
  { pattern: /^https?:\/\/(www\.)?(facebook|twitter|instagram|tiktok|youtube)\.com/, type: 'block', description: 'ソーシャルメディアサイト', redirectTo: '/blocked' },
  
  // Known potentially harmful domains
  { pattern: /^https?:\/\/.*\.(tk|ml|ga|cf)($|\/)/, type: 'block', description: '疑わしいドメイン', redirectTo: '/blocked' },
  
  // File download links
  { pattern: /\.(exe|dmg|pkg|deb|rpm|zip|rar|7z|tar\.gz)(\?.*)?$/, type: 'block', description: 'ファイルダウンロード', redirectTo: '/blocked' },
  
  // Admin and development routes in production
  { pattern: /^\/admin/, type: 'block', description: '管理者ページ', redirectTo: '/unauthorized' },
  { pattern: /^\/dev/, type: 'block', description: '開発者ページ', redirectTo: '/unauthorized' },
  
  // Deprecated or removed routes
  { pattern: /^\/profile/, type: 'block', description: '廃止されたプロファイルページ', redirectTo: '/settings' },
]

// Allowed external domains for specific purposes
export const ALLOWED_EXTERNAL_DOMAINS: string[] = [
  'stripe.com',
  'js.stripe.com',
  'nominatim.openstreetmap.org',
  'api.mapbox.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]

/**
 * Check if a URL is allowed based on the navigation rules
 */
export function isUrlAllowed(url: string, isAuthenticated: boolean = false): {
  allowed: boolean
  rule?: NavigationRule
  redirectTo?: string
} {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    const pathname = parsedUrl.pathname
    const hostname = parsedUrl.hostname
    
    // Check if it's an external URL
    if (hostname !== window.location.hostname) {
      // Check if external domain is allowed
      if (ALLOWED_EXTERNAL_DOMAINS.includes(hostname)) {
        return { allowed: true }
      }
      
      // Check against blocked patterns
      for (const rule of BLOCKED_PATTERNS) {
        if (typeof rule.pattern === 'string') {
          if (url.includes(rule.pattern)) {
            return { allowed: false, rule, redirectTo: rule.redirectTo }
          }
        } else if (rule.pattern.test(url)) {
          return { allowed: false, rule, redirectTo: rule.redirectTo }
        }
      }
      
      // By default, block external URLs not in allowed list
      return { allowed: false, redirectTo: '/external-link-blocked' }
    }
    
    // Check internal routes
    for (const rule of ALLOWED_ROUTES) {
      let matches = false
      
      if (typeof rule.pattern === 'string') {
        matches = pathname === rule.pattern || pathname.startsWith(rule.pattern + '/')
      } else {
        matches = rule.pattern.test(pathname)
      }
      
      if (matches) {
        // Check authentication requirement
        if (rule.requiresAuth && !isAuthenticated) {
          return { allowed: false, redirectTo: '/auth/signin' }
        }
        return { allowed: true, rule }
      }
    }
    
    // Check against blocked patterns
    for (const rule of BLOCKED_PATTERNS) {
      if (typeof rule.pattern === 'string') {
        if (pathname.includes(rule.pattern)) {
          return { allowed: false, rule, redirectTo: rule.redirectTo }
        }
      } else if (rule.pattern.test(pathname)) {
        return { allowed: false, rule, redirectTo: rule.redirectTo }
      }
    }
    
    // Default: block unknown routes
    return { allowed: false, redirectTo: '/not-found' }
  } catch (error) {
    console.error('Error parsing URL:', error)
    return { allowed: false, redirectTo: '/error' }
  }
}

/**
 * Get user-friendly error message for blocked navigation
 */
export function getBlockedNavigationMessage(rule?: NavigationRule): string {
  if (!rule) {
    return 'このページにはアクセスできません。'
  }
  
  switch (rule.description) {
    case 'ソーシャルメディアサイト':
      return 'ソーシャルメディアサイトへのアクセスは制限されています。集中して早起きチャレンジに取り組みましょう！'
    case '疑わしいドメイン':
      return 'セキュリティ上の理由により、このサイトへのアクセスは制限されています。'
    case 'ファイルダウンロード':
      return 'ファイルのダウンロードは制限されています。'
    case '管理者ページ':
      return '管理者ページにアクセスする権限がありません。'
    case '廃止されたプロファイルページ':
      return 'このページは廃止されました。設定ページをご利用ください。'
    default:
      return `アクセスが制限されています: ${rule.description}`
  }
}