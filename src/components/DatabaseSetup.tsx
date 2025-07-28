'use client'

import { useEffect } from 'react'
import { setupDatabase } from '@/lib/setup-database'

export default function DatabaseSetup() {
  useEffect(() => {
    // クライアントサイドでのみセットアップを試行
    setupDatabase().catch(console.error)
  }, [])

  return null
}