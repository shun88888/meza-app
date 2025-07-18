'use client'

import { useRouter } from 'next/navigation'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-6xl mb-4">😴</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            ページが見つかりません
          </h2>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-md">
          <p className="text-gray-600 leading-relaxed">
            お探しのページは存在しないか、移動または削除された可能性があります。
            URLを確認していただくか、下記のボタンからホームページに戻ってください。
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            前のページに戻る
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            他にもお困りのことがあれば
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
              onClick={() => router.push('/profile')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              プロフィール
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}