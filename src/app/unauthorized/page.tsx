'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-orange-600 dark:text-orange-400"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            アクセス権限がありません
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            このページにアクセスする権限がありません。
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            管理者権限が必要なページやサービスにアクセスしようとしました。必要な権限がある場合は、管理者にお問い合わせください。
          </p>
        </div>
      </Card>
    </div>
  )
}