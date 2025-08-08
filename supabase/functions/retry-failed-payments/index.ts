import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FailedPayment {
  id: string
  user_id: string
  challenge_id: string
  stripe_payment_intent_id: string
  amount: number
  retry_count: number
  created_at: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    console.log('🔄 Starting failed payment retry process...')

    // Get failed payments that can be retried (within 24 hours, less than 3 retries)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: failedPayments, error: fetchError } = await supabase
      .from('payments')
      .select(`
        id,
        user_id,
        challenge_id,
        stripe_payment_intent_id,
        amount,
        retry_count,
        created_at,
        failure_code
      `)
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: true })
      .limit(10) // Process max 10 at a time

    if (fetchError) {
      console.error('❌ Error fetching failed payments:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payments for retry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!failedPayments || failedPayments.length === 0) {
      console.log('✅ No failed payments found for retry')
      return new Response(
        JSON.stringify({ message: 'No failed payments to retry', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${failedPayments.length} failed payments to retry`)

    let retryAttempts = 0
    let successfulRetries = 0
    let failedRetries = 0

    for (const payment of failedPayments as FailedPayment[]) {
      try {
        console.log(`🔄 Retrying payment ${payment.stripe_payment_intent_id} (attempt ${payment.retry_count + 1})`)

        // Get user's payment methods
        const { data: paymentMethods, error: paymentMethodError } = await supabase
          .from('payment_methods')
          .select('stripe_payment_method_id, is_default')
          .eq('user_id', payment.user_id)
          .order('created_at', { ascending: false })

        if (paymentMethodError || !paymentMethods || paymentMethods.length === 0) {
          console.error(`❌ No payment methods for user ${payment.user_id}`)
          continue
        }

        const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0]

        // Retrieve the original payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)

        if (!paymentIntent) {
          console.error(`❌ Payment intent not found: ${payment.stripe_payment_intent_id}`)
          continue
        }

        let updatedPaymentIntent: Stripe.PaymentIntent

        // Try to retry the payment based on its current status
        if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
          
          // Create a new payment intent for retry (safer approach)
          updatedPaymentIntent = await stripe.paymentIntents.create({
            amount: payment.amount * 100, // Convert to cents
            currency: 'jpy',
            customer: paymentIntent.customer as string,
            payment_method: defaultPaymentMethod.stripe_payment_method_id,
            confirm: true,
            off_session: true,
            description: `自動リトライ: ${paymentIntent.description} (Retry ${payment.retry_count + 1})`,
            metadata: {
              ...paymentIntent.metadata,
              original_payment_intent: paymentIntent.id,
              retry_attempt: (payment.retry_count + 1).toString(),
              retry_timestamp: new Date().toISOString()
            }
          })

        } else {
          console.log(`⚠️ Payment intent ${payment.stripe_payment_intent_id} cannot be retried (status: ${paymentIntent.status})`)
          continue
        }

        retryAttempts++

        // Update payment record
        if (updatedPaymentIntent.status === 'succeeded') {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              stripe_payment_intent_id: updatedPaymentIntent.id,
              retry_count: payment.retry_count + 1,
              last_retry_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)

          // Send success notification
          await supabase.rpc('send_notification', {
            user_id_param: payment.user_id,
            title_param: '決済リトライ成功',
            body_param: `決済が正常に完了しました。金額: ¥${payment.amount.toLocaleString()}`,
            type_param: 'payment_success'
          })

          successfulRetries++
          console.log(`✅ Payment retry successful for ${payment.stripe_payment_intent_id}`)

        } else {
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              retry_count: payment.retry_count + 1,
              last_retry_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              failure_code: updatedPaymentIntent.last_payment_error?.code,
              failure_message: updatedPaymentIntent.last_payment_error?.message
            })
            .eq('id', payment.id)

          // Send failure notification only if this was the final retry attempt
          if (payment.retry_count + 1 >= 3) {
            await supabase.rpc('send_notification', {
              user_id_param: payment.user_id,
              title_param: '決済最終失敗',
              body_param: `自動リトライが最大回数に達しました。手動で決済を完了してください。金額: ¥${payment.amount.toLocaleString()}`,
              type_param: 'payment_final_failure'
            })
          }

          failedRetries++
          console.log(`❌ Payment retry failed for ${payment.stripe_payment_intent_id}`)
        }

      } catch (error) {
        console.error(`❌ Error retrying payment ${payment.stripe_payment_intent_id}:`, error)
        
        // Update retry count even on error
        await supabase
          .from('payments')
          .update({
            retry_count: payment.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        failedRetries++
      }
    }

    const result = {
      message: 'Payment retry process completed',
      total_found: failedPayments.length,
      retry_attempts: retryAttempts,
      successful_retries: successfulRetries,
      failed_retries: failedRetries,
      timestamp: new Date().toISOString()
    }

    console.log('📊 Retry process summary:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Critical error in payment retry processing:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Critical error in payment retry processing',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})