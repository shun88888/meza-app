'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            サーバーエラーが発生しました
          </h2>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-md">
          <p className="text-gray-600 leading-relaxed">
            申し訳ございませんが、予期しないエラーが発生しました。
            一時的な問題の可能性があります。少し時間をおいて再度お試しください。
          </p>
          
          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="font-semibold text-red-800 mb-2">エラー詳細（開発環境のみ）:</h3>
              <p className="text-sm text-red-700 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-sm text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ホームに戻る
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            問題が解決しない場合は
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/help')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ヘルプ
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ページを再読み込み
            </button>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6">
          <p className="text-xs text-gray-400">
            このエラーが継続する場合は、ブラウザのキャッシュをクリアしてみてください。
          </p>
        </div>
      </div>
    </div>
  )
}