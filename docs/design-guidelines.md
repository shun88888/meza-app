# Meza アプリ デザインガイドライン

## 1. ブランドアイデンティティ

### 1.1 コンセプト
- **明るく前向き**: 早起きという挑戦を応援する明るいイメージ
- **信頼感**: 決済を伴うため、セキュリティと信頼性を表現
- **シンプル**: 直感的で使いやすいインターフェース
- **モチベーション**: ユーザーの継続意欲を高めるデザイン

### 1.2 キーワード
- Energy（エネルギー）
- Trust（信頼）
- Simplicity（シンプル）
- Motivation（モチベーション）

## 2. カラーパレット

### 2.1 プライマリーカラー
```css
/* メインブランドカラー */
--primary: #FFC700;        /* ブライトイエロー */
--primary-50: #FFFEF0;     /* 最も薄い */
--primary-100: #FFFCE0;    
--primary-200: #FFF9C2;    
--primary-300: #FFF485;    
--primary-400: #FFED47;    
--primary-500: #FFC700;    /* ベース */
--primary-600: #E6B300;    
--primary-700: #CC9F00;    
--primary-800: #B38A00;    
--primary-900: #997500;    /* 最も濃い */
--primary-foreground: #000000; /* プライマリー上のテキスト */
```

### 2.2 セマンティックカラー
```css
/* 成功・エラー・警告 */
--success: #10B981;        /* エメラルドグリーン */
--success-light: #6EE7B7;  
--success-dark: #047857;   

--error: #EF4444;          /* レッド */
--error-light: #FCA5A5;    
--error-dark: #DC2626;     

--warning: #F59E0B;        /* アンバー */
--warning-light: #FCD34D;  
--warning-dark: #D97706;   

--info: #3B82F6;           /* ブルー */
--info-light: #93C5FD;     
--info-dark: #1D4ED8;      
```

### 2.3 ニュートラルカラー
```css
/* グレースケール（ライトモード） */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* ダークモード対応 */
--dark-bg: #0F172A;        /* ダークモード背景 */
--dark-surface: #1E293B;   /* カード背景 */
--dark-border: #334155;    /* ボーダー */
```

### 2.4 カラー使用ルール
- **プライマリー**: CTA、アクセント、ブランド要素
- **成功**: チャレンジ成功、完了状態
- **エラー**: 失敗、警告、削除アクション
- **グレー**: テキスト、ボーダー、背景

## 3. タイポグラフィ

### 3.1 フォントファミリー
```css
/* システムフォント使用 */
font-family: 
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  "Helvetica Neue",
  Arial,
  "Noto Sans",
  sans-serif,
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji";
```

### 3.2 フォントサイズシステム
```css
/* テキストサイズ */
--text-xs: 0.75rem;    /* 12px - キャプション */
--text-sm: 0.875rem;   /* 14px - 補助テキスト */
--text-base: 1rem;     /* 16px - 本文 */
--text-lg: 1.125rem;   /* 18px - 見出し4 */
--text-xl: 1.25rem;    /* 20px - 見出し3 */
--text-2xl: 1.5rem;    /* 24px - 見出し2 */
--text-3xl: 1.875rem;  /* 30px - 見出し1 */
--text-4xl: 2.25rem;   /* 36px - タイトル */
```

### 3.3 フォントウェイト
```css
--font-normal: 400;    /* 通常テキスト */
--font-medium: 500;    /* 強調テキスト */
--font-semibold: 600;  /* 見出し */
--font-bold: 700;      /* タイトル */
```

### 3.4 行間
```css
--leading-tight: 1.25;   /* 見出し用 */
--leading-snug: 1.375;   /* サブタイトル用 */
--leading-normal: 1.5;   /* 本文用 */
--leading-relaxed: 1.625; /* 読みやすい本文 */
```

### 3.5 タイポグラフィ使用例
```css
/* 見出し1 */
.heading-1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

/* 見出し2 */
.heading-2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

/* 本文 */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-700);
}

/* キャプション */
.caption {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-snug);
  color: var(--gray-500);
}
```

## 4. アイコンシステム

### 4.1 アイコンライブラリ
- **メインライブラリ**: Lucide React
- **サイズ**: 16px, 20px, 24px, 32px
- **スタイル**: アウトライン（統一感のため）

### 4.2 アイコン使用ルール
```css
/* アイコンサイズ */
--icon-xs: 16px;    /* 小さなボタン内 */
--icon-sm: 20px;    /* 通常のボタン、リスト */
--icon-md: 24px;    /* 見出し、重要な要素 */
--icon-lg: 32px;    /* ヒーロー要素 */

/* アイコンカラー */
--icon-primary: var(--primary-500);
--icon-secondary: var(--gray-500);
--icon-success: var(--success);
--icon-error: var(--error);
```

### 4.3 主要アイコン
- **ナビゲーション**: Home, BarChart3, History, Settings
- **アクション**: Plus, Edit, Trash2, Check, X
- **状態**: CheckCircle, XCircle, Clock, AlertCircle
- **機能**: MapPin, Bell, CreditCard, Shield, Eye

## 5. スペーシングシステム

### 5.1 スペーシングスケール
```css
--space-0: 0px;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 5.2 使用ガイド
- **要素内余白**: 4px, 8px, 12px, 16px
- **要素間余白**: 8px, 16px, 24px, 32px
- **セクション間余白**: 24px, 32px, 48px, 64px

## 6. ボーダーラディウス

### 6.1 ラディウススケール
```css
--radius-none: 0px;
--radius-sm: 0.25rem;   /* 4px - 小さな要素 */
--radius-md: 0.5rem;    /* 8px - ボタン、入力欄 */
--radius-lg: 0.75rem;   /* 12px - カード */
--radius-xl: 1rem;      /* 16px - 大きなカード */
--radius-2xl: 1.25rem;  /* 20px - モーダル */
--radius-full: 9999px;  /* 完全な円形 */
```

## 7. シャドウシステム

### 7.1 シャドウレベル
```css
/* カードシャドウ */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 特殊効果 */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
--shadow-none: 0 0 #0000;
```

## 8. レイアウトシステム

### 8.1 グリッドシステム
```css
/* コンテナ */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;

/* モバイルファースト */
--mobile-max: 480px;
--tablet-min: 768px;
--desktop-min: 1024px;
```

### 8.2 Z-indexシステム
```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-toast: 1080;
```

## 9. アニメーション

### 9.1 トランジション
```css
/* 基本トランジション */
--transition-fast: 150ms ease-out;
--transition-base: 200ms ease-out;
--transition-slow: 300ms ease-out;

/* イージング */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 9.2 アニメーション使用例
```css
/* ホバー効果 */
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-fast);
}

/* フェードイン */
.fade-in {
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 10. コンポーネント仕様

### 10.1 ボタン
```css
/* プライマリーボタン */
.btn-primary {
  background: var(--primary-500);
  color: var(--primary-foreground);
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
}

/* セカンダリーボタン */
.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}
```

### 10.2 カード
```css
.card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  border: 1px solid var(--gray-200);
}
```

### 10.3 入力欄
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-base);
  transition: border-color var(--transition-fast);
}

.input:focus {
  border-color: var(--primary-500);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 199, 0, 0.1);
}
```

## 11. ダークモード

### 11.1 カラー変数（ダークモード）
```css
[data-theme="dark"] {
  --background: var(--dark-bg);
  --foreground: #F8FAFC;
  --card: var(--dark-surface);
  --card-foreground: #F8FAFC;
  --border: var(--dark-border);
  --primary: #FFC700;
  --primary-foreground: #000000;
}
```

### 11.2 切り替え規則
- システム設定に従う（prefers-color-scheme）
- ユーザー設定で上書き可能
- 滑らかなトランジション

## 12. アクセシビリティ

### 12.1 コントラスト比
- 通常テキスト: 4.5:1以上
- 大きなテキスト: 3:1以上
- UI要素: 3:1以上

### 12.2 フォーカス表示
```css
.focusable:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### 12.3 タッチターゲット
- 最小サイズ: 44px × 44px
- 間隔: 8px以上

## 13. 実装ガイドライン

### 13.1 CSS変数使用
- 色は必ずCSS変数を使用
- マジックナンバーは避ける
- Tailwindクラスを優先

### 13.2 レスポンシブ
- モバイルファースト
- ブレークポイント: sm(640px), md(768px), lg(1024px)
- 可変サイズでテスト