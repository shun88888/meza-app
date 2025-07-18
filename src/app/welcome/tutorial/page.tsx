'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const tutorialSteps = [
  {
    id: 1,
    title: 'チャレンジを作成',
    description: '起床時間と目標地点を設定します',
    image: '📝',
    details: [
      '起床時間を設定',
      '目標地点を地図で選択',
      'ペナルティ金額を設定'
    ],
    tips: [
      '💡 最初は近い場所から始めましょう',
      '💡 ペナルティは痛みを感じる金額がおすすめ',
      '💡 天候予報も確認して設定'
    ],
    demoAction: 'タップして設定デモを見る',
    timeEstimate: '約2分',
    difficulty: 'easy'
  },
  {
    id: 2,
    title: 'チャレンジを開始',
    description: 'スライドで覚悟を決めて開始',
    image: '🚀',
    details: [
      'スライドバーを右にスライド',
      '現在位置を記録',
      'カウントダウン開始'
    ],
    tips: [
      '💡 スライドは一度だけ、慎重に',
      '💡 GPS信号が強い場所で開始',
      '💡 開始後はキャンセル不可'
    ],
    demoAction: 'スライドデモを体験',
    timeEstimate: '約30秒',
    difficulty: 'easy'
  },
  {
    id: 3,
    title: '目標地点に向かう',
    description: '指定時間までに目標地点に到着',
    image: '🏃',
    details: [
      '指定時間までに移動',
      '100m以内に到着',
      '位置情報で確認'
    ],
    tips: [
      '💡 余裕を持った時間設定が重要',
      '💡 リアルタイムで残り時間を確認',
      '💡 到着前にGPSの精度をチェック'
    ],
    demoAction: 'ルート案内デモを見る',
    timeEstimate: '設定次第',
    difficulty: 'medium'
  },
  {
    id: 4,
    title: 'チャレンジ完了',
    description: '成功またはペナルティ決済',
    image: '✅',
    details: [
      '成功：おめでとう！',
      '失敗：自動ペナルティ決済',
      '履歴に記録'
    ],
    tips: [
      '💡 成功すると達成感MAX',
      '💡 失敗しても次に活かせる',
      '💡 統計で成長を実感'
    ],
    demoAction: '結果画面デモを見る',
    timeEstimate: '即座',
    difficulty: 'easy'
  }
]

export default function TutorialPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showTips, setShowTips] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const handleNext = () => {
    setIsAnimating(true)
    setShowTips(false)
    
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
    
    setTimeout(() => {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        router.push('/signup')
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleSkip = () => {
    router.push('/signup')
  }

  const handleBack = () => {
    setIsAnimating(true)
    setShowTips(false)
    
    setTimeout(() => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
      } else {
        router.push('/welcome/features')
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleDemo = () => {
    // Show interactive demo
    setShowTips(!showTips)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '簡単'
      case 'medium': return '普通'
      case 'hard': return '難しい'
      default: return '不明'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 flex flex-col">
      {/* Header */}
      <div className="p-6 pt-safe">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="text-sm text-gray-500">
            {currentStep + 1} / {tutorialSteps.length}
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            スキップ
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className={`text-center transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          {/* Tutorial Step Icon with animations */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full mx-auto flex items-center justify-center text-4xl animate-bounce">
              {tutorialSteps[currentStep].image}
            </div>
            {/* Completion Badge */}
            {completedSteps.includes(currentStep) && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
            {/* Step Number */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white border-2 border-orange-400 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">{currentStep + 1}</span>
            </div>
          </div>

          {/* Step metadata */}
          <div className="flex justify-center items-center space-x-4 mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorialSteps[currentStep].difficulty)}`}>
              {getDifficultyText(tutorialSteps[currentStep].difficulty)}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              ⏱️ {tutorialSteps[currentStep].timeEstimate}
            </span>
          </div>

          {/* Step Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {tutorialSteps[currentStep].title}
          </h1>

          {/* Step Description */}
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            {tutorialSteps[currentStep].description}
          </p>

          {/* Demo Button */}
          <button
            onClick={handleDemo}
            className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
          >
            🎮 {tutorialSteps[currentStep].demoAction}
          </button>

          {/* Step Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-md mx-auto">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              手順
            </h3>
            <ul className="text-left space-y-3">
              {tutorialSteps[currentStep].details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tips Section (expandable) */}
          <div className={`transition-all duration-500 overflow-hidden ${showTips ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                成功のコツ
              </h3>
              <ul className="text-left space-y-2">
                {tutorialSteps[currentStep].tips.map((tip, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Progress */}
          <div className="flex justify-center space-x-3 mb-8">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true)
                  setShowTips(false)
                  setTimeout(() => {
                    setCurrentStep(index)
                    setIsAnimating(false)
                  }, 300)
                }}
                className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center text-sm font-bold relative ${
                  index === currentStep 
                    ? 'bg-orange-500 text-white scale-110 shadow-lg' 
                    : completedSteps.includes(index)
                    ? 'bg-green-500 text-white hover:scale-105'
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400 hover:scale-105'
                }`}
              >
                {completedSteps.includes(index) ? '✓' : index + 1}
                {index === currentStep && (
                  <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                )}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {currentStep + 1} / {tutorialSteps.length} ステップ完了
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pb-safe">
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-4 text-lg"
        >
          {currentStep === tutorialSteps.length - 1 ? '始める' : '次へ'}
        </Button>
      </div>
    </div>
  )
} 