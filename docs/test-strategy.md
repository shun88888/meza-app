# Meza アプリ テスト戦略

## 1. テスト戦略概要

### 1.1 目的
- 品質の高いアプリケーションの提供
- 継続的な機能追加時の品質保証
- リファクタリング時の安全性確保
- 本番環境での不具合最小化

### 1.2 テストピラミッド
```
    🔺 E2E テスト (10%)
      - ユーザージャーニー全体
      - クリティカルパス
      
   🔺🔺 統合テスト (20%)
      - コンポーネント間連携
      - API通信
      - 画面遷移
      
  🔺🔺🔺 単体テスト (70%)
     - 関数・メソッド
     - ユーティリティ
     - ロジック
```

## 2. テストレベル別戦略

### 2.1 単体テスト (Unit Tests)

#### 対象
- ユーティリティ関数 (`src/lib/utils.ts`)
- 位置情報ライブラリ (`src/lib/geolocation.ts`)
- 住所フォーマット (`src/lib/addressFormatter.ts`)
- カスタムフック
- ビジネスロジック関数

#### フレームワーク
- **Jest** + **@testing-library/react**
- TypeScript サポート付き
- モックとスタブ機能

#### カバレッジ目標
- **80%以上** (コードカバレッジ)
- **90%以上** (クリティカルパス)

#### 実装例
```typescript
// __tests__/lib/utils.test.ts
describe('calculateDistance', () => {
  it('should calculate distance between two points correctly', () => {
    const distance = calculateDistance(35.6762, 139.6503, 35.6812, 139.7671)
    expect(distance).toBeCloseTo(8000, -3) // 約8km
  })
})
```

### 2.2 統合テスト (Integration Tests)

#### 対象
- React コンポーネントとhooks
- API通信 (Supabase)
- 地図コンポーネント
- 決済フロー (Stripe)
- ページ間遷移

#### フレームワーク
- **@testing-library/react**
- **MSW** (Mock Service Worker) - API モック
- **@testing-library/user-event** - ユーザー操作

#### 実装例
```typescript
// __tests__/components/MapPicker.test.tsx
describe('MapPicker', () => {
  it('should update location when clicked', async () => {
    const onLocationSelect = jest.fn()
    render(<MapPicker onLocationSelect={onLocationSelect} />)
    
    // 地図をクリック
    const map = screen.getByTestId('map-container')
    fireEvent.click(map, { clientX: 100, clientY: 100 })
    
    await waitFor(() => {
      expect(onLocationSelect).toHaveBeenCalledWith({
        lat: expect.any(Number),
        lng: expect.any(Number)
      })
    })
  })
})
```

### 2.3 E2E テスト (End-to-End Tests)

#### 対象
- ユーザー登録からチャレンジ完了まで
- 決済フロー全体
- 位置情報を使ったチャレンジ
- エラーシナリオ

#### フレームワーク
- **Playwright** (推奨)
  - クロスブラウザ対応
  - モバイル対応
  - ネットワーク制御
  - スクリーンショット
  - ビデオ録画

#### 実装例
```typescript
// e2e/challenge-flow.spec.ts
test('complete challenge flow', async ({ page }) => {
  await page.goto('/auth/signin')
  
  // ログイン
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=signin-button]')
  
  // チャレンジ作成
  await page.click('[data-testid=create-challenge]')
  await page.click('[data-testid=time-picker]')
  await page.selectOption('[data-testid=hour]', '06')
  await page.click('[data-testid=next-button]')
  
  // 位置設定
  await page.click('[data-testid=map]', { position: { x: 100, y: 100 } })
  await page.click('[data-testid=next-button]')
  
  // 完了確認
  await expect(page.locator('[data-testid=challenge-created]')).toBeVisible()
})
```

## 3. 特定機能のテスト戦略

### 3.1 地図機能テスト

#### 単体テスト
```typescript
describe('Geolocation', () => {
  it('should get current position with high accuracy', async () => {
    // Geolocation API をモック
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) => {
        success({
          coords: {
            latitude: 35.6762,
            longitude: 139.6503,
            accuracy: 10
          },
          timestamp: Date.now()
        })
      })
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation
    })
    
    const position = await getCurrentPosition()
    expect(position.latitude).toBe(35.6762)
    expect(position.accuracy).toBeLessThanOrEqual(50)
  })
})
```

#### 統合テスト
```typescript
describe('MapPicker Integration', () => {
  it('should handle geolocation permission denial', async () => {
    // 位置情報拒否をシミュレート
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success, error) => {
        error({ code: 1, message: 'Permission denied' })
      })
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation
    })
    
    render(<MapPicker />)
    
    await waitFor(() => {
      expect(screen.getByText(/位置情報の許可が必要です/)).toBeInTheDocument()
    })
  })
})
```

### 3.2 決済機能テスト

#### Stripe テストカード
```typescript
// __tests__/stripe/payment.test.ts
describe('Stripe Payment', () => {
  const testCards = {
    visa: '4242424242424242',
    visaDebit: '4000056655665556',
    mastercard: '5555555555554444',
    declined: '4000000000000002',
    insufficientFunds: '4000000000009995'
  }
  
  it('should process successful payment', async () => {
    const { stripe } = await setupStripe()
    
    const result = await stripe.createPaymentMethod({
      type: 'card',
      card: {
        number: testCards.visa,
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    })
    
    expect(result.error).toBeNull()
    expect(result.paymentMethod?.id).toBeDefined()
  })
})
```

#### Webhook テスト
```typescript
// __tests__/api/webhooks/stripe.test.ts
describe('Stripe Webhook', () => {
  it('should handle payment_intent.succeeded event', async () => {
    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_12345',
          amount: 1000,
          metadata: {
            challenge_id: 'challenge_123'
          }
        }
      }
    }
    
    const response = await POST(new Request('/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(event)
    }))
    
    expect(response.status).toBe(200)
  })
})
```

### 3.3 Supabase 統合テスト

#### データベース操作
```typescript
// __tests__/lib/supabase.test.ts
describe('Supabase Integration', () => {
  beforeEach(async () => {
    // テストデータベースをリセット
    await supabase.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  })
  
  it('should create challenge correctly', async () => {
    const challengeData = {
      target_time: '06:00:00',
      penalty_amount: 1000,
      target_location: { lat: 35.6762, lng: 139.6503 }
    }
    
    const result = await createChallenge(challengeData)
    
    expect(result.error).toBeNull()
    expect(result.data?.id).toBeDefined()
  })
})
```

## 4. テスト環境設定

### 4.1 必要パッケージ

#### 開発依存関係
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "@playwright/test": "^1.40.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "msw": "^1.3.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### 4.2 Jest 設定

#### `jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/stories/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### `jest.setup.js`
```javascript
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { handlers } from './src/__mocks__/handlers'

// MSW サーバー設定
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Geolocation API モック
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
  },
})

// ResizeObserver モック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
```

### 4.3 Playwright 設定

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 5. CI/CD 統合

### 5.1 GitHub Actions 設定

#### `.github/workflows/test.yml`
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.2 package.json スクリプト
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## 6. テストデータ管理

### 6.1 テストデータベース
```typescript
// src/__mocks__/database.ts
export const testChallenges = [
  {
    id: 'test-challenge-1',
    target_time: '06:00:00',
    penalty_amount: 1000,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z'
  }
]

export const testUsers = [
  {
    id: 'test-user-1',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z'
  }
]
```

### 6.2 MSW ハンドラー
```typescript
// src/__mocks__/handlers.ts
import { rest } from 'msw'

export const handlers = [
  // Supabase API
  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.json({
        access_token: 'mock-token',
        user: { id: 'test-user-1', email: 'test@example.com' }
      })
    )
  }),
  
  // Nominatim API
  rest.get('*/reverse', (req, res, ctx) => {
    return res(
      ctx.json({
        display_name: '東京都千代田区丸の内1丁目, 日本',
        address: {
          state: '東京都',
          city: '千代田区',
          suburb: '丸の内'
        }
      })
    )
  }),
  
  // Stripe API
  rest.post('*/payment_intents', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'pi_test_12345',
        client_secret: 'pi_test_12345_secret_test'
      })
    )
  })
]
```

## 7. パフォーマンステスト

### 7.1 Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Build app
        run: |
          npm ci
          npm run build
          npm run start &
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

### 7.2 Bundle 分析
```javascript
// scripts/analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  webpack: (config) => {
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      )
    }
    return config
  },
}
```

## 8. 品質ゲート

### 8.1 プルリクエスト要件
- [ ] 単体テスト カバレッジ 80%以上
- [ ] E2E テスト 全て通過
- [ ] Lighthouse スコア 90以上
- [ ] TypeScript エラー なし
- [ ] ESLint エラー なし

### 8.2 リリース要件
- [ ] 全テスト通過
- [ ] セキュリティスキャン通過
- [ ] パフォーマンス基準達成
- [ ] アクセシビリティテスト通過

## 9. 運用とメンテナンス

### 9.1 定期実行
- **毎日**: E2E スモークテスト
- **毎週**: 全テストスイート実行
- **毎月**: セキュリティ・依存関係更新

### 9.2 モニタリング
- テスト実行時間の監視
- フレイキーテストの検出
- カバレッジトレンド分析

### 9.3 改善プロセス
- 月次テストレビューミーティング
- テスト戦略の定期見直し
- 新機能追加時のテスト要件定義

このテスト戦略により、Mezaアプリの品質を継続的に維持・向上させていきます。