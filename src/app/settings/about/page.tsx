'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, Info, ExternalLink, Heart, Star } from 'lucide-react'

export default function AboutPage() {
  const [appVersion] = useState('1.0.0')
  const [buildNumber] = useState('2024070100')
  const router = useRouter()

  const handleRateApp = () => {
    alert('アプリストアのレビューページに移動します')
  }

  const handleFeedback = () => {
    alert('フィードバック送信フォームを開きます')
  }

  const handleOpenSource = () => {
    alert('オープンソースライセンス情報を表示します')
  }

  const handleTerms = () => {
    alert('利用規約ページに移動します')
  }

  const handlePrivacy = () => {
    alert('プライバシーポリシーページに移動します')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownLeft size={20} className="text-gray-600 dark:text-gray-400 rotate-45" />
            </button>
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">アプリについて</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-6">
          {/* App Info */}
          <div className="mb-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-black font-bold text-2xl">M</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Meza</h2>
              <p className="text-gray-600 dark:text-gray-400">早起きチャレンジアプリ</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Info size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">バージョン</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">現在のアプリバージョン</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{appVersion}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Build {buildNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">サポート</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRateApp}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Star size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">アプリを評価</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">App Store / Google Playで評価</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              <button
                onClick={handleFeedback}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Heart size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">フィードバック送信</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ご意見・ご要望をお聞かせください</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Legal */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">法的情報</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleTerms}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <ExternalLink size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">利用規約</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">サービス利用に関する規約</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              <button
                onClick={handlePrivacy}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <ExternalLink size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">プライバシーポリシー</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">個人情報の取り扱いについて</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              <button
                onClick={handleOpenSource}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <ExternalLink size={20} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">オープンソースライセンス</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">使用しているライブラリについて</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* About App */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Mezaについて</h3>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <p>Mezaは、早起きを習慣化するためのアプリです。設定した時間に起きて、100m以上移動することでチャレンジ成功となります。</p>
              <p>失敗した場合は事前に設定したペナルティ金額が自動で決済されるため、強制的に早起きの習慣を身につけることができます。</p>
              <p>継続こそが力なり。毎日の小さな積み重ねで、より良い生活習慣を築いていきましょう。</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 Meza. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}