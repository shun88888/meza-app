'use client'

import { useRouter } from 'next/navigation'

export default function TermsPage() {
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
            <h1 className="ml-2 text-xl font-semibold text-gray-900">利用規約</h1>
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
            <h2 className="text-lg font-semibold text-gray-900">第1条（適用）</h2>
            <p className="text-gray-700 leading-relaxed">
              本利用規約（以下「本規約」といいます。）は、当社が提供するMezaアプリケーション（以下「本サービス」といいます。）の利用条件を定めるものです。本サービスをご利用いただくユーザーの皆様（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第2条（利用登録）</h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <p className="text-gray-700 leading-relaxed">
              ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第4条（利用料金および支払方法）</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>本サービスの利用に関して、以下の料金が発生する場合があります：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>チャレンジ失敗時のペナルティ料金</li>
                <li>その他当社が定める料金</li>
              </ul>
              <p>支払方法は、当社が指定する方法によるものとします。</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第5条（禁止事項）</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第6条（本サービスの提供の停止等）</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第7条（利用制限および登録抹消）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、当該ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第8条（免責事項）</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>当社は、本サービスに関して、以下について一切の責任を負いません：</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>本サービスの内容の正確性、完全性、有用性等</li>
                <li>本サービスの利用によってユーザーに生じた損害</li>
                <li>本サービスの提供の中断、停止、終了等</li>
                <li>本サービスの利用により第三者との間で生じた紛争</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第9条（サービス内容の変更等）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第10条（利用規約の変更）</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に表示した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">第11条（準拠法・裁判管轄）</h2>
            <p className="text-gray-700 leading-relaxed">
              本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              本規約に関するお問い合わせは、本サービス内のヘルプページよりお願いいたします。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  )
}