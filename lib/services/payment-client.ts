export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer' | 'cash';
  cardData?: {
    cardNumber: string;
    cardHolder: string;
    expiryMonth: string | number;
    expiryYear: string | number;
    cvv: string | number;
  };
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  bookingId: string;
  transactionRef: string;
  status: 'completed' | 'pending' | 'failed';
  message: string;
}

export interface PaymentError {
  error: string;
  code: string;
  details?: string[];
}

export async function submitPayment(payload: PaymentRequest): Promise<PaymentResponse> {
  try {
    console.log('Submitting payment:', {
      bookingId: payload.bookingId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
    });

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: payload.bookingId,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        paymentMethod: payload.paymentMethod,
        cardData: payload.cardData || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error: any) {
    console.error('Payment submission error:', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string): Promise<any> {
  const response = await fetch(`/api/payments?paymentId=${paymentId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment status');
  }

  return response.json();
}
