import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Challenge {
  id: string
  user_id: string
  ends_at: string
  penalty_amount: number
  status: string
}

interface PaymentMethod {
  stripe_customer_id: string
  stripe_payment_method_id: string
  is_default: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    console.log('🚀 Starting expired challenges processing...')

    // Get all expired challenges that haven't been processed
    const now = new Date().toISOString()
    const { data: expiredChallenges, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .lt('ends_at', now)

    if (fetchError) {
      console.error('❌ Error fetching expired challenges:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired challenges' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredChallenges || expiredChallenges.length === 0) {
      console.log('✅ No expired challenges found')
      return new Response(
        JSON.stringify({ message: 'No expired challenges to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${expiredChallenges.length} expired challenges`)

    let processedCount = 0
    let failedCount = 0

    for (const challenge of expiredChallenges as Challenge[]) {
      try {
        console.log(`⏰ Processing expired challenge ${challenge.id} for user ${challenge.user_id}`)

        // 新しいRPC関数で自動失敗処理（行ロック付き）
        const { data: autoFailResult, error: autoFailError } = await supabase
          .rpc('auto_fail_expired_challenge', {
            challenge_id_param: challenge.id,
            failure_reason: 'timeout'
          })
          .single()

        if (autoFailError) {
          console.error(`❌ Failed to auto-fail challenge ${challenge.id}:`, autoFailError)
          failedCount++
          continue
        }

        if (!autoFailResult.success) {
          console.warn(`⚠️ Challenge ${challenge.id} already processed or not found`)
          continue
        }

        const penaltyAmount = autoFailResult.penalty_amount

        // ユーザーのペイメントメソッド取得
        const { data: paymentMethods, error: paymentError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', challenge.user_id)
          .order('created_at', { ascending: false })

        if (paymentError || !paymentMethods || paymentMethods.length === 0) {
          console.error(`❌ No payment method found for user ${challenge.user_id}`)
          
          // 失敗レコードを冪等性キー付きで保存
          await supabase.from('payments').insert({
            user_id: challenge.user_id,
            challenge_id: challenge.id,
            amount: penaltyAmount,
            status: 'failed',
            payment_method: 'no_payment_method',
            error_message: 'No payment method available',
            idempotency_key: challenge.id, // 冪等性キー
            created_at: new Date().toISOString()
          })

          failedCount++
          continue
        }

        // Use the default payment method or the first one
        const defaultPaymentMethod = paymentMethods.find((pm: PaymentMethod) => pm.is_default) || paymentMethods[0]

        // 自動決済処理（冪等性キー付き）
        try {
          console.log(`💳 Processing payment for challenge ${challenge.id}`)

          const paymentIntent = await stripe.paymentIntents.create({
            amount: penaltyAmount, // JPY is zero-decimal; use yen as-is
            currency: 'jpy',
            customer: defaultPaymentMethod.stripe_customer_id,
            payment_method: defaultPaymentMethod.stripe_payment_method_id,
            confirm: true,
            off_session: true, // Indicates this is for saved payment method
            description: `自動決済: チャレンジ失敗ペナルティ (Challenge ID: ${challenge.id})`,
            metadata: {
              challenge_id: challenge.id,
              user_id: challenge.user_id,
              type: 'auto_penalty_cron',
              processed_at: new Date().toISOString()
            }
          }, {
            idempotencyKey: challenge.id // 冪等性キーで二重決済防止
          })

          // 決済結果をデータベースに記録（冪等性キー付き）
          const { error: paymentInsertError } = await supabase
            .from('payments')
            .insert({
              user_id: challenge.user_id,
              challenge_id: challenge.id,
              amount: penaltyAmount,
              status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
              stripe_payment_intent_id: paymentIntent.id,
              stripe_customer_id: defaultPaymentMethod.stripe_customer_id,
              payment_method: 'auto_charge_cron',
              idempotency_key: challenge.id, // 冪等性キー
              requires_action: paymentIntent.status === 'requires_action',
              created_at: new Date().toISOString()
            })

          if (paymentInsertError) {
            console.error('❌ Error recording payment:', paymentInsertError)
          }

          if (paymentIntent.status === 'succeeded') {
            console.log(`✅ Payment successful for challenge ${challenge.id}`)
            
            // 成功通知を送信
            await supabase.rpc('send_notification', {
              user_id_param: challenge.user_id,
              title_param: 'チャレンジ自動決済完了',
              body_param: `起床時間を過ぎたため、ペナルティ料金 ¥${penaltyAmount.toLocaleString()} が自動決済されました。`,
              type_param: 'payment'
            })

            processedCount++
          } else {
            console.error(`❌ Payment failed for challenge ${challenge.id}:`, paymentIntent.status)
            
            // 失敗通知を送信
            await supabase.rpc('send_notification', {
              user_id_param: challenge.user_id,
              title_param: 'チャレンジ決済失敗',
              body_param: `自動決済に失敗しました。手動で決済を完了してください。金額: ¥${penaltyAmount.toLocaleString()}`,
              type_param: 'payment_error'
            })

            failedCount++
          }

        } catch (stripeError: any) {
          console.error(`❌ Stripe error for challenge ${challenge.id}:`, stripeError)
          
          // 失敗レコードを冪等性キー付きで保存
          await supabase.from('payments').insert({
            user_id: challenge.user_id,
            challenge_id: challenge.id,
            amount: penaltyAmount,
            status: 'failed',
            payment_method: 'auto_charge_cron_failed',
            error_message: stripeError.message,
            idempotency_key: challenge.id, // 冪等性キー
            created_at: new Date().toISOString()
          })

          // エラー通知を送信
          await supabase.rpc('send_notification', {
            user_id_param: challenge.user_id,
            title_param: 'チャレンジ決済エラー',
            body_param: `自動決済でエラーが発生しました。カード情報を確認し、手動で決済してください。`,
            type_param: 'payment_error'
          })

          failedCount++
        }

      } catch (challengeError) {
        console.error(`❌ Error processing challenge ${challenge.id}:`, challengeError)
        failedCount++
      }
    }

    const result = {
      message: 'Expired challenges processing completed',
      total_found: expiredChallenges.length,
      successfully_processed: processedCount,
      failed: failedCount,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Processing summary:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Critical error in cron processing:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Critical error in expired challenges processing',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})