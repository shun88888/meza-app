'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CompletionScreenProps {
  isSuccess: boolean
  title: string
  message: string
  penaltyAmount?: number
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
  primaryButtonText: string
  secondaryButtonText?: string
  showConfetti?: boolean
  autoRedirect?: {
    url: string
    delay: number
  }
}

const SuccessIcon = () => (
  <motion.svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
  >
    <circle cx="32" cy="32" r="30" fill="url(#successGradient)" />
    <motion.path
      d="M20 32l8 8 16-16"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
    />
    <defs>
      <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
  </motion.svg>
)

const FailureIcon = () => (
  <motion.svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
  >
    <circle cx="32" cy="32" r="30" fill="url(#failureGradient)" />
    <motion.path
      d="M22 22l20 20M42 22l-20 20"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
    />
    <defs>
      <linearGradient id="failureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
  </motion.svg>
)

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            opacity: 1,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: window.innerHeight + 10,
            x: Math.random() * window.innerWidth,
            opacity: 0,
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            ease: "linear",
            delay: Math.random() * 2,
          }}
          style={{
            backgroundColor: ['#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6'][
              Math.floor(Math.random() * 5)
            ],
          }}
        />
      ))}
    </div>
  )
}

export default function CompletionScreen({
  isSuccess,
  title,
  message,
  penaltyAmount,
  onPrimaryAction,
  onSecondaryAction,
  primaryButtonText,
  secondaryButtonText,
  showConfetti = false,
  autoRedirect,
}: CompletionScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (autoRedirect) {
      setCountdown(autoRedirect.delay / 1000)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            router.push(autoRedirect.url)
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [autoRedirect, router])

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
          <motion.div variants={itemVariants} className="mb-6">
            {isSuccess ? <SuccessIcon /> : <FailureIcon />}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className={`text-3xl font-bold mb-4 ${
              isSuccess ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {title}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed"
          >
            {message}
          </motion.p>

          {penaltyAmount && (
            <motion.div
              variants={itemVariants}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
            >
              <div className="text-red-800 dark:text-red-200 font-semibold text-xl">
                ペナルティ: ¥{penaltyAmount.toLocaleString()}
              </div>
              <div className="text-red-600 dark:text-red-300 text-sm mt-1">
                決済が必要です
              </div>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-3">
            <Button
              onClick={onPrimaryAction}
              className={`w-full py-3 text-lg font-semibold transition-all duration-200 ${
                isSuccess
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              }`}
            >
              {primaryButtonText}
            </Button>

            {secondaryButtonText && onSecondaryAction && (
              <Button
                onClick={onSecondaryAction}
                variant="outline"
                className="w-full py-3 text-lg"
              >
                {secondaryButtonText}
              </Button>
            )}
          </motion.div>

          {countdown !== null && (
            <motion.div
              variants={itemVariants}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400"
            >
              {countdown}秒後に自動的にリダイレクトします...
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}