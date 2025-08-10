import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { payment_method_id, cardholder_name } = body

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' }, 
        { status: 400 }
      )
    }

    // PaymentMethodを取得
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)

    // プロファイルからStripe顧客IDを取得（なければ作成して保存）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    let customerId = profile?.stripe_customer_id || null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        name: cardholder_name,
        metadata: { user_id: user.id }
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // PaymentMethodを顧客にアタッチ
    await stripe.paymentMethods.attach(payment_method_id, { customer: customerId })

    // 既存のデフォルト有無を確認し、なければ今回をデフォルトに設定
    let setAsDefault = false
    try {
      const customer = await stripe.customers.retrieve(customerId)
      const hasDefault = typeof customer !== 'string' && !('deleted' in customer) && !!customer.invoice_settings?.default_payment_method
      setAsDefault = !hasDefault
      if (setAsDefault) {
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: payment_method_id }
        })
      }
    } catch (e) {
      console.warn('Customer default check/update failed (continuing):', (e as any)?.message)
    }

    // ローカルDBへ保存（Stripe連携IDも保持）
    if (!paymentMethod.card) {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 })
    }

    // まず他のカードのデフォルトを外す（今回デフォルトにした場合）
    if (setAsDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        cardholder_name: cardholder_name,
        is_default: setAsDefault,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethod.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

      if (error) {
        console.error('Supabase error:', error)
        // Stripeから作成したPaymentMethodをデタッチ
        try {
          await stripe.paymentMethods.detach(paymentMethod.id)
        } catch (detachError) {
          console.error('Failed to detach payment method:', detachError)
        }
        return NextResponse.json(
          { error: 'Failed to save payment method' }, 
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        paymentMethod: {
          id: data.id,
          type: 'card',
          card: {
            brand: data.brand,
            last4: data.last4,
            exp_month: data.exp_month,
            exp_year: data.exp_year
          }
        }
      })
  } catch (error) {
    console.error('Payment method creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // ユーザーの支払い方法を取得
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' }, 
        { status: 500 }
      )
    }

    // Stripe APIの形式に合わせて変換
    const paymentMethods = data.map(method => ({
      id: method.id,
      type: 'card',
      card: {
        brand: method.brand,
        last4: method.last4,
        exp_month: method.exp_month,
        exp_year: method.exp_year
      }
    }))

    return NextResponse.json({
      paymentMethods
    })

  } catch (error) {
    console.error('Payment methods fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' }, 
        { status: 400 }
      )
    }

    try {
      // Stripeから削除
      await stripe.paymentMethods.detach(paymentMethodId)
    } catch (stripeError: any) {
      console.warn('Stripe detach error (continuing):', stripeError.message)
    }

    // Supabaseから削除
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete payment method' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })

  } catch (error) {
    console.error('Payment method deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

function detectCardBrand(cardNumber: string): string {
  // 基本的なカードブランド検出
  if (cardNumber.startsWith('4')) {
    return 'visa'
  } else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) {
    return 'mastercard'
  } else if (cardNumber.startsWith('3')) {
    return 'amex'
  } else if (cardNumber.startsWith('35')) {
    return 'jcb'
  }
  return 'unknown'
}