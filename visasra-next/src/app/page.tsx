'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { openRazorpayPayment } from '@/lib/razorpay';
import '@/styles/styles.css';
import '@/styles/live.css';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { HomeTab } from '@/components/tabs/HomeTab';
import { CartTab } from '@/components/tabs/CartTab';
import { WalletTab } from '@/components/tabs/WalletTab';
import { ProfileTab } from '@/components/tabs/ProfileTab';
import { OrdersTab } from '@/components/tabs/OrdersTab';
import { AddressesTab } from '@/components/tabs/AddressesTab';
import { LiveShoppingTab } from '@/components/tabs/LiveShoppingTab';
import { OrderPlacedModal } from '@/components/modals/OrderPlacedModal';
import { InsufficientBalanceModal } from '@/components/modals/InsufficientBalanceModal';
import OrderTrackingModal from '@/components/modals/OrderTrackingModal';
import { compressImageClient } from '@/lib/imageCompression';
import { chime } from '@/lib/chime';
import { resolveItemImage } from '@/lib/placeholders';

// Code-split heavy modals to reduce initial JavaScript payload by ~40%
const CustomizeProductModal = dynamic(() => import('@/components/modals/CustomizeProductModal'), { ssr: false });
const EditBasketItemModal = dynamic(() => import('@/components/modals/EditBasketItemModal'), { ssr: false });
const TripDetailsModal = dynamic(() => import('@/components/modals/TripDetailsModal').then(m => m.TripDetailsModal), { ssr: false });
const RateShopperModal = dynamic(() => import('@/components/modals/RateShopperModal').then(m => m.RateShopperModal), { ssr: false });

interface LiveOption {
  id: string;
  image: string;
  price: number;
  description: string;
  status: string;
}

interface LiveProductItem {
  itemId: string;
  name: string;
  qty: number;
  estMin: number;
  estMax: number;
  status: string;
  approvedAmount?: number;
  options: LiveOption[];
}

interface LiveSessionDetails {
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

interface TrackingStageItem {
  key: string;
  title: string;
  status: string;
  expected?: string;
  note?: string;
  updatedAt?: string;
}

interface TrackingDetails {
  slotKey: string;
  orderNumber?: string;
  orderStatus?: string;
  trackingStage?: string;
  orderType?: string;
  items?: OrderItem[];
  slotDate?: string;
  slotLabel?: string;
  totalAmount?: number;
  customerNotes?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
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

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  walletBalance: number;
  lastLoginAt?: string | Date;
}

interface ProductType {
  name: string;
  mid?: number;
  high?: number;
}

interface Product {
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

interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  desc?: string;
  products: Product[];
}

interface CartItem {
  id: string;
  productId?: string;
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

interface OrderItem {
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

interface Address {
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

interface Order {
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
  customerNotes?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
  items: OrderItem[];
  stageHistory?: Array<{
    stageKey: string;
    title?: string;
    status: string;
    expected?: string;
    note?: string;
    updatedAt?: string;
  }>;
  liveSession?: {
    id: string;
    status: string;
    stage: string;
    storeName?: string;
    storeAddress?: string;
    storeLat?: number;
    storeLng?: number;
    workerLat?: number;
    workerLng?: number;
    workerEtaMin?: number;
    worker?: {
      id?: string;
      name: string;
      phone: string;
      rating?: number;
      ordersDone?: number;
      photo?: string;
    };
  };
}




export default function CustomerApp() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [showInitialSplash, setShowInitialSplash] = useState<boolean>(false);

  const getCustomerToken = () => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('visasra_token') : null;
    } catch {
      return null;
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const t = getCustomerToken();
    const headers: Record<string, string> = {};
    if (t) headers['Authorization'] = `Bearer ${t}`;
    if (user?.id) headers['x-user-id'] = user.id;
    if (user?.email) headers['x-user-email'] = user.email;
    return headers;
  };


  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'bookslot' | 'orders' | 'cart' | 'profile' | 'wallet' | 'addresses' | 'live-shopping'>('home');
  const [user, setUser] = useState<User>({ id: '', name: '', email: '', phone: '', walletBalance: 0 });
  const [cart, setCart] = useState<CartItem[]>([]);

  const isCartInitializedRef = useRef(false);
  const lastOrdersFetchRef = useRef<number>(0);

  // Helper to synchronously persist cart to localStorage
  const persistCartLocally = (newCart: CartItem[]) => {
    try {
      localStorage.setItem('visasra_customer_cart_v1', JSON.stringify(newCart));
    } catch { }
  };

  // Load saved session, active tab, cart & splash on mount (runs strictly client-side post-hydration)
  useEffect(() => {
    let splashTimer: NodeJS.Timeout | null = null;
    try {
      // 1. Zero-latency session hydration: only show brief splash once per cold session if desired
      const hasSeenSplash = typeof window !== 'undefined' ? sessionStorage.getItem('visasra_splash_seen') : '1';
      if (!hasSeenSplash) {
        sessionStorage.setItem('visasra_splash_seen', '1');
        setShowInitialSplash(true);
        splashTimer = setTimeout(() => {
          setShowInitialSplash(false);
        }, 500);
      } else {
        setShowInitialSplash(false);
      }

      // 2. Restore local cart
      const savedCart = localStorage.getItem('visasra_customer_cart_v1');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      }

      // 3. Restore active tab from URL path, query params, or localStorage
      const path = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '').toLowerCase() : '';
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const tabParam = urlParams?.get('tab');

      const pathToTab: Record<string, string> = {
        'book-slot': 'bookslot',
        'bookslot': 'bookslot',
        'orders': 'orders',
        'cart': 'cart',
        'wallet': 'wallet',
        'profile': 'profile',
        'categories': 'categories',
        'live-shopping': 'live-shopping',
      };

      const savedTab = localStorage.getItem('visasra_customer_active_tab');
      const resolvedTab = (tabParam && pathToTab[tabParam]) || pathToTab[path] || savedTab;
      if (resolvedTab && ['home', 'categories', 'bookslot', 'orders', 'cart', 'profile', 'wallet', 'addresses', 'live-shopping'].includes(resolvedTab)) {
        setActiveTab(resolvedTab as any);
      }

      // 4. Restore user session
      const saved = localStorage.getItem('visasra_customer_session_v1');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email === 'customer@visasra.com') {
          u.walletBalance = 0;
        }
        setUser(u);
        if (u.phone) {
          setCustomerPhone(prev => prev || u.phone);
        }
        setIsLoggedIn(true);

        // Fetch authoritative wallet balance from DB
        fetch('/api/wallet', { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then((d) => {
            if (d && typeof d.balance === 'number') {
              setUser((prev) => {
                const updated = { ...prev, walletBalance: d.balance };
                try {
                  localStorage.setItem('visasra_customer_session_v1', JSON.stringify(updated));
                } catch { }
                return updated;
              });
            }
          })
          .catch(() => { });
      }
    } catch (e) {
      console.error('Session/Cart load error', e);
    } finally {
      setAuthChecking(false);
      setMounted(true);
    }

    return () => {
      if (splashTimer) clearTimeout(splashTimer);
    };
  }, []);

  // Live Auto-Save cart to localStorage (protected against initial mount wipe)
  useEffect(() => {
    if (!mounted) return;
    if (!isCartInitializedRef.current) {
      isCartInitializedRef.current = true;
      return;
    }
    persistCartLocally(cart);
  }, [cart, mounted]);

  // Live Auto-Save active tab to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('visasra_customer_active_tab', activeTab);
    } catch { }
  }, [activeTab]);

  // Live Auto-Sync Wallet Balance from PostgreSQL
  useEffect(() => {
    const syncWallet = () => {
      if (!isLoggedIn) return;
      fetch('/api/wallet', { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.balance === 'number') {
            setUser((prev) => {
              if (prev.walletBalance !== d.balance) {
                const updated = { ...prev, walletBalance: d.balance };
                try {
                  localStorage.setItem('visasra_customer_session_v1', JSON.stringify(updated));
                } catch { }
                return updated;
              }
              return prev;
            });
          }
          if (d && Array.isArray(d.transactions)) {
            setWalletTransactions(d.transactions);
          }
        })
        .catch(() => { });
    };

    if (!isLoggedIn || !user.email) return;

    syncWallet();
    window.addEventListener('focus', syncWallet);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      syncWallet();
    }, 60000);
    return () => {
      window.removeEventListener('focus', syncWallet);
      clearInterval(interval);
    };
  }, [isLoggedIn, user.email]);

  const handleAuthSuccess = (authUser: User, token?: string, fullPhone?: string) => {
    setUser(authUser);
    if (fullPhone) {
      setCustomerPhone(fullPhone);
    }
    setIsLoggedIn(true);
    setActiveTab(prev => (prev === 'cart' || prev === 'bookslot' ? prev : 'home'));
    try {
      localStorage.setItem('visasra_customer_session_v1', JSON.stringify(authUser));
      if (token) localStorage.setItem('visasra_token', token);
    } catch { }
    showToast(`Welcome back, ${authUser.name || 'Customer'}!`);
    loadData(authUser, true);
    syncCartWithDatabase(authUser);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('visasra_customer_session_v1');
    localStorage.removeItem('visasra_token');
    localStorage.removeItem('visasra_customer_cart_v1');
    setIsLoggedIn(false);
    setUser({
      id: '',
      name: '',
      email: '',
      phone: '',
      walletBalance: 0,
    });
    setOrders([]);
    setCart([]);
    setActiveTab('home');
    showToast('Signed out of Visasra');
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Saved Delivery Addresses & Customer Mobile Number
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    zip: '',
    country: 'India',
    label: 'Home',
  });

  // Booking Flow State (3 Steps: Sourcing Basket -> Delivery & Contact -> Slot & Timing)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [sourcingSourceTab, setSourcingSourceTab] = useState<'catalog' | 'mind' | 'online'>('catalog');
  const [slotDuration, setSlotDuration] = useState<2 | 3 | 5>(3);
  const [selectedDate, setSelectedDate] = useState('2026-10-16');
  const [selectedSlotWindow, setSelectedSlotWindow] = useState('11:00 AM – 2:00 PM (IST)');
  const [itemRequirement, setItemRequirement] = useState('');
  const [showTripDetailsModal, setShowTripDetailsModal] = useState(false);

  // Source Type 2: Customize Product (What's on your mind)
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customMin, setCustomMin] = useState<string>('1500');
  const [customMax, setCustomMax] = useState<string>('4500');
  const [customQty, setCustomQty] = useState<string>('1');
  const [customImg, setCustomImg] = useState<string>('');
  const [customImgs, setCustomImgs] = useState<string[]>([]);

  // Source Type 3: Online Platform Item
  const [onlineUrl, setOnlineUrl] = useState('');
  const [onlinePlatform, setOnlinePlatform] = useState('Amazon.in');
  const [onlineTitle, setOnlineTitle] = useState('');
  const [onlinePrice, setOnlinePrice] = useState<string>('2499');
  const [onlineImg, setOnlineImg] = useState('');
  const [onlineImgs, setOnlineImgs] = useState<string[]>([]);
  const [onlineNotes, setOnlineNotes] = useState('');

  // Editing Cart / Sourcing Item State
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImgs, setEditImgs] = useState<string[]>([]);

  // Category & Product Customization UX (3-tier: Category -> Subcategory/Product -> Types)
  const [selectedCategoryForView, setSelectedCategoryForView] = useState<Category | null>(null);
  const [selectedProductForTypes, setSelectedProductForTypes] = useState<Product | null>(null);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customizingQty, setCustomizingQty] = useState(1);
  const [customizingNotes, setCustomizingNotes] = useState('');
  const [customizingImg, setCustomizingImg] = useState('');
  const [customizingImgs, setCustomizingImgs] = useState<string[]>([]);
  const [activeProductPhotoIdx, setActiveProductPhotoIdx] = useState(0);

  // Wallet Top-Up State
  const [customTopupAmt, setCustomTopupAmt] = useState('2500');
  const [selectedQuickAmt, setSelectedQuickAmt] = useState<number | null>(2500);

  // Central Navigation & History Handler
  const navigateToTab = (tab: typeof activeTab, pushToHistory = true) => {
    setActiveTab(tab);
    if (tab !== 'categories') {
      setSelectedCategoryForView(null);
      setSelectedProductForTypes(null);
    }
    if (pushToHistory && typeof window !== 'undefined') {
      const tabToPath: Record<string, string> = {
        home: '/',
        categories: '/categories',
        bookslot: '/book-slot',
        orders: '/orders',
        cart: '/cart',
        wallet: '/wallet',
        profile: '/profile',
        'live-shopping': '/live-shopping',
      };
      const targetPath = tabToPath[tab] || '/';
      window.history.pushState({ tab, catId: null, prodId: null }, '', targetPath);
    }
  };

  const handleSelectCategory = (c: Category, pushToHistory = true) => {
    setSelectedCategoryForView(c);
    setSelectedProductForTypes(null);
    setCatSearchQuery('');
    setActiveTab('categories');
    if (pushToHistory && typeof window !== 'undefined') {
      window.history.pushState(
        { tab: 'categories', catId: c.id, catSlug: c.slug, prodId: null },
        '',
        `/categories?cat=${encodeURIComponent(c.slug || c.id)}`
      );
    }
  };

  const handleSelectProductForTypes = (p: Product, pushToHistory = true) => {
    setSelectedProductForTypes(p);
    setTypeSearchQuery('');
    if (pushToHistory && typeof window !== 'undefined' && selectedCategoryForView) {
      window.history.pushState(
        { tab: 'categories', catId: selectedCategoryForView.id, catSlug: selectedCategoryForView.slug, prodId: p.id },
        '',
        `/categories?cat=${encodeURIComponent(selectedCategoryForView.slug || selectedCategoryForView.id)}&item=${encodeURIComponent(p.id)}`
      );
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback if opened without browser history
      if (selectedProductForTypes) {
        setSelectedProductForTypes(null);
        setTypeSearchQuery('');
      } else if (selectedCategoryForView) {
        setSelectedCategoryForView(null);
        setCatSearchQuery('');
      } else if (activeTab !== 'home') {
        navigateToTab('home', false);
      }
    }
  };

  // Synchronize browser history and handle mobile/browser back button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Anchor initial state on load if not set
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab, catId: null, prodId: null }, '', window.location.pathname);
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state && state.tab) {
        setActiveTab(state.tab);
        if (state.tab === 'categories') {
          if (state.prodId && state.catId) {
            const cat = categories.find((c) => c.id === state.catId || c.slug === state.catSlug);
            if (cat) {
              setSelectedCategoryForView(cat);
              const prod = (cat.products || []).find((p) => p.id === state.prodId);
              setSelectedProductForTypes(prod || null);
            }
          } else if (state.catId) {
            const cat = categories.find((c) => c.id === state.catId || c.slug === state.catSlug);
            setSelectedCategoryForView(cat || null);
            setSelectedProductForTypes(null);
          } else {
            setSelectedCategoryForView(null);
            setSelectedProductForTypes(null);
          }
        } else {
          setSelectedCategoryForView(null);
          setSelectedProductForTypes(null);
        }
      } else {
        // Pushed back to the beginning of the site
        if (selectedProductForTypes) {
          setSelectedProductForTypes(null);
          setTypeSearchQuery('');
        } else if (selectedCategoryForView) {
          setSelectedCategoryForView(null);
          setCatSearchQuery('');
        } else if (activeTab !== 'home') {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories, activeTab, selectedCategoryForView, selectedProductForTypes]);

  // Product & Sub-type Image Resolution Helpers
  const productSlug = (name: string) => {
    return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const getProductImg = (catSlug: string, prodName?: string, fallbackImg?: string) => {
    if (fallbackImg) return fallbackImg;
    const cleanCat = productSlug(catSlug);
    if (prodName) {
      const cleanProd = productSlug(prodName);
      return `/images/products/${cleanCat}/${cleanProd}.jpg`;
    }
    return `/images/categories/${cleanCat}.jpg`;
  };

  const getTypeImg = (catSlug: string, prodName: string, typeName: string) => {
    const cleanCat = productSlug(catSlug);
    const cleanProd = productSlug(prodName);
    const cleanType = productSlug(typeName);
    return `/images/products/${cleanCat}/${cleanProd}/${cleanType}.jpg`;
  };

  // Search Bar Interaction
  const [searchFocused, setSearchFocused] = useState(false);

  // Modals
  const [liveSessionSlot, setLiveSessionSlot] = useState<string | null>(null);
  const [liveSessionData, setLiveSessionData] = useState<LiveSessionDetails | null>(null);
  const [liveSessionLoading, setLiveSessionLoading] = useState(false);

  const [trackOrderSlot, setTrackOrderSlot] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingDetails | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState<{
    itemId: string;
    optionId: string;
    itemName: string;
    itemImage?: string;
    price: number;
    qty: number;
    requiredAmount: number;
    currentBalance: number;
    shortfall: number;
  } | null>(null);

  const [walletTransactions, setWalletTransactions] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    note: string;
    date: string;
  }>>([]);

  // Booking Confirmation, Loading & Celebration States
  const [isBooking, setIsBooking] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState<Order | null>(null);

  // Button expression & instant feedback states
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);
  const [isAddingBasket, setIsAddingBasket] = useState(false);
  const [customAddedFeedback, setCustomAddedFeedback] = useState(false);
  const [onlineAddedFeedback, setOnlineAddedFeedback] = useState(false);
  const [catalogFilterSlug, setCatalogFilterSlug] = useState<string>('all');
  const [catPillsWrapped, setCatPillsWrapped] = useState(false);
  const catScrollRef = useRef<HTMLDivElement>(null);

  // Worker Review & Rating Modal
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const handleSubmitReview = async () => {
    if (!ratingModalOrder || !ratingModalOrder.liveSession?.worker?.id) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/worker/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          workerId: ratingModalOrder.liveSession.worker.id,
          orderId: ratingModalOrder.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Thank you! Your rating and review have been saved.');
        setRatingModalOrder(null);
        setReviewComment('');
        setReviewRating(5);
      } else {
        showToast(data.error || 'Failed to submit review');
      }
    } catch {
      showToast('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Image Upload State & Handlers (Direct Cloudflare Sync / Local Fallback)
  const [uploadingImage, setUploadingImage] = useState(false);
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      // Client-side off-screen canvas downscaling to 1280px WebP (reduces 6MB camera raw to ~140KB)
      const compressedFile = await compressImageClient(file, { maxDimension: 1280, quality: 0.82 });
      const fd = new FormData();
      fd.append('file', compressedFile);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        showToast('Photo uploaded successfully!');
        return data.url;
      } else {
        showToast(data.error || 'Upload failed');
        return null;
      }
    } catch {
      showToast('Image upload failed');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Reusable Image Upload Dropzone Component Function
  const renderImageUploadBox = (
    currentUrl: string,
    onUrlChange: (url: string) => void,
    label: string = 'Reference Photo / Image'
  ) => (
    <div style={{ marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#0B192E', display: 'block', marginBottom: 5 }}>
        {label}
      </span>
      {currentUrl ? (
        <div className="image-upload-dropzone has-file">
          <div className="image-upload-preview">
            <img src={currentUrl} alt="Preview" className="iup-thumb" onError={() => onUrlChange('')} />
            <div className="iup-meta">
              <div className="iup-name">{currentUrl.split('/').pop() || 'Uploaded Photo'}</div>
              <div className="iup-status">✓ Photo Ready (Stored Securely)</div>
            </div>
            <button
              type="button"
              className="iup-remove-btn"
              onClick={() => onUrlChange('')}
            >
              ✕ Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="image-upload-dropzone" style={{ display: 'block' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={uploadingImage}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const uploadedUrl = await handleFileUpload(file);
                if (uploadedUrl) onUrlChange(uploadedUrl);
              }
            }}
          />
          <div className="iud-content">
            <svg className="iud-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="iud-title">
              {uploadingImage ? 'Uploading photo...' : 'Click to Upload Photo or Drag & Drop'}
            </div>
            <div className="iud-sub">Take photo from camera or pick JPG, PNG, WEBP from device</div>
          </div>
        </label>
      )}
    </div>
  );

  // Reusable Multi-Image Upload Dropzone Component Function (Supports up to 4 Photos)
  const renderMultiImageUploadBox = (
    images: string[],
    onImagesChange: (urls: string[]) => void,
    label: string = 'Reference Photos (Up to 4 Photos)',
    sublabel: string = 'Add up to 4 photos to help your personal shopper find the exact product'
  ) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B192E' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: images.length >= 4 ? '#16A34A' : '#2563EB', background: images.length >= 4 ? '#DCFCE7' : '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
          {images.length}/4 Photos
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
        {sublabel}
      </div>

      <div className="multi-photo-grid">
        {images.map((imgUrl, idx) => (
          <div key={idx} className="multi-photo-card">
            <img src={imgUrl} alt={`Photo ${idx + 1}`} className="mpc-img" />
            <span className="mpc-badge">{idx === 0 ? 'Main Photo' : `Pic #${idx + 1}`}</span>
            <button
              type="button"
              className="mpc-remove-btn"
              title="Remove photo"
              onClick={() => {
                onImagesChange(images.filter((_, i) => i !== idx));
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < 4 && (
          <label className="multi-photo-add-slot">
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              disabled={uploadingImage}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const remainingSlots = 4 - images.length;
                const toUpload = files.slice(0, remainingSlots);
                let currentList = [...images];
                for (const f of toUpload) {
                  const uploadedUrl = await handleFileUpload(f);
                  if (uploadedUrl) {
                    currentList = [...currentList, uploadedUrl];
                  }
                }
                onImagesChange(currentList.slice(0, 4));
                e.target.value = '';
              }}
            />
            <div className="mpas-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22, color: '#2563EB' }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: '#0F172A' }}>
                {uploadingImage ? 'Uploading...' : `+ Add Photo (${images.length}/4)`}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>Select image or take photo</div>
            </div>
          </label>
        )}
      </div>
    </div>
  );

  // Live Chat Messenger State
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ id: string; sender: 'shopper' | 'customer'; text: string; time: string }>>([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const handleSendLiveMessage = () => {
    if (!liveChatInput.trim()) return;
    setLiveChatMessages(prev => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        sender: 'customer',
        text: liveChatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLiveChatInput('');
    showToast('Message sent to ground shopper');
  };

  const fetchLiveSession = async (slotKey: string) => {
    try {
      const res = await fetch(`/api/live/${encodeURIComponent(slotKey)}`);
      if (res.ok) {
        const data = await res.json();
        setLiveSessionData(data);
      }
    } catch (err) {
      console.error('Error fetching live session:', err);
    }
  };

  const fetchTracking = async (slotKey: string) => {
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(slotKey)}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch (err) {
      console.error('Error fetching tracking:', err);
    }
  };

  const handleTrackOrder = (slotKey: string, initialOrder?: Order) => {
    // 1. Immediately hydrate tracking data synchronously from in-memory orders (0ms latency, zero skeleton delay)
    const existing = initialOrder || orders.find(o => o.slotKey === slotKey || o.orderNumber === slotKey);
    if (existing) {
      const defaultStages = [
        { key: 'slot_confirmed', title: 'Slot Confirmed & Scheduled', status: 'done', note: 'Priority shopping window reserved across ground shopper network.' },
        { key: 'worker_assigned', title: 'Personal Shopper Assigned', status: ['worker_assigned', 'shopping', 'purchased', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(existing.trackingStage || existing.status) ? 'done' : 'pending', note: existing.liveSession?.worker ? `${existing.liveSession.worker.name} (${existing.liveSession.worker.phone || 'Dedicated Sourcing Specialist'})` : 'Dedicated personal shopper assigned.' },
        { key: 'shopping', title: 'In-Store Verification & Sourcing', status: ['shopping', 'purchased', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(existing.trackingStage || existing.status) ? (existing.trackingStage === 'shopping' ? 'current' : 'done') : 'pending', note: existing.liveSession?.storeName || 'Sourcing in local retail market' },
        { key: 'purchased', title: 'Purchased & Merchant Billed', status: ['purchased', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(existing.trackingStage || existing.status) ? 'done' : 'pending' },
        { key: 'packed', title: 'Central Hub Quality Check & Export Packing', status: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(existing.trackingStage || existing.status) ? 'done' : 'pending' },
        { key: 'shipped', title: 'Customs Clearance & International Flight Dispatch', status: ['shipped', 'out_for_delivery', 'delivered'].includes(existing.trackingStage || existing.status) ? 'done' : 'pending', note: existing.trackingNumber ? `AWB: ${existing.trackingNumber}` : undefined },
        { key: 'out_for_delivery', title: 'Doorstep Delivery Overseas', status: existing.status === 'delivered' ? 'done' : 'pending' },
      ];

      setTrackingData({
        slotKey: existing.slotKey,
        orderNumber: existing.orderNumber,
        orderType: existing.orderType,
        orderStatus: existing.status,
        trackingStage: existing.trackingStage,
        slotDate: existing.slotDate,
        slotLabel: existing.slotLabel || existing.slotKey,
        totalAmount: existing.totalAmount,
        customerNotes: existing.customerNotes,
        carrier: existing.carrier,
        trackingNumber: existing.trackingNumber,
        trackingUrl: existing.trackingUrl,
        shippedAt: existing.shippedAt,
        deliveredAt: existing.deliveredAt,
        items: existing.items || [],
        stages: existing.stageHistory && existing.stageHistory.length > 0
          ? existing.stageHistory.map((s) => ({
              key: s.stageKey,
              title: s.title || s.stageKey,
              status: s.status,
              expected: s.expected,
              note: s.note,
              updatedAt: s.updatedAt,
            }))
          : defaultStages,
        shopper: existing.liveSession?.worker
          ? {
              name: existing.liveSession.worker.name,
              rating: existing.liveSession.worker.rating ?? 4.9,
              ordersDone: existing.liveSession.worker.ordersDone ?? 12,
              phone: existing.liveSession.worker.phone,
              photo: existing.liveSession.worker.photo,
            }
          : null,
        store: {
          name: existing.liveSession?.storeName || 'Local Store & Market',
          address: existing.liveSession?.storeAddress || 'Physical In-Store Sourcing Across India',
          lat: existing.liveSession?.storeLat ?? 13.0418,
          lng: existing.liveSession?.storeLng ?? 80.2341,
        },
        workerLocation: existing.liveSession?.workerLat && existing.liveSession?.workerLng
          ? {
              lat: existing.liveSession.workerLat,
              lng: existing.liveSession.workerLng,
              stage: existing.liveSession.stage,
              etaMin: existing.liveSession.workerEtaMin ?? 12,
            }
          : null,
      });
    }
    setTrackOrderSlot(slotKey);
  };

  useEffect(() => {
    if (!liveSessionSlot) {
      setLiveSessionData(null);
      return;
    }
    setLiveSessionLoading(true);
    fetchLiveSession(liveSessionSlot).finally(() => setLiveSessionLoading(false));

    // Connect to Real-time SSE Event Bus (eliminates 20s polling load)
    let es: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      es = new EventSource(`/api/live/${encodeURIComponent(liveSessionSlot)}/events`);

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'option_created') {
            fetchLiveSession(liveSessionSlot);
            chime.playLiveOptionChime();
          } else if (parsed.type === 'qr_cleared') {
            fetchLiveSession(liveSessionSlot);
            chime.playPaymentClearedChime();
          } else if (['stage_changed', 'location_updated', 'option_decision', 'session_refresh'].includes(parsed.type)) {
            fetchLiveSession(liveSessionSlot);
          }
        } catch {
          // Keep-alive or non-JSON message
        }
      };

      es.onerror = () => {
        // SSE disconnected; close to stop 3s reconnect loop and prevent socket exhaustion on serverless
        if (es) {
          try { es.close(); } catch {}
          es = null;
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            fetchLiveSession(liveSessionSlot);
          }, 15000);
        }
      };

      es.onopen = () => {
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };
    } catch {
      // EventSource not supported in environment: passive fallback
      fallbackInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
        fetchLiveSession(liveSessionSlot);
      }, 20000);
    }

    return () => {
      if (es) {
        try { es.close(); } catch {}
        es = null;
      }
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [liveSessionSlot]);

  useEffect(() => {
    if (!trackOrderSlot) {
      setTrackingData(null);
      return;
    }
    // Silently fetch any fresh tracking updates without resetting in-memory hydrated state
    fetchTracking(trackOrderSlot);
  }, [trackOrderSlot]);

  // Lock body scroll cleanly whenever any modal is active (prevents mobile background scroll trap)
  const isAnyModalOpen = Boolean(
    trackOrderSlot ||
    customizingProduct ||
    editingCartItem ||
    orderPlacedSuccess ||
    ratingModalOrder ||
    showTripDetailsModal ||
    insufficientBalanceModal
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);


  const executeApproveOption = async (itemId: string, optionId: string) => {
    if (!liveSessionSlot) return;
    try {
      const res = await fetch(`/api/live/${encodeURIComponent(liveSessionSlot)}/products/${itemId}/options/${optionId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve option');
      showToast('Option Approved! Shopper will proceed to billing counter.');
      fetchLiveSession(liveSessionSlot);
      loadData(user, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error approving option');
    }
  };

  const handleApproveOption = async (itemId: string, optionId: string, item?: any, option?: any) => {
    if (!liveSessionSlot) return;
    const itemQty = item?.qty || 1;
    const optionPrice = option?.price || 0;
    const requiredAmount = optionPrice * itemQty;

    // Check if customer has enough Visasra Money balance
    if (requiredAmount > 0 && user.walletBalance < requiredAmount) {
      const shortfall = requiredAmount - user.walletBalance;
      setInsufficientBalanceModal({
        itemId,
        optionId,
        itemName: item?.name || 'Selected Item',
        itemImage: option?.image || '',
        price: optionPrice,
        qty: itemQty,
        requiredAmount,
        currentBalance: user.walletBalance,
        shortfall,
      });
      return;
    }

    await executeApproveOption(itemId, optionId);
  };

  const handleTopupAndApprove = async (depositAmt: number) => {
    if (!insufficientBalanceModal) return;
    const { itemId, optionId, itemName } = insufficientBalanceModal;
    try {
      await openRazorpayPayment({
        amount: depositAmt,
        description: `Visasra Money Top-up for ${itemName}`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: customerPhone || user.phone,
        },
        onSuccess: async (paymentId: string, orderId?: string, signature?: string) => {
          showToast(`Depositing ₹${depositAmt.toLocaleString('en-IN')} to Visasra Money...`);
          const res = await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              amount: depositAmt,
              razorpayPaymentId: paymentId,
              razorpayOrderId: orderId,
              razorpaySignature: signature,
              note: `Deposit for item: ${itemName} (${paymentId})`,
            }),
          });
          const data = await res.json();
          if (data.success) {
            const newBal = typeof data.balance === 'number' ? data.balance : (user.walletBalance + depositAmt);
            setUser(prev => ({ ...prev, walletBalance: newBal }));
            try {
              localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, walletBalance: newBal }));
            } catch { }
            setInsufficientBalanceModal(null);
            showToast(`₹${depositAmt.toLocaleString('en-IN')} added! Approving ${itemName}...`);
            await executeApproveOption(itemId, optionId);
          } else {
            showToast(data.error || 'Failed to credit funds to Visasra Money');
          }
        },
        onDismiss: () => {
          showToast('Payment cancelled. Balance was not added.');
        },
        onError: () => {
          showToast('Payment failed. Please try again.');
        },
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Payment error');
    }
  };

  const handleRejectOption = async (itemId: string, optionId: string) => {
    if (!liveSessionSlot) return;
    try {
      const res = await fetch(`/api/live/${encodeURIComponent(liveSessionSlot)}/products/${itemId}/options/${optionId}/reject`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request alternative');
      if (data.refundedAmount && data.refundedAmount > 0) {
        showToast(`Decision undone! ₹${Number(data.refundedAmount).toLocaleString('en-IN')} refunded to your Visasra Money`);
      } else {
        showToast('Requested alternative options from shopper');
      }
      fetchLiveSession(liveSessionSlot);
      loadData(user, true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error rejecting option');
    }
  };


  const handleSelectProductVariety = (
    variety: { name: string; mid?: number; high?: number },
    typePhoto: string,
    minVal: number,
    maxVal: number
  ) => {
    if (!selectedCategoryForView || !selectedProductForTypes) return;
    const prodPhoto = getProductImg(selectedCategoryForView.slug, selectedProductForTypes.name);
    const subPhotos: string[] = [];
    if (typePhoto && !typePhoto.startsWith('/images/categories/')) {
      subPhotos.push(typePhoto);
    }
    if (prodPhoto && !prodPhoto.startsWith('/images/categories/')) {
      subPhotos.push(prodPhoto);
    }

    setCustomizingProduct({
      id: `${selectedProductForTypes.id}-${productSlug(variety.name)}`,
      name: `${selectedProductForTypes.name} – ${variety.name}`,
      price: minVal,
      estMin: minVal,
      estMax: maxVal,
      image: typePhoto,
      images: subPhotos,
      description: `Specific ${variety.name} variety of ${selectedProductForTypes.name} sourced directly from verified Indian merchants.`,
      categoryName: selectedCategoryForView.name,
      tag: 'Specific Variety',
    });
    setCustomizingQty(1);
    setCustomizingNotes('');
    setCustomizingImg(typePhoto);
    setCustomizingImgs(subPhotos);
    setActiveProductPhotoIdx(0);
  };

  const handleSaveNewAddress = async (formData?: Omit<Address, 'id'>) => {
    const src = formData || addressForm;
    if (!src.line1 || !src.city || !src.zip) {
      showToast('Please fill in street address, city, and ZIP code');
      return;
    }
    const nameToUse = src.name.trim() || user.name || 'Recipient';
    const phoneToUse = src.phone.trim() || customerPhone || user.phone;

    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: nameToUse,
          phone: phoneToUse,
          line1: src.line1.trim(),
          line2: src.line2?.trim() || null,
          city: src.city.trim(),
          region: src.region?.trim() || null,
          zip: src.zip.trim(),
          country: src.country || 'India',
        }),
      });
      const data = await res.json();
      if (res.ok && data.address) {
        const newAddr: Address = {
          id: data.address.id,
          name: data.address.name,
          phone: data.address.phone || '',
          line1: data.address.line1,
          line2: data.address.line2 || '',
          city: data.address.city,
          region: data.address.region || '',
          zip: data.address.zip,
          country: data.address.country,
          label: (src.label as 'Home' | 'Office' | 'Other') || 'Home',
        };
        setSavedAddresses(prev => [newAddr, ...prev.filter(a => a.id !== newAddr.id)]);
        setSelectedAddressId(newAddr.id);
        setIsAddingAddress(false);
        showToast('New delivery address saved to database!');
        return;
      }
    } catch { }

    const newAddr: Address = {
      id: 'addr-' + Date.now(),
      ...src,
      label: (src.label as 'Home' | 'Office' | 'Other') || 'Home',
    };
    setSavedAddresses(prev => [newAddr, ...prev]);
    setSelectedAddressId(newAddr.id);
    setIsAddingAddress(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (savedAddresses.length <= 1) {
      showToast('You must keep at least one saved address');
      return;
    }
    try {
      await fetch(`/api/user/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch { }
    setSavedAddresses(savedAddresses.filter(a => a.id !== id));
    if (selectedAddressId === id) {
      setSelectedAddressId(savedAddresses.find(a => a.id !== id)!.id);
    }
    showToast('Address removed');
  };

  const showToast = (msg: string) => {
    if (!msg) return;
    let clean = msg;
    // Humanize raw backend technical errors into polished, helpful messages
    if (/unauthorized|session token required|token required/i.test(msg)) {
      clean = 'Please sign in to complete your request';
    } else if (/failed to fetch|networkerror/i.test(msg)) {
      clean = 'Connection interrupted. Please try again.';
    } else if (/internal server error|failed to place order/i.test(msg)) {
      clean = 'Unable to complete request right now. Please try again.';
    }
    setToastMsg(clean);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Load Catalog Categories & Products from PostgreSQL once on mount
  const fetchCatalog = async () => {
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.categories) {
        setCategories(catData.categories);

        // Canonical Popular Items from D:\visasra-suite24 (app.js POPULAR_ITEMS)
        const CANONICAL_POPULAR = [
          { cat: 'cookware', name: 'Cooker' },
          { cat: 'cookware', name: 'Pans' },
          { cat: 'jewellery-accessories', name: 'Oxidized Jewellery' },
          { cat: 'jewellery-accessories', name: 'Earrings' },
          { cat: 'pooja-spiritual', name: 'Diyas' },
          { cat: 'home-decors', name: 'Wall Decor' },
          { cat: 'womens-fashion', name: 'Ethnic Wear' },
          { cat: 'home-furnishing', name: 'Bedsheets' },
        ];

        const matchedPopular: Product[] = [];
        CANONICAL_POPULAR.forEach(cp => {
          const cat = catData.categories.find((c: Category) => c.slug === cp.cat);
          if (cat) {
            const prod = (cat.products || []).find((p: Product) => p.name === cp.name);
            if (prod) {
              matchedPopular.push({
                ...prod,
                categoryName: cat.name,
                image: prod.image || `/images/products/${cp.cat}/${productSlug(prod.name)}.jpg`,
              });
            }
          }
        });

        if (matchedPopular.length > 0) {
          setPopularProducts(matchedPopular);
        } else {
          const allProds: Product[] = [];
          catData.categories.forEach((c: Category) => {
            (c.products || []).forEach(p => allProds.push({ ...p, categoryName: c.name }));
          });
          setPopularProducts(allProds.slice(0, 8));
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Fetch authoritative saved delivery addresses from PostgreSQL
  const fetchAddresses = async (activeUser: User) => {
    if (!activeUser) return;
    try {
      const r = await fetch('/api/user/addresses', { headers: getAuthHeaders() });
      const d = await r.json();
      if (d.success && Array.isArray(d.addresses) && d.addresses.length > 0) {
        interface DbAddr {
          id: string;
          name: string;
          phone?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          region?: string | null;
          zip: string;
          country?: string | null;
        }
        const mapped: Address[] = (d.addresses as DbAddr[]).map(a => ({
          id: a.id,
          name: a.name,
          phone: a.phone || '',
          line1: a.line1,
          line2: a.line2 || '',
          city: a.city,
          region: a.region || '',
          zip: a.zip,
          country: a.country || 'India',
          label: 'Home',
        }));
        setSavedAddresses(mapped);
        setSelectedAddressId(prev => prev && mapped.some(m => m.id === prev) ? prev : (mapped[0]?.id || ''));
        if (mapped[0]?.phone) {
          setCustomerPhone(prev => prev || mapped[0].phone);
        }
      } else {
        setSavedAddresses([]);
        setSelectedAddressId('');
      }
    } catch { }
  };

  // Synchronize Cart with PostgreSQL Database
  const syncCartWithDatabase = async (activeUser: User) => {
    if (!activeUser) return;
    try {
      const res = await fetch('/api/cart', { headers: getAuthHeaders() });
      const data = await res.json();
      const dbItems: CartItem[] = Array.isArray(data.items) ? data.items : [];

      // Check current in-memory cart and localStorage for items to sync/merge
      let localItems: CartItem[] = [];
      try {
        const localSaved = localStorage.getItem('visasra_customer_cart_v1');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) localItems = parsed;
        }
      } catch { }

      // Combine in-memory cart and localStorage items
      const combinedLocal = [...cart];
      for (const it of localItems) {
        if (!combinedLocal.some(c => c.id === it.id)) {
          combinedLocal.push(it);
        }
      }

      if (combinedLocal.length > 0) {
        const toMerge = combinedLocal.filter(l => !dbItems.some(d => (d.productId && d.productId === l.productId) || (d.id === l.id) || d.name.toLowerCase() === l.name.toLowerCase()));
        if (toMerge.length > 0) {
          const mergeRes = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              action: 'merge',
              items: toMerge,
            }),
          });
          const mergeData = await mergeRes.json();
          if (mergeData.success && Array.isArray(mergeData.items)) {
            setCart(mergeData.items);
            persistCartLocally(mergeData.items);
            return;
          }
        }
      }

      if (dbItems.length > 0) {
        setCart(dbItems);
        persistCartLocally(dbItems);
      }
    } catch (err) {
      console.error('Failed to sync cart with database:', err);
    }
  };

  // Remove an item from the cart & sync with PostgreSQL
  const handleRemoveCartItem = (itemId: string) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      persistCartLocally(updated);
      return updated;
    });
    if (isLoggedIn) {
      fetch(`/api/cart?id=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).catch(() => { });
    }
    showToast('Item removed from basket');
  };

  // Load Data from PostgreSQL with smart caching
  const loadData = async (targetUser?: User | null, force: boolean = false) => {
    try {
      const activeUser = targetUser !== undefined ? targetUser : (isLoggedIn ? user : null);
      if (activeUser) {
        const now = Date.now();
        // Skip re-fetching if recently loaded within 30 seconds unless explicitly forced
        if (!force && now - lastOrdersFetchRef.current < 30000 && orders.length > 0) {
          return;
        }
        lastOrdersFetchRef.current = now;
        const q = activeUser.email ? `?email=${encodeURIComponent(activeUser.email)}` : '';
        const ordRes = await fetch(`/api/orders${q}`, { headers: getAuthHeaders() });
        const ordData = await ordRes.json();
        if (ordData.orders) {
          setOrders(ordData.orders);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    }
  };

  useEffect(() => {
    const active = isLoggedIn && (user?.id || user?.email) ? user : null;
    if (active) {
      fetchAddresses(active);
      loadData(active, true);
      syncCartWithDatabase(active);
    } else {
      loadData(null);
      return;
    }

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      loadData(user);
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user?.email, user?.id]);

  // Live Search Filters
  const filteredSearchCategories = searchQuery.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const filteredSearchProducts = searchQuery.trim()
    ? popularProducts.concat(categories.flatMap(c => c.products || [])).filter((p, idx, arr) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) && arr.findIndex(x => x.id === p.id) === idx
    ).slice(0, 5)
    : [];

  const renderSearchBar = (isMobile = false) => (
    <div className="search-bar-wrap">
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={isMobile ? "Search categories or items..." : "Search categories, e.g. Silk Sarees, GRT Jewellery, Brass Diya..."}
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setSearchQuery('');
              setSearchFocused(false);
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {searchQuery.trim().length > 0 && (
        <div className="search-dropdown">
          {filteredSearchCategories.length > 0 && (
            <>
              <div className="search-group-title">Categories</div>
              {filteredSearchCategories.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  className="search-item-row"
                  onClick={() => {
                    handleSelectCategory(c);
                    setSearchQuery('');
                    setSearchFocused(false);
                    if (isMobile) setMobileSearchOpen(false);
                  }}
                >
                  <img
                    src={c.image || '/images/placeholders/placeholder-category.svg'}
                    alt=""
                    className="search-item-img"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('placeholder-category.svg')) {
                        target.src = '/images/placeholders/placeholder-category.svg';
                      }
                    }}
                  />
                  <div className="search-item-text">
                    <div className="search-item-name">{c.name}</div>
                    <div className="search-item-sub">View category &amp; products →</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {filteredSearchProducts.length > 0 && (
            <>
              <div className="search-group-title">Products &amp; Specialties</div>
              {filteredSearchProducts.map(p => (
                <div
                  key={p.id}
                  className="search-item-row"
                  onClick={() => {
                    setCustomizingProduct(p);
                    setSearchQuery('');
                    setSearchFocused(false);
                    if (isMobile) setMobileSearchOpen(false);
                  }}
                >
                  <img
                    src={p.image || '/images/placeholders/placeholder-item.svg'}
                    alt=""
                    className="search-item-img"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('placeholder-item.svg')) {
                        target.src = '/images/placeholders/placeholder-item.svg';
                      }
                    }}
                  />
                  <div className="search-item-text">
                    <div className="search-item-name">{p.name}</div>
                    <div className="search-item-sub">Est. ₹{p.estMin} – ₹{p.estMax} · Customize &amp; Add</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div
            className="search-custom-action"
            onClick={() => {
              setCustomTitle(searchQuery);
              navigateToTab('bookslot');
              setSourcingSourceTab('mind');
              setSearchQuery('');
              setSearchFocused(false);
              if (isMobile) setMobileSearchOpen(false);
            }}
          >
            <span>Can&apos;t find &ldquo;{searchQuery}&rdquo;? Request custom sourcing</span>
            <span>+ Add Request →</span>
          </div>
        </div>
      )}
    </div>
  );



  // Quick Add from Popular Picks matching target mockup
  const handleAddPopularQuick = (name: string, defaultMin: number, defaultMax: number) => {
    const feedbackKey = name.toLowerCase().includes('cooker') ? 'quick-cooker' : 'quick-pan';
    setAddedFeedbackId(feedbackKey);
    setTimeout(() => {
      setAddedFeedbackId(prev => (prev === feedbackKey ? null : prev));
    }, 1500);

    let found = popularProducts.find(p => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase()));
    if (!found) {
      for (const c of categories) {
        const p = (c.products || []).find(prod => prod.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(prod.name.toLowerCase()));
        if (p) {
          found = p;
          break;
        }
      }
    }
    if (found) {
      addToCart(found);
    } else {
      addToCart({
        id: name.toLowerCase().includes('cooker') ? 'quick-cooker' : 'quick-pan',
        name,
        price: defaultMin,
        estMin: defaultMin,
        estMax: defaultMax,
        image: '/images/placeholders/placeholder-item.svg',
        categoryName: 'Cookware',
      });
    }
  };

  // Add Item to Cart (Quick) with button expression
  const addToCart = (product: Product) => {
    setAddedFeedbackId(product.id);
    setTimeout(() => {
      setAddedFeedbackId(prev => (prev === product.id ? null : prev));
    }, 1600);

    const existing = cart.find(i => i.id === product.id || (i.productId && i.productId === product.id));
    let itemToSync: CartItem;
    let newCart: CartItem[];
    if (existing) {
      itemToSync = { ...existing, qty: existing.qty + 1 };
      newCart = cart.map(i => i.id === existing.id ? itemToSync : i);
    } else {
      itemToSync = {
        id: product.id,
        productId: product.id,
        name: product.name,
        qty: 1,
        priceMin: product.estMin,
        priceMax: product.estMax,
        image: product.image,
        sourceType: 'catalog',
        categoryName: product.categoryName,
      };
      newCart = [...cart, itemToSync];
    }

    setCart(newCart);
    persistCartLocally(newCart);

    if (isLoggedIn && user.email) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ item: itemToSync, userId: user.id, email: user.email }),
      }).catch(() => { });
    }

    showToast(`Added ${product.name} to sourcing basket`);
  };

  // Add Customized Catalog Product with button expression
  const handleAddCustomizedCatalogProduct = () => {
    if (!customizingProduct) return;
    setIsAddingBasket(true);
    const prod = customizingProduct;
    const newItem: CartItem = {
      id: `${prod.id}-${Date.now()}`,
      productId: prod.id,
      name: prod.name,
      qty: customizingQty,
      priceMin: prod.estMin,
      priceMax: prod.estMax,
      image: customizingImgs[0] || customizingImg.trim() || prod.image,
      images: customizingImgs.length > 0 ? customizingImgs : (prod.images || [prod.image]),
      notes: customizingNotes.trim() || undefined,
      sourceType: 'catalog',
      categoryName: prod.categoryName,
    };
    const newCart = [...cart, newItem];
    setCart(newCart);
    persistCartLocally(newCart);

    if (isLoggedIn && user.email) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ item: newItem, userId: user.id, email: user.email }),
      }).catch(() => { });
    }
    showToast(`Added ${prod.name} to basket`);
    setTimeout(() => {
      setIsAddingBasket(false);
      setCustomizingProduct(null);
      setCustomizingQty(1);
      setCustomizingNotes('');
      setCustomizingImg('');
      setCustomizingImgs([]);
      setActiveProductPhotoIdx(0);
    }, 450);
  };

  // Add Custom Item (Source 2: Customize Product / What's On Your Mind)
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      showToast('Please enter an item name');
      return;
    }
    setCustomAddedFeedback(true);
    setTimeout(() => setCustomAddedFeedback(false), 1600);

    const primaryImg = customImgs[0] || customImg.trim() || '/images/placeholders/placeholder-custom.svg';
    const allImgs = customImgs.length > 0 ? customImgs : [primaryImg];

    const minVal = parseInt(customMin, 10) || 0;
    const maxVal = parseInt(customMax, 10) || minVal || 3500;
    const qtyVal = Math.max(1, parseInt(customQty, 10) || 1);

    const newItem: CartItem = {
      id: 'custom-' + Date.now(),
      name: customTitle.trim(),
      qty: qtyVal,
      priceMin: minVal,
      priceMax: maxVal,
      image: primaryImg,
      images: allImgs,
      notes: customDesc.trim() || undefined,
      sourceType: 'mind',
    };
    const newCart = [...cart, newItem];
    setCart(newCart);
    persistCartLocally(newCart);

    if (isLoggedIn && user.email) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ item: newItem, userId: user.id, email: user.email }),
      }).catch(() => { });
    }
    showToast(`Added "${customTitle}" to sourcing basket`);
    setCustomTitle('');
    setCustomDesc('');
    setCustomImg('');
    setCustomImgs([]);
    setCustomMin('1500');
    setCustomMax('4500');
    setCustomQty('1');
  };

  // Add Online Platform Item (Source 3)
  const handleAddOnlineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onlineTitle.trim() && !onlineUrl.trim()) {
      showToast('Please provide an item name or website link');
      return;
    }
    setOnlineAddedFeedback(true);
    setTimeout(() => setOnlineAddedFeedback(false), 1600);

    const title = onlineTitle.trim() || `${onlinePlatform} Product`;
    const primaryImg = onlineImgs[0] || onlineImg.trim() || '/images/placeholders/placeholder-online.svg';
    const allImgs = onlineImgs.length > 0 ? onlineImgs : [primaryImg];
    const parsedPrice = parseInt(onlinePrice, 10) || 1500;

    const newItem: CartItem = {
      id: 'online-' + Date.now(),
      name: title,
      qty: 1,
      priceMin: parsedPrice,
      priceMax: parsedPrice ? Math.round(parsedPrice * 1.1) : 3500,
      image: primaryImg,
      images: allImgs,
      notes: `Store: ${onlinePlatform}. Link: ${onlineUrl.trim()}. ${onlineNotes.trim()}`,
      sourceType: 'online',
      sourceUrl: onlineUrl.trim(),
    };
    const newCart = [...cart, newItem];
    setCart(newCart);
    persistCartLocally(newCart);

    if (isLoggedIn && user.email) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ item: newItem, userId: user.id, email: user.email }),
      }).catch(() => { });
    }
    showToast(`Added online product to sourcing basket`);
    setOnlineUrl('');
    setOnlineTitle('');
    setOnlinePrice('2499');
    setOnlineImg('');
    setOnlineImgs([]);
    setOnlineNotes('');
  };

  // Edit Sourcing Item in Basket
  const handleStartEditCartItem = (item: CartItem) => {
    setEditingCartItem(item);
    setEditTitle(item.name);
    setEditMin(item.priceMin ? String(item.priceMin) : '');
    setEditMax(item.priceMax ? String(item.priceMax) : '');
    setEditQty(String(item.qty || 1));
    setEditNotes(item.notes || '');
    setEditImgs(item.images && item.images.length > 0 ? [...item.images] : (item.image ? [item.image] : []));
  };

  const handleSaveEditCartItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCartItem) return;
    const minVal = parseInt(editMin, 10) || 0;
    const maxVal = parseInt(editMax, 10) || minVal || 3500;
    const qtyVal = Math.max(1, parseInt(editQty, 10) || 1);
    const fallbackImg = editingCartItem.sourceType === 'online'
      ? '/images/placeholders/placeholder-online.svg'
      : editingCartItem.sourceType === 'mind'
        ? '/images/placeholders/placeholder-custom.svg'
        : '/images/placeholders/placeholder-item.svg';
    const primaryImg = editImgs[0] || resolveItemImage(editingCartItem.image, editingCartItem.sourceType) || fallbackImg;

    const updated = {
      name: editTitle.trim() || editingCartItem.name,
      priceMin: minVal,
      priceMax: maxVal,
      qty: qtyVal,
      notes: editNotes.trim() || undefined,
      image: primaryImg,
      images: editImgs.length > 0 ? editImgs : [primaryImg],
    };

    const updatedCart = cart.map(c => c.id === editingCartItem.id ? { ...c, ...updated } : c);
    setCart(updatedCart);
    persistCartLocally(updatedCart);
    if (isLoggedIn && user.email) {
      fetch(`/api/cart?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCartItem.id, ...updated, userId: user.id, email: user.email }),
      }).catch(() => { });
    }

    showToast(`Updated "${editTitle || editingCartItem.name}"`);
    setEditingCartItem(null);
  };

  // Confirm Slot Booking with Visasra Money & Razorpay payment
  const handleConfirmBooking = async () => {
    if (cart.length === 0) {
      showToast('You must add at least one item before booking a slot');
      setBookingStep(1);
      return;
    }

    const activeAddress = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];
    const contactPhone = customerPhone.trim() || activeAddress?.phone || user.phone;

    if (!contactPhone) {
      showToast('Please enter your WhatsApp / mobile number in Step 2');
      setBookingStep(2);
      return;
    }

    if (!activeAddress) {
      showToast('Please add and select your delivery destination in Step 2');
      setIsAddingAddress(true);
      setBookingStep(2);
      return;
    }

    setIsBooking(true);
    const currentSlotFee = slotDuration === 2 ? 250 : slotDuration === 5 ? 600 : 400;
    const merchandiseBudget = cart.reduce((sum, item) => sum + (item.priceMax || item.priceMin || 1000) * (item.qty || 1), 0);
    // Total deposit required = product budget held safely + slot fee for dedicated shopper
    const requiredDeposit = merchandiseBudget + currentSlotFee;
    const shortfall = Math.max(0, requiredDeposit - (user.walletBalance || 0));

    // Finalizes the order and deducts the slot fee after wallet has sufficient funds
    const finalizeOrder = async (confirmedBalance?: number) => {
      try {
        const slotKey = `${selectedDate}|${selectedSlotWindow}`;
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            slotKey,
            slotDate: selectedDate,
            slotWindow: selectedSlotWindow,
            slotLabel: `${selectedDate} · ${selectedSlotWindow}`,
            slotFee: currentSlotFee,
            items: cart,
            customerNotes: itemRequirement || deliveryNotes || '',
            shippingAddress: {
              name: activeAddress.name || user.name || 'Recipient',
              phone: contactPhone,
              line1: activeAddress.line1 || '',
              line2: activeAddress.line2 || '',
              city: activeAddress.city || '',
              region: activeAddress.region || '',
              zip: activeAddress.zip || '',
              country: activeAddress.country || 'India',
              label: activeAddress.label || 'Home',
              deliveryNotes: deliveryNotes || '',
              marketLocation: 'Direct Stores & Markets Across India',
              marketNotes: '',
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          const finalBal = data.newWalletBalance !== undefined
            ? data.newWalletBalance
            : ((confirmedBalance !== undefined ? confirmedBalance : user.walletBalance) - currentSlotFee);
          setUser(prev => ({ ...prev, walletBalance: finalBal }));
          try {
            localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, walletBalance: finalBal }));
            if (data.token) {
              localStorage.setItem('visasra_token', data.token);
            }
          } catch { }

          // 1. Instant optimistic reflection: prepend valid order into orders state
          const bookedCartItems = [...cart];
          const validOrder = (data.order && data.order.id && data.order.orderNumber) ? data.order : {
            id: `ord-${Date.now()}`,
            orderNumber: `VIS-${Math.floor(10000 + Math.random() * 90000)}`,
            slotKey,
            slotDate: selectedDate,
            slotWindow: selectedSlotWindow,
            slotLabel: `${selectedDate} · ${selectedSlotWindow}`,
            status: 'confirmed',
            trackingStage: 'slot_confirmed',
            totalAmount: merchandiseBudget,
            items: bookedCartItems.map((c, i) => ({
              id: `item-${Date.now()}-${i}`,
              name: c.name,
              qty: c.qty,
              estMin: c.priceMin,
              estMax: c.priceMax,
              image: c.image,
              status: 'waiting',
              options: [],
            })),
          };

          setOrders(prev => [validOrder, ...prev.filter(o => o && o.id !== validOrder.id)]);
          // Mark cached orders as up-to-date so subsequent tab switches are instantaneous
          lastOrdersFetchRef.current = Date.now();

          // 2. Clear booking wizard state & clear database cart (already cleared atomically on server)
          setCart([]);
          localStorage.removeItem('visasra_customer_cart_v1');
          setItemRequirement('');
          setDeliveryNotes('');
          setBookingStep(1);
          setShowTripDetailsModal(false);

          // 3. Open celebration modal "Order Placed Successfully! 🎉"
          setOrderPlacedSuccess(validOrder);
        } else {
          showToast(data.error || 'Booking failed');
        }
      } catch {
        showToast('Booking failed');
      } finally {
        setIsBooking(false);
      }
    };

    // If wallet has insufficient funds, prompt user to deposit the shortfall via Razorpay
    if (shortfall > 0) {
      try {
        await openRazorpayPayment({
          amount: shortfall,
          description: `Visasra Sourcing Deposit & Slot Booking (${selectedDate})`,
          prefill: {
            name: activeAddress?.name || user.name,
            email: user.email,
            contact: contactPhone,
          },
          onSuccess: async (paymentId: string, orderId?: string, signature?: string) => {
            showToast(`Payment successful! Depositing ₹${shortfall.toLocaleString('en-IN')} to Visasra Money...`);
            const topupRes = await fetch('/api/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                amount: shortfall,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpaySignature: signature,
                note: `Sourcing Deposit & Slot Booking (${selectedDate}) · Razorpay: ${paymentId}`,
              }),
            });
            const topupData = await topupRes.json();
            if (topupData.success) {
              const creditedBalance = typeof topupData.balance === 'number'
                ? topupData.balance
                : (user.walletBalance + shortfall);
              setUser(prev => ({ ...prev, walletBalance: creditedBalance }));
              await finalizeOrder(creditedBalance);
            } else {
              showToast(topupData.error || 'Failed to credit deposit to Visasra Money');
              setIsBooking(false);
            }
          },
          onDismiss: () => {
            showToast('Razorpay payment cancelled. No money was added to your wallet.');
            setIsBooking(false);
          },
          onError: () => {
            showToast('Razorpay payment failed. Please try again.');
            setIsBooking(false);
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to launch Razorpay payment';
        showToast(msg);
        setIsBooking(false);
      }
      return;
    }

    // User already has enough balance in Visasra Money — book directly
    await finalizeOrder();
  };

  // Add Money to Wallet via Razorpay
  const handleAddMoney = async (amt: number) => {
    try {
      await openRazorpayPayment({
        amount: amt,
        description: 'Visasra Money Wallet Top-up',
        prefill: {
          name: user.name,
          email: user.email,
          contact: customerPhone || user.phone,
        },
        onSuccess: async (paymentId: string, orderId?: string, signature?: string) => {
          // Instant optimistic feedback: reflect balance immediately
          const optimisticBal = user.walletBalance + amt;
          setUser(prev => ({ ...prev, walletBalance: optimisticBal }));
          showToast(`Payment received! Crediting ₹${amt.toLocaleString('en-IN')} to Visasra Money...`);

          try {
            const res = await fetch('/api/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                amount: amt,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpaySignature: signature,
                note: 'Wallet Top-up via Razorpay',
              }),
            });
            const data = await res.json();
            if (data.success) {
              const newBal = typeof data.balance === 'number' ? data.balance : optimisticBal;
              setUser(prev => ({ ...prev, walletBalance: newBal }));
              try {
                localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, walletBalance: newBal }));
              } catch { }
              showToast(`✓ ₹${amt.toLocaleString('en-IN')} added to Visasra Money!`);
            }
          } catch {
            showToast('Wallet balance will synchronize shortly');
          }
        },
        onDismiss: () => {
          showToast('Razorpay payment cancelled. No funds were added.');
        },
        onError: () => {
          showToast('Razorpay payment failed. Please try again.');
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch Razorpay';
      showToast(msg);
    }
  };

  // Branded splash screen (Image 4): displays for 3.5s on every page load while backend data reloads
  // Ensures 100% identical SSR & client initial render with zero login flicker
  if (!mounted || showInitialSplash) {
    return (
      <div
        id="initialSplash"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #071E3D 0%, #0A3A6B 100%)',
          color: '#fff',
        }}
      >
        <img
          src="/images/logo/visasra-logo.png"
          alt="Visasra"
          style={{
            width: 320,
            maxWidth: '82vw',
            height: 'auto',
            marginBottom: 20,
            filter: 'drop-shadow(0 6px 30px rgba(0,0,0,0.4))',
            imageRendering: '-webkit-optimize-contrast' as any,
          }}
        />
        <div style={{ fontFamily: "var(--font-bodoni, 'Bodoni Moda', serif)", fontSize: 36, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>Visasra</div>
        <div
          style={{
            fontSize: 13.5,
            color: '#BFDBFE',
            marginTop: 14,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: 0.95,
          }}
        >
          <span>You choose</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>We shop</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>We ship</span>
        </div>
      </div>
    );
  }

  // If Logged Out: Show Customer Authentication Screen
  if (!isLoggedIn) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} showToast={showToast} />
        {/* Toast Notification */}
        <div
          id="toast"
          className={`toast ${toastMsg ? 'show on' : ''} ${toastMsg && /error|failed|incorrect|invalid|not found|no account|warning|please sign in/i.test(toastMsg)
            ? 'toast-error'
            : toastMsg && /added|success|congratulations|welcome|approved|saved|updated/i.test(toastMsg)
              ? 'toast-success'
              : ''
            }`}
        >
          {toastMsg && /error|failed|incorrect|invalid|not found|no account|warning|please sign in/i.test(toastMsg) ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : toastMsg && /added|success|congratulations|welcome|approved|saved|updated/i.test(toastMsg) ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          <span>{toastMsg}</span>
        </div>
      </>
    );
  }

  // Logged In: Render Exact Original Sidenav + #app
  return (
    <>

      {/* Sidenav (Desktop) */}
      <nav className="sidenav" id="sidenav">
        <div className="sidenav-brand" onClick={() => navigateToTab('home')}>
          <img src="/images/logo/visasra-logo.png" alt="" className="sidenav-brand-logo" />
          <span className="brand-text">VISASRA</span>
        </div>

        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateToTab('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11L12 4l8 7" /><path d="M6 10v9h5v-5h2v5h5v-9" /></svg>
          Home
        </button>
        <button className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => navigateToTab('categories')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></svg>
          Categories
        </button>
        <button className={`nav-btn ${activeTab === 'bookslot' ? 'active' : ''}`} onClick={() => navigateToTab('bookslot')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Uploads
        </button>
        <button
          className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            navigateToTab('orders');
            loadData(user);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" /></svg>
          Orders
          {orders.length > 0 && <span className="nb-badge">{orders.length}</span>}
        </button>
        <button
          className={`nav-btn ${activeTab === 'live-shopping' ? 'active' : ''}`}
          onClick={() => {
            if (!liveSessionSlot && orders.length > 0) {
              setLiveSessionSlot(orders[0].slotKey);
            }
            navigateToTab('live-shopping');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
          Live Shopping
          <span className="nb-badge" style={{ background: '#22C55E', color: '#fff', fontSize: 10, padding: '2px 5px' }}>LIVE</span>
        </button>
        <button className={`nav-btn ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => navigateToTab('cart')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M6 8h12l-1 12H7L6 8z" /></svg>
          Cart
          {cart.length > 0 && <span className="nb-badge">{cart.length}</span>}
        </button>
        <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigateToTab('profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
          Profile
        </button>
      </nav>

      {/* Main #app Container */}
      <div id="app">
        {/* Decorative Flow Elements */}
        <div className="flow-decor" aria-hidden="true">
          <img className="fd-leaves" src="/images/decor/flow-leaves.png" alt="" />
          <img className="fd-fan" src="/images/decor/flow-fan.png" alt="" />
        </div>

        {/* Mobile Topbar */}
        <div className="topbar">
          <div className="wordmark" onClick={() => navigateToTab('home')}>
            <img src="/images/logo/visasra-logo.png" alt="" className="wordmark-logo" />
            <span className="brand-text">VISASRA</span>
          </div>
          <div className="top-actions">
            <button className="top-btn" onClick={() => navigateToTab('wallet')} aria-label="Wallet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" /></svg>
              Wallet
            </button>
            <button className="top-btn" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              Search
            </button>
            <button className="top-btn" onClick={() => navigateToTab('cart')} aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M6 8h12l-1 12H7L6 8z" /></svg>
              {cart.length > 0 && <span className="nb-badge">{cart.length}</span>}
              Cart
            </button>
          </div>
        </div>

        {/* Mobile Search Drawer */}
        <div className={`mobile-search ${mobileSearchOpen ? 'open' : ''}`} id="mobileSearch">
          {renderSearchBar(true)}
        </div>

        {/* Screens View Container */}
        <div className={`screens ${activeTab === 'categories' && !selectedCategoryForView ? 'screens-cat-root' : ''}`}>
          {/* ================= SCREEN 1: HOME ================= */}
          {activeTab === 'home' && (
            <HomeTab
              user={user}
              cart={cart}
              orders={orders}
              categories={categories}
              popularProducts={popularProducts}
              addedFeedbackId={addedFeedbackId}
              onNavigate={(tab) => {
                navigateToTab(tab);
                if (tab === 'orders') loadData(user);
              }}
              onSelectCategory={(cat) => handleSelectCategory(cat)}
              onAddToCart={addToCart}
              onLiveSession={(slotKey) => {
                setLiveSessionSlot(slotKey);
                navigateToTab('live-shopping');
              }}
              onTrackOrder={handleTrackOrder}
              renderSearchBar={renderSearchBar}
            />
          )}

          {/* ================= SCREEN 2: CATEGORIES & CATALOG (3-TIER: CATEGORIES -> SUBCATEGORIES/PRODUCTS -> TYPES) ================= */}
          {activeTab === 'categories' && (
            <section
              className={`screen active ${!selectedCategoryForView ? 'screen-categories-root' : ''}`}
              data-screen="categories"
            >
              {/* Tier 1: All Categories Grid (Persistent DOM for zero image reload/flicker) */}
              <div className={`cat-tier1-wrap ${selectedCategoryForView ? 'is-hidden' : ''}`}>
                <img className="corner-leaf" src="/images/decor/visasra-corner-flourish.png?v=1" alt="" aria-hidden="true" />
                <div className="cat-tier1-inner">
                  <button type="button" className="back-row" onClick={handleGoBack} aria-label="Back">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    <span>Back</span>
                  </button>
                  <div className="desk-header">
                    {renderSearchBar(false)}
                  </div>
                  <div className="page-title">Categories</div>
                  <div className="page-sub">Browse authentic Indian categories, explore subcategories &amp; varieties, or tell us what you need.</div>

                  <div className="cat-page-grid" id="catPageGrid">
                    {categories.map(c => (
                      <div
                        key={c.id}
                        className="cat-tile"
                        onClick={() => {
                          handleSelectCategory(c);
                        }}
                      >
                        <img
                          src={c.image || '/images/placeholders/placeholder-category.svg'}
                          alt={c.name}
                          className="cat-tile-bg-img"
                          loading="eager"
                          decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('placeholder-category.svg')) {
                              target.src = '/images/placeholders/placeholder-category.svg';
                            }
                          }}
                        />
                        <div className="cat-tile-count">
                          {(c.products || []).length} products
                        </div>
                        <div className="cat-tile-body">
                          <div className="name">{c.name}</div>
                          <div className="desc" style={{ display: 'block' }}>
                            Browse {(c.products || []).length} items &amp; varieties →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cat-leaves-decor" aria-hidden="true">
                  <img src="/images/decor/category-leaves.png" alt="" />
                </div>
              </div>

              {selectedCategoryForView && selectedProductForTypes && (
                /* Tier 3: Sub-Category / Product Varieties Detail (e.g. Cookware > Pans > Frying Pan, Appam Pan, etc.) */
                <div>
                  <button
                    type="button"
                    className="back-row"
                    onClick={handleGoBack}
                    aria-label={`Back to ${selectedCategoryForView.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    <span>Back to {selectedCategoryForView.name}</span>
                  </button>

                  <div
                    className="cat-detail-hero"
                    style={{ backgroundImage: `url('${getProductImg(selectedCategoryForView.slug, selectedProductForTypes.name)}')` }}
                  >
                    <div className="cat-detail-hero-content">
                      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: '#BAE6FD', marginBottom: 4 }}>
                        {selectedCategoryForView.name} · Sub-category
                      </div>
                      <h2>{selectedProductForTypes.name}</h2>
                      <p>Select any specific variety or style below for your dedicated in-store personal shopper.</p>
                    </div>
                  </div>

                  <div className="cd-body">
                    {/* Search inside this product's varieties */}
                    <div className="cd-search">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      <input
                        type="text"
                        placeholder={`Search ${selectedProductForTypes.name.toLowerCase()} types (e.g. Cast Iron, Non-Stick, Mini...)`}
                        value={typeSearchQuery}
                        onChange={e => setTypeSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="section-title row">
                      <span>Available Types &amp; Varieties</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        {(selectedProductForTypes.types || []).filter(t => t.name.toLowerCase().includes(typeSearchQuery.toLowerCase())).length} varieties available
                      </span>
                    </div>

                    <div className="cd-product-list">
                      {(selectedProductForTypes.types || [])
                        .filter(t => t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                        .map(t => {
                          const mid = t.mid || selectedProductForTypes.estMin;
                          const high = t.high || selectedProductForTypes.estMax;
                          const typeImg = getTypeImg(selectedCategoryForView.slug, selectedProductForTypes.name, t.name);

                          return (
                            <div
                              key={t.name}
                              className="cd-prod-card"
                              tabIndex={0}
                              role="button"
                              onClick={() => handleSelectProductVariety(t, typeImg, mid, high)}
                            >
                              <div className="cd-prod-photo">
                                <img
                                  src={typeImg}
                                  alt={t.name}
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('placeholder-item.svg')) {
                                      target.src = '/images/placeholders/placeholder-item.svg';
                                    }
                                  }}
                                />
                              </div>
                              <div className="cd-prod-name">{t.name}</div>
                              <div className="cd-prod-range">₹{mid.toLocaleString('en-IN')} – ₹{high.toLocaleString('en-IN')}</div>
                              <button
                                type="button"
                                className="cat-add-btn"
                                style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="9" cy="21" r="1" />
                                  <circle cx="20" cy="21" r="1" />
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Sourcing Prompt */}
                    <div
                      style={{
                        background: '#FFF9E6',
                        border: '1.5px dashed #F5C64C',
                        borderRadius: 16,
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginTop: 24,
                        marginBottom: 30,
                      }}
                      onClick={() => {
                        setCustomTitle(`Custom ${selectedProductForTypes.name}`);
                        navigateToTab('bookslot');
                        setSourcingSourceTab('mind');
                      }}
                    >
                      <div>
                        <b style={{ color: '#7A5300', fontSize: 14 }}>Need a unique size or custom variant of {selectedProductForTypes.name}?</b>
                        <div style={{ color: '#996C00', fontSize: 12, marginTop: 2 }}>Provide specific merchant instructions, photo references, or measurements.</div>
                      </div>
                      <button className="btn btn-sm btn-primary" style={{ flexShrink: 0, padding: '8px 14px' }}>
                        Request Custom →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedCategoryForView && !selectedProductForTypes && (
                /* Tier 2: Category Products / Sub-Categories Drill-Down */
                <div>
                  <button
                    type="button"
                    className="back-row"
                    onClick={handleGoBack}
                    aria-label="Back to all categories"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    <span>All Categories</span>
                  </button>

                  <div
                    className="cat-detail-hero"
                    style={{ backgroundImage: `url('${selectedCategoryForView.image}')` }}
                  >
                    <div className="cat-detail-hero-content">
                      <h2>{selectedCategoryForView.name}</h2>
                      <p>Browse authentic subcategories and store floor items verified with official bills.</p>
                      <div className="cd-hero-count">
                        {(selectedCategoryForView.products || []).length} products in this category
                      </div>
                    </div>
                  </div>

                  <div className="cd-body">
                    {/* Search inside this category */}
                    <div className="cd-search">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      <input
                        type="text"
                        placeholder={`Search within ${selectedCategoryForView.name}...`}
                        value={catSearchQuery}
                        onChange={e => setCatSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="section-title row">
                      <span>Available Sub-categories &amp; Items</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        {(selectedCategoryForView.products || []).filter(p => p.name.toLowerCase().includes(catSearchQuery.toLowerCase())).length} items
                      </span>
                    </div>

                    <div className="cat-product-grid">
                      {(selectedCategoryForView.products || [])
                        .filter(p => p.name.toLowerCase().includes(catSearchQuery.toLowerCase()))
                        .map(p => {
                          const hasTypes = p.types && p.types.length > 0;
                          const prodImg = p.image || getProductImg(selectedCategoryForView.slug, p.name);
                          const cardPhotos = (p.images && p.images.length > 0)
                            ? p.images.slice(0, 4)
                            : (hasTypes && p.types)
                              ? [prodImg, ...p.types.slice(0, 3).map(t => getTypeImg(selectedCategoryForView.slug, p.name, t.name))].slice(0, 4)
                              : [prodImg];

                          return (
                            <div key={p.id} className="cat-prod-card">
                              <div
                                className="cat-prod-img-wrap"
                                onClick={() => {
                                  if (hasTypes) {
                                    handleSelectProductForTypes(p);
                                  } else {
                                    setCustomizingProduct({
                                      ...p,
                                      image: p.image || prodImg,
                                      images: cardPhotos,
                                      categoryName: selectedCategoryForView.name,
                                    });
                                    setCustomizingQty(1);
                                    setCustomizingNotes('');
                                    setCustomizingImg(p.image || prodImg);
                                    setCustomizingImgs([]);
                                    setActiveProductPhotoIdx(0);
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <img
                                  src={prodImg}
                                  alt={p.name}
                                  className="cat-prod-img"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('placeholder-item.svg')) {
                                      target.src = '/images/placeholders/placeholder-item.svg';
                                    }
                                  }}
                                />
                                {hasTypes ? (
                                  <span className="cat-prod-tag" style={{ background: '#0A3A6B', color: '#fff' }}>
                                    {p.types?.length} Varieties
                                  </span>
                                ) : (p.tag && !p.tag.toLowerCase().includes('artisan')) ? (
                                  <span className="cat-prod-tag">{p.tag}</span>
                                ) : null}
                              </div>

                              <div className="cat-prod-body">
                                <div className="cat-prod-name">{p.name}</div>
                                <div className="est-budget-badge">
                                  <div className="est-budget-val">Est. Budget: ₹{p.estMin.toLocaleString('en-IN')} – ₹{p.estMax.toLocaleString('en-IN')}</div>
                                  <span className="est-budget-sub">
                                    {hasTypes ? `${p.types?.length} distinct sub-types available` : 'Official GST store bill included'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="cat-add-btn"
                                  style={hasTypes ? { background: '#0A3A6B', color: '#fff', borderColor: '#08264A' } : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  onClick={() => {
                                    if (hasTypes) {
                                      handleSelectProductForTypes(p);
                                    } else {
                                      setCustomizingProduct({
                                        ...p,
                                        image: prodImg,
                                        images: cardPhotos,
                                        categoryName: selectedCategoryForView.name,
                                      });
                                      setCustomizingQty(1);
                                      setCustomizingNotes('');
                                      setCustomizingImg(prodImg);
                                      setCustomizingImgs([]);
                                      setActiveProductPhotoIdx(0);
                                    }
                                  }}
                                >
                                  {hasTypes ? (
                                    <>
                                      Explore {p.types?.length} Varieties →
                                    </>
                                  ) : (
                                    <>
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                      </svg>
                                      <span>Add to Cart</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Sourcing Prompt */}
                    <div
                      style={{
                        background: '#FFF9E6',
                        border: '1.5px dashed #F5C64C',
                        borderRadius: 16,
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginTop: 24,
                        marginBottom: 30,
                      }}
                      onClick={() => {
                        setCustomTitle(`Custom item from ${selectedCategoryForView.name}`);
                        navigateToTab('bookslot');
                        setSourcingSourceTab('mind');
                      }}
                    >
                      <div>
                        <b style={{ color: '#7A5300', fontSize: 14 }}>Looking for something specific in {selectedCategoryForView.name}?</b>
                        <div style={{ color: '#996C00', fontSize: 12, marginTop: 2 }}>Describe any custom design or upload reference photos for your personal shopper.</div>
                      </div>
                      <button className="btn btn-sm btn-primary" style={{ flexShrink: 0, padding: '8px 14px' }}>
                        Request Custom Item →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= SCREEN 3: REDESIGNED BOOKING FLOW ================= */}
          {activeTab === 'bookslot' && (
            <section className="screen active" data-screen="bookslot">
              <button type="button" className="back-row" onClick={handleGoBack} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                <span>Back</span>
              </button>

              <h1 className="bookslot-title" style={{ marginTop: 12, marginBottom: 16 }}>
                {bookingStep === 1 ? 'What should your shopper buy?' : bookingStep === 2 ? 'Where should we courier your purchases?' : 'Select your shopping slot'}
              </h1>

              {/* Minimal Connected Stepper (1) --- (2) --- (3) matching official mockup */}
              <div className="bookslot-stepper-minimal">
                <button
                  type="button"
                  onClick={() => setBookingStep(1)}
                  className={`bookslot-step-num ${bookingStep >= 1 ? 'active' : ''}`}
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  1
                </button>
                <div className="bookslot-step-line" style={{ background: bookingStep > 1 ? '#0B4F9C' : '#CBD5E1' }} />
                <button
                  type="button"
                  onClick={() => cart.length > 0 && setBookingStep(2)}
                  disabled={cart.length === 0}
                  className={`bookslot-step-num ${bookingStep >= 2 ? 'active' : ''}`}
                  style={{ border: 'none', cursor: cart.length > 0 ? 'pointer' : 'not-allowed' }}
                >
                  2
                </button>
                <div className="bookslot-step-line" style={{ background: bookingStep > 2 ? '#0B4F9C' : '#CBD5E1' }} />
                <button
                  type="button"
                  onClick={() => cart.length > 0 && setBookingStep(3)}
                  disabled={cart.length === 0}
                  className={`bookslot-step-num ${bookingStep >= 3 ? 'active' : ''}`}
                  style={{ border: 'none', cursor: cart.length > 0 ? 'pointer' : 'not-allowed' }}
                >
                  3
                </button>
              </div>

              <div className="booking-wizard">

                {/* ================= STEP 1: SOURCING BASKET (MANDATORY ITEMS) ================= */}
                {bookingStep === 1 && (
                  <div className="bookslot-step1-wrap" style={{ paddingBottom: 160 }}>
                    {/* Three Source Pill Buttons: Catalog, Store link, Photo */}
                    <div className="bookslot-sources-row">
                      <button
                        type="button"
                        className={`bookslot-source-btn ${sourcingSourceTab === 'catalog' ? 'active' : ''}`}
                        onClick={() => setSourcingSourceTab('catalog')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                        <span>Catalog</span>
                      </button>
                      <button
                        type="button"
                        className={`bookslot-source-btn ${sourcingSourceTab === 'online' ? 'active' : ''}`}
                        onClick={() => setSourcingSourceTab('online')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        <span>Store link</span>
                      </button>
                      <button
                        type="button"
                        className={`bookslot-source-btn ${sourcingSourceTab === 'mind' ? 'active' : ''}`}
                        onClick={() => setSourcingSourceTab('mind')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        <span>Photo</span>
                      </button>
                    </div>

                    {/* Source Tab 1: Catalog -> Complete Catalog Browser */}
                    {sourcingSourceTab === 'catalog' && (
                      <div>
                        {/* Luxury Category Filter Bar */}
                        <div className="bookslot-cat-nav-wrap">
                          <div className="bookslot-cat-header-row">
                            <div className="bookslot-cat-title-group">
                              <span className="bookslot-cat-title">Browse Categories &amp; Products</span>
                              <span className="bookslot-cat-badge">
                                {catalogFilterSlug === 'all'
                                  ? `${categories.length} Categories Available`
                                  : categories.find(c => c.slug === catalogFilterSlug)?.name || 'Filtered'}
                              </span>
                            </div>
                            <div className="bookslot-cat-actions">
                              <button
                                type="button"
                                className="bookslot-cat-view-all-btn"
                                onClick={() => setCatPillsWrapped(prev => !prev)}
                                title={catPillsWrapped ? 'Show single scrollable row' : 'Show all categories'}
                              >
                                {catPillsWrapped ? 'Single Row ◂' : `View All (${categories.length}) ▾`}
                              </button>
                              {!catPillsWrapped && (
                                <div className="bookslot-cat-arrows">
                                  <button
                                    type="button"
                                    className="bookslot-cat-arrow-btn"
                                    onClick={() => catScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                                    aria-label="Scroll left"
                                    title="Scroll left"
                                  >
                                    ‹
                                  </button>
                                  <button
                                    type="button"
                                    className="bookslot-cat-arrow-btn"
                                    onClick={() => catScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                                    aria-label="Scroll right"
                                    title="Scroll right"
                                  >
                                    ›
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            ref={catScrollRef}
                            className={`bookslot-cat-scroll ${catPillsWrapped ? 'wrapped' : ''}`}
                          >
                            <button
                              type="button"
                              className={`bookslot-cat-pill ${catalogFilterSlug === 'all' ? 'active' : ''}`}
                              onClick={() => setCatalogFilterSlug('all')}
                            >
                              <span className="bookslot-cat-pill-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                              </span>
                              <span>All Categories</span>
                            </button>
                            {categories.map(c => {
                              const isSelected = catalogFilterSlug === c.slug;
                              const prodCount = (c.products || []).length;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  className={`bookslot-cat-pill ${isSelected ? 'active' : ''}`}
                                  onClick={() => setCatalogFilterSlug(c.slug)}
                                >
                                  {c.image && (
                                    <img
                                      src={c.image}
                                      alt=""
                                      className="bookslot-cat-pill-thumb"
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  )}
                                  <span>{c.name}</span>
                                  {prodCount > 0 && (
                                    <span className="bookslot-cat-pill-count">
                                      {prodCount}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Full Products & Subproducts Grid */}
                        <div className="bookslot-catalog-grid">
                          {(catalogFilterSlug === 'all'
                            ? categories.flatMap(c => (c.products || []).map(p => ({ ...p, catSlug: c.slug, catName: c.name }))).slice(0, 16)
                            : (categories.find(c => c.slug === catalogFilterSlug)?.products || []).map(p => ({
                                ...p,
                                catSlug: catalogFilterSlug,
                                catName: categories.find(c => c.slug === catalogFilterSlug)?.name || '',
                              }))
                          ).map((p, pIdx) => {
                            const pKey = String(p.id || `${p.catSlug}-${productSlug(p.name)}`);
                            const pImg = p.image || getProductImg(p.catSlug, p.name);
                            return (
                              <div key={`${p.catSlug}-${p.name}-${pIdx}`} className="bookslot-pick-card">
                                <div className="bookslot-pick-img-box">
                                  <img
                                    src={pImg}
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg'; }}
                                  />
                                </div>
                                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0B4F9C', textTransform: 'uppercase', marginBottom: 2 }}>
                                  {p.catName}
                                </div>
                                <div className="bookslot-pick-name" title={p.name}>{p.name}</div>
                                <div className="bookslot-pick-price">
                                  Est. ₹{(p.estMin || 1000).toLocaleString('en-IN')} – ₹{(p.estMax || 3000).toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minHeight: 18 }}>
                                  {p.types && p.types.length > 0
                                    ? `${p.types.length} varieties: ${p.types.map((t: any) => t.name).slice(0, 2).join(', ')}...`
                                    : ''}
                                </div>
                                <button
                                  type="button"
                                  className="bookslot-pick-add-btn"
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  onClick={() => {
                                    const itemToAdd: CartItem = {
                                      id: pKey,
                                      productId: pKey,
                                      name: p.name,
                                      qty: 1,
                                      priceMin: p.estMin || 1000,
                                      priceMax: p.estMax || 3000,
                                      image: pImg,
                                      categoryName: p.catName,
                                      sourceType: 'catalog',
                                    };
                                    addToCart({
                                      id: pKey,
                                      name: p.name,
                                      price: p.estMin || 1000,
                                      estMin: p.estMin || 1000,
                                      estMax: p.estMax || 3000,
                                      image: pImg,
                                      categoryName: p.catName,
                                    });
                                    // Automatically open instructions & reference photo modal
                                    handleStartEditCartItem(itemToAdd);
                                  }}
                                >
                                  {addedFeedbackId === pKey ? (
                                    <>✓ Added to Cart</>
                                  ) : (
                                    <>
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                      </svg>
                                      <span>Add to Cart</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Source Tab 2: Customize Product (What's On Your Mind) */}
                    {sourcingSourceTab === 'mind' && (
                      <form onSubmit={handleAddCustomItem} style={{ background: '#FAF5FF', border: '1.5px solid #E9D8FD', borderRadius: 16, padding: 18 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#6B21A8', marginBottom: 3 }}>
                          What&apos;s On Your Mind? Customize Any Product:
                        </div>
                        <div style={{ fontSize: 12, color: '#7E22CE', marginBottom: 14 }}>
                          Tell us what&apos;s on your mind. You can customize any product, specify design requirements, and upload up to 4 reference pictures.
                        </div>

                        <label style={{ display: 'block', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Item Name / Title *</span>
                          <input
                            type="text"
                            className="inp"
                            placeholder="What's on your mind? e.g. Traditional Matte Finish Kemp Temple Jewellery Set"
                            value={customTitle}
                            onChange={e => setCustomTitle(e.target.value)}
                            required
                          />
                        </label>

                        <label style={{ display: 'block', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Detailed Specifications / Design Preference</span>
                          <textarea
                            className="inp"
                            rows={5}
                            style={{ minHeight: 120, resize: 'vertical', lineHeight: 1.5, padding: '10px 14px' }}
                            placeholder="e.g. Peacock motif, ruby red stones, antique matte gold finish, approx 22-inch necklace with matching jhumkas"
                            value={customDesc}
                            onChange={e => setCustomDesc(e.target.value)}
                          />
                        </label>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <label>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>Min Budget (₹)</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="inp"
                              placeholder="0"
                              value={customMin}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCustomMin(val.replace(/^0+(?=\d)/, ''));
                              }}
                            />
                          </label>
                          <label>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>Max Budget (₹)</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="inp"
                              placeholder="0"
                              value={customMax}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCustomMax(val.replace(/^0+(?=\d)/, ''));
                              }}
                            />
                          </label>
                          <label>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>Quantity</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="inp"
                              placeholder="1"
                              value={customQty}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCustomQty(val.replace(/^0+(?=\d)/, ''));
                              }}
                            />
                          </label>
                        </div>

                        {renderMultiImageUploadBox(
                          customImgs,
                          setCustomImgs,
                          'Upload Reference Photos / Sketches (Up to 4 Pics)',
                          'Add up to 4 photos to help your personal shopper find the exact product'
                        )}

                        <button
                          type="submit"
                          className="btn-concierge-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            ...(customAddedFeedback ? { background: '#10B981', borderColor: '#059669', color: '#fff', transform: 'scale(1.02)' } : {})
                          }}
                        >
                          {customAddedFeedback ? '✓ Added to Sourcing Basket!' : '+ Add Customized Product to Sourcing Basket'}
                        </button>
                      </form>
                    )}

                    {/* Source Tab 3: From Online Platform */}
                    {sourcingSourceTab === 'online' && (
                      <form onSubmit={handleAddOnlineItem} style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16, padding: 18 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#92400E', marginBottom: 12 }}>
                          Order From Any Online Indian Platform:
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
                          <label>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Platform</span>
                            <select
                              className="inp"
                              value={onlinePlatform}
                              onChange={e => setOnlinePlatform(e.target.value)}
                            >
                              <option>Amazon.in</option>
                              <option>Flipkart</option>
                              <option>Myntra</option>
                              <option>Nykaa</option>
                              <option>Ajio</option>
                              <option>GRT Jewellers</option>
                              <option>Tanishq</option>
                              <option>Nalli Silks</option>
                              <option>Other Online Store</option>
                            </select>
                          </label>
                          <label>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Product Web Link / URL *</span>
                            <input
                              type="url"
                              className="inp"
                              placeholder="https://www.amazon.in/dp/..."
                              value={onlineUrl}
                              onChange={e => setOnlineUrl(e.target.value)}
                              required
                            />
                          </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                          <label>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Product Title / Description</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="e.g. Copper Water Dispenser 5L"
                              value={onlineTitle}
                              onChange={e => setOnlineTitle(e.target.value)}
                            />
                          </label>
                          <label>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Listed Price (₹)</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              className="inp"
                              placeholder="0"
                              value={onlinePrice}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setOnlinePrice(val.replace(/^0+(?=\d)/, ''));
                              }}
                            />
                          </label>
                        </div>

                        {renderMultiImageUploadBox(
                          onlineImgs,
                          setOnlineImgs,
                          'Product Photos / Screenshots (Up to 4 Pics)',
                          'Upload up to 4 screenshots or photos of this online product from your device'
                        )}

                        <label style={{ display: 'block', marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Special Instructions (Size, Variant, Color)</span>
                          <input
                            type="text"
                            className="inp"
                            placeholder="e.g. Size L, Maroon color, or delivery speed preference"
                            value={onlineNotes}
                            onChange={e => setOnlineNotes(e.target.value)}
                          />
                        </label>

                        <button
                          type="submit"
                          className="btn-concierge-primary"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            ...(onlineAddedFeedback ? { background: '#10B981', borderColor: '#059669', color: '#fff', transform: 'scale(1.02)' } : {})
                          }}
                        >
                          {onlineAddedFeedback ? '✓ Added to Sourcing Basket!' : '+ Add Online Store Item to Basket'}
                        </button>
                      </form>
                    )}

                    {/* Basket Status: Empty Bag Card vs Items List (Positioned Below Uploads / Catalog Input) */}
                    <div style={{ marginTop: 28, marginBottom: 20 }}>
                      {cart.length === 0 ? (
                        <div className="bookslot-empty-card">
                          <div className="bookslot-empty-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                          </div>
                          <div>
                            <div className="bookslot-empty-title">Your basket is currently empty</div>
                            <div className="bookslot-empty-sub">Select products from the catalog above, customize an item, or paste a store link.</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #CBD5E1', padding: 18, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)' }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#071D3A', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B4F9C" strokeWidth="2.2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                              </svg>
                              Your Sourcing Basket ({cart.length} item{cart.length > 1 ? 's' : ''})
                            </span>
                            <span style={{ color: '#0B4F9C', fontWeight: 800, fontSize: 13.5 }}>
                              Est. ₹{cart.reduce((s, i) => s + (i.priceMin || 0) * i.qty, 0).toLocaleString('en-IN')}+
                            </span>
                          </div>
                          {cart.map(item => (
                            <div key={item.id} className="basket-item-row" style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                <img
                                  src={resolveItemImage(item.image, item.sourceType)}
                                  alt=""
                                  className="basket-item-thumb"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                                  }}
                                />
                              </div>
                              <div className="basket-item-info">
                                <span className={`basket-source-tag ${item.sourceType === 'online' ? 'tag-online' : item.sourceType === 'mind' ? 'tag-mind' : 'tag-catalog'}`}>
                                  {item.sourceType === 'online' ? 'Online Store' : item.sourceType === 'mind' ? 'Customized Product' : 'Catalog'}
                                </span>
                                <div className="basket-item-title">{item.name}</div>
                                <div className="basket-item-meta">
                                  Est. ₹{item.priceMin.toLocaleString('en-IN')} – ₹{item.priceMax.toLocaleString('en-IN')} · Qty: {item.qty}
                                </div>
                              </div>
                              <div className="basket-actions-col">
                                <button
                                  type="button"
                                  className="basket-edit-btn"
                                  onClick={() => handleStartEditCartItem(item)}
                                  title="Edit item details"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="basket-del-btn"
                                  onClick={() => handleRemoveCartItem(item.id)}
                                  title="Remove item"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* High-Contrast Floating Sticky Footer */}
                    <div className="bookslot-sticky-footer">
                      <div className="bookslot-sticky-hint">
                        {cart.length === 0 ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Add at least 1 item to proceed
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              background: '#2563EB',
                              color: '#fff',
                              fontSize: 11.5,
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: 999
                            }}>
                              {cart.length} ITEM{cart.length > 1 ? 'S' : ''}
                            </span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                                Est. ₹{cart.reduce((s, i) => s + (i.priceMin || 0) * i.qty, 0).toLocaleString('en-IN')}+
                              </div>
                              <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                                Next: Delivery &amp; Contact Details
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`bookslot-continue-btn ${cart.length > 0 ? 'active' : 'disabled'}`}
                        disabled={cart.length === 0}
                        onClick={() => {
                          if (cart.length === 0) {
                            showToast('Please add at least one item first');
                            return;
                          }
                          if (savedAddresses.length === 0) {
                            setIsAddingAddress(true);
                          }
                          setBookingStep(2);
                        }}
                      >
                        <span>Continue</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: DELIVERY DETAILS & CONTACT ================= */}
                {bookingStep === 2 && (
                  <div className="luxury-step-card">
                    <div className="luxury-step-header">
                      <div className="luxury-step-title">
                        <span>2. Delivery &amp; Contact Details</span>
                      </div>
                      <div className="luxury-step-subtitle">
                        Where should we courier your purchases? Enter your contact mobile and destination address.
                      </div>
                    </div>

                    {/* Contact Mobile */}
                    <div style={{ marginBottom: 20, background: '#F8FAFD', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#081E3B', marginBottom: 6 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                        <span>WhatsApp &amp; Mobile Notification Number *</span>
                      </label>
                      <input
                        type="tel"
                        className="inp"
                        placeholder="e.g. +91 98765 43210 or +1 415 555 0199"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                      />
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.45 }}>
                        Real-time shopping updates, store photo approvals, and dispatch alerts are sent to this number.
                      </div>
                    </div>

                    {/* Address Selection */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#081E3B', marginBottom: 10 }}>
                      International Shipping Destination:
                    </div>

                    {savedAddresses.length === 0 && !isAddingAddress && (
                      <div style={{ background: '#F8FAFD', border: '1.5px dashed #CBD5E1', borderRadius: 14, padding: '20px 16px', textAlign: 'center', marginBottom: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'grid', placeItems: 'center', margin: '0 auto 8px' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>No delivery address added yet</div>
                        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 14 }}>
                          Please add your delivery address so your personal shopper knows where to courier your purchases.
                        </div>
                        <button
                          type="button"
                          className="btn-concierge-primary"
                          onClick={() => setIsAddingAddress(true)}
                          style={{ margin: '0 auto', maxWidth: 260 }}
                        >
                          + Add Delivery Address
                        </button>
                      </div>
                    )}

                    {savedAddresses.length > 0 && (
                      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                        {savedAddresses.map(addr => (
                          <div
                            key={addr.id}
                            className={`addr-card selectable ${selectedAddressId === addr.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAddressId(addr.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="addr-radio" />
                            <div className="addr-body">
                              <div className="addr-name">
                                {addr.name} <span className="addr-tag">{addr.label}</span>
                              </div>
                              <div className="addr-lines">
                                {[addr.line1, addr.line2, addr.city, addr.region, addr.zip, addr.country].filter(Boolean).join(', ')}
                              </div>
                              <div className="addr-phone">{addr.phone}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {savedAddresses.length > 0 && !isAddingAddress && (
                      <button
                        type="button"
                        className="dl-add"
                        onClick={() => setIsAddingAddress(true)}
                        style={{ width: '100%', marginBottom: 16 }}
                      >
                        + Add another international address
                      </button>
                    )}

                    {isAddingAddress && (
                      <div className="af" style={{ background: '#F8FAFD', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                        <div className="af-head">
                          <div className="af-title">New Delivery Address</div>
                          {savedAddresses.length > 0 && (
                            <button type="button" className="af-del" onClick={() => setIsAddingAddress(false)}>Close</button>
                          )}
                        </div>
                        <div className="af-sec">Contact Details</div>
                        <div className="af-grid">
                          <label className="af-f">
                            <span>Full name</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="Recipient Name"
                              value={addressForm.name}
                              onChange={e => setAddressForm({ ...addressForm, name: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>Phone</span>
                            <input
                              type="tel"
                              className="inp"
                              placeholder="Recipient Phone (e.g. +91 98765 43210)"
                              value={addressForm.phone}
                              onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                            />
                          </label>
                        </div>
                        <div className="af-sec" style={{ marginTop: 12 }}>Street &amp; Location</div>
                        <div className="af-grid">
                          <label className="af-f af-full">
                            <span>Street address</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="Flat / House no, Street, Area"
                              value={addressForm.line1}
                              onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>City</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="City"
                              value={addressForm.city}
                              onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>State / Region</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="State / Province"
                              value={addressForm.region}
                              onChange={e => setAddressForm({ ...addressForm, region: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>Postal / Zip</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="Postal / Zip code"
                              value={addressForm.zip}
                              onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>Country</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="e.g. United States, India, UK, UAE"
                              value={addressForm.country}
                              onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          {savedAddresses.length > 0 && (
                            <button type="button" className="btn btn-secondary" onClick={() => setIsAddingAddress(false)} style={{ flex: 1 }}>Cancel</button>
                          )}
                          <button type="button" className="btn btn-primary" onClick={() => handleSaveNewAddress()} style={{ flex: 2 }}>Save Address</button>
                        </div>
                      </div>
                    )}

                    <div className="wizard-actions">
                      <button
                        type="button"
                        className="btn-concierge-secondary"
                        onClick={() => setBookingStep(1)}
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        className="btn-concierge-primary"
                        onClick={() => {
                          const userPhoneTrimmed = user.phone ? user.phone.trim() : '';
                          const trimmedPhone = customerPhone.trim() || userPhoneTrimmed;
                          if (!trimmedPhone) {
                            showToast('Please enter your WhatsApp / mobile number for shopping updates');
                            return;
                          }
                          if (!customerPhone.trim() && userPhoneTrimmed) {
                            setCustomerPhone(userPhoneTrimmed);
                          }
                          const hasSelected = selectedAddressId && savedAddresses.some(a => a.id === selectedAddressId);
                          if (!hasSelected) {
                            if (savedAddresses.length > 0) {
                              setSelectedAddressId(savedAddresses[0].id);
                              setBookingStep(3);
                              return;
                            }
                            setIsAddingAddress(true);
                            showToast('Please add and save your delivery address to continue');
                            return;
                          }
                          setBookingStep(3);
                        }}
                      >
                        <span>Continue to Slot &amp; Timing</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="9 18 15 12 9 6" /></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: SLOT & TIMING (AT THE END) ================= */}
                {bookingStep === 3 && (
                  <div className="luxury-step-card">
                    <div className="luxury-step-header">
                      <div className="luxury-step-title">
                        <span>3. Shopping Window &amp; Slot</span>
                      </div>
                      <div className="luxury-step-subtitle">
                        Select your shopping duration and convenient time window. A dedicated ground shopper is assigned to you.
                      </div>
                    </div>

                    {/* Duration Selection */}
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#081E3B', marginBottom: 10 }}>
                      Shopping Window Duration:
                    </div>
                    <div className="lux-dur-grid">
                      <div
                        className={`lux-dur-card ${slotDuration === 2 ? 'selected' : ''}`}
                        onClick={() => {
                          setSlotDuration(2);
                          setSelectedSlotWindow('11:00 AM – 1:00 PM (IST)');
                        }}
                      >
                        <div>
                          <span className="lux-dur-badge lux-badge-express">Express Run</span>
                          <div className="lux-dur-hours">2 Hours</div>
                          <div className="lux-dur-name">Targeted Sourcing</div>
                          <div className="lux-dur-desc">Quick visit to 1–2 specific stores. Ideal for 1–3 pre-decided items.</div>
                        </div>
                        <div className="lux-dur-perk" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                          <span>Live In-App Photo Approvals</span>
                        </div>
                      </div>

                      <div
                        className={`lux-dur-card ${slotDuration === 3 ? 'selected' : ''}`}
                        onClick={() => {
                          setSlotDuration(3);
                          setSelectedSlotWindow('11:00 AM – 2:00 PM (IST)');
                        }}
                      >
                        <div>
                          <span className="lux-dur-badge lux-badge-popular" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <span>Most Popular</span>
                          </span>
                          <div className="lux-dur-hours">3 Hours</div>
                          <div className="lux-dur-name">Comprehensive Shopping</div>
                          <div className="lux-dur-desc">Visit multiple stores to compare styles, quality, and prices.</div>
                        </div>
                        <div className="lux-dur-perk" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                          <span>Real-Time In-Store Curation</span>
                        </div>
                      </div>

                      <div
                        className={`lux-dur-card ${slotDuration === 5 ? 'selected' : ''}`}
                        onClick={() => {
                          setSlotDuration(5);
                          setSelectedSlotWindow('11:00 AM – 4:00 PM (IST)');
                        }}
                      >
                        <div>
                          <span className="lux-dur-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>Extended Session</span>
                          <div className="lux-dur-hours">5 Hours</div>
                          <div className="lux-dur-name">Extended Shopping</div>
                          <div className="lux-dur-desc">Extensive visits across multiple stores. Ideal for custom tailoring, bridal, or bulk shopping.</div>
                        </div>
                        <div className="lux-dur-perk" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span>Dedicated Shopper Assigned</span>
                        </div>
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#081E3B', marginBottom: 10 }}>
                      Select Shopping Date:
                    </div>
                    <div className="lux-date-bar">
                      {[
                        { label: 'Tomorrow', date: '2026-10-16', day: 'Fri' },
                        { label: 'Oct 17', date: '2026-10-17', day: 'Sat' },
                        { label: 'Oct 18', date: '2026-10-18', day: 'Sun' },
                        { label: 'Oct 19', date: '2026-10-19', day: 'Mon' },
                        { label: 'Oct 20', date: '2026-10-20', day: 'Tue' },
                      ].map(d => (
                        <div
                          key={d.date}
                          className={`lux-date-pill ${selectedDate === d.date ? 'selected' : ''}`}
                          onClick={() => setSelectedDate(d.date)}
                        >
                          <div className="lux-date-day">{d.day}</div>
                          <div className="lux-date-val">{d.label}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>Or pick any custom date:</span>
                      <input
                        type="date"
                        className="inp"
                        style={{ maxWidth: 200, padding: '7px 12px', fontSize: 13 }}
                        value={selectedDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setSelectedDate(e.target.value)}
                      />
                    </div>

                    {/* Time Window Selection */}
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#081E3B', marginBottom: 10 }}>
                      Select Time Window (India Standard Time · IST):
                    </div>
                    <div className="lux-slots-grid">
                      {slotDuration === 2 && [
                        { id: 'w2-1', tag: 'Morning Bazaar', time: '11:00 AM – 1:00 PM (IST)', zone: 'Best for fresh market stock' },
                        { id: 'w2-2', tag: 'Afternoon Studio', time: '2:00 PM – 4:00 PM (IST)', zone: 'Best for designer boutiques' },
                        { id: 'w2-3', tag: 'Evening Golden Hour', time: '5:00 PM – 7:00 PM (IST)', zone: 'Best for silk & jewelry lighting' },
                      ].map(slot => (
                        <div
                          key={slot.id}
                          className={`lux-slot-btn ${selectedSlotWindow === slot.time ? 'selected' : ''}`}
                          onClick={() => setSelectedSlotWindow(slot.time)}
                        >
                          <div className="lux-slot-tag">{slot.tag}</div>
                          <div className="lux-slot-time">{slot.time}</div>
                          <div className="lux-slot-zone">{slot.zone}</div>
                        </div>
                      ))}

                      {slotDuration === 3 && [
                        { id: 'w3-1', tag: 'Morning Intensive', time: '11:00 AM – 2:00 PM (IST)', zone: 'Boutique exploration & live trial' },
                        { id: 'w3-2', tag: 'Afternoon Curation', time: '2:30 PM – 5:30 PM (IST)', zone: 'Bazaar hunt + photo inspection' },
                      ].map(slot => (
                        <div
                          key={slot.id}
                          className={`lux-slot-btn ${selectedSlotWindow === slot.time ? 'selected' : ''}`}
                          onClick={() => setSelectedSlotWindow(slot.time)}
                        >
                          <div className="lux-slot-tag">{slot.tag}</div>
                          <div className="lux-slot-time">{slot.time}</div>
                          <div className="lux-slot-zone">{slot.zone}</div>
                        </div>
                      ))}

                      {slotDuration === 5 && [
                        { id: 'w5-1', tag: 'Extended Shopping', time: '11:00 AM – 4:00 PM (IST)', zone: 'Multi-store extensive shopping' },
                      ].map(slot => (
                        <div
                          key={slot.id}
                          className={`lux-slot-btn ${selectedSlotWindow === slot.time ? 'selected' : ''}`}
                          onClick={() => setSelectedSlotWindow(slot.time)}
                        >
                          <div className="lux-slot-tag">{slot.tag}</div>
                          <div className="lux-slot-time">{slot.time}</div>
                          <div className="lux-slot-zone">{slot.zone}</div>
                        </div>
                      ))}
                    </div>

                    {(() => {
                      const currentSlotFee = slotDuration === 2 ? 250 : slotDuration === 5 ? 600 : 400;
                      const merchandiseBudget = cart.reduce((sum, item) => sum + (item.priceMax || item.priceMin || 1000) * (item.qty || 1), 0);
                      const totalDepositRequired = merchandiseBudget + currentSlotFee;
                      const walletShortfall = Math.max(0, totalDepositRequired - user.walletBalance);
                      const activeAddr = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];

                      return (
                        <>
                          {/* Sourcing Summary Card (Clean, Professional, AbhiBus-Inspired) */}
                          <div
                            className="sourcing-summary-compact-card"
                            onClick={() => setShowTripDetailsModal(true)}
                          >
                            <div className="ssc-top-row">
                              <div className="ssc-item-info">
                                <div className="ssc-thumb-wrapper">
                                  <img
                                    src={cart[0]?.image || '/images/placeholders/placeholder-item.svg'}
                                    alt={cart[0]?.name || 'Sourcing items'}
                                    className="ssc-primary-thumb"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/images/placeholders/placeholder-item.svg';
                                    }}
                                  />
                                  {cart.length > 1 && (
                                    <span className="ssc-badge-more">+{cart.length - 1}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="ssc-title-row">
                                    <span className="ssc-service-tag">Personal Shopper</span>
                                    <div className="ssc-title">{cart[0]?.name || 'Personal Shopping Run'}</div>
                                  </div>
                                  <div className="ssc-desc">
                                    {cart.length} item{cart.length > 1 ? 's' : ''} in sourcing basket · {slotDuration}h Dedicated Shopper
                                  </div>
                                </div>
                              </div>

                              <div className="ssc-price-box">
                                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Product Budget</div>
                                <div className="ssc-price" style={{ color: '#0F172A', marginTop: 1 }}>₹{merchandiseBudget.toLocaleString('en-IN')}</div>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2563EB', marginTop: 1 }}>
                                  + ₹{currentSlotFee} ({slotDuration}h Shopper)
                                </div>
                              </div>
                            </div>

                            {/* Bottom Section: All Slot Timing, Delivery Address & Payment Breakdown */}
                            <div className="ssc-bottom-details">
                              <div className="ssc-detail-pill">
                                <span className="ssc-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">All Slot Timing:</span>
                                  <span className="ssc-detail-val">{selectedDate} · {selectedSlotWindow} ({slotDuration} Hours)</span>
                                </div>
                              </div>

                              <div className="ssc-detail-pill">
                                <span className="ssc-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                </span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">Delivery Address:</span>
                                  <span className="ssc-detail-val">
                                    {activeAddr ? (
                                      `${activeAddr.name} · ${[activeAddr.city, activeAddr.country].filter(Boolean).join(', ')}`
                                    ) : (
                                      <span style={{ color: '#E11D48' }}>Delivery address pending (Step 2)</span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="ssc-detail-pill">
                                <span className="ssc-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                </span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">Payment Breakdown:</span>
                                  <span className="ssc-detail-val">
                                    ₹{currentSlotFee} Slot Fee (cut now) + ₹{merchandiseBudget.toLocaleString('en-IN')} Product Budget (held safely in wallet)
                                  </span>
                                </div>
                              </div>

                              <div className="ssc-detail-pill">
                                <span className="ssc-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                </span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">Delivery Fee:</span>
                                  <span className="ssc-detail-val">
                                    Weighed &amp; calculated after store purchase based on actual package weight
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="ssc-action-banner">
                              <div className="ssc-guarantee-text">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.4" style={{ width: 15, height: 15 }}>
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  <path d="M9 12l2 2 4-4" />
                                </svg>
                                <span>100% Protected</span>
                              </div>
                              <div className="ssc-view-trigger">
                                <span>View Sourcing &amp; Payment Plan</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* AbhiBus Inspired Trip Details Bottom Sheet Modal */}
                          <TripDetailsModal
                            isOpen={showTripDetailsModal}
                            onClose={() => setShowTripDetailsModal(false)}
                            slotDuration={slotDuration}
                            selectedDate={selectedDate}
                            selectedSlotWindow={selectedSlotWindow}
                            cart={cart}
                            activeAddr={activeAddr}
                            user={user}
                            customerPhone={customerPhone}
                            merchandiseBudget={merchandiseBudget}
                            currentSlotFee={currentSlotFee}
                            totalDepositRequired={totalDepositRequired}
                          />

                          {/* Clean, Responsive Visasra Sourcing & Wallet Box */}
                          <div className={`visasra-money-pay-box ${walletShortfall > 0 ? 'needs-deposit' : 'sufficient'}`}>
                            <div className="vmp-header">
                              <div className="vmp-wallet-info">
                                <div className="vmp-wallet-title">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="#0A3A6B" strokeWidth="2.2" style={{ width: 16, height: 16 }}>
                                    <rect x="2" y="4" width="20" height="16" rx="3" />
                                    <path d="M16 12h2" />
                                    <path d="M2 10h20" />
                                  </svg>
                                  <span>Visasra Sourcing Wallet</span>
                                </div>
                                <div className="vmp-wallet-balance">
                                  ₹{user.walletBalance.toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className={walletShortfall > 0 ? 'vmp-badge-warning' : 'vmp-badge-success'}>
                                {walletShortfall > 0 ? `Shortfall: ₹${walletShortfall.toLocaleString('en-IN')}` : '✓ Sufficient Balance'}
                              </div>
                            </div>

                            <div className="vmp-summary-details">
                              <div className="vmp-row">
                                <span>Dedicated Shopper Slot Fee ({slotDuration}h):</span>
                                <b>₹{currentSlotFee}</b>
                              </div>
                              <div className="vmp-row">
                                <span>Merchandise Budget (Held Securely):</span>
                                <b>₹{merchandiseBudget.toLocaleString('en-IN')}</b>
                              </div>
                              <div className="vmp-row" style={{ color: '#475569', fontSize: 12.5 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B4F9C" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                  <span>Delivery Fee:</span>
                                </span>
                                <b style={{ color: '#2563EB', fontWeight: 600 }}>Weighed &amp; billed after store purchase</b>
                              </div>
                              <div className="vmp-row vmp-total-row">
                                <span style={{ fontWeight: 800, color: '#0F172A' }}>Total Booking Deposit Required:</span>
                                <b style={{ fontSize: 14.5, color: '#0A3A6B' }}>₹{totalDepositRequired.toLocaleString('en-IN')}</b>
                              </div>
                            </div>

                            {walletShortfall > 0 ? (
                              <div className="vmp-alert-note">
                                <div className="vmp-alert-note-header">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                  <span>Deposit ₹{walletShortfall.toLocaleString('en-IN')} via Razorpay to confirm slot</span>
                                </div>
                                <div className="vmp-alert-note-body">
                                  ₹{currentSlotFee} slot fee is deducted now for your personal shopper. ₹{merchandiseBudget.toLocaleString('en-IN')} merchandise budget is held safely until you approve live samples. Delivery fee is weighed and calculated after items are collected from shops based on actual weight.
                                </div>
                              </div>
                            ) : (
                              <div className="vmp-success-note">
                                ✓ You have sufficient wallet balance. ₹{currentSlotFee} slot fee will be deducted upon confirmation. Delivery fee will be weighed and calculated after store pickup.
                              </div>
                            )}
                          </div>

                          <div className="wizard-actions">
                            <button
                              type="button"
                              className="btn-concierge-secondary"
                              onClick={() => {
                                setIsBooking(false);
                                setBookingStep(2);
                              }}
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              className="btn-concierge-primary"
                              disabled={isBooking}
                              onClick={handleConfirmBooking}
                              style={isBooking ? { opacity: 0.88, cursor: 'wait' } : {}}
                            >
                              {isBooking ? (
                                <>
                                  <span
                                    style={{
                                      width: 15,
                                      height: 15,
                                      border: '2.2px solid rgba(255,255,255,0.3)',
                                      borderTopColor: '#fff',
                                      borderRadius: '50%',
                                      display: 'inline-block',
                                      animation: 'spin 0.75s linear infinite',
                                      marginRight: 6,
                                    }}
                                  />
                                  <span>Confirming Booking...</span>
                                </>
                              ) : walletShortfall > 0 ? (
                                <>
                                  <span>Pay ₹{walletShortfall.toLocaleString('en-IN')} &amp; Book Slot</span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>Confirm &amp; Book Slot ({slotDuration}h)</span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= SCREEN 4: ORDERS ================= */}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              onBack={handleGoBack}
              onJoinLiveShopping={(slotKey) => {
                setLiveSessionSlot(slotKey);
                navigateToTab('live-shopping');
              }}
              onTrackOrder={handleTrackOrder}
              onRateShopper={(order) => {
                setRatingModalOrder(order);
                setReviewRating(5);
                setReviewComment('');
              }}
              onRefresh={() => loadData(user, true)}
            />
          )}

          {/* ================= SCREEN 5: CART ================= */}
          {activeTab === 'cart' && (
            <CartTab
              cart={cart}
              onRemoveItem={handleRemoveCartItem}
              onNavigate={(tab) => {
                navigateToTab(tab);
                if (tab === 'orders') loadData(user);
              }}
              onBack={handleGoBack}
            />
          )}

          {/* ================= SCREEN 6: WALLET ================= */}
          {activeTab === 'wallet' && (
            <WalletTab
              user={user}
              walletTransactions={walletTransactions}
              onAddMoney={handleAddMoney}
              onBack={handleGoBack}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              customerPhone={customerPhone}
              savedAddressesCount={savedAddresses.length}
              onNavigate={(tab) => {
                navigateToTab(tab);
                if (tab === 'orders') loadData(user);
              }}
              onLogout={handleLogout}
              onBack={handleGoBack}
              onUpdateUser={(updated) => {
                setUser((prev) => ({ ...prev, ...updated }));
                if (updated.phone) setCustomerPhone(updated.phone);
                try {
                  localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, ...updated }));
                } catch { }
              }}
              showToast={showToast}
            />
          )}

          {/* ================= SCREEN 8: SAVED ADDRESSES ================= */}
          {activeTab === 'addresses' && (
            <AddressesTab
              savedAddresses={savedAddresses}
              onBack={handleGoBack}
              onDeleteAddress={handleDeleteAddress}
              onSaveAddress={handleSaveNewAddress}
              defaultName={user.name}
              defaultPhone={customerPhone || user.phone}
              showToast={showToast}
            />
          )}

          {/* ================= SCREEN 9: DEDICATED FULL-PAGE LIVE SHOPPING ================= */}
          {activeTab === 'live-shopping' && (
            <LiveShoppingTab
              orders={orders}
              liveSessionSlot={liveSessionSlot}
              setLiveSessionSlot={setLiveSessionSlot}
              liveSessionData={liveSessionData}
              liveSessionLoading={liveSessionLoading}
              user={user}
              onBackToOrders={handleGoBack}
              onNavigate={(tab) => {
                navigateToTab(tab);
                if (tab === 'orders') loadData(user);
              }}
              onApproveOption={handleApproveOption}
              onRejectOption={handleRejectOption}
              showToast={showToast}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="bottomnav" id="bottomnav">
          <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigateToTab('home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11L12 4l8 7" /><path d="M6 10v9h5v-5h2v5h5v-9" /></svg>
            Home
          </button>
          <button className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => navigateToTab('categories')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></svg>
            Categories
          </button>
          <button className={`nav-btn ${activeTab === 'bookslot' ? 'active' : ''}`} onClick={() => navigateToTab('bookslot')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Uploads
          </button>
          <button
            className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              navigateToTab('orders');
              loadData(user);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" /></svg>
            Orders
          </button>
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigateToTab('profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
            Profile
          </button>
        </nav>
      </div>

      {/* Product Customization & Add Modal */}
      {customizingProduct && (
        <CustomizeProductModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAdd={async ({ qty, notes, images }) => {
            const prod = customizingProduct;
            const newItem: CartItem = {
              id: `${prod.id}-${Date.now()}`,
              productId: prod.id,
              name: prod.name,
              qty,
              priceMin: prod.estMin,
              priceMax: prod.estMax,
              image: images[0] || prod.image,
              images: images.length > 0 ? images : (prod.images || [prod.image]),
              notes: notes.trim() || undefined,
              sourceType: 'catalog',
              categoryName: prod.categoryName,
            };
            setCart(prev => {
              const updated = [...prev, newItem];
              persistCartLocally(updated);
              return updated;
            });
            if (isLoggedIn && user.email) {
              fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ item: newItem, userId: user.id, email: user.email }),
              }).catch(() => { });
            }
            showToast(`Added ${prod.name} to cart`);
          }}
          handleFileUpload={handleFileUpload}
        />
      )}

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        slotKey={trackOrderSlot}
        trackingData={trackingData}
        onClose={() => setTrackOrderSlot(null)}
        onJoinLiveShopping={(slotKey) => {
          setTrackOrderSlot(null);
          setLiveSessionSlot(slotKey);
          navigateToTab('live-shopping');
        }}
      />

      {/* ================= ORDER PLACED SUCCESSFULLY CELEBRATION MODAL ================= */}
      <OrderPlacedModal
        order={orderPlacedSuccess}
        onClose={() => setOrderPlacedSuccess(null)}
        onNavigate={(tab) => navigateToTab(tab)}
        onJoinLiveShopping={(slotKey) => {
          setLiveSessionSlot(slotKey);
          navigateToTab('live-shopping');
        }}
      />

      {/* Insufficient Balance Top-up & Approval Modal */}
      <InsufficientBalanceModal
        modalData={insufficientBalanceModal}
        onClose={() => setInsufficientBalanceModal(null)}
        onTopupAndApprove={(shortfall) => handleTopupAndApprove(shortfall)}
      />

      {/* Edit Sourcing Basket Item Modal */}
      <EditBasketItemModal
        item={editingCartItem}
        onClose={() => setEditingCartItem(null)}
        onSave={(updated) => {
          setCart(prev => {
            const next = prev.map(c => c.id === updated.id ? updated : c);
            persistCartLocally(next);
            return next;
          });
          if (isLoggedIn && user.email) {
            fetch(`/api/cart?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ ...updated, userId: user.id, email: user.email }),
            }).catch(() => { });
          }
          showToast(`Saved instructions for "${updated.name}"`);
          setEditingCartItem(null);
        }}
        handleFileUpload={handleFileUpload}
      />

      {/* Rate Personal Shopper Modal */}
      <RateShopperModal
        order={ratingModalOrder}
        reviewRating={reviewRating}
        setReviewRating={setReviewRating}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        submittingReview={submittingReview}
        onClose={() => setRatingModalOrder(null)}
        onSubmit={handleSubmitReview}
      />

      {/* Toast Notification */}
      <div
        id="toast"
        className={`toast ${toastMsg ? 'show on' : ''} ${toastMsg && /error|failed|incorrect|invalid|not found|no account|warning|please sign in/i.test(toastMsg)
          ? 'toast-error'
          : toastMsg && /added|success|congratulations|welcome|approved|saved|updated/i.test(toastMsg)
            ? 'toast-success'
            : ''
          }`}
      >
        {toastMsg && /error|failed|incorrect|invalid|not found|no account|warning|please sign in/i.test(toastMsg) ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : toastMsg && /added|success|congratulations|welcome|approved|saved|updated/i.test(toastMsg) ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
