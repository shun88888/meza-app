/**
 * 時刻ズレ検出用APIエンドポイント
 * GET /api/time - サーバー時刻をUTCで返す
 */

import { NextRequest, NextResponse } from 'next/server'
import { nowUTCString } from '@/lib/time-utils'

export async function GET(request: NextRequest) {
  try {
    const serverTime = nowUTCString()
    
    return NextResponse.json({
      serverTime,
      timezone: 'UTC',
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('時刻取得エラー:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get server time',
        serverTime: new Date().toISOString() // フォールバック
      },
      { status: 500 }
    )
  }
}

// CORS対応
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}