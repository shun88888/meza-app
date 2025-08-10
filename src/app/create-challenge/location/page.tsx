import Link from 'next/link'

export default function LocationSettingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-800">起床場所設定（再構築中）</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              このページはマップ機能を一から作り直しています。
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/create-challenge"
              className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              チャレンジ作成に戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}




