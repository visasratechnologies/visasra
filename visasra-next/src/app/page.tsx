'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { openRazorpayPayment } from '@/lib/razorpay';
import '@/styles/styles.css';
import '@/styles/live.css';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

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
  walletBalance: number;
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

const HOW_IT_WORKS = [
  {
    t: 'Add Items From Anywhere',
    d: 'Choose from our curated categories, describe custom requests from your mind, or paste online store links.',
    badgeClass: 'hw-step-1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    t: 'Add Photos & Budget Specs',
    d: 'Attach reference photos, live images, specify preferred fabric/size, and set your target price range.',
    badgeClass: 'hw-step-2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    t: 'Reserve Shopping Slot & Delivery',
    d: 'Choose your preferred shopping duration, date & live window. Your personal shopper is assigned exclusively for you.',
    badgeClass: 'hw-step-3',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    t: 'Dedicated Shopper Assigned',
    d: 'A verified local personal shopper heads out to the authentic physical stores and artisan markets for you.',
    badgeClass: 'hw-step-4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    t: 'Live Photo & Video Approval',
    d: 'Review live photos, artisan craftsmanship, and exact store bills in real-time. Approve before purchase.',
    badgeClass: 'hw-step-5',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    t: 'Secure International Delivery',
    d: 'Consolidated packaging, customs clearance, and express doorstep courier tracking anywhere in the world.',
    badgeClass: 'hw-step-6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="14" height="10" rx="1.5" /><path d="M16 10h3l3 3v4h-6z" /><circle cx="7" cy="19" r="1.6" /><circle cx="18" cy="19" r="1.6" />
      </svg>
    ),
  },
];


export interface CountryConfig {
  iso: string;
  country: string;
  code: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  formatHint: string;
  example: string;
}

const COUNTRY_CONFIGS: CountryConfig[] = [
  // Primary Indian Diaspora & Global Trade Hubs
  { iso: 'IN', country: 'India', code: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10, placeholder: '98765 43210', formatHint: '10 digits', example: '98765 43210' },
  { iso: 'US', country: 'United States', code: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10, placeholder: '415 555 0199', formatHint: '10 digits', example: '415 555 0199' },
  { iso: 'AU', country: 'Australia', code: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 9, placeholder: '412 345 678', formatHint: '9 digits', example: '412 345 678' },
  { iso: 'GB', country: 'United Kingdom', code: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 10, placeholder: '7123 456789', formatHint: '10 digits', example: '7123 456789' },
  { iso: 'CA', country: 'Canada', code: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10, placeholder: '416 555 0199', formatHint: '10 digits', example: '416 555 0199' },
  { iso: 'AE', country: 'UAE', code: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567', formatHint: '9 digits', example: '50 123 4567' },
  { iso: 'SG', country: 'Singapore', code: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8, placeholder: '8123 4567', formatHint: '8 digits', example: '8123 4567' },
  { iso: 'SA', country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567', formatHint: '9 digits', example: '50 123 4567' },
  { iso: 'QA', country: 'Qatar', code: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8, placeholder: '3312 3456', formatHint: '8 digits', example: '3312 3456' },
  { iso: 'NZ', country: 'New Zealand', code: '+64', flag: '🇳🇿', minDigits: 9, maxDigits: 10, placeholder: '21 123 4567', formatHint: '9-10 digits', example: '21 123 4567' },
  { iso: 'MY', country: 'Malaysia', code: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10, placeholder: '12 345 6789', formatHint: '9-10 digits', example: '12 345 6789' },
  { iso: 'DE', country: 'Germany', code: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11, placeholder: '151 23456789', formatHint: '10-11 digits', example: '151 23456789' },
  { iso: 'FR', country: 'France', code: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78', formatHint: '9 digits', example: '6 12 34 56 78' },
  { iso: 'IE', country: 'Ireland', code: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 9, placeholder: '85 123 4567', formatHint: '9 digits', example: '85 123 4567' },
  { iso: 'NL', country: 'Netherlands', code: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9, placeholder: '6 12345678', formatHint: '9 digits', example: '6 12345678' },
  { iso: 'CH', country: 'Switzerland', code: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67', formatHint: '9 digits', example: '78 123 45 67' },
  { iso: 'KW', country: 'Kuwait', code: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'BH', country: 'Bahrain', code: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8, placeholder: '3912 3456', formatHint: '8 digits', example: '3912 3456' },
  { iso: 'OM', country: 'Oman', code: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'HK', country: 'Hong Kong', code: '+852', flag: '🇭🇰', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'JP', country: 'Japan', code: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10, placeholder: '90 1234 5678', formatHint: '10 digits', example: '90 1234 5678' },
  { iso: 'ZA', country: 'South Africa', code: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9, placeholder: '71 234 5678', formatHint: '9 digits', example: '71 234 5678' },
];

export default function CustomerApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'password' | 'email_otp'>('password');

  // Sign In State (Email or Mobile Number)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Sign Up State with Country Code & Email OTP Verification
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCountryIso, setSignupCountryIso] = useState('IN');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupStep, setSignupStep] = useState<'details' | 'verify_email'>('details');
  const [signupOtp, setSignupOtp] = useState('');

  const activeSignupCountry = COUNTRY_CONFIGS.find((c) => c.iso === signupCountryIso) || COUNTRY_CONFIGS[0];

  const detectCountryFromLocation = (loc: string): string | null => {
    const q = loc.toLowerCase().trim();
    if (!q) return null;
    if (q.includes('india') || q.includes('mumbai') || q.includes('delhi') || q.includes('bangalore') || q.includes('chennai') || q.includes('hyderabad') || q.includes('kolkata') || q.includes('pune') || q.includes('kerala')) return 'IN';
    if (q.includes('uk') || q.includes('united kingdom') || q.includes('london') || q.includes('manchester') || q.includes('birmingham') || q.includes('england') || q.includes('scotland')) return 'GB';
    if (q.includes('australia') || q.includes('sydney') || q.includes('melbourne') || q.includes('brisbane') || q.includes('perth')) return 'AU';
    if (q.includes('usa') || q.includes('united states') || q.includes('america') || q.includes('california') || q.includes('new york') || q.includes('texas')) return 'US';
    if (q.includes('canada') || q.includes('toronto') || q.includes('vancouver') || q.includes('montreal')) return 'CA';
    if (q.includes('uae') || q.includes('dubai') || q.includes('abu dhabi') || q.includes('sharjah') || q.includes('emirates')) return 'AE';
    if (q.includes('singapore')) return 'SG';
    if (q.includes('saudi') || q.includes('riyadh') || q.includes('jeddah')) return 'SA';
    if (q.includes('qatar') || q.includes('doha')) return 'QA';
    if (q.includes('germany') || q.includes('berlin') || q.includes('munich')) return 'DE';
    if (q.includes('france') || q.includes('paris')) return 'FR';
    if (q.includes('new zealand') || q.includes('auckland')) return 'NZ';
    if (q.includes('malaysia') || q.includes('kuala')) return 'MY';
    if (q.includes('ireland') || q.includes('dublin')) return 'IE';
    return null;
  };

  // Forgot Password State (Email based OTP & Reset)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'bookslot' | 'orders' | 'cart' | 'profile' | 'wallet' | 'addresses' | 'live-shopping'>('home');
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    phone: '',
    walletBalance: 0,
  });

  // Load saved session on mount & sync fresh live wallet from Postgres
  useEffect(() => {
    try {
      const saved = localStorage.getItem('visasra_customer_session_v1');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email === 'customer@visasra.com') {
          u.walletBalance = 0;
        }
        setUser(u);
        setIsLoggedIn(true);
        setActiveTab('home');

        // Fetch authoritative wallet balance from DB
        if (u.email) {
          fetch(`/api/wallet?email=${encodeURIComponent(u.email)}`)
            .then(r => r.json())
            .then(d => {
              if (d && typeof d.balance === 'number') {
                setUser(prev => {
                  const updated = { ...prev, walletBalance: d.balance };
                  try { localStorage.setItem('visasra_customer_session_v1', JSON.stringify(updated)); } catch {}
                  return updated;
                });
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error('Session load error', e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  // Live Auto-Sync Wallet Balance from PostgreSQL
  useEffect(() => {
    const syncWallet = () => {
      if (!isLoggedIn || !user.email) return;
      fetch(`/api/wallet?email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.balance === 'number') {
            setUser((prev) => {
              if (prev.walletBalance !== d.balance) {
                const updated = { ...prev, walletBalance: d.balance };
                try {
                  localStorage.setItem('visasra_customer_session_v1', JSON.stringify(updated));
                } catch {}
                return updated;
              }
              return prev;
            });
          }
          if (d && Array.isArray(d.transactions)) {
            setWalletTransactions(d.transactions);
          }
        })
        .catch(() => {});
    };

    if (isLoggedIn && user.email) {
      syncWallet();
    }
    window.addEventListener('focus', syncWallet);
    const interval = setInterval(syncWallet, 3000);
    return () => {
      window.removeEventListener('focus', syncWallet);
      clearInterval(interval);
    };
  }, [isLoggedIn, user.email]);

  // Sign In Handler (Email/Password or Email OTP)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMethod === 'email_otp') {
        if (!otpSent) {
          // Request OTP to Email
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_email_otp', email: authEmail }),
          });
          const data = await res.json();
          if (res.ok) {
            setOtpSent(true);
            showToast(data.message || `Verification code sent to ${authEmail}. Please check your email.`);
          } else {
            showToast(data.error || 'Failed to send OTP to email');
          }
          setAuthLoading(false);
          return;
        }

        // Verify OTP
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, otp: authOtp }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          setActiveTab('home');
          localStorage.setItem('visasra_customer_session_v1', JSON.stringify(data.user));
          showToast(`Welcome back, ${data.user.name || 'Customer'}!`);
          loadData(data.user);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showToast(data.error || 'Invalid OTP code');
        }
      } else {
        // Sign In with Email & Password
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          setActiveTab('home');
          localStorage.setItem('visasra_customer_session_v1', JSON.stringify(data.user));
          showToast(`Welcome back, ${data.user.name || 'Customer'}!`);
          loadData(data.user);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showToast(data.error || 'Invalid email or password');
        }
      }
    } catch {
      showToast('Login network error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Up Step 1: Request Verification Code to Email
  const handleSignUpRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      showToast('Please enter your name');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      showToast('Please enter a valid Gmail / Email address');
      return;
    }
    const rawDigits = signupPhone.replace(/\D/g, '');
    if (!rawDigits) {
      showToast('Please enter your mobile number');
      return;
    }
    if (rawDigits.length < activeSignupCountry.minDigits || rawDigits.length > activeSignupCountry.maxDigits) {
      const neededMsg =
        activeSignupCountry.minDigits === activeSignupCountry.maxDigits
          ? `exactly ${activeSignupCountry.minDigits} digits (e.g. ${activeSignupCountry.example})`
          : `between ${activeSignupCountry.minDigits} and ${activeSignupCountry.maxDigits} digits`;
      showToast(`Please enter a valid ${activeSignupCountry.country} mobile number with ${neededMsg}. You entered ${rawDigits.length} digits.`);
      return;
    }
    if (!signupLocation.trim()) {
      showToast('Please enter your delivery location or city');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    try {
      const fullPhone = `${activeSignupCountry.code} ${rawDigits}`;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          name: signupName,
          email: signupEmail,
          phone: fullPhone,
          location: signupLocation,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignupStep('verify_email');
        showToast(data.message || `Verification code sent to ${signupEmail}. Please check your email.`);
      } else {
        showToast(data.error || 'Failed to send verification code');
      }
    } catch {
      showToast('Network error during registration');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Up Step 2: Verify Email OTP and Create Account & Log In
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtp.trim()) {
      showToast('Please enter the verification code sent to your email');
      return;
    }

    setAuthLoading(true);
    try {
      const fullPhone = `${activeSignupCountry.code} ${signupPhone.replace(/\D/g, '')}`;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_and_create',
          name: signupName,
          email: signupEmail,
          phone: fullPhone,
          location: signupLocation,
          password: signupPassword,
          otp: signupOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
        setActiveTab('home');
        localStorage.setItem('visasra_customer_session_v1', JSON.stringify(data.user));
        setSavedAddresses((prev) => [
          {
            id: `addr-${Date.now()}`,
            name: signupName,
            phone: fullPhone,
            line1: signupLocation,
            city: signupLocation.split(',')[0]?.trim() || signupLocation,
            region: signupLocation.split(',')[1]?.trim() || 'Global',
            zip: '90001',
            country: 'Global',
            label: 'Home',
          },
          ...prev,
        ]);
        showToast(`Email verified! Welcome to Visasra, ${signupName}!`);
        loadData(data.user);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast(data.error || 'Invalid verification code');
      }
    } catch {
      showToast('Network error verifying code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      showToast('Please enter your registered Gmail / Email address');
      return;
    }

    setAuthLoading(true);
    try {
      if (!forgotOtpSent) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_otp', email: forgotEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          setForgotOtpSent(true);
          showToast(data.message || `Reset code sent to ${forgotEmail}. Please check your email.`);
        } else {
          showToast(data.error || 'Failed to send reset code');
        }
      } else {
        if (!forgotOtp.trim()) {
          showToast('Please enter the verification code sent to your email');
          setAuthLoading(false);
          return;
        }
        if (!forgotNewPassword || forgotNewPassword.length < 6) {
          showToast('New password must be at least 6 characters');
          setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset_password',
            email: forgotEmail,
            otp: forgotOtp,
            newPassword: forgotNewPassword,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Password updated successfully! You can now sign in.');
          setAuthEmail(forgotEmail);
          setAuthPassword(forgotNewPassword);
          setAuthMode('signin');
          setAuthMethod('password');
          setForgotOtpSent(false);
          setForgotNewPassword('');
          setForgotOtp('');
        } else {
          showToast(data.error || 'Password reset failed');
        }
      }
    } catch {
      showToast('Network error processing password reset');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('visasra_customer_session_v1');
    setIsLoggedIn(false);
    setUser({
      id: '',
      name: '',
      email: '',
      phone: '',
      walletBalance: 0,
    });
    setOrders([]);
    setActiveTab('home');
    setOtpSent(false);
    showToast('Signed out of Visasra');
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // Product & Sub-type Image Resolution Helpers
  const productSlug = (name: string) => {
    return name.toLowerCase().replace(/['\u2019]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const getProductImg = (catSlug: string, _prodName?: string, fallbackImg?: string) => {
    if (fallbackImg) return fallbackImg;
    const cleanCat = productSlug(catSlug);
    return `/images/categories/${cleanCat}.jpg`;
  };

  const getTypeImg = (catSlug: string, _prodName: string, typeName: string) => {
    const cleanCat = productSlug(catSlug);
    const cleanType = productSlug(typeName);
    return `/images/products/${cleanCat}/${cleanType}.jpg`;
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

  // Image Upload State & Handlers (Direct Cloudflare Sync / Local Fallback)
  const [uploadingImage, setUploadingImage] = useState(false);
  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
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

  useEffect(() => {
    if (!liveSessionSlot) {
      setLiveSessionData(null);
      return;
    }
    setLiveSessionLoading(true);
    fetchLiveSession(liveSessionSlot).finally(() => setLiveSessionLoading(false));

    const interval = setInterval(() => {
      fetchLiveSession(liveSessionSlot);
    }, 3500);

    return () => clearInterval(interval);
  }, [liveSessionSlot]);

  useEffect(() => {
    if (!trackOrderSlot) {
      setTrackingData(null);
      return;
    }
    setTrackingLoading(true);
    fetchTracking(trackOrderSlot).finally(() => setTrackingLoading(false));

    const interval = setInterval(() => {
      fetchTracking(trackOrderSlot);
    }, 4000);

    return () => clearInterval(interval);
  }, [trackOrderSlot]);

  // Lock body scroll when tracking modal is open
  useEffect(() => {
    if (trackOrderSlot) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [trackOrderSlot]);

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
      loadData();
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
        onSuccess: async (paymentId: string) => {
          showToast(`Depositing ₹${depositAmt.toLocaleString('en-IN')} to Visasra Money...`);
          const res = await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              amount: depositAmt,
              razorpayPaymentId: paymentId,
              note: `Deposit for item: ${itemName} (${paymentId})`,
            }),
          });
          const data = await res.json();
          if (data.success) {
            const newBal = typeof data.balance === 'number' ? data.balance : (user.walletBalance + depositAmt);
            setUser(prev => ({ ...prev, walletBalance: newBal }));
            try {
              localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, walletBalance: newBal }));
            } catch {}
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
      showToast('Requested alternative options from shopper');
      fetchLiveSession(liveSessionSlot);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error rejecting option');
    }
  };


  const handleSaveNewAddress = async () => {
    if (!addressForm.line1 || !addressForm.city || !addressForm.zip) {
      showToast('Please fill in street address, city, and ZIP code');
      return;
    }
    const nameToUse = addressForm.name.trim() || user.name || 'Recipient';
    const phoneToUse = addressForm.phone.trim() || customerPhone || user.phone;

    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: nameToUse,
          phone: phoneToUse,
          line1: addressForm.line1.trim(),
          line2: addressForm.line2?.trim() || null,
          city: addressForm.city.trim(),
          region: addressForm.region?.trim() || null,
          zip: addressForm.zip.trim(),
          country: addressForm.country || 'India',
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
          label: addressForm.label || 'Home',
        };
        setSavedAddresses(prev => [newAddr, ...prev.filter(a => a.id !== newAddr.id)]);
        setSelectedAddressId(newAddr.id);
        setIsAddingAddress(false);
        showToast('New delivery address saved to database!');
        return;
      }
    } catch {}

    const newAddr: Address = {
      id: 'addr-' + Date.now(),
      ...addressForm,
    };
    setSavedAddresses([...savedAddresses, newAddr]);
    setSelectedAddressId(newAddr.id);
    setIsAddingAddress(false);
    showToast('New delivery address saved!');
  };

  const handleDeleteAddress = async (id: string) => {
    if (savedAddresses.length <= 1) {
      showToast('You must keep at least one saved address');
      return;
    }
    try {
      await fetch(`/api/user/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
    setSavedAddresses(savedAddresses.filter(a => a.id !== id));
    if (selectedAddressId === id) {
      setSelectedAddressId(savedAddresses.find(a => a.id !== id)!.id);
    }
    showToast('Address removed');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2600);
  };

  // Load Data from PostgreSQL
  const loadData = async (targetUser?: User | null) => {
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.categories) {
        setCategories(catData.categories);
        const allProds: Product[] = [];
        catData.categories.forEach((c: Category) => {
          (c.products || []).forEach(p => allProds.push({ ...p, categoryName: c.name }));
        });
        setPopularProducts(allProds.slice(0, 8));
      }

      const activeUser = targetUser !== undefined ? targetUser : (isLoggedIn && user?.email ? user : null);
      if (activeUser && activeUser.email) {
        // Authoritative fetch of saved delivery addresses from PostgreSQL
        fetch(`/api/user/addresses?email=${encodeURIComponent(activeUser.email)}&userId=${encodeURIComponent(activeUser.id || '')}`)
          .then(r => r.json())
          .then(d => {
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
              setSelectedAddressId(prev => prev && mapped.some(m => m.id === prev) ? prev : mapped[0].id);
            }
          })
          .catch(() => {});

        const ordRes = await fetch(`/api/orders?email=${encodeURIComponent(activeUser.email)}&userId=${encodeURIComponent(activeUser.id || '')}`);
        const ordData = await ordRes.json();
        if (ordData.orders) {
          setOrders(ordData.orders);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
    }
  };

  useEffect(() => {
    const active = isLoggedIn && user?.email ? user : null;
    loadData(active);
    const interval = setInterval(() => {
      loadData(isLoggedIn && user?.email ? user : null);
    }, 6000);
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
          <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
                    setSelectedCategoryForView(c);
                    setActiveTab('categories');
                    setSearchQuery('');
                    setSearchFocused(false);
                    if (isMobile) setMobileSearchOpen(false);
                  }}
                >
                  <img src={c.image} alt="" className="search-item-img" />
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
                  <img src={p.image} alt="" className="search-item-img" />
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
              setActiveTab('bookslot');
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



  // Add Item to Cart (Quick)
  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        qty: 1,
        priceMin: product.estMin,
        priceMax: product.estMax,
        image: product.image,
        sourceType: 'catalog',
        categoryName: product.categoryName,
      }]);
    }
    showToast(`Added ${product.name} to sourcing basket`);
  };

  // Add Customized Catalog Product
  const handleAddCustomizedCatalogProduct = () => {
    if (!customizingProduct) return;
    const newItem: CartItem = {
      id: `${customizingProduct.id}-${Date.now()}`,
      name: customizingProduct.name,
      qty: customizingQty,
      priceMin: customizingProduct.estMin,
      priceMax: customizingProduct.estMax,
      image: customizingImgs[0] || customizingImg.trim() || customizingProduct.image,
      images: customizingImgs.length > 0 ? customizingImgs : (customizingProduct.images || [customizingProduct.image]),
      notes: customizingNotes.trim() || undefined,
      sourceType: 'catalog',
      categoryName: customizingProduct.categoryName,
    };
    setCart([...cart, newItem]);
    showToast(`Added ${customizingProduct.name} to basket`);
    setCustomizingProduct(null);
    setCustomizingQty(1);
    setCustomizingNotes('');
    setCustomizingImg('');
    setCustomizingImgs([]);
    setActiveProductPhotoIdx(0);
  };

  // Add Custom Item (Source 2: Customize Product / What's On Your Mind)
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      showToast('Please enter an item name');
      return;
    }
    const primaryImg = customImgs[0] || customImg.trim() || '/images/categories/pooja-spiritual.jpg';
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
    setCart([...cart, newItem]);
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
    const title = onlineTitle.trim() || `${onlinePlatform} Product`;
    const primaryImg = onlineImgs[0] || onlineImg.trim() || '/images/categories/electronics-accessories.jpg';
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
    setCart([...cart, newItem]);
    showToast(`Added online product to sourcing basket`);
    setOnlineUrl('');
    setOnlineTitle('');
    setOnlinePrice('2499');
    setOnlineImg('');
    setOnlineImgs([]);
    setOnlineNotes('');
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
    const primaryImg = editImgs[0] || editingCartItem.image || '/images/categories/pooja-spiritual.jpg';

    setCart(cart.map(c => c.id === editingCartItem.id ? {
      ...c,
      name: editTitle.trim() || c.name,
      priceMin: minVal,
      priceMax: maxVal,
      qty: qtyVal,
      notes: editNotes.trim() || undefined,
      image: primaryImg,
      images: editImgs.length > 0 ? editImgs : [primaryImg],
    } : c));

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

    const currentSlotFee = slotDuration === 2 ? 250 : slotDuration === 5 ? 600 : 400;
    // Slot booking requires the slot fee to reserve the personal shopper
    const requiredDeposit = currentSlotFee;
    const shortfall = Math.max(0, requiredDeposit - (user.walletBalance || 0));

    // Finalizes the order and deducts the slot fee after wallet has sufficient funds
    const finalizeOrder = async (confirmedBalance?: number) => {
      try {
        const activeAddress = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];
        const slotKey = `${selectedDate}|${selectedSlotWindow}`;
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            slotKey,
            slotDate: selectedDate,
            slotWindow: selectedSlotWindow,
            slotLabel: `${selectedDate} · ${selectedSlotWindow}`,
            slotFee: currentSlotFee,
            items: cart,
            shippingAddress: {
              name: activeAddress?.name || user.name,
              phone: customerPhone || activeAddress?.phone || user.phone,
              line1: activeAddress?.line1 || '',
              line2: activeAddress?.line2 || '',
              city: activeAddress?.city || '',
              region: activeAddress?.region || '',
              zip: activeAddress?.zip || '',
              country: activeAddress?.country || 'United States',
              label: activeAddress?.label || 'Home',
              deliveryNotes: deliveryNotes || '',
              marketLocation: 'Direct Artisan & Stores Across India',
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
          } catch {}
          showToast(`Slot Confirmed! ₹${currentSlotFee} slot fee deducted. Sourcing budget held in Visasra Money.`);
          setCart([]);
          setItemRequirement('');
          setDeliveryNotes('');
          setBookingStep(1);
          setShowTripDetailsModal(false);
          loadData();
          setActiveTab('orders');
        } else {
          showToast(data.error || 'Booking failed');
        }
      } catch {
        showToast('Booking failed');
      }
    };

    // If wallet has insufficient funds, prompt user to deposit the shortfall via Razorpay
    if (shortfall > 0) {
      try {
        await openRazorpayPayment({
          amount: shortfall,
          description: `Sourcing Slot Booking Fee (${selectedDate})`,
          prefill: {
            name: user.name,
            email: user.email,
            contact: customerPhone || user.phone,
          },
          onSuccess: async (paymentId: string) => {
            showToast(`Payment successful! Depositing ₹${shortfall.toLocaleString('en-IN')} to Visasra Money...`);
            const topupRes = await fetch('/api/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                email: user.email,
                amount: shortfall,
                razorpayPaymentId: paymentId,
                note: `Slot Deposit (${selectedDate}) · Razorpay: ${paymentId}`,
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
            }
          },
          onDismiss: () => {
            showToast('Razorpay payment cancelled. No money was added to your wallet.');
          },
          onError: () => {
            showToast('Razorpay payment failed. Please try again.');
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to launch Razorpay payment';
        showToast(msg);
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
        onSuccess: async (paymentId: string) => {
          const res = await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              amount: amt,
              razorpayPaymentId: paymentId,
              note: `Wallet Top-up via Razorpay (${paymentId})`,
            }),
          });
          const data = await res.json();
          if (data.success) {
            const newBal = typeof data.balance === 'number' ? data.balance : (user.walletBalance + amt);
            setUser(prev => ({ ...prev, walletBalance: newBal }));
            try {
              localStorage.setItem('visasra_customer_session_v1', JSON.stringify({ ...user, walletBalance: newBal }));
            } catch {}
            showToast(`Payment successful! Added ₹${amt.toLocaleString('en-IN')} to Visasra Money`);
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

  // Smooth initial session check - prevents login screen flicker
  if (authChecking) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
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
          style={{ width: 76, height: 76, marginBottom: 16, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.25))' }}
        />
        <div style={{ fontFamily: 'var(--font-display, serif)', fontSize: 28, fontWeight: 800, letterSpacing: 0.5, color: '#FFFFFF' }}>Visasra</div>
        <div style={{ fontSize: 13.5, color: '#93C5FD', marginTop: 8, fontWeight: 500, letterSpacing: 0.3 }}>Connecting to your concierge...</div>
      </div>
    );
  }

  // If Logged Out: Show Customer Authentication Screen with Demo OTP
  if (!isLoggedIn) {
    return (
      <>
        <div id="authScreen" aria-label="Sign in to Visasra">
        <div className="auth-side">
          <div className="auth-brand">
            <img src="/images/logo/visasra-logo.png" alt="" className="auth-logo" />
            <span className="brand-text">Vis<span>asra</span></span>
          </div>
          <div className="auth-side-copy">
            <h1>Shop India,<br />delivered anywhere.</h1>
            <p>Your trusted hands on the ground in India. Verified authentic items sourced live and shipped directly to your door.</p>
            <ul className="auth-points">
              <li>Live store inspections &amp; real-time video</li>
              <li>Official GST store receipts verified</li>
              <li>Direct express courier to anywhere globally</li>
            </ul>
          </div>
          <img className="auth-side-leaves" src="/images/decor/leaves-corner.png" alt="" aria-hidden="true" />
        </div>

        <div className="auth-main">
          <img className="auth-corner-leaves" src="/images/decor/leaves-corner.png" alt="" aria-hidden="true" />
          <div className="auth-mobile-brand">
            <img src="/images/logo/visasra-logo.png" alt="" className="auth-logo" />
            <span className="brand-text">Vis<span>asra</span></span>
          </div>

          <div className="auth-card" style={{ maxWidth: 440 }}>
            {/* Top Toggle: Sign In vs Create Account */}
            <div className="auth-segmented-switch">
              <button
                type="button"
                className={`auth-segmented-btn ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('signin');
                  setOtpSent(false);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-segmented-btn ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Create Account
              </button>
            </div>

            {/* ================= 1. SIGN IN ================= */}
            {authMode === 'signin' && (
              <>
                <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                  {authMethod === 'password' ? 'Sign In' : 'Sign In with OTP'}
                </h2>
                <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                  {authMethod === 'password'
                    ? 'Enter your email and password to access your concierge.'
                    : 'Enter your email to receive a verification code.'}
                </p>

                <form onSubmit={handleAuthSubmit}>
                  <div className="field">
                    <label>Email ID or Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. priya.sharma@example.com or 9876543210"
                    />
                  </div>

                  {authMethod === 'password' ? (
                    <>
                      <div className="field" style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Password</label>
                          <button
                            type="button"
                            className="auth-forgot-link"
                            onClick={() => {
                              setForgotEmail(authEmail);
                              setAuthMode('forgot');
                              setForgotOtpSent(false);
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="auth-pass" style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ paddingRight: 42 }}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: 10,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748B',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        style={{ marginTop: 16, width: '100%', padding: '12px' }}
                        disabled={authLoading}
                      >
                        {authLoading ? 'Signing In...' : 'Sign In'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button
                          type="button"
                          className="auth-switch-link"
                          style={{ fontSize: 12, textDecoration: 'none' }}
                          onClick={() => {
                            setAuthMethod('email_otp');
                            setOtpSent(false);
                          }}
                        >
                          Sign in with Email OTP instead
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {otpSent && (
                        <div className="field" style={{ marginTop: 12 }}>
                          <label>Verification Code</label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={authOtp}
                            onChange={(e) => setAuthOtp(e.target.value)}
                            placeholder="••••••"
                            style={{ letterSpacing: 4, fontWeight: 700, fontSize: 15, textAlign: 'center' }}
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        style={{ marginTop: 16, width: '100%', padding: '12px' }}
                        disabled={authLoading}
                      >
                        {authLoading ? 'Processing...' : otpSent ? 'Verify & Sign In' : 'Send Code to Email'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button
                          type="button"
                          className="auth-switch-link"
                          style={{ fontSize: 12, textDecoration: 'none' }}
                          onClick={() => {
                            setAuthMethod('password');
                            setOtpSent(false);
                          }}
                        >
                          Sign in with Password instead
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </>
            )}

            {/* ================= 2. CREATE ACCOUNT ================= */}
            {authMode === 'signup' && (
              <>
                {signupStep === 'details' ? (
                  <>
                    <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                      Create Account
                    </h2>
                    <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                      Enter your details to create your customer account.
                    </p>

                    <form onSubmit={handleSignUpRequestOtp}>
                      <div className="field">
                        <label>Name</label>
                        <input
                          type="text"
                          required
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Ananya Iyer"
                        />
                      </div>

                      <div className="field" style={{ marginTop: 10 }}>
                        <label>Gmail / Email</label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="ananya.iyer@gmail.com"
                        />
                      </div>

                      <div className="field" style={{ marginTop: 10 }}>
                        <label>Mobile Number</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            value={signupCountryIso}
                            onChange={(e) => {
                              const newIso = e.target.value;
                              setSignupCountryIso(newIso);
                              const newCountry = COUNTRY_CONFIGS.find((c) => c.iso === newIso);
                              if (newCountry) {
                                setSignupPhone((prev) => prev.slice(0, newCountry.maxDigits));
                                if (!signupLocation || signupLocation.trim().length <= 3) {
                                  setSignupLocation(newCountry.country);
                                }
                              }
                            }}
                            style={{
                              width: '160px',
                              padding: '10px 10px',
                              borderRadius: '12px',
                              border: '1.5px solid var(--border)',
                              background: '#fff',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#0B192E',
                            }}
                          >
                            {COUNTRY_CONFIGS.map((c) => (
                              <option key={c.iso} value={c.iso}>
                                {c.country} ({c.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            value={signupPhone}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, activeSignupCountry.maxDigits);
                              setSignupPhone(digits);
                            }}
                            placeholder={activeSignupCountry.placeholder}
                            maxLength={activeSignupCountry.maxDigits}
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>

                      <div className="field" style={{ marginTop: 10 }}>
                        <label>Location</label>
                        <input
                          type="text"
                          required
                          value={signupLocation}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSignupLocation(val);
                            const detectedIso = detectCountryFromLocation(val);
                            if (detectedIso && detectedIso !== signupCountryIso) {
                              setSignupCountryIso(detectedIso);
                              const c = COUNTRY_CONFIGS.find((cfg) => cfg.iso === detectedIso);
                              if (c) {
                                setSignupPhone((prev) => prev.slice(0, c.maxDigits));
                              }
                            }
                          }}
                          placeholder="City, Country"
                        />
                      </div>

                      <div className="field" style={{ marginTop: 10 }}>
                        <label>Password</label>
                        <div className="auth-pass" style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ paddingRight: 42 }}
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: 10,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748B',
                              padding: 4,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {showPassword ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        style={{ marginTop: 16, width: '100%', padding: '12px' }}
                        disabled={authLoading}
                      >
                        {authLoading ? 'Sending Verification Code...' : 'Continue & Verify Email →'}
                      </button>
                    </form>

                    <div className="auth-switch" style={{ marginTop: 14 }}>
                      <span>Already have an account? </span>
                      <button
                        type="button"
                        className="auth-switch-link"
                        onClick={() => setAuthMode('signin')}
                      >
                        Sign In
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 20 }}>
                        ✉️
                      </div>
                      <h2 className="auth-title" style={{ fontSize: 20, marginBottom: 4 }}>
                        Enter Verification Code
                      </h2>
                      <p className="auth-sub" style={{ fontSize: 13, color: '#475569', marginBottom: 0 }}>
                        We sent a 6-digit code to <b style={{ color: '#0F172A' }}>{signupEmail}</b>. Enter it below to sign in:
                      </p>
                    </div>

                    <form onSubmit={handleVerifySignupOtp}>
                      <div className="field">
                        <label style={{ textAlign: 'center', display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                          6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={signupOtp}
                          onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          style={{
                            letterSpacing: 10,
                            fontWeight: 800,
                            fontSize: 22,
                            textAlign: 'center',
                            height: 50,
                            background: '#FFFFFF',
                            borderColor: signupOtp.length === 6 ? '#16A34A' : '#CBD5E1',
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        style={{ marginTop: 16, width: '100%', padding: '13px', fontSize: 14, fontWeight: 700 }}
                        disabled={authLoading}
                      >
                        {authLoading ? 'Verifying...' : '✓ Verify Code & Sign In'}
                      </button>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #E2E8F0', fontSize: 12.5 }}>
                      <button
                        type="button"
                        className="auth-switch-link"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600 }}
                        onClick={() => setSignupStep('details')}
                      >
                        ← Edit email / phone
                      </button>
                      <button
                        type="button"
                        className="auth-switch-link"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0F172A', fontWeight: 700 }}
                        onClick={(e) => handleSignUpRequestOtp(e)}
                      >
                        Resend code ↻
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================= 3. FORGOT PASSWORD ================= */}
            {authMode === 'forgot' && (
              <>
                <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                  Reset Password
                </h2>
                <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                  Enter your email address to receive a reset code.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@gmail.com"
                    />
                  </div>

                  {forgotOtpSent && (
                    <>
                      <div className="field" style={{ marginTop: 12 }}>
                        <label>Verification Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          placeholder="123456"
                          style={{ letterSpacing: 4, fontWeight: 700, fontSize: 15, textAlign: 'center' }}
                        />
                      </div>

                      <div className="field" style={{ marginTop: 12 }}>
                        <label>New Password</label>
                        <div className="auth-pass">
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary auth-submit"
                    style={{ marginTop: 16, width: '100%', padding: '12px' }}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Verifying...' : forgotOtpSent ? 'Set New Password' : 'Send Reset Code'}
                  </button>
                </form>

                <div className="auth-switch" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setAuthMode('signin');
                      setForgotOtpSent(false);
                    }}
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastMsg ? 'show on' : ''}`}>{toastMsg}</div>
    </>
    );
  }

  // Logged In: Render Exact Original Sidenav + #app
  return (
    <>

      {/* Sidenav (Desktop) */}
      <nav className="sidenav" id="sidenav">
        <div className="sidenav-brand" onClick={() => setActiveTab('home')}>
          <img src="/images/logo/visasra-logo.png" alt="" className="sidenav-brand-logo" />
          <span className="brand-text">Vis<span>asra</span></span>
        </div>

        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11L12 4l8 7"/><path d="M6 10v9h5v-5h2v5h5v-9"/></svg>
          Home
        </button>
        <button className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/></svg>
          Categories
        </button>
        <button className={`nav-btn ${activeTab === 'bookslot' ? 'active' : ''}`} onClick={() => setActiveTab('bookslot')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M12 13v5M9.5 15.5h5"/></svg>
          Book Slot
        </button>
        <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
          Orders
          {orders.length > 0 && <span className="nb-badge">{orders.length}</span>}
        </button>
        <button
          className={`nav-btn ${activeTab === 'live-shopping' ? 'active' : ''}`}
          onClick={() => {
            if (!liveSessionSlot && orders.length > 0) {
              setLiveSessionSlot(orders[0].slotKey);
            }
            setActiveTab('live-shopping');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          Live Shopping
          <span className="nb-badge" style={{ background: '#22C55E', color: '#fff', fontSize: 10, padding: '2px 5px' }}>LIVE</span>
        </button>
        <button className={`nav-btn ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 8h12l-1 12H7L6 8z"/></svg>
          Cart
          {cart.length > 0 && <span className="nb-badge">{cart.length}</span>}
        </button>
        <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
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
          <div className="wordmark" onClick={() => setActiveTab('home')}>
            <img src="/images/logo/visasra-logo.png" alt="" className="wordmark-logo" />
            <span className="brand-text">Vis<span>asra</span></span>
          </div>
          <div className="top-actions">
            <button className="top-btn" onClick={() => setActiveTab('wallet')} aria-label="Wallet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/></svg>
              Wallet
            </button>
            <button className="top-btn" onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search
            </button>
            <button className="top-btn" onClick={() => setActiveTab('cart')} aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 8h12l-1 12H7L6 8z"/></svg>
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
        <div className="screens">
          {/* ================= SCREEN 1: HOME ================= */}
          {activeTab === 'home' && (
            <section className="screen active" data-screen="home">

              {/* Desktop Header */}
              <div className="desk-header">
                {renderSearchBar(false)}
                <div className="top-actions">
                  <button className="icon-pill" onClick={() => setActiveTab('wallet')} title="Wallet">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/></svg>
                  </button>
                  <button className="icon-pill" onClick={() => setActiveTab('cart')} title="Cart">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M6 8h12l-1 12H7L6 8z"/></svg>
                    {cart.length > 0 && <span className="icon-badge">{cart.length}</span>}
                  </button>
                </div>
              </div>

              {/* Exact Hero Banner Wrap */}
              <div className="hero" id="homeBanner">
                <div className="hero-banner-wrap">
                  <img className="hero-banner" src="/images/banner/home-banner.jpg" alt="Charminar, Hyderabad at sunset" />
                  <div className="hero-banner-copy">
                    <div className="hbc-eyebrow">Authentic Indian products</div>
                    <h1 className="hbc-title">Bringing India to the World</h1>
                    <p className="hbc-sub">Shop from local stores in India with trusted shoppers.</p>
                    <button className="hbc-btn" onClick={() => setActiveTab('categories')}>
                      Shop Now
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Exact Home Grid (Wallet Rail + Your Bookings) */}
              <div className="home-grid">
                <div className="home-rail">
                  <div className="wallet-card" onClick={() => setActiveTab('wallet')} style={{ cursor: 'pointer' }}>
                    <div>
                      <div className="label">Visasra Money</div>
                      <div className="amount money">₹{user.walletBalance.toLocaleString('en-IN')}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setActiveTab('wallet'); }}>
                      Add money
                    </button>
                  </div>
                  <p className="wallet-caption">Keep this loaded so a booking never stalls on payment.</p>
                </div>

                <div className="home-main">
                  <div className="section-title row">
                    <span>Your bookings</span>
                    <span className="see-all" onClick={() => setActiveTab('orders')}>See all</span>
                  </div>

                  <div id="homeBookings">
                    {orders.slice(0, 2).map(o => (
                      <div key={o.id} className="booking-card">
                        <div className="booking-strip"><span style={{ background: 'var(--gold)' }} /></div>
                        <div className="booking-main">
                          <div className="booking-top">
                            <div className="booking-top-left">
                              <img
                                src={o.items[0]?.image || '/images/categories/jewellery-accessories.jpg'}
                                alt=""
                                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                              />
                              <div>
                                <div className="booking-id">{o.orderNumber}</div>
                                <div className="booking-slot">{o.slotLabel || o.slotKey}</div>
                                <div className="booking-items">{o.items.map(i => i.name).join(', ')}</div>
                                <div className="booking-meta">{o.items.length} product(s)</div>
                              </div>
                            </div>
                            <div className="booking-total">₹{o.totalAmount}</div>
                          </div>
                          <div className="status-pill">{o.trackingStage.replace('_', ' ')}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary live-track-btn"
                              onClick={() => {
                                setLiveSessionSlot(o.slotKey);
                                setActiveTab('live-shopping');
                              }}
                            >
                              Live Shopping
                            </button>
                            <button
                              type="button"
                              className="track-btn"
                              onClick={() => setTrackOrderSlot(o.slotKey)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>
                              <span>Track order</span>
                              <svg className="tb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="booking-card" style={{ padding: '24px', textAlign: 'center' }}>
                        <b>No bookings yet</b>
                        <div style={{ color: 'var(--text-dim)', margin: '4px 0 14px' }}>Book a slot and tell us what you need — we'll take it from there.</div>
                        <button className="btn btn-primary" onClick={() => setActiveTab('bookslot')}>Book a shopping slot</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Exact Shop By Category */}
              <div className="section-title row">
                <span>Shop by category</span>
                <span className="see-all" onClick={() => setActiveTab('categories')}>See all</span>
              </div>
              <div className="cat-grid" id="catGrid">
                {categories.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    className="cat-tile home-cat"
                    style={{ backgroundImage: `url('${c.image}')` }}
                    onClick={() => setActiveTab('categories')}
                  >
                    <div className="cat-tile-body">
                      <div className="name">{c.name}</div>
                    </div>
                  </div>
                ))}
                <div className="cat-tile home-cat see-all-tile" onClick={() => setActiveTab('categories')}>
                  <div className="cat-tile-body">
                    <span className="see-all-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </span>
                    <div className="name">See all categories</div>
                    <div className="see-all-sub">{categories.length} categories</div>
                  </div>
                </div>
              </div>

              {/* Exact Popular on Visasra Blue Band */}
              <div className="blue-band">
                <div className="section-title row">
                  <span>Popular on Visasra</span>
                  <span className="see-all" onClick={() => setActiveTab('categories')}>See all</span>
                </div>
                <div className="product-scroll" id="popularScroll">
                  {popularProducts.map(p => (
                    <div key={p.id} className="card" style={{ minWidth: 200, padding: 10, flex: 'none', background: '#fff' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />
                      <div style={{ padding: '8px 4px 4px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase' }}>{p.categoryName || 'Sourced'}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, margin: '2px 0 6px', color: 'var(--text)' }}>{p.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#1261B5' }}>₹{p.estMin} – ₹{p.estMax}</span>
                          <button className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => addToCart(p)}>Add</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced 6-Milestone How Visasra Works */}
              <div className="hw-container-6">
                <div className="section-title" style={{ marginBottom: 4 }}>How Visasra works</div>
                <div className="hw-sub">From your wish to your doorstep, in six structured milestones.</div>
                <div className="hw-grid-6" id="howItWorks">
                  {HOW_IT_WORKS.map((s, i) => (
                    <div key={i} className="hw-card-6">
                      <div className={`hw-badge-6 ${s.badgeClass || `hw-step-${i + 1}`}`}>
                        {i + 1}
                      </div>
                      <div className="hw-card-body-6">
                        <div className="t">{s.t}</div>
                        <div className="d">{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Trust Card */}
              <div className="trust-card">
                <div className="tc-eyebrow">Why people trust Visasra</div>
                <div className="tc-title">Shop India, delivered anywhere.</div>
                <div className="tc-text">We're the trusted hands on the ground in India for people abroad — a real person sources, verifies and ships what you ask for, so you get the real thing without flying home for it.</div>
                <div className="tc-points">
                  <div className="tc-point">
                    <span className="tc-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/><path d="M9 12l2 2 4-4"/></svg>
                    </span>
                    <div><b>Verified before we buy</b><span>A real person checks every item first.</span></div>
                  </div>
                  <div className="tc-point">
                    <span className="tc-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                    </span>
                    <div><b>Real-time slot booking</b><span>Pick a date and time that suits you.</span></div>
                  </div>
                  <div className="tc-point">
                    <span className="tc-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h13v10H3zM16 10h3l2 3v4h-5z"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>
                    </span>
                    <div><b>Shipped to your door</b><span>Packed and tracked all the way to you.</span></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= SCREEN 2: CATEGORIES & CATALOG (3-TIER: CATEGORIES -> SUBCATEGORIES/PRODUCTS -> TYPES) ================= */}
          {activeTab === 'categories' && (
            <section className="screen active" data-screen="categories">
              {selectedCategoryForView && selectedProductForTypes ? (
                /* Tier 3: Sub-Category / Product Varieties Detail (e.g. Cookware > Pans > Frying Pan, Appam Pan, etc.) */
                <div>
                  <button
                    className="back-row"
                    onClick={() => {
                      setSelectedProductForTypes(null);
                      setTypeSearchQuery('');
                    }}
                    aria-label={`Back to ${selectedCategoryForView.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                    Back to {selectedCategoryForView.name}
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
                              onClick={() => {
                                const subPhotos = [
                                  typeImg,
                                  getProductImg(selectedCategoryForView.slug, selectedProductForTypes.name),
                                  selectedCategoryForView.image,
                                ].filter(Boolean);

                                setCustomizingProduct({
                                  id: `${selectedProductForTypes.id}-${productSlug(t.name)}`,
                                  name: `${selectedProductForTypes.name} – ${t.name}`,
                                  price: mid,
                                  estMin: mid,
                                  estMax: high,
                                  image: typeImg,
                                  images: subPhotos,
                                  description: `Specific ${t.name} variety of ${selectedProductForTypes.name} sourced directly from verified Indian merchants.`,
                                  categoryName: selectedCategoryForView.name,
                                  tag: 'Specific Variety',
                                });
                                setCustomizingQty(1);
                                setCustomizingNotes('');
                                setCustomizingImg(typeImg);
                                setCustomizingImgs([]);
                                setActiveProductPhotoIdx(0);
                              }}
                            >
                              <div className="cd-prod-photo">
                                <img
                                  src={typeImg}
                                  alt={t.name}
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getProductImg(selectedCategoryForView.slug, selectedProductForTypes.name);
                                  }}
                                />
                              </div>
                              <div className="cd-prod-name">{t.name}</div>
                              <div className="cd-prod-range">₹{mid.toLocaleString('en-IN')} – ₹{high.toLocaleString('en-IN')}</div>
                              <button
                                type="button"
                                className="cat-add-btn"
                                style={{ marginTop: 8 }}
                              >
                                Select &amp; Customize
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
                        setActiveTab('bookslot');
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
              ) : selectedCategoryForView ? (
                /* Tier 2: Category Products / Sub-Categories Drill-Down */
                <div>
                  <button
                    className="back-row"
                    onClick={() => {
                      setSelectedCategoryForView(null);
                      setCatSearchQuery('');
                    }}
                    aria-label="Back to categories"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                    All Categories
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
                                    setSelectedProductForTypes(p);
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
                                    (e.target as HTMLImageElement).src = selectedCategoryForView.image;
                                  }}
                                />
                                {hasTypes ? (
                                  <span className="cat-prod-tag" style={{ background: '#0A3A6B', color: '#fff' }}>
                                    {p.types?.length} Varieties · Up to 4 pics
                                  </span>
                                ) : (
                                  <span className="cat-prod-tag">{p.tag || selectedCategoryForView.name}</span>
                                )}
                              </div>

                              {cardPhotos.length > 1 && (
                                <div className="cat-prod-thumbs-row">
                                  {cardPhotos.slice(0, 4).map((cPic, cIdx) => (
                                    <img
                                      key={cIdx}
                                      src={cPic}
                                      alt=""
                                      className="cat-prod-thumb-mini"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = prodImg;
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomizingProduct({
                                          ...p,
                                          image: prodImg,
                                          images: cardPhotos,
                                          categoryName: selectedCategoryForView.name,
                                        });
                                        setActiveProductPhotoIdx(cIdx);
                                      }}
                                    />
                                  ))}
                                  <span style={{ fontSize: 10, color: '#64748B', alignSelf: 'center', fontWeight: 700, marginLeft: 2 }}>
                                    {cardPhotos.slice(0, 4).length} pics
                                  </span>
                                </div>
                              )}

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
                                  style={hasTypes ? { background: '#0A3A6B', color: '#fff', borderColor: '#08264A' } : {}}
                                  onClick={() => {
                                    if (hasTypes) {
                                      setSelectedProductForTypes(p);
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
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                      Customize Product (4 pics) →
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
                        setActiveTab('bookslot');
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
              ) : (
                /* Tier 1: All Categories Grid */
                <div>
                  <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                    Back to Home
                  </button>
                  <div className="desk-header">
                    {renderSearchBar(false)}
                  </div>
                  <img className="corner-leaf" src="/images/decor/category-corner-leaf.png" alt="" aria-hidden="true" />
                  <div className="page-title">Categories</div>
                  <div className="page-sub">Browse authentic Indian categories, explore subcategories &amp; varieties, or tell us what you need.</div>

                  <div className="cat-page-grid" id="catPageGrid">
                    {categories.map(c => (
                      <div
                        key={c.id}
                        className="cat-tile"
                        style={{ backgroundImage: `url('${c.image}')` }}
                        onClick={() => {
                          setSelectedCategoryForView(c);
                          setSelectedProductForTypes(null);
                        }}
                      >
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
                  <div className="cat-leaves-decor" aria-hidden="true">
                    <img src="/images/decor/category-leaves.png" alt="" />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= SCREEN 3: REDESIGNED BOOKING FLOW ================= */}
          {activeTab === 'bookslot' && (
            <section className="screen active" data-screen="bookslot">
              <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back to Home
              </button>

              <div className="page-title">Book a Shopping Concierge</div>
              <div className="page-sub">Add what you want sourced, provide your delivery address, and reserve your dedicated shopping slot.</div>

              <div className="booking-wizard">
                {/* Luxury Connected Stepper Progress */}
                <div className="concierge-stepper-wrap">
                  <div className="concierge-stepper">
                    <div className="cs-track-line">
                      <div
                        className="cs-track-progress"
                        style={{
                          width: bookingStep === 1 ? '0%' : bookingStep === 2 ? '50%' : '100%',
                        }}
                      />
                    </div>

                    {/* Step 1 Node */}
                    <button
                      type="button"
                      className={`cs-step-item ${bookingStep === 1 ? 'active' : 'done'}`}
                      onClick={() => setBookingStep(1)}
                    >
                      <div className="cs-circle">
                        {bookingStep > 1 ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"/></svg>
                        ) : '1'}
                      </div>
                      <div className="cs-label">Sourcing Basket</div>
                      <div className="cs-hint">{cart.length} item{cart.length === 1 ? '' : 's'}</div>
                    </button>

                    {/* Step 2 Node */}
                    <button
                      type="button"
                      className={`cs-step-item ${bookingStep === 2 ? 'active' : bookingStep > 2 ? 'done' : ''}`}
                      disabled={cart.length === 0}
                      onClick={() => cart.length > 0 && setBookingStep(2)}
                    >
                      <div className="cs-circle">
                        {bookingStep > 2 ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"/></svg>
                        ) : '2'}
                      </div>
                      <div className="cs-label">Delivery &amp; Contact</div>
                      <div className="cs-hint">Global Address</div>
                    </button>

                    {/* Step 3 Node */}
                    <button
                      type="button"
                      className={`cs-step-item ${bookingStep === 3 ? 'active' : ''}`}
                      disabled={cart.length === 0}
                      onClick={() => cart.length > 0 && setBookingStep(3)}
                    >
                      <div className="cs-circle">3</div>
                      <div className="cs-label">Slot &amp; Timing</div>
                      <div className="cs-hint">Reserve Window</div>
                    </button>
                  </div>
                </div>

                {/* ================= STEP 1: SOURCING BASKET (MANDATORY ITEMS) ================= */}
                {bookingStep === 1 && (
                  <div className="luxury-step-card">
                    <div className="luxury-step-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="luxury-step-title">
                            <span>1. What would you like us to source?</span>
                          </div>
                          <div className="luxury-step-subtitle">
                            Add items from our catalog, describe custom items from your mind with photos, or paste online store links.
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: cart.length > 0 ? '#ECFDF5' : '#FEF2F2', color: cart.length > 0 ? '#065F46' : '#991B1B' }}>
                          {cart.length} item{cart.length === 1 ? '' : 's'} added
                        </span>
                      </div>
                    </div>

                    {/* Empty Guard Alert */}
                    {cart.length === 0 ? (
                      <div className="basket-guard-alert">
                        <div className="bga-ico">!</div>
                        <div className="bga-copy">
                          <h4>Sourcing Basket is Empty</h4>
                          <p>Please add at least one item below using any of the 3 sourcing options to proceed with slot booking.</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#081E3B', marginBottom: 10 }}>
                          Current Sourcing Items in your Request:
                        </div>
                        {cart.map(item => (
                          <div key={item.id} className="basket-item-row">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                              <img
                                src={item.image || '/images/categories/pooja-spiritual.jpg'}
                                alt=""
                                className="basket-item-thumb"
                              />
                              {item.images && item.images.length > 1 && (
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: 4 }}>
                                  {item.images.slice(0, 4).length} pics
                                </span>
                              )}
                            </div>
                            <div className="basket-item-info">
                              <span className={`basket-source-tag ${item.sourceType === 'online' ? 'tag-online' : item.sourceType === 'mind' ? 'tag-mind' : 'tag-catalog'}`}>
                                {item.sourceType === 'online' ? 'Online Store' : item.sourceType === 'mind' ? 'Customized Product' : 'Visasra Catalog'}
                              </span>
                              <div className="basket-item-title">{item.name}</div>
                              <div className="basket-item-meta">
                                Est. ₹{item.priceMin.toLocaleString('en-IN')} – ₹{item.priceMax.toLocaleString('en-IN')} · Qty: {item.qty}
                                {item.notes && <span> · &ldquo;{item.notes}&rdquo;</span>}
                              </div>
                              {item.images && item.images.length > 1 && (
                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                  {item.images.slice(0, 4).map((pic, pIdx) => (
                                    <img
                                      key={pIdx}
                                      src={pic}
                                      alt={`Pic ${pIdx + 1}`}
                                      style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #CBD5E1' }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="basket-actions-col">
                              <button
                                type="button"
                                className="basket-edit-btn"
                                onClick={() => handleStartEditCartItem(item)}
                                title="Edit item details"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="basket-del-btn"
                                onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Three Sourcing Tabs */}
                    <div style={{ borderTop: '1.5px solid #EEF2F6', paddingTop: 18 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#081E3B', marginBottom: 4 }}>
                        + Add Items to Your Sourcing Request
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>
                        Choose how you want to specify your items:
                      </div>

                      <div className="sourcing-source-tabs">
                        <button
                          type="button"
                          className={`src-tab-btn ${sourcingSourceTab === 'catalog' ? 'active' : ''}`}
                          onClick={() => setSourcingSourceTab('catalog')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          <span>From Categories</span>
                        </button>
                        <button
                          type="button"
                          className={`src-tab-btn ${sourcingSourceTab === 'mind' ? 'active' : ''}`}
                          onClick={() => setSourcingSourceTab('mind')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          <span>Customize Product</span>
                        </button>
                        <button
                          type="button"
                          className={`src-tab-btn ${sourcingSourceTab === 'online' ? 'active' : ''}`}
                          onClick={() => setSourcingSourceTab('online')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          <span>From Online Store</span>
                        </button>
                      </div>

                      {/* Source 1: From Categories */}
                      {sourcingSourceTab === 'catalog' && (
                        <div style={{ background: '#F8FAFD', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18 }}>
                          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10, color: '#081E3B' }}>
                            Select from Visasra&apos;s Curated Indian Specialties:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 14 }}>
                            {categories.slice(0, 8).map(c => (
                              <button
                                key={c.id}
                                type="button"
                                style={{
                                  padding: '9px 10px',
                                  borderRadius: 10,
                                  border: '1.5px solid #E2E8F0',
                                  background: '#fff',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  color: '#081E3B',
                                }}
                                onClick={() => {
                                  setSelectedCategoryForView(c);
                                  setActiveTab('categories');
                                }}
                              >
                                {c.name} →
                              </button>
                            ))}
                          </div>

                          <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>
                            Quick Popular Picks:
                          </div>
                          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                            {popularProducts.slice(0, 4).map(p => (
                              <div key={p.id} style={{ minWidth: 160, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 8 }}>
                                <img src={p.image} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} />
                                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: '#1261B5', fontWeight: 800, marginTop: 2 }}>Est. ₹{p.estMin} – ₹{p.estMax}</div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: 11, marginTop: 6 }}
                                  onClick={() => addToCart(p)}
                                >
                                  + Add to Basket
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Source 2: Customize Product (What's On Your Mind) */}
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
                              rows={2}
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

                          <button type="submit" className="btn-concierge-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            + Add Customized Product to Sourcing Basket
                          </button>
                        </form>
                      )}

                      {/* Source 3: From Online Platform */}
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

                          <button type="submit" className="btn-concierge-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            + Add Online Store Item to Basket
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Step 1 Next Action */}
                    <div className="wizard-actions">
                      <div style={{ fontSize: 12.5, color: '#64748B' }}>
                        {cart.length > 0 ? `✓ ${cart.length} item(s) ready for sourcing` : 'Add at least 1 item to proceed'}
                      </div>
                      <button
                        type="button"
                        className="btn-concierge-primary"
                        disabled={cart.length === 0}
                        onClick={() => {
                          if (cart.length === 0) {
                            showToast('Please add at least one item first');
                            return;
                          }
                          setBookingStep(2);
                        }}
                      >
                        <span>Continue to Delivery Details</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: DELIVERY DETAILS & CONTACT ================= */}
                {bookingStep === 2 && (
                  <div className="luxury-step-card">
                    <div className="luxury-step-header">
                      <div className="luxury-step-title">
                        <span>2. Delivery Destination &amp; Contact Details</span>
                      </div>
                      <div className="luxury-step-subtitle">
                        Where should we courier your purchases, and which mobile number should receive real-time session notifications?
                      </div>
                    </div>

                    {/* Contact Mobile */}
                    <div style={{ marginBottom: 22, background: '#F8FAFD', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#081E3B', marginBottom: 6 }}>
                        📱 Contact &amp; SMS Notification Number *
                      </label>
                      <input
                        type="tel"
                        className="inp"
                        placeholder="+1 (415) 890-1234 or +91 98765 43210"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                      />
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.45 }}>
                        ✨ Real-time slot reminders and order alerts will be sent to this number. Live curations and approvals happen directly in your Visasra live portal.
                      </div>
                    </div>

                    {/* Address Selection */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#081E3B', marginBottom: 10 }}>
                      Select International Shipping Destination:
                    </div>
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

                    {!isAddingAddress ? (
                      <button
                        type="button"
                        className="dl-add"
                        onClick={() => setIsAddingAddress(true)}
                        style={{ width: '100%', marginBottom: 16 }}
                      >
                        + Add new international address
                      </button>
                    ) : (
                      <div className="af" style={{ background: '#F8FAFD', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 18, marginBottom: 16 }}>
                        <div className="af-head">
                          <div className="af-title">New Delivery Address</div>
                          <button type="button" className="af-del" onClick={() => setIsAddingAddress(false)}>Close</button>
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
                              placeholder="+1 (415) 890-1234"
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
                              placeholder="Flat / House no, Street"
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
                              placeholder="State"
                              value={addressForm.region}
                              onChange={e => setAddressForm({ ...addressForm, region: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>Postal / Zip</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="Zip"
                              value={addressForm.zip}
                              onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                            />
                          </label>
                          <label className="af-f">
                            <span>Country</span>
                            <input
                              type="text"
                              className="inp"
                              placeholder="Country"
                              value={addressForm.country}
                              onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsAddingAddress(false)} style={{ flex: 1 }}>Cancel</button>
                          <button type="button" className="btn btn-primary" onClick={handleSaveNewAddress} style={{ flex: 2 }}>Save Address</button>
                        </div>
                      </div>
                    )}

                    <div className="wizard-actions">
                      <button
                        type="button"
                        className="btn-concierge-secondary"
                        onClick={() => setBookingStep(1)}
                      >
                        ← Back to Sourcing Basket
                      </button>
                      <button
                        type="button"
                        className="btn-concierge-primary"
                        onClick={() => setBookingStep(3)}
                      >
                        <span>Continue to Slot &amp; Timing</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: SLOT & TIMING (AT THE END) ================= */}
                {bookingStep === 3 && (
                  <div className="luxury-step-card">
                    <div className="luxury-step-header">
                      <div className="luxury-step-title">
                        <span>3. Choose Shopping Duration &amp; Time Window</span>
                      </div>
                      <div className="luxury-step-subtitle">
                        Select your dedicated shopping window. A verified ground shopper is assigned exclusively to source your items.
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
                          <div className="lux-dur-desc">Quick visit to 1–2 specific artisan stores. Ideal for 1–3 pre-decided items.</div>
                        </div>
                        <div className="lux-dur-perk">⚡ Live In-App Photo Approvals</div>
                      </div>

                      <div
                        className={`lux-dur-card ${slotDuration === 3 ? 'selected' : ''}`}
                        onClick={() => {
                          setSlotDuration(3);
                          setSelectedSlotWindow('11:00 AM – 2:00 PM (IST)');
                        }}
                      >
                        <div>
                          <span className="lux-dur-badge lux-badge-popular">★ Most Popular</span>
                          <div className="lux-dur-hours">3 Hours</div>
                          <div className="lux-dur-name">Comprehensive Concierge</div>
                          <div className="lux-dur-desc">Multi-store bazaar exploration. Compare fabric weaves, jewelry weights &amp; quality.</div>
                        </div>
                        <div className="lux-dur-perk">⚡ Real-Time In-Store Curation</div>
                      </div>

                      <div
                        className={`lux-dur-card ${slotDuration === 5 ? 'selected' : ''}`}
                        onClick={() => {
                          setSlotDuration(5);
                          setSelectedSlotWindow('11:00 AM – 4:00 PM (IST)');
                        }}
                      >
                        <div>
                          <span className="lux-dur-badge lux-badge-vip">VIP Concierge</span>
                          <div className="lux-dur-hours">5 Hours</div>
                          <div className="lux-dur-name">Full-Day Artisan Tour</div>
                          <div className="lux-dur-desc">Deep curation across multiple city bazaars, custom boutique tailoring, bridal and bulk sourcing.</div>
                        </div>
                        <div className="lux-dur-perk">👑 Senior Personal Stylist Assigned</div>
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
                        { id: 'w3-2', tag: 'Afternoon Curation', time: '2:30 PM – 5:30 PM (IST)', zone: 'Bazaar hunt + video inspection' },
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
                        { id: 'w5-1', tag: 'Full-Day Artisan Tour', time: '11:00 AM – 4:00 PM (IST)', zone: 'Multi-market deep curation across city' },
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
                                    src={cart[0]?.image || '/images/categories/pooja-spiritual.jpg'}
                                    alt={cart[0]?.name || 'Sourcing items'}
                                    className="ssc-primary-thumb"
                                  />
                                  {cart.length > 1 && (
                                    <span className="ssc-badge-more">+{cart.length - 1}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="ssc-title-row">
                                    <span className="ssc-service-tag">Personal Concierge</span>
                                    <div className="ssc-title">{cart[0]?.name || 'Artisan Sourcing Run'}</div>
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
                                <span className="ssc-icon">🕒</span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">All Slot Timing:</span>
                                  <span className="ssc-detail-val">{selectedDate} · {selectedSlotWindow} ({slotDuration} Hours)</span>
                                </div>
                              </div>

                              <div className="ssc-detail-pill">
                                <span className="ssc-icon">📍</span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">Delivery Address:</span>
                                  <span className="ssc-detail-val">
                                    {savedAddresses.find(a => a.id === selectedAddressId)?.name || user.name}
                                    {' · '}
                                    {savedAddresses.find(a => a.id === selectedAddressId)?.city || 'City'},{' '}
                                    {savedAddresses.find(a => a.id === selectedAddressId)?.country || 'US'}
                                  </span>
                                </div>
                              </div>

                              <div className="ssc-detail-pill">
                                <span className="ssc-icon">💳</span>
                                <div className="ssc-detail-text">
                                  <span className="ssc-detail-label">Payment Breakdown:</span>
                                  <span className="ssc-detail-val">
                                    ₹{currentSlotFee} Slot Fee (cut now) + ₹{merchandiseBudget.toLocaleString('en-IN')} Product Budget (held safely in wallet)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="ssc-action-banner" style={{ justifyContent: 'flex-end' }}>
                              <div className="ssc-view-trigger">
                                <span>View Trip Details</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* AbhiBus Inspired Trip Details Bottom Sheet Modal */}
                          {showTripDetailsModal && (
                            <div className="abhibus-modal-overlay" onClick={() => setShowTripDetailsModal(false)}>
                              <div className="abhibus-modal-wrapper" onClick={e => e.stopPropagation()}>
                                {/* Close circle button at top */}
                                <div className="abhibus-close-row">
                                  <button
                                    type="button"
                                    className="abhibus-close-btn"
                                    onClick={() => setShowTripDetailsModal(false)}
                                    aria-label="Close trip details"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </div>

                                <div className="abhibus-sheet">
                                  <div className="abhibus-sheet-header">
                                    <h2 className="abhibus-title">Trip Details</h2>
                                  </div>

                                  {/* Service Card (AbhiBus TGSRTC Header Card with Bus Photo) */}
                                  <div className="abhibus-service-card">
                                    <div className="absc-header">
                                      <div className="absc-header-text">
                                        <div className="absc-service-name">VISASRA SOURCING - {slotDuration}H PASS</div>
                                        <div className="absc-service-type">
                                          {slotDuration === 2 ? 'Super Express Sourcing (1–2 Stores)' : slotDuration === 3 ? 'Comprehensive Multi-Bazaar Concierge' : 'VIP Full-Day Artisan & Boutique Tour'}
                                        </div>
                                      </div>
                                      <div className="absc-thumb-box">
                                        <img
                                          src={cart[0]?.image || '/images/categories/pooja-spiritual.jpg'}
                                          alt={cart[0]?.name || 'Item'}
                                          className="absc-bus-img"
                                        />
                                      </div>
                                    </div>

                                    <div className="absc-divider" />

                                    {/* Timeline Stops */}
                                    <div className="absc-timeline">
                                      <div className="absc-stop">
                                        <div className="absc-stop-icon">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                        </div>
                                        <div className="absc-stop-content">
                                          <div className="absc-stop-city">Local Artisan Markets &amp; Stores</div>
                                          <div className="absc-stop-time">{selectedDate}, {selectedSlotWindow}</div>
                                        </div>
                                      </div>

                                      <div className="absc-timeline-line" />

                                      <div className="absc-stop">
                                        <div className="absc-stop-icon">
                                          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                        </div>
                                        <div className="absc-stop-content">
                                          <div className="absc-stop-city">
                                            {savedAddresses.find(a => a.id === selectedAddressId)?.city || 'Destination City'},{' '}
                                            {savedAddresses.find(a => a.id === selectedAddressId)?.country || 'United States'}
                                          </div>
                                          <div className="absc-stop-time">
                                            {savedAddresses.find(a => a.id === selectedAddressId)?.line1 || 'Doorstep Delivery'} (Insured Air Courier)
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Traveller & Seat / Sourcing Details */}
                                  <div className="abhibus-section">
                                    <div className="abhibus-section-title">TRAVELLER &amp; SEAT DETAILS</div>

                                    <div className="abhibus-traveller-row">
                                      <div className="abhibus-avatar">
                                        {(savedAddresses.find(a => a.id === selectedAddressId)?.name || user.name)
                                          .split(' ')
                                          .map(n => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase() || 'CU'}
                                      </div>
                                      <div className="abhibus-traveller-info">
                                        <div className="abhibus-traveller-name">
                                          {savedAddresses.find(a => a.id === selectedAddressId)?.name || user.name}
                                        </div>
                                        <div className="abhibus-traveller-sub">
                                          Verified Customer · {savedAddresses.find(a => a.id === selectedAddressId)?.country || 'USA'}
                                        </div>
                                      </div>
                                      <div className="abhibus-seat-badge">
                                        Seat No : {slotDuration}H-PASS
                                      </div>
                                    </div>

                                    {/* Mini Visual Seat Grid representation for Items */}
                                    <div className="abhibus-seat-mini-grid">
                                      <div className="abhibus-seat-grid-label">Reserved Sourcing Capacity ({cart.length} items):</div>
                                      <div className="abhibus-seat-slots">
                                        {cart.map((item, idx) => (
                                          <div key={item.id || idx} className="abhibus-seat-chip active">
                                            <img
                                              src={item.image || '/images/categories/pooja-spiritual.jpg'}
                                              alt={item.name}
                                            />
                                            <span>{item.name} (x{item.qty || 1}) · Est: ₹{(item.priceMax || item.priceMin || 1000).toLocaleString('en-IN')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Contact Details */}
                                  <div className="abhibus-section">
                                    <div className="abhibus-section-title">CONTACT DETAILS</div>
                                    <div className="abhibus-contact-sub">Your live shopping video call link &amp; store bills will be sent here:</div>
                                    <div className="abhibus-contact-card">
                                      <div className="abhibus-contact-phone">
                                        <span className="abhibus-contact-phone-icon">📞</span>
                                        <span>{customerPhone || savedAddresses.find(a => a.id === selectedAddressId)?.phone || user.phone}</span>
                                      </div>
                                      <span className="abhibus-wa-tag">WhatsApp Active</span>
                                    </div>
                                  </div>

                                  {/* Visasra Money & Payment Structure (Replaced old ₹199 deposit) */}
                                  <div className="abhibus-fare-card">
                                    <div className="absc-payment-title">VISASRA MONEY PAYMENT FLOW</div>
                                    
                                    <div className="absc-breakdown-row">
                                      <div className="absc-breakdown-label">
                                        <span>🛍️ Sourcing Merchandise Budget (Max)</span>
                                        <span className="absc-sub-tip">Estimated for {cart.length} item{cart.length > 1 ? 's' : ''} in basket</span>
                                      </div>
                                      <div className="absc-breakdown-val">₹{merchandiseBudget.toLocaleString('en-IN')}</div>
                                    </div>

                                    <div className="absc-breakdown-row">
                                      <div className="absc-breakdown-label">
                                        <span>⚡ Dedicated Shopper Slot Fee ({slotDuration}h)</span>
                                        <span className="absc-sub-tip">Deducted immediately to reserve ground personal shopper</span>
                                      </div>
                                      <div className="absc-breakdown-val" style={{ color: '#2563EB' }}>₹{currentSlotFee}</div>
                                    </div>

                                    <div className="absc-total-deposit-row">
                                      <div>
                                        <div className="absc-total-label">Total Required Deposit in Visasra Money</div>
                                        <div className="absc-total-sub">Full deposit required to confirm slot booking</div>
                                      </div>
                                      <div className="absc-total-amt">₹{totalDepositRequired.toLocaleString('en-IN')}</div>
                                    </div>

                                    {/* How Money Works 4-Step Breakdown */}
                                    <div className="absc-how-money-works">
                                      <div className="absc-step-item">
                                        <div className="absc-step-num">1</div>
                                        <div className="absc-step-text">
                                          <b>Deposit Upfront:</b> Deposit ₹{totalDepositRequired.toLocaleString('en-IN')} to Visasra Money to lock in your slot.
                                        </div>
                                      </div>
                                      <div className="absc-step-item">
                                        <div className="absc-step-num">2</div>
                                        <div className="absc-step-text">
                                          <b>Slot Fee Deducted:</b> ₹{currentSlotFee} is deducted automatically from your wallet when slot is confirmed.
                                        </div>
                                      </div>
                                      <div className="absc-step-item">
                                        <div className="absc-step-num">3</div>
                                        <div className="absc-step-text">
                                          <b>Live Sample Selection:</b> The remaining ₹{merchandiseBudget.toLocaleString('en-IN')} stays in your Visasra Money. When the shopper shares live samples and you choose one, only that exact item's price is deducted.
                                        </div>
                                      </div>
                                      <div className="absc-step-item">
                                        <div className="absc-step-num">4</div>
                                        <div className="absc-step-text">
                                          <b>Final Settlement:</b> Any leftover balance covers international packaging &amp; courier shipping fees at final dispatch.
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="abhibus-sheet-confirm-btn"
                                    onClick={() => setShowTripDetailsModal(false)}
                                  >
                                    Done &amp; Return to Booking
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sleek, Clean Visasra Money Balance Bar */}
                          <div
                            className={`visasra-money-pay-box ${walletShortfall > 0 ? 'needs-deposit' : 'sufficient'}`}
                            style={{
                              padding: '14px 18px',
                              borderRadius: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              marginBottom: 18,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: walletShortfall > 0 ? '#FEF3C7' : '#DCFCE7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              >
                                {walletShortfall > 0 ? '⚠️' : '👛'}
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                                  Visasra Money: ₹{user.walletBalance.toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                                  {walletShortfall > 0
                                    ? `Pay ₹${walletShortfall.toLocaleString('en-IN')} via Razorpay (UPI/Card) to complete deposit`
                                    : `₹${currentSlotFee} slot fee deducted upon confirmation`}
                                </div>
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 800,
                                padding: '5px 12px',
                                borderRadius: 8,
                                whiteSpace: 'nowrap',
                                background: walletShortfall > 0 ? '#FEF3C7' : '#DCFCE7',
                                color: walletShortfall > 0 ? '#B45309' : '#15803D',
                              }}
                            >
                              {walletShortfall > 0 ? `Razorpay: ₹${walletShortfall.toLocaleString('en-IN')}` : '✓ Ready'}
                            </span>
                          </div>

                          <div className="wizard-actions">
                            <button
                              type="button"
                              className="btn-concierge-secondary"
                              onClick={() => setBookingStep(2)}
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              className="btn-concierge-primary"
                              onClick={handleConfirmBooking}
                            >
                              {walletShortfall > 0 ? (
                                <span>Pay ₹{walletShortfall.toLocaleString('en-IN')} via Razorpay &amp; Book ({slotDuration}h)</span>
                              ) : (
                                <span>Confirm &amp; Book Slot ({slotDuration}h)</span>
                              )}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
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
            <section className="screen active" data-screen="orders">
              <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
              <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back
              </button>
              <div className="page-title">Orders</div>
              <div className="page-sub">Everything you've booked with us.</div>

              <div id="ordersList" style={{ marginTop: 16 }}>
                {orders.map(o => (
                  <div key={o.id} className="booking-card">
                    <div className="booking-strip"><span style={{ background: 'var(--gold)' }} /></div>
                    <div className="booking-main">
                      <div className="booking-top">
                        <div className="booking-top-left">
                          <img
                            src={o.items[0]?.image || '/images/categories/jewellery-accessories.jpg'}
                            alt=""
                            style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover' }}
                          />
                          <div>
                            <div className="booking-id">{o.orderNumber}</div>
                            <div className="booking-slot">{o.slotLabel || o.slotKey}</div>
                            <div className="booking-items">{o.items.map(i => i.name).join(', ')}</div>
                            <div className="booking-meta">{o.items.length} product(s)</div>
                          </div>
                        </div>
                        <div className="booking-total">₹{o.totalAmount}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <div className="status-pill">{o.trackingStage.replace(/_/g, ' ')}</div>
                        {o.orderType === 'online' && (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#EDE9FE', color: '#6D28D9' }}>
                            Online Concierge (Admin Procurement)
                          </span>
                        )}
                      </div>
                      {o.orderType !== 'online' && (o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping') && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#ECFDF5',
                          border: '1.2px solid #10B981',
                          borderRadius: 8,
                          padding: '6px 10px',
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#065F46'
                        }}>
                          <span className="live-pulsing-dot" style={{ width: 7, height: 7 }} />
                          <span>🟢 Personal Shopper Active in Market Right Now</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {o.orderType !== 'online' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary live-track-btn"
                            style={(o.trackingStage === 'shopping' || o.status === 'shopping') ? {
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                              border: 'none',
                            } : {}}
                            onClick={() => {
                              setLiveSessionSlot(o.slotKey);
                              setActiveTab('live-shopping');
                            }}
                          >
                            {(o.trackingStage === 'shopping' || o.status === 'shopping') ? '● Join Live Shopping' : 'Live Shopping'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="track-btn"
                          style={o.orderType === 'online' ? { background: 'var(--navy)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : {}}
                          onClick={() => setTrackOrderSlot(o.slotKey)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>
                          <span>{o.orderType === 'online' ? 'Track Procurement' : 'Track order'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= SCREEN 5: CART ================= */}
          {activeTab === 'cart' && (
            <section className="screen active" data-screen="cart">
              <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back
              </button>
              <div className="page-title">Cart</div>
              <div className="page-sub">A booking in progress, before it's confirmed.</div>

              <div id="cartBody" style={{ marginTop: 16 }}>
                {cart.length > 0 ? (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                          <img src={item.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="thumb" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                          {item.images && item.images.length > 1 && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: 4 }}>
                              {item.images.slice(0, 4).length} pics
                            </span>
                          )}
                        </div>
                        <div className="item-body">
                          <div className="item-name">{item.name}</div>
                          <div className="item-sub">₹{item.priceMin.toLocaleString('en-IN')} – ₹{item.priceMax.toLocaleString('en-IN')} each × {item.qty}</div>
                          {item.images && item.images.length > 1 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              {item.images.slice(0, 4).map((pic, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={pic}
                                  alt={`Pic ${pIdx + 1}`}
                                  style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                                />
                              ))}
                            </div>
                          )}
                          <div className="item-actions" style={{ marginTop: 8 }}>
                            <button className="icon-btn" onClick={() => setCart(cart.filter(i => i.id !== item.id))}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 20 }}>
                      <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={() => setActiveTab('bookslot')}>
                        Proceed to Slot Booking →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="card pad" style={{ textAlign: 'center', padding: '36px 20px' }}>
                    <b>Nothing in progress</b>
                    <p style={{ color: 'var(--text-dim)', margin: '6px 0 16px' }}>Start a booking and we'll keep it here until you confirm it.</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('categories')}>Start a booking</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= SCREEN 6: WALLET ================= */}
          {activeTab === 'wallet' && (
            <section className="screen active" data-screen="wallet">
              <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back
              </button>
              <div className="page-title">Visasra Money</div>
              <div className="page-sub">Your personal shopping wallet balance and complete transaction history.</div>

              <div className="wallet-card" style={{ marginTop: 14 }}>
                <div>
                  <div className="label">Available balance</div>
                  <div className="amount money">₹{user.walletBalance.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#9FC0E6', fontWeight: 600 }}>Zero hold fees</div>
                  <div style={{ fontSize: 12, color: '#EAF3FF', fontWeight: 700, marginTop: 2 }}>Instant live billing</div>
                </div>
              </div>

              {/* Redesigned Compact Top-Up Box */}
              <div className="wallet-topup-card">
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Add Money to Wallet</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                  Funds stay in your balance and are only utilized when you approve actual store receipts during live shopping.
                </div>

                <div className="wallet-quick-chips">
                  {[1000, 2500, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`wallet-quick-chip ${selectedQuickAmt === amt ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedQuickAmt(amt);
                        setCustomTopupAmt(String(amt));
                      }}
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="wallet-input-row">
                  <div className="wallet-currency-box">
                    <span>₹</span>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      placeholder="Enter amount"
                      value={customTopupAmt}
                      onChange={e => {
                        setCustomTopupAmt(e.target.value);
                        setSelectedQuickAmt(null);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="wallet-action-btn"
                    onClick={() => {
                      const num = Number(customTopupAmt);
                      if (!num || num <= 0) {
                        showToast('Please enter an amount greater than 0');
                        return;
                      }
                      handleAddMoney(num);
                    }}
                  >
                    + Add to Wallet
                  </button>
                </div>
              </div>

              <div className="section-title" style={{ marginTop: 24 }}>Transaction Activity</div>
              <div className="review-card" style={{ marginTop: 0 }}>
                {walletTransactions.length > 0 ? (
                  walletTransactions.map(tx => (
                    <div key={tx.id} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)' }}>
                      <div>
                        <b style={{ fontSize: 13.5 }}>{tx.note || (tx.type === 'credit' ? 'Wallet Deposit via Razorpay' : 'Slot Booking Fee')}</b>
                        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <b style={{ color: tx.type === 'credit' ? '#2F7D4A' : '#DC2626', fontSize: 14 }}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </b>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                    No wallet transactions yet. Top up using Razorpay to start live sourcing!
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= SCREEN 7: PROFILE ================= */}
          {activeTab === 'profile' && (
            <section className="screen active" data-screen="profile">
              <img className="corner-leaf" src="/images/decor/leaf-cluster.png" alt="" aria-hidden="true" />
              <button className="back-row" onClick={() => setActiveTab('home')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back
              </button>
              <div className="profile-head">
                <div className="avatar">AI</div>
                <div>
                  <div className="profile-name">{user.name}</div>
                  <div className="profile-loc">San Francisco, California · Phone: {customerPhone}</div>
                </div>
              </div>

              <div className="section-title" style={{ marginTop: 22 }}>Account</div>
              <div className="menu-card">
                <div className="row-link" onClick={() => setActiveTab('wallet')}>
                  <div className="ri"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1"/></svg></div>
                  <div className="rt">Visasra Money<span style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--gold-soft)', marginTop: 1 }} className="money">₹{user.walletBalance.toLocaleString('en-IN')}</span></div>
                  <div className="rc">›</div>
                </div>
                <div className="row-link" onClick={() => setActiveTab('orders')}>
                  <div className="ri"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
                  <div className="rt">Orders</div>
                  <div className="rc">›</div>
                </div>
                <div className="row-link" onClick={() => setActiveTab('addresses')}>
                  <div className="ri"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg></div>
                  <div className="rt">Delivery addresses<span style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-faint)', marginTop: 1 }}>{savedAddresses.length} saved · Primary: {customerPhone}</span></div>
                  <div className="rc">›</div>
                </div>
                <div className="row-link" onClick={handleLogout} style={{ color: '#DC2626' }}>
                  <div className="ri"><svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="M10 12h11M17 8l4 4-4 4"/></svg></div>
                  <div className="rt" style={{ fontWeight: 700 }}>Sign out of Visasra</div>
                  <div className="rc" style={{ color: '#DC2626' }}>›</div>
                </div>
              </div>
            </section>
          )}

          {/* ================= SCREEN 8: SAVED ADDRESSES ================= */}
          {activeTab === 'addresses' && (
            <section className="screen active" data-screen="addresses">
              <button className="back-row" onClick={() => setActiveTab('profile')} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                Back
              </button>
              <div className="page-title">Delivery addresses</div>
              <div className="page-sub">Addresses and phone numbers saved on your Visasra account.</div>

              <div className="dl-wrap dl-wrap-page" style={{ marginTop: 16 }}>
                <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className="addr-card">
                      <span className="addr-pin">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                          <circle cx="12" cy="9.5" r="2.4" />
                        </svg>
                      </span>
                      <div className="addr-body">
                        <div className="addr-name">
                          {addr.name} <span className="addr-tag">{addr.label}</span>
                        </div>
                        <div className="addr-lines">
                          {[addr.line1, addr.line2, addr.city, addr.region, addr.zip, addr.country].filter(Boolean).join(', ')}
                        </div>
                        <div className="addr-phone">{addr.phone}</div>
                      </div>
                      <button
                        type="button"
                        className="addr-edit"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                {!isAddingAddress ? (
                  <button type="button" className="dl-add" onClick={() => setIsAddingAddress(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add new address
                  </button>
                ) : (
                  <div className="af" style={{ background: '#F8FAFD', border: '1.5px solid var(--border)', borderRadius: 16, padding: 16 }}>
                    <div className="af-head">
                      <div className="af-title">Add New Address</div>
                      <button type="button" className="af-del" onClick={() => setIsAddingAddress(false)}>Close</button>
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
                        <span>Phone / Mobile</span>
                        <input
                          type="tel"
                          className="inp"
                          placeholder="+1 (415) 890-1234"
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
                          placeholder="Flat / House no, Building, Street"
                          value={addressForm.line1}
                          onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                        />
                      </label>
                      <label className="af-f af-full">
                        <span>Apartment, suite, landmark (optional)</span>
                        <input
                          type="text"
                          className="inp"
                          placeholder="Apartment or landmark"
                          value={addressForm.line2}
                          onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })}
                        />
                      </label>
                      <label className="af-f">
                        <span>City</span>
                        <input
                          type="text"
                          className="inp"
                          placeholder="e.g. San Francisco or London"
                          value={addressForm.city}
                          onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                        />
                      </label>
                      <label className="af-f">
                        <span>State / Province</span>
                        <input
                          type="text"
                          className="inp"
                          placeholder="e.g. California"
                          value={addressForm.region}
                          onChange={e => setAddressForm({ ...addressForm, region: e.target.value })}
                        />
                      </label>
                      <label className="af-f">
                        <span>Postal / ZIP code</span>
                        <input
                          type="text"
                          className="inp"
                          placeholder="e.g. 94107"
                          value={addressForm.zip}
                          onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                        />
                      </label>
                      <label className="af-f">
                        <span>Country</span>
                        <input
                          type="text"
                          className="inp"
                          placeholder="e.g. United States"
                          value={addressForm.country}
                          onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="af-foot" style={{ marginTop: 14 }}>
                      <div className="af-chips">
                        <span className="af-saveas">Label as:</span>
                        {(['Home', 'Office', 'Other'] as const).map(lbl => (
                          <button
                            key={lbl}
                            type="button"
                            className={`af-chip ${addressForm.label === lbl ? 'active' : ''}`}
                            onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsAddingAddress(false)} style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSaveNewAddress} style={{ flex: 2 }}>
                        Save address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= SCREEN 8: DEDICATED FULL-PAGE LIVE SHOPPING ================= */}
          {activeTab === 'live-shopping' && (
            <section className="screen active" data-screen="live-shopping">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <button className="back-row" onClick={() => setActiveTab('orders')} aria-label="Back" style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
                  Back to Orders
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span className="live-pulsing-badge">
                    <span className="live-pulsing-dot" />
                    LIVE IN-STORE CONCIERGE ACTIVE
                  </span>
                  {orders.length > 0 && (
                    <select
                      className="inp"
                      style={{ padding: '7px 14px', fontSize: 13, height: 'auto', width: 'auto', background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 10, fontWeight: 600, color: '#071D3A' }}
                      value={liveSessionSlot || (orders[0]?.slotKey || '')}
                      onChange={e => setLiveSessionSlot(e.target.value)}
                    >
                      {orders.map(o => (
                        <option key={o.slotKey} value={o.slotKey}>{o.orderNumber} ({o.slotLabel || o.slotKey})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Concierge Live Header */}
              <div className="shopper-banner-hero" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div className="shopper-avatar-ring">
                    <span style={{ fontSize: 17, fontWeight: 800, color: '#BAE6FD', letterSpacing: 0.5 }}>
                      {(liveSessionData?.shopper?.name || 'Personal Concierge').split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: 19, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.2px' }}>
                        {liveSessionData?.shopper?.name || 'Personal Shopper'}
                      </h2>
                      <span className="shopper-rating-badge">
                        ★ {liveSessionData?.shopper?.rating || '4.9'} · Verified Concierge
                      </span>
                    </div>
                    <div style={{ color: '#BAE6FD', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {liveSessionData?.store?.name ? `At ${liveSessionData.store.name}` : 'In-store at local markets across India'}
                    </div>
                  </div>
                </div>

                <div className="sbh-concierge-panel">
                  <div className="sbh-live-indicator">
                    <span className="sbh-live-beacon" />
                    Live in Store
                  </div>
                </div>
              </div>

              {/* 2-Column Live Session Workspace */}
              <div className="live-layout-2col">
                {/* Column 1: Items & Suggestions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                      In-Store Curations &amp; Suggestions
                    </h3>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', background: '#F1F5F9', padding: '3px 10px', borderRadius: 999 }}>
                      {liveSessionData?.products?.length || 0} Item(s) in Scope
                    </span>
                  </div>

                  {liveSessionLoading && !liveSessionData ? (
                    <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                        Connecting with Ground Shopper at Store Floor...
                      </div>
                      <p style={{ margin: 0, fontSize: 13 }}>Syncing live recommendations, real-time tags, and high-res store photos.</p>
                    </div>
                  ) : liveSessionData?.products && liveSessionData.products.length > 0 ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {liveSessionData.products.map((item, itemIdx) => (
                        <div key={item.itemId || itemIdx} className="live-item-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#0A3A6B', textTransform: 'uppercase', letterSpacing: 0.6, background: '#EFF6FF', display: 'inline-block', padding: '2px 8px', borderRadius: 6, marginBottom: 4 }}>
                                Sourced Item #{itemIdx + 1}
                              </div>
                              <h4 style={{ margin: '2px 0 0', fontSize: 18, color: 'var(--text)', fontWeight: 800 }}>{item.name}</h4>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 0 }}>
                              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Quantity: <b>{item.qty}</b></div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#0A3A6B', marginTop: 3 }}>
                                Target Budget: ₹{item.estMin} – ₹{item.estMax}
                              </div>
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3A6B" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                Shopper Recommendations ({item.options?.length || 0})
                              </span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>Verified genuine in-store options</span>
                            </div>

                            {item.options && item.options.length > 0 ? (
                              <div style={{ display: 'grid', gap: 14 }}>
                                {item.options.map((opt, optIdx) => (
                                  <div
                                    key={opt.id}
                                    className={`live-suggestion-card ${opt.status === 'approved' ? 'approved' : opt.status === 'rejected' ? 'rejected' : 'pending'}`}
                                  >
                                    <div className="live-sugg-content-row" style={{ display: 'flex', gap: 16 }}>
                                      <div className="live-sugg-img-wrapper">
                                        <img
                                          src={opt.image || '/images/categories/jewellery-accessories.jpg'}
                                          alt=""
                                          className="live-sugg-img"
                                          onError={(e) => {
                                             (e.target as HTMLImageElement).src = '/images/categories/jewellery-accessories.jpg';
                                          }}
                                        />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Suggestion #{optIdx + 1}
                                          </span>
                                          <span className={`live-tag-${opt.status}`}>
                                            {opt.status === 'approved' ? '✓ Approved & Reserved' : opt.status === 'rejected' ? '✕ Alternative Requested' : '⏳ Awaiting Your Approval'}
                                          </span>
                                        </div>
                                        <div className="live-sugg-price" style={{ flexWrap: 'wrap' }}>
                                          ₹{opt.price.toLocaleString('en-IN')}
                                          <span className="live-sugg-price-usd">(~${Math.round(opt.price / 83)} USD)</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4, wordBreak: 'break-word' }}>
                                          {opt.description || 'Verified authentic item option selected in-store by shopper.'}
                                        </div>
                                      </div>
                                    </div>

                                    {opt.status === 'pending' && (
                                      <div className="live-sugg-actions" style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                                        <button
                                          type="button"
                                          className="btn-live-approve"
                                          style={user.walletBalance < opt.price * (item.qty || 1) ? {
                                            background: 'linear-gradient(135deg, #D97706, #B45309)',
                                            boxShadow: '0 6px 16px rgba(180, 83, 9, 0.35)',
                                          } : {}}
                                          onClick={() => handleApproveOption(item.itemId, opt.id, item, opt)}
                                        >
                                          {user.walletBalance < opt.price * (item.qty || 1)
                                            ? `⚡ Top-Up ₹${(opt.price * (item.qty || 1) - user.walletBalance).toLocaleString('en-IN')} & Approve`
                                            : `✓ Approve Option (₹${opt.price.toLocaleString('en-IN')})`}
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-live-reject"
                                          onClick={() => handleRejectOption(item.itemId, opt.id)}
                                        >
                                          ✕ Request Alternative
                                        </button>
                                      </div>
                                    )}

                                    {opt.status === 'approved' && (
                                      <div className="live-approved-banner">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                          <span>Reserved for billing! Shopper will include authentic GST store invoice.</span>
                                        </div>
                                        <button type="button" className="btn-live-undo" onClick={() => handleRejectOption(item.itemId, opt.id)}>
                                          Change Decision
                                        </button>
                                      </div>
                                    )}

                                    {opt.status === 'rejected' && (
                                      <div className="live-rejected-banner">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                          <span>Alternative requested. Shopper is inspecting other designs.</span>
                                        </div>
                                        <button type="button" className="btn-live-undo" onClick={() => handleApproveOption(item.itemId, opt.id, item, opt)}>
                                          Re-evaluate
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 22, textAlign: 'center', border: '1.5px dashed #CBD5E1' }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                                  Shopper is selecting options in the market...
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                  Photos and prices from the store will appear here as items are found.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card pad" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                      No items found for this slot session.
                    </div>
                  )}
                </div>

                {/* Column 2: Running Tally, Verification & Live Chat */}
                <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
                  {/* Live Running Tally */}
                  <div className="live-tally-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div className="live-tally-title">Session Running Tally</div>
                      <span className="live-status-badge">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7' }}></span>
                        Live Sync
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="live-tally-row">
                        <span>Slot Deposit Credit</span>
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>-₹199</span>
                      </div>
                      <div className="live-tally-row">
                        <span>Approved Items ({liveSessionData?.products?.reduce((acc, p) => acc + (p.options?.filter(o => o.status === 'approved').length || 0), 0) || 0})</span>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                          ₹{(liveSessionData?.products?.reduce((acc, p) => acc + (p.options?.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0) || 0), 0) || 2440).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="live-tally-row">
                        <span>Official GST Store Bills</span>
                        <span style={{ color: '#16A34A', fontWeight: 600 }}>Included (Verified)</span>
                      </div>
                      <div className="live-tally-row">
                        <span>International QC &amp; Vault</span>
                        <span style={{ color: 'var(--text-dim)' }}>Complimentary</span>
                      </div>
                      <div className="live-tally-divider" />
                      <div className="live-tally-total">
                        <span>Total Payable at Checkout</span>
                        <span style={{ color: '#0A3A6B' }}>₹{Math.max(0, ((liveSessionData?.products?.reduce((acc, p) => acc + (p.options?.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0) || 0), 0) || 2440) - 199)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Wallet Balance: <b style={{ color: '#071D3A' }}>₹{user.walletBalance.toLocaleString('en-IN')}</b></span>
                      <button type="button" className="btn btn-sm btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setActiveTab('wallet')}>+ Top Up</button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 16, justifyContent: 'center', padding: '12px 18px', fontSize: 14, fontWeight: 800 }}
                      onClick={() => {
                        setActiveTab('cart');
                        showToast('Approved items transferred to checkout cart');
                      }}
                    >
                      Proceed to Secure Checkout →
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11.5, color: 'var(--text-dim)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      100% Escrow Protected · Authentic Store Bills
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="bottomnav" id="bottomnav">
          <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11L12 4l8 7"/><path d="M6 10v9h5v-5h2v5h5v-9"/></svg>
            Home
          </button>
          <button className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/></svg>
            Categories
          </button>
          <button className={`nav-btn ${activeTab === 'bookslot' ? 'active' : ''}`} onClick={() => setActiveTab('bookslot')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M12 13v5M9.5 15.5h5"/></svg>
            Book Slot
          </button>
          <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
            Orders
          </button>
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
            Profile
          </button>
        </nav>
      </div>

      {/* Product Customization & Add Modal */}
      {customizingProduct && (() => {
        const catSlugClean = productSlug(customizingProduct.categoryName || 'mens-fashion');
        const fallbackCatImg = `/images/categories/${catSlugClean}.jpg`;
        const baseImg = customizingProduct.image || fallbackCatImg;

        const availablePhotos: string[] = (customizingProduct.images && customizingProduct.images.length > 0)
          ? customizingProduct.images.slice(0, 4)
          : (customizingProduct.types && customizingProduct.types.length > 0 && customizingProduct.categoryName)
            ? [
                baseImg,
                ...customizingProduct.types.slice(0, 3).map(t => getTypeImg(catSlugClean, customizingProduct.name, t.name))
              ].slice(0, 4)
            : [baseImg];

        const activeDisplayPhoto = availablePhotos[activeProductPhotoIdx] || baseImg;

        return (
          <div className="modal-overlay" onClick={() => setCustomizingProduct(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)' }}>Customize Product</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{customizingProduct.categoryName || 'Catalog Specialty'}</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setCustomizingProduct(null)}>✕</button>
              </div>

              {/* 4-Photo Showcase Gallery */}
              <div className="product-modal-gallery">
                <div className="pmg-main-photo-wrap">
                  <img
                    src={activeDisplayPhoto}
                    alt={customizingProduct.name}
                    className="pmg-main-img"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes(fallbackCatImg)) {
                        img.src = fallbackCatImg;
                      } else {
                        img.src = '/images/categories/mens-fashion.jpg';
                      }
                    }}
                  />
                  <span className="pmg-photo-tag">
                    {availablePhotos.length > 1 ? `Pic ${activeProductPhotoIdx + 1} of ${availablePhotos.length}` : 'Official Product'}
                  </span>
                </div>

                {availablePhotos.length > 1 && (
                  <div className="pmg-thumbs-row">
                    {availablePhotos.map((photoUrl, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        className={`pmg-thumb-btn ${activeProductPhotoIdx === pIdx ? 'active' : ''}`}
                        onClick={() => setActiveProductPhotoIdx(pIdx)}
                        title={`View Photo ${pIdx + 1}`}
                      >
                        <img
                          src={photoUrl}
                          alt=""
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = fallbackCatImg;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{customizingProduct.name}</div>
                    <div style={{ fontSize: 13, color: '#1261B5', fontWeight: 800, marginTop: 2 }}>
                      Est. Budget: ₹{customizingProduct.estMin.toLocaleString('en-IN')} – ₹{customizingProduct.estMax.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    Up to 4 pics attached<br />by ground shopper
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => setCustomizingQty(Math.max(1, customizingQty - 1))}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{customizingQty}</span>
                  <button
                    type="button"
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => setCustomizingQty(customizingQty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                  What&apos;s on your mind? Custom Specifications &amp; Preferences
                </label>
                <textarea
                  className="inp"
                  rows={2}
                  placeholder="What's on your mind? e.g. Size M, Peacock blue color, GRT Silks preferred, matte gold finish..."
                  value={customizingNotes}
                  onChange={e => setCustomizingNotes(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                {renderMultiImageUploadBox(
                  customizingImgs,
                  setCustomizingImgs,
                  'Upload Reference Photos / Sketches (Up to 4 Pics)',
                  'Add up to 4 photos or sketches from your device so your shopper gets the exact match'
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-concierge-secondary" onClick={() => setCustomizingProduct(null)} style={{ flex: 1, padding: '12px' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-concierge-primary"
                  onClick={handleAddCustomizedCatalogProduct}
                  style={{ flex: 2, padding: '12px', justifyContent: 'center' }}
                >
                  + Add to Sourcing Basket
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Order Tracking Modal */}
      {trackOrderSlot && (
        <div className="modal-overlay" onClick={() => setTrackOrderSlot(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, color: '#0F172A' }}>Order Tracking</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#E0F2FE', color: '#0369A1' }}>
                    {trackingData?.orderNumber || 'VIS-92014'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Slot: <b>{trackingData?.slotLabel || trackOrderSlot}</b>
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setTrackOrderSlot(null)} style={{ fontSize: 13, padding: '4px 10px' }}>Close</button>
            </div>

            {/* Simple 4-Step Progress Bar */}
            {(() => {
              const status = trackingData?.orderStatus || 'confirmed';
              const isDelivered = status === 'delivered';
              const isShipped = isDelivered || status === 'shipped';
              const isPacked = isShipped || status === 'packed';
              const isSourced = isPacked || ['purchased', 'bought', 'approved'].includes(status) || trackingData?.items?.some((i: any) => i.status === 'purchased');
              const isConfirmed = true;

              const steps = [
                { label: 'Order Placed', done: isSourced, current: !isSourced && isConfirmed },
                { label: trackingData?.orderType === 'online' ? 'Procured' : 'Sourced', done: isPacked, current: isSourced && !isPacked },
                { label: 'Shipped', done: isDelivered, current: isPacked && !isDelivered },
                { label: 'Delivered', done: isDelivered, current: isDelivered },
              ];

              const progressPct = isDelivered ? '100%' : isShipped ? '70%' : isSourced ? '40%' : '10%';

              return (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 10px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Background Progress Track */}
                    <div style={{ position: 'absolute', top: 12, left: '12%', right: '12%', height: 3, background: '#E2E8F0', zIndex: 0 }}>
                      <div style={{ height: '100%', background: '#22C55E', width: progressPct, transition: 'width 0.3s ease' }} />
                    </div>

                    {steps.map((s, idx) => (
                      <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '24%' }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: s.done ? '#22C55E' : s.current ? '#0284C7' : '#fff',
                            border: s.done || s.current ? 'none' : '2px solid #CBD5E1',
                            color: s.done || s.current ? '#fff' : '#94A3B8',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            boxShadow: s.current ? '0 0 0 4px rgba(2, 132, 199, 0.18)' : 'none',
                          }}
                        >
                          {s.done ? '✓' : idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: s.current ? 800 : 600,
                            color: s.current ? '#0284C7' : s.done ? '#1E293B' : '#94A3B8',
                            marginTop: 6,
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Shopper / Sourcing Badge (Physical Market Orders) */}
            {trackingData?.orderType !== 'online' && trackingData?.shopper && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
                    {trackingData.shopper.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0369A1' }}>{trackingData.shopper.name}</div>
                    <div style={{ fontSize: 11, color: '#0284C7' }}>Personal Shopper · {trackingData.store?.name || 'Local Store'}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>
                  ● Active
                </span>
              </div>
            )}

            {/* Items Summary (Simple & Clean) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Items ({trackingData?.items?.length || 0})
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {trackingData?.items?.map((it: any) => {
                  const isBought = it.status === 'purchased';
                  const isApproved = it.status === 'approved';
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 16 }}>{it.sourceType === 'online' ? '📦' : '🛍️'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                            {it.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Qty: {it.qty || 1} · {it.onlinePlatform || 'In-Store'}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isBought ? '#DCFCE7' : isApproved ? '#EFF6FF' : '#FEF3C7',
                          color: isBought ? '#166534' : isApproved ? '#1E40AF' : '#92400E',
                          flexShrink: 0,
                        }}
                      >
                        {isBought ? '✓ Purchased' : isApproved ? 'Approved' : 'Procuring'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simple Delivery Note */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#64748B', textAlign: 'center' }}>
              Shipped via Express International Courier directly to your doorstep.
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Balance Top-up & Approval Modal */}
      {insufficientBalanceModal && (
        <div className="topup-guard-overlay" onClick={() => setInsufficientBalanceModal(null)}>
          <div className="topup-guard-card" onClick={e => e.stopPropagation()}>
            <div className="topup-guard-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Visasra Money Top-Up Needed</h3>
                  <div style={{ fontSize: 12, color: '#BAE6FD', marginTop: 2 }}>Instant deposit via Razorpay to approve item</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInsufficientBalanceModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div className="topup-guard-body">
              <div className="topup-item-summary">
                <img
                  src={insufficientBalanceModal.itemImage || '/images/categories/jewellery-accessories.jpg'}
                  alt=""
                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {insufficientBalanceModal.itemName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Quantity: {insufficientBalanceModal.qty} · In-Store Verified Option
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A', fontSize: 15 }}>
                  ₹{insufficientBalanceModal.requiredAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="topup-balance-breakdown">
                <div className="topup-breakdown-row">
                  <span>Item Total Price</span>
                  <span>₹{insufficientBalanceModal.requiredAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="topup-breakdown-row">
                  <span>Current Visasra Money Balance</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>₹{insufficientBalanceModal.currentBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="topup-breakdown-row shortfall">
                  <span>Shortfall to Deposit</span>
                  <span>₹{insufficientBalanceModal.shortfall.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                className="topup-action-btn"
                onClick={() => handleTopupAndApprove(insufficientBalanceModal.shortfall)}
              >
                <span>⚡ Pay ₹{insufficientBalanceModal.shortfall.toLocaleString('en-IN')} via Razorpay &amp; Approve</span>
              </button>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[1000, 2000, 5000].map(extra => (
                  <button
                    key={extra}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleTopupAndApprove(insufficientBalanceModal.shortfall + extra)}
                  >
                    +₹{extra} buffer
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', marginTop: 14 }}>
                Instant deposit via UPI, GPay, PhonePe, Cards &amp; NetBanking. Item is approved immediately after payment.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sourcing Basket Item Modal */}
      {editingCartItem && (
        <div className="edit-basket-overlay" onClick={() => setEditingCartItem(null)}>
          <div className="edit-basket-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className={`basket-source-tag ${editingCartItem.sourceType === 'online' ? 'tag-online' : editingCartItem.sourceType === 'mind' ? 'tag-mind' : 'tag-catalog'}`} style={{ marginBottom: 6 }}>
                  {editingCartItem.sourceType === 'online' ? 'Online Store Item' : editingCartItem.sourceType === 'mind' ? 'Customized Product' : 'Catalog Item'}
                </span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  Edit Sourcing Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCartItem(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B', padding: '0 4px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditCartItem}>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Item Name / Title *</span>
                <input
                  type="text"
                  className="inp"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="e.g. Traditional Temple Jewellery Set"
                  required
                />
              </label>

              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Specifications / Notes</span>
                <textarea
                  className="inp"
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="e.g. Peacock motif, antique matte gold, approx 22-inch length"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <label>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>Min Budget (₹)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="inp"
                    placeholder="0"
                    value={editMin}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditMin(val.replace(/^0+(?=\d)/, ''));
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
                    value={editMax}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditMax(val.replace(/^0+(?=\d)/, ''));
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
                    value={editQty}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEditQty(val.replace(/^0+(?=\d)/, ''));
                    }}
                  />
                </label>
              </div>

              {renderMultiImageUploadBox(
                editImgs,
                setEditImgs,
                'Reference Photos / Sketches (Up to 4)',
                'Add photos to guide your concierge'
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCartItem(null)}
                  style={{ padding: '9px 18px', borderRadius: 10 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: '#0A3A6B', color: '#fff', fontWeight: 700, padding: '9px 22px', borderRadius: 10 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastMsg ? 'show on' : ''}`}>{toastMsg}</div>
    </>
  );
}
