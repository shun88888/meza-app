'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FeyButton } from '@/components/ui/fey-button'

export default function WelcomePage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      icon: '🌅',
      title: 'Mezaへようこそ',
      subtitle: '起床チャレンジアプリ',
      description: '早起きを習慣化し、理想的な生活リズムを手に入れましょう。失敗時のペナルティで確実に継続できます。',
      color: 'from-orange-400 to-yellow-400'
    },
    {
      icon: '🎯',
      title: '目標を設定',
      subtitle: 'チャレンジ作成',
      description: '起床時間とペナルティ金額を設定してチャレンジを作成。自分に合った難易度で始められます。',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      icon: '📍',
      title: '移動で証明',
      subtitle: '位置情報確認',
      description: 'チャレンジ成功には100m以上の移動が必要。ベッドから確実に起き上がることを証明します。',
      color: 'from-green-400 to-emerald-400'
    },
    {
      icon: '💳',
      title: '自動決済システム',
      subtitle: '失敗時の責任',
      description: 'チャレンジに失敗した場合、設定したペナルティ金額が自動で決済されます。だからこそ本気になれる。',
      color: 'from-purple-400 to-pink-400'
    }
  ]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push('/signup')
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentSlideData.color} flex flex-col`}>
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10">
        <Link
          href="/signup"
          className="text-white/80 hover:text-white text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
        >
          スキップ
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center text-white">
          {/* Icon */}
          <div className="text-8xl mb-8 animate-bounce">
            {currentSlideData.icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-2">
            {currentSlideData.title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg font-medium opacity-90 mb-6">
            {currentSlideData.subtitle}
          </p>

          {/* Description */}
          <p className="text-base opacity-80 leading-relaxed mb-8">
            {currentSlideData.description}
          </p>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                currentSlide === 0
                  ? 'text-transparent cursor-not-allowed'
                  : 'text-white/80 hover:text-white hover:bg-white/20'
              }`}
            >
              前へ
            </button>

            <button
              onClick={nextSlide}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors shadow-lg"
            >
              {currentSlide === slides.length - 1 ? '始める' : '次へ'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="bg-black/10 backdrop-blur-sm p-6">
        <div className="max-w-sm mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs opacity-80">チャレンジ</div>
            </div>
            <div>
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs opacity-80">統計</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🎖️</div>
              <div className="text-xs opacity-80">実績</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      {currentSlide === slides.length - 1 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              準備はできましたか？
            </h2>
            <p className="text-gray-600 mb-6">
              今すぐアカウントを作成して、理想的な朝の習慣を始めましょう。
            </p>
            <div className="space-y-3">
              <FeyButton
                onClick={() => router.push('/signup')}
                className="w-full h-12"
              >
                無料でアカウント作成
              </FeyButton>
              <FeyButton
                onClick={() => router.push('/login')}
                className="w-full h-12"
              >
                既存アカウントでログイン
              </FeyButton>
            </div>
            
            <button
              onClick={() => setCurrentSlide(0)}
              className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              最初から見る
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}