export interface ProductOption {
  id: string;
  image: string;
  price: number;
  description: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'not_chosen'
  store?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  estMin: number;
  estMax: number;
  image?: string;
  notes?: string;
  status: string; // 'waiting' | 'options_ready' | 'needs_options' | 'approved' | 'purchased'
  approvedAmount?: number;
  shopPaymentStatus?: string; // 'none' | 'qr_uploaded' | 'paid'
  shopPaymentQr?: string;
  shopPaymentProof?: string;
  shopPaymentAmount?: number;
  options: ProductOption[];
}

export interface LiveSession {
  id: string;
  slotKey: string;
  status: string;
  stage: string;
  workerId?: string | null;
  storeName?: string;
  storeAddress?: string;
  storeLat?: number;
  storeLng?: number;
  workerLat?: number;
  workerLng?: number;
  user: {
    name: string;
    phone?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    slotDate: string;
    slotLabel: string;
    totalAmount: number;
    items: OrderItem[];
    shippingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      region?: string;
      zip?: string;
      country?: string;
    };
  };
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  ordersDone: number;
  status: string; // 'active' | 'offline'
  kycStatus: string; // 'none' | 'pending' | 'verified' | 'approved' | 'rejected'
  aadhaarNumber?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  panNumber?: string;
  panDoc?: string;
  drivingLicenseNumber?: string;
  drivingLicenseDoc?: string;
  currentAddress?: string;
  permanentAddress?: string;
  altPhone?: string;
  photo?: string;
  selfie?: string;
  walletBalance: number;
  payoutUpi?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  bankBranch?: string;
  kycReason?: string;
  currentLat?: number;
  currentLng?: number;
}

export interface WorkerNotification {
  id: string;
  ts: number;
  read: boolean;
  type: 'approved' | 'paid' | 'rejected' | 'new_slot' | 'accept_open' | 'kyc_ok';
  name: string;
  slotKey?: string;
  itemId?: string;
  amount?: number;
  when?: string;
}

export type WorkerScreen =
  | 'login'
  | 'otp'
  | 'forgot'
  | 'kycform'
  | 'kycwait'
  | 'kycrej'
  | 'home'
  | 'slots'
  | 'map'
  | 'earn'
  | 'profile'
  | 'detail'
  | 'list'
  | 'prod'
  | 'add'
  | 'complete'
  | 'notes';
