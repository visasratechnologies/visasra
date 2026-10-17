export interface LiveOption {
  id: string;
  image: string;
  price: number;
  description: string;
  status: string;
}

export interface LiveProductItem {
  itemId: string;
  name: string;
  qty: number;
  estMin: number;
  estMax: number;
  status: string;
  approvedAmount?: number;
  options: LiveOption[];
}

export interface LiveSessionDetails {
  slotKey: string;
  status: string;
  stage: string;
  shopper: {
    id: string;
    name: string;
    rating: number;
    ordersDone: number;
    phone: string;
    photo?: string;
  } | null;
  store: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  location: {
    lat: number;
    lng: number;
    updatedAt: number;
    etaMin: number;
  } | null;
  products: LiveProductItem[];
}

export interface TrackingStageItem {
  key: string;
  title: string;
  status: string;
  expected?: string;
  note?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  estMin: number;
  estMax: number;
  image?: string;
  notes?: string;
  sourceType?: string;
  sourceUrl?: string;
  onlinePlatform?: string;
  onlineOrderStatus?: string;
  onlineOrderNumber?: string;
  onlineTrackingNumber?: string;
  status: string;
  approvedAmount?: number;
  shopPaymentStatus?: string;
  options: Array<{
    id: string;
    image: string;
    price: number;
    description: string;
    status: string;
  }>;
}

export interface TrackingDetails {
  slotKey: string;
  orderNumber?: string;
  orderStatus?: string;
  trackingStage?: string;
  orderType?: string;
  items?: OrderItem[];
  slotDate?: string;
  slotLabel?: string;
  totalAmount?: number;
  stages: TrackingStageItem[];
  shopper: {
    name: string;
    rating: number;
    ordersDone: number;
    phone: string;
    photo?: string;
  } | null;
  store: {
    name: string;
    address?: string;
    lat: number;
    lng: number;
  };
  workerLocation?: {
    lat: number;
    lng: number;
    stage: string;
    etaMin: number;
  } | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  walletBalance: number;
}

export interface ProductType {
  name: string;
  mid?: number;
  high?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  estMin: number;
  estMax: number;
  image: string;
  images?: string[];
  description?: string;
  tag?: string;
  categoryName?: string;
  types?: ProductType[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  desc?: string;
  products: Product[];
}

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  priceMin: number;
  priceMax: number;
  image?: string;
  images?: string[];
  notes?: string;
  sourceType?: 'catalog' | 'mind' | 'online';
  sourceUrl?: string;
  categoryName?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  label: 'Home' | 'Office' | 'Other';
}

export interface Order {
  id: string;
  orderNumber: string;
  slotKey: string;
  slotDate: string;
  slotWindow: string;
  slotLabel: string;
  status: string;
  trackingStage: string;
  orderType?: string;
  totalAmount: number;
  items: OrderItem[];
  liveSession?: {
    id: string;
    status: string;
    stage: string;
    worker?: {
      name: string;
      phone: string;
    };
  };
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  note: string;
  date: string;
}

export type CustomerTab = 'home' | 'categories' | 'bookslot' | 'orders' | 'cart' | 'profile' | 'wallet' | 'addresses' | 'live-shopping';
