export interface RazorpayCheckoutOptions {
  amount: number; // in INR
  description?: string;
  orderId?: string; // Razorpay Order ID (auto-created via /api/razorpay/create-order if not provided)
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentId: string, orderId?: string, signature?: string) => void | Promise<void>;
  onError?: (err: unknown) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the Razorpay checkout.js script with a safety timeout
 * and stale element cleanup to ensure it never hangs.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);

    // If already loaded in window, resolve immediately
    if (typeof (window as unknown as { Razorpay?: unknown }).Razorpay !== 'undefined') {
      return resolve(true);
    }

    const scriptId = 'razorpay-checkout-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    // Safety timeout: never let the caller hang for more than 8 seconds
    const safetyTimeout = setTimeout(() => {
      const isAvailable = typeof (window as unknown as { Razorpay?: unknown }).Razorpay !== 'undefined';
      resolve(isAvailable);
    }, 8000);

    if (existing) {
      // If script is already in DOM, check if window.Razorpay is available
      if (typeof (window as unknown as { Razorpay?: unknown }).Razorpay !== 'undefined') {
        clearTimeout(safetyTimeout);
        return resolve(true);
      }
      // If the script element is stale or failed previously, remove it to re-fetch cleanly
      try {
        existing.remove();
      } catch {}
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      clearTimeout(safetyTimeout);
      resolve(true);
    };

    script.onerror = () => {
      clearTimeout(safetyTimeout);
      console.error('[Razorpay] Failed to load https://checkout.razorpay.com/v1/checkout.js');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * Opens Razorpay standard checkout popup.
 * Automatically generates a server-side order ID (mandatory in Razorpay) if not provided.
 */
export const openRazorpayPayment = async (options: RazorpayCheckoutOptions): Promise<void> => {
  // 1. Ensure Razorpay checkout.js is loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    const error = new Error('Unable to load Razorpay payment gateway. Please check your internet connection or ad-blocker.');
    if (options.onError) options.onError(error);
    throw error;
  }

  // 2. Obtain or generate server-side Razorpay Order ID (MANDATORY for Razorpay Checkout)
  let orderId = options.orderId;
  let keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_T2fS0wvX1zbtHt';

  if (!orderId) {
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: options.amount,
          currency: 'INR',
          notes: {
            description: options.description || 'Visasra Money Escrow / Deposit',
            email: options.prefill?.email || '',
            ...options.notes,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to initialize payment order with Razorpay');
      }

      orderId = orderData.orderId;
      if (orderData.key) {
        keyId = orderData.key;
      }
    } catch (createErr: unknown) {
      console.error('[Razorpay] Order creation failed:', createErr);
      if (options.onError) options.onError(createErr);
      throw createErr;
    }
  }

  // 3. Format prefill phone (digits and leading plus only)
  const rawContact = options.prefill?.contact || '';
  const sanitizedContact = rawContact.replace(/[^\d+]/g, '');

  // 4. Configure Razorpay Checkout options with mandatory order_id
  const rzpOptions = {
    key: keyId,
    amount: Math.round(options.amount * 100), // paise
    currency: 'INR',
    name: 'Visasra',
    description: options.description || 'Deposit to Visasra Money',
    image: '/images/logo/visasra-logo.png',
    order_id: orderId, // <-- MANDATORY in Razorpay Checkout
    prefill: {
      name: options.prefill?.name || 'Customer',
      email: options.prefill?.email || '',
      contact: sanitizedContact,
    },
    theme: {
      color: '#09254A',
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      confirm_close: true,
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
    handler: function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      if (response && response.razorpay_payment_id) {
        options.onSuccess(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      } else {
        const err = new Error('No payment ID received from Razorpay');
        if (options.onError) options.onError(err);
      }
    },
  };

  // 5. Instantiate and open the modal safely
  try {
    const RazorpayConstructor = (
      window as unknown as {
        Razorpay: new (opts: unknown) => {
          open: () => void;
          on: (event: string, cb: (r: unknown) => void) => void;
        };
      }
    ).Razorpay;

    if (!RazorpayConstructor) {
      throw new Error('Razorpay SDK constructor is unavailable');
    }

    const rzp = new RazorpayConstructor(rzpOptions);

    rzp.on('payment.failed', function (resp: unknown) {
      console.warn('[Razorpay] Payment failed / rejected:', resp);
      if (options.onError) options.onError(resp);
    });

    rzp.open();
  } catch (err: unknown) {
    console.error('[Razorpay] Error initializing checkout popup:', err);
    if (options.onError) options.onError(err);
    throw err;
  }
};
