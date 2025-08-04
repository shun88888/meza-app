'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import SlideToWake from '@/components/SlideToWake'
import CountdownScreen from '@/components/CountdownScreen'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getFormattedAddressFromCoords, formatAddress } from '@/lib/addressFormatter'
import { getPaymentMethods, PaymentMethodInfo } from '@/lib/stripe'
import { getCurrentUser } from '@/lib/supabase'

// Dynamic import to avoid SSR issues - use direct import path
const MapPicker = dynamic(() => import('../../components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="loading-container" style={{ height: '612px' }}>
      <div>地図を読み込み中...</div>
    </div>
  )
})

interface Location {
  lat: number
  lng: number
  address?: string
}

interface ChallengeData {
  wakeTime: string
  penaltyAmount: number
  wakeUpLocation: Location | null
  paymentMethod: string
  selectedPaymentMethodId?: string
}

export default function CreateChallengePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCountdown, setShowCountdown] = useState(false)
  
  // Optimize theme changes - only update when needed
  useEffect(() => {
    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      const themeColor = showCountdown ? '#FED7AA' : '#ffffff'
      const bgGradient = showCountdown 
        ? 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
      
      if (!metaThemeColor) {
        const meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
        metaThemeColor = meta
      }
      
      metaThemeColor.setAttribute('content', themeColor)
      document.body.style.background = bgGradient
      document.documentElement.style.setProperty('--status-bar-gradient', bgGradient)
      
      return () => {
        try {
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#FED7AA')
          }
          document.body.style.background = 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)'
          document.documentElement.style.setProperty('--status-bar-gradient', 'linear-gradient(135deg, #FED7AA 0%, #FEF3C7 100%)')
        } catch (error) {
          console.error('Error resetting theme:', error)
        }
      }
    } catch (error) {
      console.error('Error setting theme:', error)
    }
  }, [showCountdown])
  

  
  // Set default wake time to tomorrow at 8:00 AM
  const getDefaultWakeTime = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)
    return tomorrow.toISOString()
  }
  
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    wakeTime: getDefaultWakeTime(),
    penaltyAmount: 300,
    wakeUpLocation: null,
    paymentMethod: '支払い方法を設定してください'
  })
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([])
  const [loadingPayment, setLoadingPayment] = useState(true)

  // 支払い方法を取得
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const methods = await getPaymentMethods(user.id)
          setPaymentMethods(methods.paymentMethods)
          
          if (methods.paymentMethods.length > 0) {
            const defaultMethod = methods.paymentMethods[0]
            setChallengeData(prev => ({
              ...prev,
              paymentMethod: defaultMethod.card 
                ? `${defaultMethod.card.brand.toUpperCase()} •••• ${defaultMethod.card.last4}`
                : '登録済みのカード',
              selectedPaymentMethodId: defaultMethod.id
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setLoadingPayment(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  // 現在地を取得して初期位置に設定
  useEffect(() => {
    if (typeof window === 'undefined') return // SSR時はスキップ

    const setDefaultLocation = () => {
      setChallengeData(prev => ({
        ...prev,
        wakeUpLocation: {
          lat: 35.6812,
          lng: 139.7671,
          address: '東京駅周辺（デフォルト位置）'
        }
      }))
    }

    // URLパラメータから起床場所が設定されている場合はスキップ
    try {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('wakeUpLat') && urlParams.get('wakeUpLng')) {
        return
      }
    } catch (error) {
      console.error('URLパラメータ取得エラー:', error)
    }

    // if (challengeData.wakeUpLocation) return // デバッグのため一時的にコメントアウト

    if (!navigator?.geolocation) {
      console.log('位置情報がサポートされていません')
      setDefaultLocation()
      return
    }

    console.log('現在地を取得中...')
    
    // 位置情報取得の実行
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log('現在地取得成功:', position.coords.latitude, position.coords.longitude)
          
          // 即座に座標を設定（住所は後で取得）
          setChallengeData(prev => ({
            ...prev,
            wakeUpLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: '住所を取得中...'
            }
          }))
          
          // 住所を非同期で取得して更新
          getFormattedAddressFromCoords(position.coords.latitude, position.coords.longitude)
            .then(address => {
              console.log('フォーマット住所取得成功:', address)
              setChallengeData(prev => ({
                ...prev,
                wakeUpLocation: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  address: address
                }
              }))
            })
            .catch(error => {
              console.error('住所取得エラー:', error)
              setChallengeData(prev => ({
                ...prev,
                wakeUpLocation: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
                }
              }))
            })
        } catch (error) {
          console.error('位置情報処理エラー:', error)
          setDefaultLocation()
        }
      },
      (error) => {
        console.error('現在地取得エラー:', error.code, error.message)
        let errorMessage = '東京駅周辺'
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = '東京駅周辺（位置情報許可をしてください）'
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = '東京駅周辺（位置情報取得不可）'
            break
          case 3: // TIMEOUT
            errorMessage = '東京駅周辺（位置情報取得タイムアウト）'
            break
          default:
            errorMessage = '東京駅周辺（位置情報取得失敗）'
        }
        
        setChallengeData(prev => ({
          ...prev,
          wakeUpLocation: {
            lat: 35.6812,
            lng: 139.7671,
            address: errorMessage
          }
        }))
      },
      {
        enableHighAccuracy: false, // より高速な取得のためfalseに変更
        timeout: 5000, // タイムアウトを5秒に短縮
        maximumAge: 300000 // 5分間キャッシュを延長
      }
    )
  }, [])

  // URLパラメータから設定値を更新
  useEffect(() => {
    // 覚悟金額の更新
    const penaltyAmount = searchParams.get('penaltyAmount')
    if (penaltyAmount) {
      setChallengeData(prev => ({
        ...prev,
        penaltyAmount: parseInt(penaltyAmount)
      }))
    }

    // 目覚時間の更新
    const wakeTime = searchParams.get('wakeTime')
    if (wakeTime) {
      try {
        const decodedTime = decodeURIComponent(wakeTime)
        const date = new Date(decodedTime)
        if (!isNaN(date.getTime())) {
          setChallengeData(prev => ({
            ...prev,
            wakeTime: date.toISOString()
          }))
        }
      } catch (error) {
        console.error('Error parsing wake time parameter:', error)
      }
    }

    // 起床場所情報の更新
    const wakeUpLat = searchParams.get('wakeUpLat')
    const wakeUpLng = searchParams.get('wakeUpLng')
    const wakeUpAddress = searchParams.get('wakeUpAddress')

    if (wakeUpLat && wakeUpLng) {
      setChallengeData(prev => ({
        ...prev,
        wakeUpLocation: {
          lat: parseFloat(wakeUpLat),
          lng: parseFloat(wakeUpLng),
          address: wakeUpAddress || undefined
        }
      }))
    }

    // 支払い方法の更新
    const paymentMethodId = searchParams.get('paymentMethodId')
    if (paymentMethodId) {
      const selectedMethod = paymentMethods.find(method => method.id === paymentMethodId)
      if (selectedMethod) {
        setChallengeData(prev => ({
          ...prev,
          paymentMethod: selectedMethod.card 
            ? `${selectedMethod.card.brand.toUpperCase()} •••• ${selectedMethod.card.last4}`
            : '登録済みのカード',
          selectedPaymentMethodId: paymentMethodId
        }))
      }
    }

    // URLをクリアして、戻るボタンが期待通りに動作するようにする
    if (searchParams.toString()) {
      router.replace('/create-challenge', { scroll: false })
    }
  }, [searchParams, router, paymentMethods])

  const handleLocationSelect = (location: Location) => {
    setChallengeData(prev => ({
      ...prev,
      wakeUpLocation: location
    }))
  }

  // カードブランドアイコンを取得
  const getCardBrandIcon = (brand?: string) => {
    if (!brand) {
      return (
        <div className="w-6 h-4 bg-gray-300 rounded mr-3 flex items-center justify-center">
          <span className="text-xs text-gray-600">💳</span>
        </div>
      )
    }

    switch (brand.toLowerCase()) {
      case 'visa':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <path fill="#171E6C" d="M2.788 5.914A7.201 7.201 0 001 5.237l.028-.125h2.737c.371.013.672.125.77.519l.595 2.836.182.854 1.666-4.21h1.799l-2.674 6.167H4.304L2.788 5.914zm7.312 5.37H8.399l1.064-6.172h1.7L10.1 11.284zm6.167-6.021l-.232 1.333-.153-.066a3.054 3.054 0 00-1.268-.236c-.671 0-.972.269-.98.531 0 .29.365.48.96.762.98.44 1.435.979 1.428 1.681-.014 1.28-1.176 2.108-2.96 2.108-.764-.007-1.5-.158-1.898-.328l.238-1.386.224.099c.553.23.917.328 1.596.328.49 0 1.015-.19 1.022-.604 0-.27-.224-.466-.882-.769-.644-.295-1.505-.788-1.491-1.674C11.878 5.84 13.06 5 14.74 5c.658 0 1.19.138 1.526.263zm2.26 3.834h1.415c-.07-.308-.392-1.786-.392-1.786l-.12-.531c-.083.23-.23.604-.223.59l-.68 1.727zm2.1-3.985L22 11.284h-1.575s-.154-.71-.203-.926h-2.184l-.357.926h-1.785l2.527-5.66c.175-.4.483-.512.889-.512h1.316z"/>
            </g>
          </svg>
        )
      case 'mastercard':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <circle cx="9" cy="8" r="4" fill="#EB001B"/>
              <circle cx="15" cy="8" r="4" fill="#F79E1B"/>
              <path fill="#FF5F00" d="M12 4.5c-.78 0-1.5.31-2.04.81A3.97 3.97 0 0 1 12 8c.78 0 1.5-.31 2.04-.81A3.97 3.97 0 0 0 12 4.5z"/>
            </g>
          </svg>
        )
      case 'jcb':
        return (
          <svg width="24" height="16" viewBox="0 0 24 16" className="mr-3">
            <g fill="none" fillRule="nonzero">
              <rect width="23.5" height="15.5" x="0.25" y="0.25" fill="#FFF" stroke="#000" strokeOpacity="0.2" strokeWidth="0.5" rx="2"/>
              <text x="12" y="10" textAnchor="middle" fill="#007B3F" fontSize="8" fontFamily="Arial, sans-serif" fontWeight="bold">JCB</text>
            </g>
          </svg>
        )
      default:
        return (
          <div className="w-6 h-4 bg-gray-300 rounded mr-3 flex items-center justify-center">
            <span className="text-xs text-gray-600">💳</span>
          </div>
        )
    }
  }

  const handleSlideComplete = async () => {
    // Check if user has payment method registered
    if (!challengeData.selectedPaymentMethodId || paymentMethods.length === 0) {
      alert('チャレンジを開始するには、クレジットカードの登録が必要です。支払い方法を設定してください。')
      router.push('/settings/payment')
      return
    }

    // Save start location for later use
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const startLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          // Store challenge data with start location
          localStorage.setItem('activeChallenge', JSON.stringify({
            ...challengeData,
            startLocation,
            startTime: new Date().toISOString()
          }))
          
          // Show countdown
          setShowCountdown(true)
        },
        (error) => {
          console.error('Error getting start location:', error)
          // Use mock location if GPS fails
          localStorage.setItem('activeChallenge', JSON.stringify({
            ...challengeData,
            startLocation: { lat: 35.6762, lng: 139.6503 },
            startTime: new Date().toISOString()
          }))
          setShowCountdown(true)
        }
      )
    } else {
      // Use mock location if geolocation not supported
      localStorage.setItem('activeChallenge', JSON.stringify({
        ...challengeData,
        startLocation: { lat: 35.6762, lng: 139.6503 },
        startTime: new Date().toISOString()
      }))
      setShowCountdown(true)
    }
  }

  const handleCountdownComplete = () => {
    router.push('/active-challenge')
  }

  const handleCountdownCancel = () => {
    setShowCountdown(false)
    localStorage.removeItem('activeChallenge')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '未設定'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '未設定'
      }
      const days = ['日', '月', '火', '水', '木', '金', '土']
      const dayOfWeek = days[date.getDay()]
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} (${dayOfWeek}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } catch (error) {
      console.error('Error formatting date:', error)
      return '未設定'
    }
  }

  if (showCountdown) {
    return (
      <CountdownScreen
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
        duration={3}
      />
    )
  }

  return (
    <div className="full-screen-safe overflow-hidden bg-gray-50 relative" style={{ zIndex: 1001 }}>
      {/* Back Button */}
      <div className="absolute top-4 left-4" style={{ zIndex: 1 }}>
        <button
          aria-label="戻る"
          onClick={() => router.back()}
          className="flex items-center justify-center bg-white rounded-full shadow-lg"
          style={{ height: '48px', width: '48px' }}
          tabIndex={0}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            height="20"
            viewBox="0 0 24 24"
            width="20"
            fill="currentColor"
          >
            <path d="m4.41 13 6.3 6.3-1.42 1.4L.6 12l8.7-8.7 1.42 1.4L4.4 11H24v2z"></path>
          </svg>
        </button>
      </div>

      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <style type="text/css">{`
          #setting-location-map .leaflet-container {
            width: 100%;
            height: 100vh;
            height: 100dvh;
          }
        `}</style>
        <div id="setting-location-map">
          <ErrorBoundary 
            fallback={
              <div className="loading-container h-full flex items-center justify-center">
                <div>地図コンポーネントのエラーが発生しました</div>
              </div>
            }
          >
            <MapPicker
              location={challengeData.wakeUpLocation}
              onLocationSelect={handleLocationSelect}
              height="100vh"
              className="w-full"
              wakeUpLocation={challengeData.wakeUpLocation}
              showPins={true}
              readOnly={false}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Bottom Overlay with Settings */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
        <div className="p-4 pb-safe">
          {/* Settings Cards Container */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            
            {/* 起床場所 */}
            <button 
              className="w-full flex items-center h-12 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                const params = new URLSearchParams()
                if (challengeData.wakeUpLocation) {
                  params.set('wakeUpLat', challengeData.wakeUpLocation.lat.toString())
                  params.set('wakeUpLng', challengeData.wakeUpLocation.lng.toString())
                  if (challengeData.wakeUpLocation.address) {
                    params.set('wakeUpAddress', challengeData.wakeUpLocation.address)
                  }
                }
                router.push(`/create-challenge/location?${params.toString()}`)
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">起床場所</div>
              <div className="flex-1 text-sm text-left">
                <span className={challengeData.wakeUpLocation?.address && !challengeData.wakeUpLocation.address.includes('取得中') ? 'text-gray-800' : 'text-gray-400'}>
                  {challengeData.wakeUpLocation?.address ? formatAddress(challengeData.wakeUpLocation.address) : '現在地を取得中...'}
                </span>
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>

            {/* 目覚時間 */}
            <button 
              className="w-full flex items-center h-12 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                router.push(`/create-challenge/time?current=${encodeURIComponent(challengeData.wakeTime)}`)
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">目覚時間</div>
              <div className="flex-1 text-sm text-gray-800 text-left">
                {formatDate(challengeData.wakeTime)}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>

            {/* 覚悟金額 */}
            <button 
              className="w-full flex items-center h-12 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                router.push(`/create-challenge/penalty?current=${challengeData.penaltyAmount}`)
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">覚悟金額</div>
              <div className="flex-1 text-sm text-gray-800 text-left">
                ￥{challengeData.penaltyAmount.toLocaleString()}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>

            {/* 支払方法 */}
            <button 
              className="w-full flex items-center h-12 px-4 hover:bg-gray-50 transition-colors duration-50"
              onClick={() => {
                router.push('/settings/payment')
              }}
            >
              <div className="w-16 text-xs text-gray-500 tracking-wide">支払方法</div>
              <div className="flex-1 flex items-center text-sm text-gray-800">
                {loadingPayment ? (
                  <div className="text-gray-400">読み込み中...</div>
                ) : (
                  <>
                    {challengeData.selectedPaymentMethodId && paymentMethods.length > 0 ? (
                      (() => {
                        const selectedMethod = paymentMethods.find(method => method.id === challengeData.selectedPaymentMethodId)
                        return selectedMethod ? (
                          <>
                            {getCardBrandIcon(selectedMethod.card?.brand)}
                            {challengeData.paymentMethod}
                          </>
                        ) : (
                          <span className="text-gray-400">支払い方法を設定してください</span>
                        )
                      })()
                    ) : (
                      <>
                        <div className="w-6 h-4 bg-gray-300 rounded mr-3 flex items-center justify-center">
                          <span className="text-xs text-gray-600">💳</span>
                        </div>
                        <span className="text-gray-400">支払い方法を設定してください</span>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="px-3">
                <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-400">
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M1 2l3 3-3 3"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Slide to confirm */}
          <SlideToWake
            onSlideComplete={handleSlideComplete}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
} 