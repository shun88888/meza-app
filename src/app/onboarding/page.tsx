'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeyButton } from '@/components/ui/fey-button'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'プロフィール設定',
      description: '基本情報を設定します',
      icon: '👤',
      path: '/onboarding/profile'
    },
    {
      title: '決済方法設定',
      description: 'クレジットカードを登録します',
      icon: '💳',
      path: '/onboarding/payment'
    },
    {
      title: '設定完了',
      description: 'チャレンジ開始の準備完了',
      icon: '🎉',
      path: '/onboarding/complete'
    }
  ]

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep + 1) {
      router.push(steps[stepIndex].path)
    }
  }

  const handleSkip = () => {
    router.push('/')
  }

  const handleStart = () => {
    router.push('/onboarding/profile')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#FFAD2F] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">初期設定</h1>
          <p className="text-gray-600">
            Mezaアプリを快適にご利用いただくため<br />
            いくつかの設定を行います
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(index)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors mb-2 ${
                    index <= currentStep
                      ? 'bg-[#FFAD2F] text-white cursor-pointer hover:bg-[#FF9A1F]'
                      : index === currentStep + 1
                      ? 'bg-blue-100 text-blue-600 cursor-pointer hover:bg-blue-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={index > currentStep + 1}
                >
                  {index <= currentStep ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>

                {/* Step Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute h-0.5 transition-colors ${
                    index < currentStep ? 'bg-[#FFAD2F]' : 'bg-gray-200'
                  }`} style={{
                    width: 'calc(33.333% - 3rem)',
                    left: `calc(${(index + 1) * 33.333}% - 1.5rem)`,
                    top: '6rem'
                  }} />
                )}

                {/* Step Label */}
                <div className="text-center">
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <div className={`text-sm font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">設定内容</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-blue-800">基本プロフィール（名前、目標など）</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-blue-800">決済方法（チャレンジ失敗時の自動決済用）</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-blue-800">通知設定（オプション）</span>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium">所要時間: 約3-5分</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <FeyButton
            onClick={handleStart}
            className="w-full h-12"
          >
            設定を開始
          </FeyButton>
          
          <FeyButton
            onClick={handleSkip}
            className="w-full h-12"
          >
            後で設定する
          </FeyButton>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            設定はいつでも後から変更できます
          </p>
        </div>
      </div>
    </div>
  )
}