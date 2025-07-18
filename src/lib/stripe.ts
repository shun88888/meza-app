import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export { stripePromise }

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  customerId: string
}

export interface PaymentConfirmationResponse {
  success: boolean
  status: string
  message?: string
}

export interface PaymentIntentData {
  id: string
  status: string
  amount: number
  currency: string
  created: number
  metadata: Record<string, string>
}

export async function createPaymentIntent(
  amount: number, 
  challengeId: string, 
  userId: string
): Promise<PaymentIntentResponse> {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      challengeId,
      userId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create payment intent')
  }

  return response.json()
}

export async function confirmPayment(paymentIntentId: string): Promise<PaymentConfirmationResponse> {
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
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to confirm payment')
  }

  return response.json()
}

export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentData> {
  const response = await fetch(`/api/confirm-payment?payment_intent_id=${paymentIntentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get payment intent')
  }

  return response.json()
}

export interface PaymentMethodInfo {
  id: string
  type: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  } | null
}

export interface PaymentMethodsResponse {
  hasPaymentMethod: boolean
  paymentMethods: PaymentMethodInfo[]
  customerId?: string
}

export interface AutoChargeResponse {
  success: boolean
  status: string
  paymentIntentId?: string
  clientSecret?: string
  message: string
  errorCode?: string
}

export interface AutoChargeCheckResponse {
  canAutoCharge: boolean
  paymentMethod?: PaymentMethodInfo
  reason?: string
}

// Setup payment method for user
export async function setupPaymentMethod(
  userId: string, 
  paymentMethodId: string
): Promise<{ success: boolean; customerId: string; paymentMethod: PaymentMethodInfo }> {
  const response = await fetch('/api/setup-payment-method', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      paymentMethodId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to setup payment method')
  }

  return response.json()
}

// Get user's payment methods
export async function getPaymentMethods(userId: string): Promise<PaymentMethodsResponse> {
  const response = await fetch(`/api/setup-payment-method?user_id=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get payment methods')
  }

  return response.json()
}

// Auto charge penalty
export async function autoCharge(
  challengeId: string, 
  userId: string, 
  amount: number
): Promise<AutoChargeResponse> {
  const response = await fetch('/api/auto-charge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challengeId,
      userId,
      amount,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to auto charge')
  }

  return response.json()
}

// Check if auto charge is possible
export async function checkAutoCharge(userId: string): Promise<AutoChargeCheckResponse> {
  const response = await fetch(`/api/auto-charge?user_id=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to check auto charge')
  }

  return response.json()
}

export async function createStripeCustomer(email: string, userId: string): Promise<string> {
  // This function would be called from the API route, not directly from client
  // Included here for type safety and documentation
  throw new Error('createStripeCustomer should only be called from server-side API routes')
} 