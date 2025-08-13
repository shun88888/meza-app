'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PenaltySettingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedAmount, setSelectedAmount] = useState(
    parseInt(searchParams.get('current') || '300')
  )
  const [customAmount, setCustomAmount] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const predefinedAmounts = [100, 300, 500, 1000, 2000, 3000, 5000, 10000]

  const handleSave = () => {
    const finalAmount = showCustomInput ? parseInt(customAmount) : selectedAmount
    if (finalAmount && finalAmount > 0) {
      // URLパラメータとして金額を渡して戻る
      router.push(`/create-challenge?penaltyAmount=${finalAmount}`)
    }
  }

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^\d]/g, '')
    setCustomAmount(numValue)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="戻る"
              title="戻る"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          </div>
          <h1 className="text-center text-lg font-medium text-gray-900">覚悟金額設定</h1>
          <div />
        </div>
      </div>

      <div className="p-4">
        {/* 説明テキスト */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                覚悟金額について
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>設定した時間に起きられなかった場合に支払う金額です。高い金額を設定するほど、起きる動機が強くなります。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 定額選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">推奨金額</h2>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#FFAD2F] text-white rounded-lg text-sm font-medium hover:bg-[#FF9A1F] transition-colors"
            >
              決定
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {predefinedAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount)
                  setShowCustomInput(false)
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedAmount === amount && !showCustomInput
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold">
                  {formatCurrency(amount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {amount <= 500 ? '初心者向け' : 
                   amount <= 2000 ? '標準' : 
                   amount <= 5000 ? '本気度高' : '専門家向け'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* カスタム金額 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">カスタム金額</h2>
          </div>
          <div className="p-4">
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                showCustomInput
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-base font-medium text-gray-700">
                任意の金額を設定
              </div>
              <div className="text-sm text-gray-500 mt-1">
                100円〜100,000円の範囲で設定できます
              </div>
            </button>
            
            {showCustomInput && (
              <div className="mt-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="金額を入力"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg"
                    inputMode="numeric"
                  />
                </div>
                {customAmount && (
                  <div className="mt-2 text-sm text-gray-600">
                    設定金額: {formatCurrency(parseInt(customAmount) || 0)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 現在の選択表示 */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">現在の設定</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(showCustomInput ? (parseInt(customAmount) || 0) : selectedAmount)}
          </div>
        </div>
      </div>
    </div>
  )
}