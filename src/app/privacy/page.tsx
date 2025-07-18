'use client'

import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6 pt-safe">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
              aria-label="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="ml-2 text-xl font-semibold text-gray-900">プライバシーポリシー</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="text-sm text-gray-600 mb-6">
            最終更新日: {new Date().toLocaleDateString('ja-JP')}
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">1. 個人情報の取得について</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、Mezaアプリケーションの提供にあたり、以下の個人情報を取得いたします：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>メールアドレス</li>
                <li>ユーザー名</li>
                <li>位置情報（GPS等）</li>
                <li>チャレンジ履歴</li>
                <li>決済情報</li>
                <li>アプリ使用状況</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">2. 個人情報の利用目的</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>取得した個人情報は、以下の目的で利用いたします：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>本サービスの提供、運営、改善</li>
                <li>ユーザー認証</li>
                <li>位置情報を利用したチャレンジ機能の提供</li>
                <li>決済処理</li>
                <li>カスタマーサポート</li>
                <li>統計情報の作成（個人を特定できない形での利用）</li>
                <li>新機能やサービスの案内</li>
                <li>利用規約違反の調査</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">3. 個人情報の第三者提供</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、以下の場合を除き、個人情報を第三者に提供いたしません：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">4. 個人情報の委託</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、個人情報の取扱いの全部または一部を第三者に委託する場合があります。その場合、委託先に対して適切な監督を行います。</p>
              <p>主な委託先：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>クラウドサービス提供事業者（データの保存・処理）</li>
                <li>決済代行業者（決済処理）</li>
                <li>地図サービス提供事業者（位置情報サービス）</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">5. 位置情報の取扱い</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>本アプリは、チャレンジ機能の提供のためにユーザーの位置情報を取得します：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>位置情報の取得は、ユーザーの明示的な同意に基づいて行います</li>
                <li>位置情報は、チャレンジの成功・失敗判定のためにのみ使用されます</li>
                <li>位置情報の取得を停止したい場合は、端末の設定から無効にできます</li>
                <li>位置情報は、必要な期間のみ保存され、定期的に削除されます</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">6. 個人情報の保存期間</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>個人情報の保存期間は以下の通りです：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>アカウント情報：アカウント削除から1年間</li>
                <li>チャレンジ履歴：最後のチャレンジから3年間</li>
                <li>決済情報：法令に基づく保存期間</li>
                <li>位置情報：チャレンジ完了から30日間</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">7. 個人情報の開示・訂正・削除</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>ユーザーは、自己の個人情報について以下の権利を有します：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>開示を求める権利</li>
                <li>訂正・追加・削除を求める権利</li>
                <li>利用停止を求める権利</li>
                <li>第三者提供の停止を求める権利</li>
              </ul>
              <p>これらの権利を行使したい場合は、本アプリ内のヘルプページよりお問い合わせください。</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">8. Cookie等の使用</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>本アプリでは、サービスの向上のため以下の技術を使用する場合があります：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cookie</li>
                <li>ローカルストレージ</li>
                <li>アクセス解析ツール</li>
              </ul>
              <p>これらの技術により個人を特定することはありません。</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">9. 個人情報の安全管理</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、個人情報の漏洩、滅失、毀損等を防止するため、適切な安全管理措置を講じています：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>データの暗号化</li>
                <li>アクセス制御</li>
                <li>定期的なセキュリティ監査</li>
                <li>従業員への教育・研修</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">10. 未成年者の個人情報</h2>
            <p className="text-gray-700 leading-relaxed">
              未成年者が本サービスを利用する場合は、保護者の同意が必要です。未成年者の個人情報については、保護者の権利として開示・訂正・削除等の請求を行うことができます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">11. プライバシーポリシーの変更</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、法令の変更や事業の変更等により、本プライバシーポリシーを変更する場合があります。変更後のプライバシーポリシーは、本アプリ上に表示した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">12. お問い合わせ</h2>
            <p className="text-gray-700 leading-relaxed">
              本プライバシーポリシーに関するお問い合わせ、個人情報の開示・訂正・削除等のご請求は、本アプリ内のヘルプページよりお願いいたします。
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              当社は、個人情報保護法をはじめとする関連法令を遵守し、個人情報の適切な取扱いに努めてまいります。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}