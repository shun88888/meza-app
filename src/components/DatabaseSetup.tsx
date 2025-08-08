'use client'

import { useEffect } from 'react'
import { setupDatabase } from '@/lib/setup-database'

export default function DatabaseSetup() {
  useEffect(() => {
    // 開発環境でのみセットアップを試行し、エラーを静かに処理
    if (process.env.NODE_ENV === 'development') {
      setupDatabase().catch(() => {
        // SUPABASE_SERVICE_ROLE_KEYが利用できない場合は静かにスキップ
        // これは正常な動作で、本番環境では別途データベースセットアップが行われる
      })
    }
  }, [])

  return null
}