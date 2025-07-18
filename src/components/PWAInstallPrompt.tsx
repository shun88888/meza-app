'use client'

import { useEffect, useState } from 'react'
import { useMobileInfo } from './MobileDetector'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallPromptProps {
  onInstalled?: () => void
  onDismissed?: () => void
  className?: string
}

export default function PWAInstallPrompt({ 
  onInstalled, 
  onDismissed, 
  className = '' 
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const mobileInfo = useMobileInfo()

  useEffect(() => {
    // PWAインストールプロンプトの準備
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // モバイルかつスタンドアロンでない場合にプロンプト表示
      if (mobileInfo.isMobile && !mobileInfo.isStandalone) {
        // 少し遅延してからプロンプト表示（UX向上）
        setTimeout(() => setShowPrompt(true), 2000)
      }
    }

    // PWAインストール完了検出
    const handleAppInstalled = () => {
      // PWA installed successfully
      setShowPrompt(false)
      setDeferredPrompt(null)
      onInstalled?.()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [mobileInfo.isMobile, mobileInfo.isStandalone, onInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      // PWA install prompt outcome: ${outcome}
      
      if (outcome === 'accepted') {
        onInstalled?.()
      } else {
        onDismissed?.()
      }
    } catch (error) {
      console.error('PWA install failed:', error)
      onDismissed?.()
    } finally {
      setIsInstalling(false)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    onDismissed?.()
  }

  // iOS用の手動インストール案内
  const IOSInstallInstructions = () => (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mx-4 shadow-2xl border border-gray-200">
      <div className="text-center">
        <div className="text-3xl mb-3">📱</div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          ホーム画面に追加
        </h3>
        <div className="text-sm text-gray-600 space-y-2 text-left">
          <p>1. Safari下部の<span className="font-semibold">共有</span>ボタン（□↑）をタップ</p>
          <p>2. <span className="font-semibold">「ホーム画面に追加」</span>を選択</p>
          <p>3. <span className="font-semibold">「追加」</span>をタップ</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium"
          >
            後で
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-timee text-white rounded-xl font-medium"
          >
            了解
          </button>
        </div>
      </div>
    </div>
  )

  // Android用のネイティブプロンプト
  const AndroidInstallPrompt = () => (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mx-4 shadow-2xl border border-gray-200">
      <div className="text-center">
        <div className="text-3xl mb-3">🚀</div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          アプリをインストール
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Mezaアプリをホーム画面に追加して、<br />
          ネイティブアプリのように使用できます
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium"
            disabled={isInstalling}
          >
            後で
          </button>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="flex-1 px-4 py-2 bg-timee text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isInstalling ? 'インストール中...' : 'インストール'}
          </button>
        </div>
      </div>
    </div>
  )

  // 表示条件：プロンプト表示フラグ && (モバイル && 非スタンドアロン)
  if (!showPrompt || !mobileInfo.isMobile || mobileInfo.isStandalone) {
    return null
  }

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center pb-safe ${className}`}>
      <div className="w-full max-w-md">
        {mobileInfo.isIOS ? <IOSInstallInstructions /> : <AndroidInstallPrompt />}
      </div>
    </div>
  )
}

// PWAインストール状態を管理するフック
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const mobileInfo = useMobileInfo()

  useEffect(() => {
    // スタンドアロンモードかどうかでインストール状態を判定
    setIsInstalled(mobileInfo.isStandalone)
    setIsInstallable(mobileInfo.canInstallPWA)
  }, [mobileInfo.isStandalone, mobileInfo.canInstallPWA])

  return {
    isInstallable,
    isInstalled,
    canInstall: isInstallable && !isInstalled,
    mobileInfo
  }
} 