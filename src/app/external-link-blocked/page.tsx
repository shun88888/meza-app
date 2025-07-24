'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ExternalLinkBlockedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-purple-600 dark:text-purple-400"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            外部リンクがブロックされました
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            外部サイトへのアクセスは制限されています。早起きチャレンジに集中しましょう！
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            ホームに戻る
          </Button>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            前のページに戻る
          </Button>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            💡 代わりにできること
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
            <li>• 今日のチャレンジを確認する</li>
            <li>• 統計ページで進捗を見る</li>
            <li>• 新しいチャレンジを作成する</li>
            <li>• 設定を調整する</li>
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          セキュリティとフォーカスを保つため、一部の外部サイトへのアクセスを制限しています。
        </div>
      </Card>
    </div>
  )
}