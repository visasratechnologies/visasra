export interface RazorpayCheckoutOptions {
  amount: number; // in INR
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentId: string) => void | Promise<void>;
  onError?: (err: unknown) => void;
  onDismiss?: () => void;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayPayment = async (options: RazorpayCheckoutOptions) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Unable to load Razorpay payment gateway. Please check your internet connection.');
  }

  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_T2fS0wvX1zbtHt';

  const rzpOptions = {
    key: razorpayKey,
    amount: Math.round(options.amount * 100), // paise
    currency: 'INR',
    name: 'Visasra',
    description: options.description || 'Deposit to Visasra Money',
    image: '/images/logo/visasra-logo.png',
    prefill: {
      name: options.prefill?.name || 'Customer',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || '',
    },
    theme: {
      color: '#09254A',
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
    handler: function (response: { razorpay_payment_id: string }) {
      if (response && response.razorpay_payment_id) {
        options.onSuccess(response.razorpay_payment_id);
      } else {
        if (options.onError) options.onError(new Error('No payment ID received from Razorpay'));
      }
    },
  };

  const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void } }).Razorpay;
  const rzp = new RazorpayConstructor(rzpOptions);

  rzp.on('payment.failed', function (resp: unknown) {
    if (options.onError) options.onError(resp);
  });

  rzp.open();
};
