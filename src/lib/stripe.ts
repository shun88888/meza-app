import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_publishable_key'
)

export { stripePromise }

export async function createPaymentIntent(amount: number, challengeId: string) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      challengeId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create payment intent')
  }

  return response.json()
}

export async function confirmPayment(paymentIntentId: string) {
  const response = await fetch('/api/confirm-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentIntentId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to confirm payment')
  }

  return response.json()
} 