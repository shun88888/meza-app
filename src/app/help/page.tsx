'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  priority: number
}

interface GuideStep {
  id: string
  title: string
  description: string
  image?: string
  action?: string
}

interface Guide {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  steps: GuideStep[]
}

interface Troubleshooting {
  id: string
  problem: string
  solutions: string[]
  category: string
  commonality: number
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'Mezaアプリとは何ですか？',
    answer: 'Mezaは位置ベースの朝活チャレンジアプリです。起床時間と目標地点を設定し、指定時間までにその場所に到着することで朝活を習慣化できます。失敗した場合はペナルティが課金されます。',
    category: 'general',
    tags: ['基本', 'アプリ', '朝活', 'チャレンジ'],
    priority: 1
  },
  {
    id: '2',
    question: 'チャレンジの作成方法を教えてください',
    answer: '1. 「チャレンジ作成」をタップ\n2. 起床時間を設定\n3. 地図で目標地点を選択\n4. ペナルティ金額を設定\n5. チャレンジを保存',
    category: 'challenge',
    tags: ['作成', 'チャレンジ', '設定', '手順'],
    priority: 2
  },
  {
    id: '3',
    question: '位置判定の精度はどのくらいですか？',
    answer: '目標地点から100m以内に到着すれば成功と判定されます。GPSの精度により多少の誤差がありますが、通常は十分な精度で判定されます。',
    category: 'location',
    tags: ['GPS', '位置', '精度', '判定'],
    priority: 3
  },
  {
    id: '4',
    question: 'ペナルティの支払い方法を教えてください',
    answer: 'チャレンジ失敗時は、登録済みの決済方法から自動的にペナルティが課金されます。事前に決済方法を登録しておく必要があります。',
    category: 'payment',
    tags: ['ペナルティ', '支払い', '決済', '自動'],
    priority: 4
  },
  {
    id: '5',
    question: '決済方法の登録方法を教えてください',
    answer: 'プロフィール → 決済設定 → 決済方法を追加から、クレジットカードやデビットカードを登録できます。',
    category: 'payment',
    tags: ['クレジットカード', '決済', '登録', 'プロフィール'],
    priority: 5
  },
  {
    id: '6',
    question: 'アプリが動作しない場合はどうすればよいですか？',
    answer: '1. アプリを再起動\n2. 位置情報の許可を確認\n3. インターネット接続を確認\n4. アプリを最新版に更新',
    category: 'troubleshooting',
    tags: ['トラブル', '動作', '再起動', '設定'],
    priority: 6
  },
  {
    id: '7',
    question: 'データのバックアップはできますか？',
    answer: 'プロフィール → データ管理から、チャレンジ履歴をCSV形式でエクスポートできます。',
    category: 'data',
    tags: ['バックアップ', 'データ', 'エクスポート', 'CSV'],
    priority: 7
  },
  {
    id: '8',
    question: 'アカウントの削除方法を教えてください',
    answer: 'プロフィール → データ管理 → データ削除から、すべてのデータを削除できます。この操作は取り消せません。',
    category: 'account',
    tags: ['アカウント', '削除', 'データ', '管理'],
    priority: 8
  },
  {
    id: '9',
    question: 'チャレンジを編集することはできますか？',
    answer: '作成済みのチャレンジは編集できません。新しくチャレンジを作成するか、現在のチャレンジを削除してから新しく作成してください。',
    category: 'challenge',
    tags: ['編集', 'チャレンジ', '変更', '削除'],
    priority: 9
  },
  {
    id: '10',
    question: '天候が悪い日はチャレンジを延期できますか？',
    answer: '天候による延期機能は現在開発中です。雨天時などは安全を最優先に、無理をせずチャレンジを諦めることをお勧めします。',
    category: 'challenge',
    tags: ['天候', '延期', '雨', '安全'],
    priority: 10
  },
  {
    id: '11',
    question: 'チャレンジの成功率を上げるコツはありますか？',
    answer: '・余裕を持った起床時間を設定\n・目標地点までのルートを事前に確認\n・交通機関の遅延情報をチェック\n・天候予報を確認\n・十分な睡眠を取る',
    category: 'tips',
    tags: ['コツ', '成功', '準備', 'ルート'],
    priority: 11
  },
  {
    id: '12',
    question: 'プッシュ通知が来ない場合はどうすればよいですか？',
    answer: '1. 設定 → 通知でプッシュ通知が有効か確認\n2. デバイスの通知設定でMezaアプリが許可されているか確認\n3. アプリを再起動\n4. デバイスを再起動',
    category: 'troubleshooting',
    tags: ['通知', 'プッシュ', '設定', '許可'],
    priority: 12
  }
]

const guides: Guide[] = [
  {
    id: '1',
    title: 'はじめてのチャレンジ作成',
    description: '初回利用者向けの詳細なチャレンジ作成ガイド',
    category: 'getting-started',
    difficulty: 'beginner',
    estimatedTime: '5分',
    steps: [
      {
        id: '1',
        title: 'アプリを起動',
        description: 'Mezaアプリを開いて、ホーム画面を表示します。',
        action: 'アプリを開く'
      },
      {
        id: '2',
        title: 'チャレンジ作成ボタンをタップ',
        description: '画面下部の「+」ボタンまたは「チャレンジ作成」をタップします。',
        action: 'ボタンをタップ'
      },
      {
        id: '3',
        title: '起床時間を設定',
        description: '目標とする起床時間を設定します。現実的な時間を選びましょう。',
        action: '時間を選択'
      },
      {
        id: '4',
        title: '目標地点を選択',
        description: '地図から目標地点を選択します。通いやすい場所がおすすめです。',
        action: '地図で選択'
      },
      {
        id: '5',
        title: 'ペナルティ金額を設定',
        description: '失敗時のペナルティ金額を設定します。モチベーションが上がる金額にしましょう。',
        action: '金額を入力'
      },
      {
        id: '6',
        title: 'チャレンジを保存',
        description: '設定内容を確認して、チャレンジを保存します。',
        action: '保存ボタンをタップ'
      }
    ]
  },
  {
    id: '2',
    title: '決済方法の設定',
    description: 'クレジットカードの登録と決済設定の方法',
    category: 'setup',
    difficulty: 'beginner',
    estimatedTime: '3分',
    steps: [
      {
        id: '1',
        title: 'プロフィール画面を開く',
        description: '画面右下のプロフィールアイコンをタップします。',
        action: 'プロフィールを開く'
      },
      {
        id: '2',
        title: '決済設定を選択',
        description: 'プロフィール画面から「決済設定」を選択します。',
        action: '決済設定をタップ'
      },
      {
        id: '3',
        title: 'カード情報を入力',
        description: 'クレジットカードまたはデビットカードの情報を入力します。',
        action: 'カード情報を入力'
      },
      {
        id: '4',
        title: '設定を保存',
        description: '入力した情報を保存して、決済設定を完了します。',
        action: '保存'
      }
    ]
  }
]

const troubleshootingData: Troubleshooting[] = [
  {
    id: '1',
    problem: 'アプリが起動しない',
    solutions: [
      'デバイスを再起動してください',
      'アプリを最新版に更新してください',
      'ストレージ容量を確認し、不要なファイルを削除してください',
      'アプリを削除して再インストールしてください'
    ],
    category: 'app',
    commonality: 3
  },
  {
    id: '2',
    problem: 'GPS位置情報が取得できない',
    solutions: [
      '設定 → プライバシー → 位置情報サービスを有効にしてください',
      'Mezaアプリの位置情報アクセスを「常に許可」に設定してください',
      '屋外で位置情報を取得してください',
      'デバイスを再起動してください'
    ],
    category: 'location',
    commonality: 5
  },
  {
    id: '3',
    problem: '決済が失敗する',
    solutions: [
      'カード情報が正しく入力されているか確認してください',
      'カードの有効期限を確認してください',
      'カードの利用限度額を確認してください',
      '別の決済方法を試してください'
    ],
    category: 'payment',
    commonality: 4
  }
]

const categories = [
  { id: 'all', name: 'すべて', icon: '📋' },
  { id: 'general', name: '基本', icon: '❓' },
  { id: 'challenge', name: 'チャレンジ', icon: '🎯' },
  { id: 'location', name: '位置情報', icon: '📍' },
  { id: 'payment', name: '決済', icon: '💳' },
  { id: 'troubleshooting', name: 'トラブル', icon: '🔧' },
  { id: 'data', name: 'データ', icon: '📊' },
  { id: 'account', name: 'アカウント', icon: '👤' },
  { id: 'tips', name: 'コツ・アドバイス', icon: '💡' }
]

export default function HelpPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'troubleshooting'>('faq')
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Enhanced search with tags and priority
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  }).sort((a, b) => a.priority - b.priority)

  // Search suggestions based on tags and questions
  useEffect(() => {
    if (searchQuery.length > 0) {
      const allTags = faqs.flatMap(faq => faq.tags)
      const allQuestions = faqs.map(faq => faq.question)
      const suggestions = [...allTags, ...allQuestions]
        .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const handleContactSupport = () => {
    router.push('/help/contact')
  }

  const handleGuideSelect = (guide: Guide) => {
    setSelectedGuide(guide)
    setCurrentStep(0)
  }

  const handleGuideClose = () => {
    setSelectedGuide(null)
    setCurrentStep(0)
  }

  const handleNextStep = () => {
    if (selectedGuide && currentStep < selectedGuide.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">ヘルプ</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { id: 'faq', label: 'よくある質問', icon: '❓' },
            { id: 'guides', label: 'ガイド', icon: '📖' },
            { id: 'troubleshooting', label: 'トラブルシューティング', icon: '🔧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Enhanced Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="質問やキーワードを検索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">📂</span>
                  カテゴリー
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedCategory === category.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{category.icon}</div>
                      <div className="text-xs font-medium text-gray-800">{category.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="mr-2">❓</span>
                    よくある質問
                  </span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({filteredFAQs.length}件)
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredFAQs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="font-medium text-gray-700 mb-2">該当する質問が見つかりませんでした</h3>
                    <p className="text-sm">別のキーワードやカテゴリーをお試しください</p>
                  </div>
                ) : (
                  filteredFAQs.map((faq) => (
                    <div key={faq.id} className="p-6">
                      <button
                        onClick={() => handleFAQToggle(faq.id)}
                        className="w-full text-left flex items-start justify-between group"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                            {faq.question}
                          </h3>
                          {expandedFAQ === faq.id && (
                            <div className="text-gray-600 text-sm whitespace-pre-line mb-3">
                              {faq.answer}
                            </div>
                          )}
                          {expandedFAQ === faq.id && (
                            <div className="flex flex-wrap gap-2">
                              {faq.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform group-hover:text-orange-500 ${
                              expandedFAQ === faq.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div className="space-y-6">
            {!selectedGuide ? (
              <>
                {/* Step-by-step Guides */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📖</span>
                      ステップバイステップガイド
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {guides.map((guide) => (
                      <div key={guide.id} className="p-6">
                        <button
                          onClick={() => handleGuideSelect(guide)}
                          className="w-full text-left group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                                {guide.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {guide.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <span className="mr-1">⏱️</span>
                                  {guide.estimatedTime}
                                </span>
                                <span className="flex items-center">
                                  <span className="mr-1">📊</span>
                                  {guide.difficulty === 'beginner' ? '初級' : 
                                   guide.difficulty === 'intermediate' ? '中級' : '上級'}
                                </span>
                                <span className="flex items-center">
                                  <span className="mr-1">📝</span>
                                  {guide.steps.length}ステップ
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Guide Detail View */
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={handleGuideClose}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        戻る
                      </button>
                      <h2 className="text-lg font-semibold text-gray-800">{selectedGuide.title}</h2>
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentStep + 1} / {selectedGuide.steps.length}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / selectedGuide.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Current Step */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {selectedGuide.steps[currentStep].title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {selectedGuide.steps[currentStep].description}
                    </p>
                    {selectedGuide.steps[currentStep].action && (
                      <div className="inline-flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm">
                        <span className="mr-2">👆</span>
                        {selectedGuide.steps[currentStep].action}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={handlePrevStep}
                      disabled={currentStep === 0}
                      variant="outline"
                      size="sm"
                    >
                      前のステップ
                    </Button>
                    
                    <div className="flex space-x-2">
                      {selectedGuide.steps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {currentStep < selectedGuide.steps.length - 1 ? (
                      <Button
                        onClick={handleNextStep}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                        size="sm"
                      >
                        次のステップ
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGuideClose}
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        size="sm"
                      >
                        完了
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Tab */}
        {activeTab === 'troubleshooting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="mr-2">🔧</span>
                  よくあるトラブルと解決方法
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {troubleshootingData.map((item) => (
                  <div key={item.id} className="p-6">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                      <span className="mr-2">⚠️</span>
                      {item.problem}
                    </h3>
                    <div className="space-y-2">
                      {item.solutions.map((solution, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-600 text-sm">{solution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Support - Always visible */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">🆘</span>
              その他のサポート
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="text-blue-500 text-xl">📧</div>
                <div>
                  <h3 className="font-medium text-blue-800">サポートに連絡</h3>
                  <p className="text-sm text-blue-600">問題が解決しない場合はお問い合わせください</p>
                </div>
              </div>
              <Button
                onClick={handleContactSupport}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                連絡
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="text-green-500 text-xl">📖</div>
                  <div>
                    <h3 className="font-medium text-green-800 text-sm">利用規約</h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-100 text-xs"
                >
                  表示
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="text-purple-500 text-xl">🔒</div>
                  <div>
                    <h3 className="font-medium text-purple-800 text-sm">プライバシーポリシー</h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-300 hover:bg-purple-100 text-xs"
                >
                  表示
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-6 text-center">
          <div className="text-3xl mb-3">🌅</div>
          <h3 className="font-bold text-gray-800 mb-1">Meza - 朝活チャレンジ</h3>
          <p className="text-sm text-gray-600 mb-2">バージョン 1.0.0</p>
          <p className="text-xs text-gray-500">毎日の朝活を習慣化しよう</p>
        </div>
      </div>
    </div>
  )
} 