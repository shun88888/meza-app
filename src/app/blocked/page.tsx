'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function BlockedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-red-600 dark:text-red-400"
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6"/>
              <path d="m9 9 6 6"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            アクセスが制限されています
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            このサイトへのアクセスは制限されています。集中して早起きチャレンジに取り組みましょう！
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

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            なぜ制限されているの？
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left">
            <li>• 早起きの習慣化をサポートするため</li>
            <li>• 気が散るサイトへのアクセスを制限</li>
            <li>• セキュリティの向上</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}