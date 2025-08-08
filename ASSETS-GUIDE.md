# 🎨 Meza アプリ 素材配置ガイド

## 📁 フォルダ構成

### Static Assets (public/)
```
public/
├── images/
│   ├── onboarding/          # Welcome画面用イラスト
│   │   ├── step1-concept.svg
│   │   ├── step2-permission.svg
│   │   └── step3-penalty.svg
│   ├── illustrations/       # アプリ内イラスト
│   │   ├── location-tracking.svg
│   │   ├── success-celebration.svg
│   │   └── challenge-failed.svg
│   ├── backgrounds/         # 背景画像
│   │   ├── hero-gradient.jpg
│   │   └── login-bg.jpg
│   └── ui/                  # UI要素画像
│       ├── decorative-shapes.svg
│       └── patterns/
├── icons/
│   ├── features/            # 機能別アイコン
│   │   ├── location.svg
│   │   ├── alarm.svg
│   │   ├── payment.svg
│   │   └── statistics.svg
│   ├── social/              # ソーシャル関連
│   │   ├── share.svg
│   │   └── notification.svg
│   └── navigation/          # ナビゲーション用
│       ├── home.svg
│       ├── settings.svg
│       └── history.svg
├── audio/
│   ├── alarm-sounds/        # アラーム音
│   │   ├── gentle-wake.mp3
│   │   ├── energetic-bell.mp3
│   │   └── nature-birds.mp3
│   ├── notifications/       # 通知音
│   │   ├── success.wav
│   │   ├── failure.wav
│   │   └── reminder.wav
│   └── ui-sounds/           # UI効果音
│       ├── button-click.wav
│       └── swipe.wav
└── videos/
    ├── onboarding/          # チュートリアル動画
    │   └── how-it-works.mp4
    └── features/            # 機能説明動画
        └── location-setup.mp4
```

### Component Icons (src/components/icons/)
```
src/components/icons/
├── LocationIcon.tsx         # 位置情報アイコン
├── AlarmIcon.tsx           # アラームアイコン
├── PaymentIcon.tsx         # 決済アイコン
├── SuccessIcon.tsx         # 成功アイコン
├── WarningIcon.tsx         # 警告アイコン
├── NavigationIcons.tsx     # ナビゲーション一式
└── index.ts                # 一括エクスポート
```

## 🎯 用途別推奨形式

### Welcome/Onboarding画面
- **イラスト**: SVG（軽量・スケーラブル）
- **背景**: WebP/JPG（圧縮最適化）
- **アイコン**: SVG（24x24px 基準）

### 位置情報機能
- **地図マーカー**: SVG（カスタマイズ可能）
- **GPS状態アイコン**: SVG（16x16px, 24x24px）

### アラーム・通知
- **音声**: MP3（圧縮）+ WAV（高音質バックアップ）
- **視覚効果**: Lottie JSON（アニメーション）

### PWA・モバイル対応
- **アプリアイコン**: PNG（各サイズ対応済み）
- **スプラッシュ画面**: PNG/WebP

## 📝 ファイル命名規則

### 画像ファイル
```
onboarding-step1-concept.svg
illustration-success-celebration.svg
bg-login-gradient.jpg
icon-location-pin.svg
```

### 音声ファイル
```
alarm-gentle-wake.mp3
notification-success.wav
ui-button-click.wav
```

### 動画ファイル
```
tutorial-how-it-works.mp4
feature-location-setup.mp4
```

## 🔧 最適化推奨事項

### 画像最適化
- **SVG**: 不要な要素削除、minify
- **PNG**: TinyPNG等で圧縮
- **JPG**: 品質85%程度
- **WebP**: 次世代フォーマット対応

### 音声最適化
- **MP3**: 128kbps（通知音）、192kbps（アラーム）
- **WAV**: 16bit/44.1kHz
- **ファイルサイズ**: 3秒以内の音は100KB以下推奨

### 動画最適化
- **MP4**: H.264コーデック
- **解像度**: 720p（モバイル最適）
- **長さ**: チュートリアル30秒以内推奨

## 🎨 デザインガイドライン

### カラーパレット（既存設定準拠）
- **プライマリー**: #FFC700（黄色）
- **成功**: #10B981（緑）
- **エラー**: #EF4444（赤）
- **テキスト**: #1F2937（ダークグレー）

### アイコンスタイル
- **線幅**: 2px統一
- **角丸**: 2px（小さいアイコン）、4px（大きいアイコン）
- **余白**: 最小2px確保

## 📱 レスポンシブ対応

### 画像サイズ
```css
/* 例：イラスト用 */
.illustration {
  max-width: 100%;
  height: auto;
}

/* 例：アイコン用 */
.icon-small { width: 16px; height: 16px; }
.icon-medium { width: 24px; height: 24px; }
.icon-large { width: 32px; height: 32px; }
```

## 🚀 使用方法

### 静的画像の読み込み
```tsx
import Image from 'next/image'

<Image 
  src="/images/onboarding/step1-concept.svg"
  alt="アプリの概念説明"
  width={300}
  height={200}
/>
```

### SVGコンポーネントの使用
```tsx
import { LocationIcon } from '@/components/icons'

<LocationIcon className="w-6 h-6 text-yellow-400" />
```

### 音声ファイルの再生
```tsx
const playSuccessSound = () => {
  const audio = new Audio('/audio/notifications/success.wav')
  audio.play()
}
```

## 📋 チェックリスト

素材追加時の確認事項：

- [ ] ファイル名が命名規則に従っている
- [ ] 適切なフォルダに配置されている  
- [ ] ファイルサイズが最適化されている
- [ ] alt属性用の説明文を準備している
- [ ] レスポンシブ対応を考慮している
- [ ] アクセシビリティを考慮している

---

素材を配置したら、このガイドに従って適切な場所に置いてください！