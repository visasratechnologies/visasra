'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import '@/styles/worker.css';


// =====================================================================
// CONSTANTS & HELPERS (Mirroring visasra-app/worker/worker.js)
// =====================================================================
const PAY_PER_SLOT = 350;
const MAX_OPTIONS = 6;
const ACCEPT_LEAD_MS = 4 * 3600000; // 4 hours lead time

const SLOT_START: Record<string, number> = (() => {
  const m: Record<string, number> = { t1: 9, t2: 11, t3: 14, t4: 16 };
  [2, 3, 5].forEach((dur) => {
    for (let h = 11, n = 1; h + dur <= 21; h += dur, n++) m['h' + dur + '-' + n] = h;
  });
  return m;
})();

const SLOT_END: Record<string, number> = (() => {
  const m: Record<string, number> = { t1: 11, t2: 13, t3: 16, t4: 18 };
  [2, 3, 5].forEach((dur) => {
    for (let h = 11, n = 1; h + dur <= 21; h += dur, n++) m['h' + dur + '-' + n] = h + dur;
  });
  return m;
})();

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtH = (h: number) => (h % 12 || 12) + ':00 ' + (h < 12 ? 'AM' : 'PM');
const inr = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const isoOf = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayIso = () => isoOf(new Date());

const DOCS_CONFIG: Record<string, [string, string]> = {
  af: ['Aadhaar — front', 'Front side with your photo and name'],
  ab: ['Aadhaar — back', 'Back side with your address'],
  pan: ['PAN card', 'Clear photo of the whole card'],
  dl: ["Driver's license", 'Front side, clear and fully visible'],
  ph: ['Your photo', 'A clear photo of your face, no sunglasses or cap'],
};

// SVG Icons
const svg = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);

const ICONS = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  slots: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.4-4 4.4-6 8-6s6.6 2 8 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  cam: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bell: '<path d="M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
};

// =====================================================================
// INTERFACES
// =====================================================================
interface ProductOption {
  id: string;
  image: string;
  price: number;
  description: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'not_chosen'
  store?: string;
}

interface OrderItem {
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

interface LiveSession {
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

interface WorkerProfile {
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

interface WorkerNotification {
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

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export default function WorkerApp() {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Good day,');
  const [todayDateStr, setTodayDateStr] = useState('2026-10-14');

  const [screen, setScreen] = useState<
    'home' | 'slots' | 'map' | 'earn' | 'profile' | 'detail' | 'list' | 'prod' | 'add' | 'complete' | 'notes' | 'login' | 'otp' | 'forgot' | 'kycform' | 'kycwait' | 'kycrej'
  >('login');

  const [activeTab, setActiveTab] = useState<'home' | 'slots' | 'map' | 'earn' | 'profile'>('home');
  const [slotsTab, setSlotsTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [earnTab, setEarnTab] = useState<'hist' | 'pay' | 'emerg'>('hist');

  // Selected item / job pointers
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Worker & Session State - strictly real PostgreSQL data (no mock fallbacks)
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [notifications, setNotifications] = useState<WorkerNotification[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  // Auth Modes & State: 'signin' | 'signup' | 'forgot'
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  // 1. Sign In (Mobile Number or Email)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // 2. Sign Up (NO Aadhaar! Name, mobile number, mail id, password, email OTP)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [signupOtpDigits, setSignupOtpDigits] = useState(['', '', '', '', '', '']);
  // 3. Forgot Password for Email
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotOtpDigits, setForgotOtpDigits] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [otpShake, setOtpShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 4. Post-Login Application Form (Gated Access)
  const [appFullName, setAppFullName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appAltPhone, setAppAltPhone] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appCurrentAddress, setAppCurrentAddress] = useState('');
  const [appPermanentAddress, setAppPermanentAddress] = useState('');
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [appAadhaarNumber, setAppAadhaarNumber] = useState('');
  const [appAadhaarFront, setAppAadhaarFront] = useState('');
  const [appAadhaarBack, setAppAadhaarBack] = useState('');
  const [appPanNumber, setAppPanNumber] = useState('');
  const [appPanDoc, setAppPanDoc] = useState('');
  const [appDlNumber, setAppDlNumber] = useState('');
  const [appDlDoc, setAppDlDoc] = useState('');
  const [appSelfie, setAppSelfie] = useState('');
  const [appBankName, setAppBankName] = useState('');
  const [appBankBranch, setAppBankBranch] = useState('');
  const [appBankAccountNumber, setAppBankAccountNumber] = useState('');
  const [appBankConfirmAccountNumber, setAppBankConfirmAccountNumber] = useState('');
  const [appBankIfscCode, setAppBankIfscCode] = useState('');
  const [appPayoutUpi, setAppPayoutUpi] = useState('');
  const [appConsent, setAppConsent] = useState(false);
  const [appSubmitting, setAppSubmitting] = useState(false);

  // Edit Bank Modal State on Profile Screen
  const [showBankModal, setShowBankModal] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editBankConfirmAccountNumber, setEditBankConfirmAccountNumber] = useState('');
  const [editBankIfscCode, setEditBankIfscCode] = useState('');
  const [editPayoutUpi, setEditPayoutUpi] = useState('');
  const [bankUpdating, setBankUpdating] = useState(false);

  // Add Option Form State
  const [optionImage, setOptionImage] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [optionStore, setOptionStore] = useState('');
  const [optionNote, setOptionNote] = useState('');

  // Shop QR Upload State
  const [shopQrImage, setShopQrImage] = useState('');

  // Complete & Warehouse Handover State
  const [finalPackingNote, setFinalPackingNote] = useState('');
  const [warehouseOtp, setWarehouseOtp] = useState('');
  const [handoverVerified, setHandoverVerified] = useState(false);

  const showToast = (t: string) => {
    setToastMsg(t);
    setTimeout(() => setToastMsg(''), 2600);
  };

  // Helper to populate application form fields from worker data
  const populateAppState = (w: WorkerProfile) => {
    setAppFullName(w.name || '');
    setAppPhone(w.phone || '');
    setAppEmail(w.email || '');
    setAppAltPhone(w.altPhone || '');
    setAppCurrentAddress(w.currentAddress || '');
    setAppPermanentAddress(w.permanentAddress || '');
    setAppAadhaarNumber(w.aadhaarNumber ? w.aadhaarNumber.replace(/(\d{4})(?=\d)/g, '$1 ') : '');
    setAppPanNumber(w.panNumber || '');
    setAppDlNumber(w.drivingLicenseNumber || '');
    if (w.aadhaarFront) setAppAadhaarFront(w.aadhaarFront);
    if (w.aadhaarBack) setAppAadhaarBack(w.aadhaarBack);
    if (w.panDoc) setAppPanDoc(w.panDoc);
    if (w.drivingLicenseDoc) setAppDlDoc(w.drivingLicenseDoc);
    if (w.selfie) setAppSelfie(w.selfie);
    setAppBankName(w.bankName || '');
    setAppBankBranch(w.bankBranch || '');
    setAppBankAccountNumber(w.bankAccountNumber || '');
    setAppBankConfirmAccountNumber(w.bankAccountNumber || '');
    setAppBankIfscCode(w.bankIfscCode || '');
    setAppPayoutUpi(w.payoutUpi || '');
  };

  const openBankModal = () => {
    setEditBankName(worker?.bankName || '');
    setEditBankBranch(worker?.bankBranch || '');
    setEditBankAccountNumber(worker?.bankAccountNumber || '');
    setEditBankConfirmAccountNumber(worker?.bankAccountNumber || '');
    setEditBankIfscCode(worker?.bankIfscCode || '');
    setEditPayoutUpi(worker?.payoutUpi || '');
    setShowBankModal(true);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAcc = editBankAccountNumber.trim();
    if (!cleanAcc || cleanAcc.replace(/\D/g, '').length < 8) {
      showToast('Please enter a valid Account Number (min 8 digits)');
      return;
    }
    if (cleanAcc !== editBankConfirmAccountNumber.trim()) {
      showToast('Account numbers do not match');
      return;
    }
    const cleanIfsc = editBankIfscCode.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      showToast('IFSC Code must be exactly 11 characters');
      return;
    }
    setBankUpdating(true);
    try {
      const res = await fetch('/api/worker/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker?.id,
          phone: worker?.phone,
          email: worker?.email,
          bankAccountNumber: cleanAcc,
          bankIfscCode: cleanIfsc,
          bankName: editBankName.trim() || 'HDFC Bank',
          bankBranch: editBankBranch.trim() || 'Chennai',
          payoutUpi: editPayoutUpi.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.worker) {
        setWorker(data.worker);
        localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(data.worker));
        showToast('Bank details updated successfully!');
        setShowBankModal(false);
      } else {
        showToast(data.error || 'Failed to update bank details');
      }
    } catch {
      showToast('Network error updating bank details');
    } finally {
      setBankUpdating(false);
    }
  };

  // -------------------------------------------------------------------
  // INITIALIZATION & PERSISTENCE
  // -------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);
    const d = new Date();
    const h = d.getHours();
    setGreeting(h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,');
    setTodayDateStr(isoOf(d));

    try {
      const savedWorker = localStorage.getItem('visasra_worker_profile_v1');
      if (savedWorker) {
        const parsed: WorkerProfile = JSON.parse(savedWorker);
        setWorker(parsed);
        populateAppState(parsed);

        // Strict Gated Access: route based on verification status
        if (parsed.kycStatus === 'pending') {
          setScreen('kycwait');
        } else if (parsed.kycStatus === 'rejected') {
          setScreen('kycrej');
        } else if (parsed.kycStatus === 'verified' || parsed.kycStatus === 'approved') {
          setScreen('home');
          setActiveTab('home');
        } else {
          setScreen('kycform');
        }
      } else {
        setScreen('login');
      }
      const savedNotes = localStorage.getItem('visasra_worker_notes_v1');
      if (savedNotes) {
        setNotifications(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.error('Error loading worker state', e);
      setScreen('login');
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (worker) {
      localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(worker));
      localStorage.setItem('visasra_worker_session_v1', worker.phone);
    }
  }, [worker]);

  useEffect(() => {
    if (notifications.length) {
      localStorage.setItem('visasra_worker_notes_v1', JSON.stringify(notifications.slice(0, 50)));
    }
  }, [notifications]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // -------------------------------------------------------------------
  // BACKEND API SYNC
  // -------------------------------------------------------------------
  const fetchJobs = async () => {
    try {
      const q = worker ? `?workerId=${worker.id}` : '';
      const res = await fetch(`/api/worker/jobs${q}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
      if (data.worker) {
        setWorker(data.worker);
      }
    } catch (err) {
      console.error('Fetch worker jobs failed:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const iv = setInterval(fetchJobs, 4000);
    return () => clearInterval(iv);
  }, [worker?.id]);

  // Execute Backend Action
  const execAction = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/worker/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, workerId: worker?.id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.worker) setWorker(data.worker);
        await fetchJobs();
        return true;
      } else {
        showToast(data.error || 'Action failed');
        return false;
      }
    } catch {
      showToast('Network error');
      return false;
    }
  };

  // -------------------------------------------------------------------
  // LIVE GPS TRACKING
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation || !worker) return;
    const activeTrip = sessions.find((s) => s.workerId === worker.id && ['heading_to_store', 'shopping'].includes(s.stage));
    if (!activeTrip) return;

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        execAction({
          action: 'update_location',
          slotKey: activeTrip.slotKey,
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sessions, worker?.id]);

  // -------------------------------------------------------------------
  // SLOT TIMING HELPERS
  // -------------------------------------------------------------------
  const winOf = (slotKey: string) => slotKey.split('|')[1] || 'h2-1';
  const slotDateOf = (slotKey: string) => slotKey.split('|')[0] || todayDateStr;

  const slotAt = (slotKey: string, h: number) => {
    const [y, m, d] = slotDateOf(slotKey).split('-').map(Number);
    return new Date(y, m - 1, d, h, 0, 0, 0).getTime();
  };

  const slotStart = (slotKey: string) => slotAt(slotKey, SLOT_START[winOf(slotKey)] || 11);
  const slotEnd = (slotKey: string) => slotAt(slotKey, SLOT_END[winOf(slotKey)] || 13);
  const acceptAt = (slotKey: string) => slotStart(slotKey) - ACCEPT_LEAD_MS;
  const tooSoon = (slotKey: string) => Date.now() < acceptAt(slotKey);
  const isEarly = (slotKey: string) => Date.now() < slotStart(slotKey);
  const isLate = (slotKey: string) => Date.now() >= slotEnd(slotKey);

  const acceptLabel = (slotKey: string) => {
    const t = new Date(acceptAt(slotKey));
    const h = t.getHours(), m = t.getMinutes();
    const clock = (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : ':00') + ' ' + (h < 12 ? 'AM' : 'PM');
    const day = isoOf(t) === todayDateStr ? '' : ', ' + t.getDate() + ' ' + MON[t.getMonth()];
    return clock + day;
  };

  const startLabel = (slotKey: string) => fmtH(SLOT_START[winOf(slotKey)] || 11) + (slotDateOf(slotKey) === todayDateStr ? '' : ', ' + slotDateOf(slotKey));

  // Determine Job Phase
  const phaseOf = (session: LiveSession): 'open' | 'assigned' | 'progress' | 'purchased' | 'done' | 'missed' => {
    if (!session.workerId) return isLate(session.slotKey) ? 'missed' : 'open';
    if (session.workerId !== worker?.id) return 'assigned'; // taken by other
    if (session.stage === 'packed' || session.status === 'completed') return 'done';
    if (session.stage === 'purchased') return 'purchased';
    if (session.stage === 'heading_to_store' || session.stage === 'shopping') return 'progress';
    return isLate(session.slotKey) ? 'missed' : 'assigned';
  };

  const isKYCOk = () => worker?.kycStatus === 'verified' || worker?.kycStatus === 'approved';

  // -------------------------------------------------------------------
  // ACTIONS: AUTH & GATED APPLICATION WORKFLOW
  // -------------------------------------------------------------------

  // 1. Sign In with Mobile Number or Email & Password
  const handleEmailPasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanLogin = loginEmail.trim();
    if (!cleanLogin || cleanLogin.length < 3) {
      showToast('Please enter your mobile number or email address');
      return;
    }
    if (!loginPassword) {
      showToast('Please enter your password');
      return;
    }
    setAuthLoading(true);
    try {
      const isEmail = cleanLogin.includes('@');
      const res = await fetch('/api/worker/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? cleanLogin.toLowerCase() : undefined,
          phone: !isEmail ? cleanLogin : undefined,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.worker) {
        const w: WorkerProfile = data.worker;
        setWorker(w);
        localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(w));
        localStorage.setItem('visasra_worker_session_v1', w.phone);
        showToast(`Welcome back, ${w.name.split(' ')[0]}!`);
        populateAppState(w);
        await fetchJobs();

        // Strict Gated Access: cannot access portal until admin accepts
        if (w.kycStatus === 'pending') {
          setScreen('kycwait');
        } else if (w.kycStatus === 'rejected') {
          setScreen('kycrej');
        } else if (w.kycStatus === 'verified' || w.kycStatus === 'approved') {
          setScreen('home');
          setActiveTab('home');
        } else {
          setScreen('kycform');
        }
      } else {
        showToast(data.error || 'Incorrect email or password');
      }
    } catch {
      showToast('Network error during sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Sign Up Step 1: Send Email OTP (NO Aadhaar! Name, mobile number, mail id, password)
  const handleSendSignupOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signupName.trim() || signupName.trim().length < 2) {
      showToast('Please enter your full name');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/worker/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          phone: cleanPhone,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOtpCode(data.otp || '123456');
        setSignupStep('otp');
        setSignupOtpDigits(['', '', '', '', '', '']);
        showToast(data.message || `Verification code sent to ${signupEmail}`);
      } else {
        showToast(data.error || 'Failed to send verification code');
      }
    } catch {
      showToast('Network error sending verification code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Sign Up Step 2: Verify Email OTP & Create Account
  const handleVerifySignupOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = signupOtpDigits.join('');
    if (code.length < 6) {
      showToast('Please enter all 6 digits of the email verification code');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/worker/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_and_create',
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          phone: signupPhone.replace(/\D/g, '').slice(-10),
          password: signupPassword,
          otp: code,
        }),
      });
      const data = await res.json();
      if (res.ok && data.worker) {
        const w: WorkerProfile = data.worker;
        setWorker(w);
        localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(w));
        localStorage.setItem('visasra_worker_session_v1', w.phone);
        showToast('Account created! Please submit your application form for admin review.');
        populateAppState(w);
        // Post-registration gating: new user goes directly to application form!
        setScreen('kycform');
      } else {
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        showToast(data.error || 'Invalid or expired verification code');
      }
    } catch {
      showToast('Network error verifying code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Forgot Password Step 1: Request OTP for Email
  const handleRequestForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      showToast('Please enter your registered email address');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/worker/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          email: forgotEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOtpCode(data.otp || '123456');
        setForgotStep('reset');
        setForgotOtpDigits(['', '', '', '', '', '']);
        showToast(data.message || `Password reset code sent to ${forgotEmail}`);
      } else {
        showToast(data.error || 'No account found with this email');
      }
    } catch {
      showToast('Network error requesting reset code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Forgot Password Step 2: Reset Password with OTP
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = forgotOtpDigits.join('');
    if (code.length < 6) {
      showToast('Enter the 6-digit verification code');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      showToast('New password must be at least 6 characters');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/worker/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: forgotEmail.trim().toLowerCase(),
          otp: code,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password reset successful! Please sign in.');
        setAuthTab('signin');
        setLoginEmail(forgotEmail);
        setForgotStep('request');
        setForgotOtpDigits(['', '', '', '', '', '']);
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        setOtpShake(true);
        setTimeout(() => setOtpShake(false), 600);
        showToast(data.error || 'Password reset failed');
      }
    } catch {
      showToast('Network error resetting password');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Submit Application Form with Aadhaar, PAN, DL, Addresses, Photo & Alternate Mobile
  const handleSubmitApplicationForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawAadhaar = appAadhaarNumber.replace(/\D/g, '');
    if (rawAadhaar.length !== 12) {
      showToast('Please enter your 12-digit Aadhaar number');
      return;
    }
    const cleanPan = appPanNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanPan)) {
      showToast('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
      return;
    }
    if (!appDlNumber.trim() || appDlNumber.trim().length < 5) {
      showToast('Please enter your Driving License number');
      return;
    }
    if (!appCurrentAddress.trim() || appCurrentAddress.trim().length < 8) {
      showToast('Please enter your complete current / present address');
      return;
    }
    const finalPermAddress = sameAsCurrent ? appCurrentAddress : appPermanentAddress;
    if (!finalPermAddress.trim() || finalPermAddress.trim().length < 8) {
      showToast('Please enter your complete permanent address');
      return;
    }
    const cleanAlt = appAltPhone.replace(/\D/g, '').slice(-10);
    if (cleanAlt.length !== 10) {
      showToast('Please enter a valid 10-digit alternate mobile number');
      return;
    }
    if (!appAadhaarFront) {
      showToast('Please upload Aadhaar Front image');
      return;
    }
    if (!appAadhaarBack) {
      showToast('Please upload Aadhaar Back image');
      return;
    }
    if (!appPanDoc) {
      showToast('Please upload PAN card image');
      return;
    }
    if (!appDlDoc) {
      showToast('Please upload Driving License image');
      return;
    }
    if (!appSelfie) {
      showToast('Please upload your current photo / selfie');
      return;
    }
    if (!appConsent) {
      showToast('Please check the confirmation declaration');
      return;
    }

    setAppSubmitting(true);
    try {
      const res = await fetch('/api/worker/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker?.id,
          email: worker?.email || loginEmail || signupEmail,
          phone: worker?.phone,
          aadhaarNumber: rawAadhaar,
          aadhaarFront: appAadhaarFront,
          aadhaarBack: appAadhaarBack,
          panNumber: cleanPan,
          panDoc: appPanDoc,
          drivingLicenseNumber: appDlNumber.trim().toUpperCase(),
          drivingLicenseDoc: appDlDoc,
          currentAddress: appCurrentAddress.trim(),
          permanentAddress: finalPermAddress.trim(),
          altPhone: `+91 ${cleanAlt.slice(0, 5)} ${cleanAlt.slice(5)}`,
          selfie: appSelfie,
          bankAccountNumber: appBankAccountNumber.trim(),
          bankIfscCode: appBankIfscCode.trim().toUpperCase(),
          bankName: appBankName.trim(),
          bankBranch: appBankBranch.trim(),
          payoutUpi: appPayoutUpi.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.worker) {
        const w: WorkerProfile = data.worker;
        setWorker(w);
        localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(w));
        showToast('Application submitted! Admin verification in progress.');
        setScreen('kycwait');
      } else {
        showToast(data.error || 'Failed to submit application');
      }
    } catch {
      showToast('Network error submitting application');
    } finally {
      setAppSubmitting(false);
    }
  };

  // Check verification status from Admin
  const checkKycStatus = async () => {
    if (!worker?.id && !worker?.email && !worker?.phone) return;
    try {
      const query = worker?.id ? `workerId=${worker.id}` : worker?.email ? `email=${encodeURIComponent(worker.email)}` : `phone=${worker?.phone}`;
      const res = await fetch(`/api/worker/kyc?${query}`);
      const data = await res.json();
      if (res.ok && data.worker) {
        const w: WorkerProfile = data.worker;
        setWorker(w);
        localStorage.setItem('visasra_worker_profile_v1', JSON.stringify(w));
        if (w.kycStatus === 'verified' || w.kycStatus === 'approved') {
          showToast('🎉 Congratulations! Admin has approved your application.');
          setScreen('home');
          setActiveTab('home');
          await fetchJobs();
        } else if (w.kycStatus === 'rejected') {
          showToast('Application not approved. Please see feedback and resubmit.');
          setScreen('kycrej');
        } else {
          showToast('Verification in progress. Admin is reviewing your submitted documents.');
        }
      }
    } catch {
      showToast('Could not check status');
    }
  };

  // Sign out helper
  const handleSignOut = () => {
    localStorage.removeItem('visasra_worker_profile_v1');
    localStorage.removeItem('visasra_worker_session_v1');
    setWorker(null);
    setScreen('login');
    setAuthTab('signin');
    setSignupStep('form');
    setForgotStep('request');
    showToast('Signed out successfully');
  };

  // -------------------------------------------------------------------
  // ACTIONS: SHOPPING PROTOCOL
  // -------------------------------------------------------------------
  const handleAcceptSlot = async (slotKey: string) => {
    if (!isKYCOk()) {
      showToast('Complete verification first');
      setScreen('kycform');
      return;
    }
    if (worker?.status === 'offline') {
      showToast('Go online in Profile to accept slots');
      return;
    }
    if (isLate(slotKey)) {
      showToast('This slot has already ended');
      return;
    }
    if (tooSoon(slotKey)) {
      showToast('You can accept this slot from ' + acceptLabel(slotKey));
      return;
    }

    const ok = await execAction({ action: 'accept', slotKey });
    if (ok) {
      showToast('Slot accepted — customer notified');
      setSelectedSlotKey(slotKey);
      setScreen('detail');
    }
  };

  const handleStartTrip = async (slotKey: string) => {
    if (isEarly(slotKey)) {
      showToast('Shopping opens at ' + startLabel(slotKey));
      return;
    }
    const ok = await execAction({ action: 'start_trip', slotKey });
    if (ok) {
      showToast('Trip started — customer is tracking your route');
    }
  };

  const handleArrive = async (slotKey: string) => {
    const ok = await execAction({ action: 'arrive', slotKey });
    if (ok) {
      showToast('Entered store — open shopping list');
      setScreen('list');
    }
  };

  const handleSaveOption = async () => {
    if (!selectedSlotKey || !selectedItemId) return;
    if (!optionImage) {
      showToast('Add a photo of the option');
      return;
    }
    if (!Number(optionPrice) || Number(optionPrice) <= 0) {
      showToast('Enter valid price in ₹');
      return;
    }

    const ok = await execAction({
      action: 'upload_option',
      slotKey: selectedSlotKey,
      itemId: selectedItemId,
      optionData: {
        image: optionImage,
        price: Number(optionPrice),
        store: optionStore.trim() || 'Local Store',
        description: `From ${optionStore.trim() || 'Local Store'}. ${optionNote}`.trim(),
      },
    });

    if (ok) {
      setOptionImage('');
      setOptionPrice('');
      setOptionNote('');
      setScreen('prod');
    }
  };

  const handleSendOptionsToCustomer = async () => {
    if (!selectedSlotKey || !selectedItemId) return;
    const ok = await execAction({
      action: 'share_options',
      slotKey: selectedSlotKey,
      itemId: selectedItemId,
    });
    if (ok) {
      showToast('Sent! Customer can approve in their app');
      setScreen('list');
    }
  };

  const handleSendShopQr = async () => {
    if (!selectedSlotKey || !selectedItemId) return;
    if (!shopQrImage) {
      showToast('Add shop QR code first');
      return;
    }
    const curSession = sessions.find((s) => s.slotKey === selectedSlotKey);
    const it = curSession?.order?.items.find((i) => i.id === selectedItemId);

    const ok = await execAction({
      action: 'upload_qr',
      slotKey: selectedSlotKey,
      itemId: selectedItemId,
      qrData: {
        qr: shopQrImage,
        amount: it?.approvedAmount || it?.estMin || 2440,
      },
    });

    if (ok) {
      setShopQrImage('');
      showToast('Shop QR sent to Admin for payment clearance');
    }
  };

  const handleMarkPurchased = async (itemId: string) => {
    if (!selectedSlotKey) return;
    const curSession = sessions.find((s) => s.slotKey === selectedSlotKey);
    const it = curSession?.order?.items.find((i) => i.id === itemId);
    if (it?.status !== 'approved' && it?.shopPaymentStatus !== 'paid') {
      showToast('Wait until customer approves or payment is confirmed');
      return;
    }

    const ok = await execAction({
      action: 'bought',
      slotKey: selectedSlotKey,
      itemId,
    });
    if (ok) {
      showToast('Item purchased! Proceeding to next product.');
      setScreen('list');
    }
  };

  const handleFinishPacking = async () => {
    if (!selectedSlotKey) return;
    const cleanOtp = warehouseOtp.trim();
    if (!cleanOtp) {
      showToast('Please enter the 4-digit Handover OTP provided by Admin at the warehouse');
      return;
    }
    if (cleanOtp !== '8492' && cleanOtp.length !== 4) {
      showToast('Invalid Handover OTP. Admin must inspect packages and provide the 4-digit OTP.');
      return;
    }
    const ok = await execAction({
      action: 'finish',
      slotKey: selectedSlotKey,
      finalNote: finalPackingNote,
      handoverOtp: cleanOtp,
    });
    if (ok) {
      setHandoverVerified(true);
      showToast(`Warehouse Handover Verified! +₹${PAY_PER_SLOT} credited to wallet!`);
      setTimeout(() => {
        setHandoverVerified(false);
        setWarehouseOtp('');
        setFinalPackingNote('');
        setActiveTab('earn');
        setScreen('earn');
      }, 1600);
    }
  };

  // -------------------------------------------------------------------
  // CURRENT SESSION & ITEM POINTERS
  // -------------------------------------------------------------------
  const currentSession = sessions.find((s) => s.slotKey === selectedSlotKey) || sessions[0];
  const currentItem = currentSession?.order?.items.find((i) => i.id === selectedItemId);

  // Unread Action Counts
  const actionItems: { session: LiveSession; item: OrderItem; type: 'buy' | 'qr' | 'redo' }[] = [];
  sessions
    .filter((s) => s.workerId === worker?.id && phaseOf(s) !== 'done')
    .forEach((s) => {
      s.order?.items.forEach((it) => {
        if (it.status === 'approved') {
          if (!it.shopPaymentStatus || it.shopPaymentStatus === 'none') actionItems.push({ session: s, item: it, type: 'qr' });
          else if (it.shopPaymentStatus === 'paid') actionItems.push({ session: s, item: it, type: 'buy' });
        } else if (it.status === 'needs_options') {
          actionItems.push({ session: s, item: it, type: 'redo' });
        }
      });
    });

  // Today's Slots
  const todaysSlots = sessions.filter((s) => {
    const p = phaseOf(s);
    return !['done', 'missed'].includes(p) && (slotDateOf(s.slotKey) === todayDateStr || ['progress', 'purchased'].includes(p));
  });

  return (
    <div className="worker-viewport">
      <div id="worker-app">
        {/* ============================================================= */}
        {/* HEADER                                                        */}
        {/* ============================================================= */}
        {isKYCOk() && !['login', 'otp', 'forgot', 'kycform', 'kycwait', 'kycrej'].includes(screen) && (
          <header className="hd">
            <div className="hd-row">
              {screen !== 'home' && screen !== 'slots' && screen !== 'map' && screen !== 'earn' && screen !== 'profile' ? (
                <button
                  className="circ"
                  onClick={() => {
                    if (screen === 'detail') setScreen('slots');
                    else if (screen === 'list') setScreen('detail');
                    else if (screen === 'prod') setScreen('list');
                    else if (screen === 'add') setScreen('prod');
                    else if (screen === 'complete') setScreen('list');
                    else if (screen === 'notes') setScreen('home');
                    else setScreen('home');
                  }}
                  aria-label="Back"
                >
                  {svg(ICONS.back)}
                </button>
              ) : null}

              {screen === 'home' ? (
                <div className="brand">
                  <img src="/logo.png" alt="" />
                  <span className="wm">Vis<b>asra</b></span>
                </div>
              ) : (
                <h2 className="serif">
                  {screen === 'slots' ? 'My Shopping Slots' :
                   screen === 'map' ? 'Live Route Map' :
                   screen === 'earn' ? 'Partner Earnings' :
                   screen === 'profile' ? 'Partner Profile' :
                   screen === 'detail' ? 'Slot Details' :
                   screen === 'list' ? 'Shopping List' :
                   screen === 'prod' ? currentItem?.name || 'Product Details' :
                   screen === 'add' ? 'Add Option' :
                   screen === 'complete' ? 'Warehouse Handover' :
                   screen === 'notes' ? 'Notifications' :
                   screen === 'kycform' ? 'Identity Verification' :
                   screen === 'kycwait' ? 'Verification Status' : 'Visasra Worker'}
                </h2>
              )}

              {screen === 'home' && <span className="role">Shopper Force</span>}

              {/* Notification Bell */}
              <button
                className="circ bellb"
                onClick={() => setScreen('notes')}
                aria-label="Notifications"
                style={{ marginLeft: 'auto' }}
              >
                {svg(ICONS.bell)}
                {actionItems.length > 0 && <i className="cnt">{actionItems.length}</i>}
              </button>
            </div>
          </header>
        )}

        {/* Action Alert Banner */}
        {actionItems.length > 0 && screen === 'home' && (
          <div
            className={`alert ${actionItems[0].type === 'buy' ? 'ok' : 'warn'}`}
            onClick={() => {
              setSelectedSlotKey(actionItems[0].session.slotKey);
              setSelectedItemId(actionItems[0].item.id);
              setScreen('prod');
            }}
          >
            <span className="ai">{svg(actionItems[0].type === 'buy' ? ICONS.check : ICONS.back)}</span>
            <div className="grow">
              <b>{actionItems[0].type === 'buy' ? 'Admin Paid Shop Counter' : actionItems[0].type === 'qr' ? 'Customer Approved Option' : 'Customer Requested New Options'}</b>
              <div>{actionItems[0].item.name} · Tap to act</div>
            </div>
            {actionItems.length > 1 && <span className="more">+{actionItems.length - 1}</span>}
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 1: AUTHENTICATION (SIGN IN / SIGN UP / FORGOT PASSWORD) */}
        {/* ============================================================= */}
        {(screen === 'login' || screen === 'otp' || screen === 'forgot') && (
          <div className="screen login active">
            <img className="logo" src="/logo.png" alt="Visasra" />
            <div className="wm">Vis<b>asra</b></div>
            <p>Shopper Partner Portal<br />Shop, pack &amp; deliver authentic Indian goods</p>


            {/* Segmented Auth Mode Switcher */}
            {authTab !== 'forgot' ? (
              <div className="seg" style={{ marginBottom: 18 }}>
                <button
                  type="button"
                  className={authTab === 'signin' ? 'on' : ''}
                  onClick={() => { setAuthTab('signin'); setScreen('login'); }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={authTab === 'signup' ? 'on' : ''}
                  onClick={() => { setAuthTab('signup'); setSignupStep('form'); setScreen('login'); }}
                >
                  Create account
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                <button
                  type="button"
                  className="link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#BFDBFE', fontWeight: 700 }}
                  onClick={() => setAuthTab('signin')}
                >
                  ← Back to Sign in
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Reset Password</span>
              </div>
            )}

            {/* TAB 1: SIGN IN WITH MOBILE OR EMAIL & PASSWORD */}
            {authTab === 'signin' && (
              <form onSubmit={handleEmailPasswordLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <input
                  type="text"
                  placeholder="Mobile Number or Email ID (e.g. 9170324144)"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ marginBottom: 6 }}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <button
                    type="button"
                    className="link"
                    style={{ fontSize: 12.5, color: '#BFDBFE', fontWeight: 600 }}
                    onClick={() => { setAuthTab('forgot'); setForgotStep('request'); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="btn" disabled={authLoading}>
                  {authLoading ? 'Signing in...' : 'Sign in to Partner Portal'}
                </button>
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    Don't have an account?{' '}
                  </span>
                  <button
                    type="button"
                    className="link"
                    style={{ fontSize: 13, color: '#93C5FD', fontWeight: 700 }}
                    onClick={() => { setAuthTab('signup'); setSignupStep('form'); }}
                  >
                    Create account
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT (EMAIL OTP VERIFICATION — NO AADHAAR ASKED) */}
            {authTab === 'signup' && (
              <div style={{ width: '100%' }}>
                {signupStep === 'form' ? (
                  <form onSubmit={handleSendSignupOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 12, color: '#DCEAFB', marginBottom: 10, textAlign: 'center' }}>
                      Register with mobile, email &amp; password. Aadhaar &amp; IDs will be collected in the application form after login.
                    </div>
                    <input
                      type="text"
                      placeholder="Full Name (e.g. Ramesh Kumar)"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email ID (e.g. ramesh@gmail.com)"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Create password (min 6 chars)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn" disabled={authLoading}>
                      {authLoading ? 'Sending Email OTP...' : 'Send Email Verification Code'}
                    </button>
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="link"
                        style={{ fontSize: 13 }}
                        onClick={() => setAuthTab('signin')}
                      >
                        Already registered? Sign in
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySignupOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#fff', marginBottom: 18, textAlign: 'center' }}>
                      Enter the 6-digit verification code sent to<br />
                      <b>{signupEmail}</b>
                    </div>

                    <div className={`otp ${otpShake ? 'shake' : ''}`} style={{ marginBottom: 16 }}>
                      {signupOtpDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          className="otpb"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const copy = [...signupOtpDigits];
                            copy[i] = val.slice(-1);
                            setSignupOtpDigits(copy);
                            if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !signupOtpDigits[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>

                    <button type="submit" className="btn" disabled={authLoading}>
                      {authLoading ? 'Verifying...' : 'Verify Email & Create Account'}
                    </button>

                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="link"
                        onClick={() => setSignupStep('form')}
                      >
                        ← Change email / details
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: FORGOT PASSWORD FOR EMAIL ACCOUNT */}
            {authTab === 'forgot' && (
              <div style={{ width: '100%' }}>
                {forgotStep === 'request' ? (
                  <form onSubmit={handleRequestForgotOtp} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 13, color: '#DCEAFB', marginBottom: 12, textAlign: 'center' }}>
                      Enter your registered email ID. We will send you a 6-digit password reset code.
                    </div>
                    <input
                      type="email"
                      placeholder="Registered email address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn" disabled={authLoading}>
                      {authLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
                    </button>
                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="link"
                        style={{ fontSize: 13 }}
                        onClick={() => setAuthTab('signin')}
                      >
                        ← Back to Sign in
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#fff', marginBottom: 10, textAlign: 'center' }}>
                      Reset code sent to <b>{forgotEmail}</b>
                    </div>

                    <div style={{ fontSize: 12, color: '#DCEAFB', marginBottom: 14, textAlign: 'center' }}>
                      Please enter the 6-digit verification code sent to your email address.
                    </div>

                    <div className={`otp ${otpShake ? 'shake' : ''}`} style={{ marginBottom: 14 }}>
                      {forgotOtpDigits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          className="otpb"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const copy = [...forgotOtpDigits];
                            copy[i] = val.slice(-1);
                            setForgotOtpDigits(copy);
                            if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !forgotOtpDigits[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>

                    <input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />

                    <button type="submit" className="btn" disabled={authLoading}>
                      {authLoading ? 'Updating Password...' : 'Set New Password'}
                    </button>

                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="link"
                        onClick={() => setForgotStep('request')}
                      >
                        ← Resend code / Change email
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 3: POST-LOGIN APPLICATION FORM (GATED ACCESS)           */}
        {/* ============================================================= */}
        {screen === 'kycform' && (
          <div className="screen active">
            {/* Dedicated Top Bar for Application */}
            <div style={{ background: '#123A69', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <b style={{ fontSize: 16 }}>Visasra Partner Application</b>
                <div style={{ fontSize: 12, color: '#DCEAFB' }}>KYC &amp; Verification Form</div>
              </div>
              <button
                type="button"
                className="link"
                style={{ color: '#fff', fontSize: 13, textDecoration: 'underline' }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            <div className="body has-bar" style={{ padding: '14px 16px' }}>
              <div className="note" style={{ background: '#EAF2FC', border: '1px solid #CFE0F3', borderRadius: 10, padding: '12px', marginBottom: 16 }}>
                <b>Verification Required for Portal Access</b><br />
                <span style={{ fontSize: 13, color: '#4C6180' }}>
                  Please complete this application form with your Aadhaar, PAN, Driving License, residential addresses, and current photo. Once submitted, our Admin team will review and verify your documents.
                </span>
              </div>

              {/* 1. Contact & Identity Information */}
              <div className="sec"><h3>1 · Contact &amp; Personal Details</h3></div>

              <label className="fl">Full Name (as per government records)</label>
              <input
                className="kin"
                placeholder="Full Legal Name"
                value={appFullName}
                onChange={(e) => setAppFullName(e.target.value)}
              />

              <label className="fl">Primary Mobile Number</label>
              <input
                className="kin"
                placeholder="Primary Mobile Number"
                value={appPhone}
                disabled
                style={{ background: '#F1F5F9', color: '#64748B' }}
              />

              <label className="fl">Alternate Mobile Number <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="10-digit alternate mobile number"
                maxLength={10}
                value={appAltPhone}
                onChange={(e) => setAppAltPhone(e.target.value.replace(/\D/g, ''))}
              />

              <label className="fl">Email ID</label>
              <input
                className="kin"
                placeholder="Email Address"
                value={appEmail}
                disabled
                style={{ background: '#F1F5F9', color: '#64748B' }}
              />

              {/* 2. Addresses */}
              <div className="sec" style={{ marginTop: 18 }}><h3>2 · Residential Addresses</h3></div>

              <label className="fl">Current / Present Address <b style={{ color: '#E51D2A' }}>*</b></label>
              <textarea
                className="kin"
                placeholder="Door/Flat No, Street, Landmark, City, State, Pincode"
                rows={3}
                value={appCurrentAddress}
                onChange={(e) => setAppCurrentAddress(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #CFE0F3', fontSize: 13 }}
              />

              <label className="consent" style={{ margin: '8px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={sameAsCurrent}
                  onChange={(e) => {
                    setSameAsCurrent(e.target.checked);
                    if (e.target.checked) setAppPermanentAddress(appCurrentAddress);
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Permanent address is same as current address</span>
              </label>

              {!sameAsCurrent && (
                <>
                  <label className="fl">Permanent Address <b style={{ color: '#E51D2A' }}>*</b></label>
                  <textarea
                    className="kin"
                    placeholder="Permanent Address: Street, City, State, Pincode"
                    rows={3}
                    value={appPermanentAddress}
                    onChange={(e) => setAppPermanentAddress(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #CFE0F3', fontSize: 13 }}
                  />
                </>
              )}

              {/* 3. Identity Documents (Aadhaar, PAN, DL) */}
              <div className="sec" style={{ marginTop: 18 }}><h3>3 · Government Identity Documents</h3></div>

              {/* Aadhaar Card */}
              <label className="fl">Aadhaar Card Number (12 digits) <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="XXXX XXXX XXXX"
                maxLength={14}
                value={appAadhaarNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setAppAadhaarNumber(raw.replace(/(\d{4})(?=\d)/g, '$1 '));
                }}
              />

              {/* Aadhaar Front & Back Uploads */}
              <div className="kdoc">
                <div className="row" style={{ marginBottom: 6 }}>
                  <div className="grow b sm">Aadhaar Card — Front</div>
                  <span className={`pill ${appAadhaarFront ? 'g' : 'o'}`}>{appAadhaarFront ? 'Uploaded' : 'Required'}</span>
                </div>
                <label className="upload kd">
                  {appAadhaarFront ? (
                    <>
                      <img src={appAadhaarFront} alt="Aadhaar Front" />
                      <span className="chg">Change</span>
                    </>
                  ) : (
                    <>
                      {svg(ICONS.cam)}
                      <span>Upload clear photo of Aadhaar Front</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setAppAadhaarFront(String(reader.result));
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="kdoc">
                <div className="row" style={{ marginBottom: 6 }}>
                  <div className="grow b sm">Aadhaar Card — Back (with Address)</div>
                  <span className={`pill ${appAadhaarBack ? 'g' : 'o'}`}>{appAadhaarBack ? 'Uploaded' : 'Required'}</span>
                </div>
                <label className="upload kd">
                  {appAadhaarBack ? (
                    <>
                      <img src={appAadhaarBack} alt="Aadhaar Back" />
                      <span className="chg">Change</span>
                    </>
                  ) : (
                    <>
                      {svg(ICONS.cam)}
                      <span>Upload clear photo of Aadhaar Back</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setAppAadhaarBack(String(reader.result));
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>

              {/* PAN Card */}
              <label className="fl" style={{ marginTop: 12 }}>PAN Card Number <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="ABCDE1234F"
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
                value={appPanNumber}
                onChange={(e) => setAppPanNumber(e.target.value.toUpperCase().slice(0, 10))}
              />

              <div className="kdoc">
                <div className="row" style={{ marginBottom: 6 }}>
                  <div className="grow b sm">PAN Card Photo</div>
                  <span className={`pill ${appPanDoc ? 'g' : 'o'}`}>{appPanDoc ? 'Uploaded' : 'Required'}</span>
                </div>
                <label className="upload kd">
                  {appPanDoc ? (
                    <>
                      <img src={appPanDoc} alt="PAN Card" />
                      <span className="chg">Change</span>
                    </>
                  ) : (
                    <>
                      {svg(ICONS.cam)}
                      <span>Upload photo of complete PAN Card</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setAppPanDoc(String(reader.result));
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Driving License */}
              <label className="fl" style={{ marginTop: 12 }}>Driving License Number <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="e.g. TN01 20220001234"
                maxLength={20}
                style={{ textTransform: 'uppercase' }}
                value={appDlNumber}
                onChange={(e) => setAppDlNumber(e.target.value.toUpperCase())}
              />

              <div className="kdoc">
                <div className="row" style={{ marginBottom: 6 }}>
                  <div className="grow b sm">Driving License Document</div>
                  <span className={`pill ${appDlDoc ? 'g' : 'o'}`}>{appDlDoc ? 'Uploaded' : 'Required'}</span>
                </div>
                <label className="upload kd">
                  {appDlDoc ? (
                    <>
                      <img src={appDlDoc} alt="Driving License" />
                      <span className="chg">Change</span>
                    </>
                  ) : (
                    <>
                      {svg(ICONS.cam)}
                      <span>Upload photo of Driving License front</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setAppDlDoc(String(reader.result));
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Current Photo / Selfie */}
              <div className="sec" style={{ marginTop: 18 }}><h3>4 · Current Photo</h3></div>
              <div className="kdoc">
                <div className="row" style={{ marginBottom: 6 }}>
                  <div className="grow b sm">Live Selfie / Face Photo</div>
                  <span className={`pill ${appSelfie ? 'g' : 'o'}`}>{appSelfie ? 'Uploaded' : 'Required'}</span>
                </div>
                <label className="upload kd">
                  {appSelfie ? (
                    <>
                      <img src={appSelfie} alt="Selfie" />
                      <span className="chg">Change</span>
                    </>
                  ) : (
                    <>
                      {svg(ICONS.cam)}
                      <span>Upload clear face photo (no cap or glasses)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setAppSelfie(String(reader.result));
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Bank Account for Direct Payouts */}
              <div className="sec" style={{ marginTop: 18 }}><h3>5 · Bank Account for Direct Payouts</h3></div>
              
              <label className="fl">Bank Name</label>
              <input
                className="kin"
                placeholder="e.g. HDFC Bank / State Bank of India"
                value={appBankName}
                onChange={(e) => setAppBankName(e.target.value)}
              />

              <label className="fl" style={{ marginTop: 10 }}>Branch Name</label>
              <input
                className="kin"
                placeholder="e.g. T. Nagar Branch, Chennai"
                value={appBankBranch}
                onChange={(e) => setAppBankBranch(e.target.value)}
              />

              <label className="fl" style={{ marginTop: 10 }}>Bank Account Number <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="Enter bank account number"
                type="password"
                value={appBankAccountNumber}
                onChange={(e) => setAppBankAccountNumber(e.target.value)}
              />

              <label className="fl" style={{ marginTop: 10 }}>Confirm Bank Account Number <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="Re-enter bank account number"
                value={appBankConfirmAccountNumber}
                onChange={(e) => setAppBankConfirmAccountNumber(e.target.value)}
              />

              <label className="fl" style={{ marginTop: 10 }}>IFSC Code <b style={{ color: '#E51D2A' }}>*</b></label>
              <input
                className="kin"
                placeholder="e.g. HDFC0000124"
                maxLength={11}
                style={{ textTransform: 'uppercase' }}
                value={appBankIfscCode}
                onChange={(e) => setAppBankIfscCode(e.target.value.toUpperCase())}
              />

              <label className="fl" style={{ marginTop: 10 }}>Payout UPI ID (Optional)</label>
              <input
                className="kin"
                placeholder="e.g. name@okaxis / mobile@upi"
                value={appPayoutUpi}
                onChange={(e) => setAppPayoutUpi(e.target.value)}
              />

              {/* Consent & Confirmation */}
              <label className="consent" style={{ margin: '18px 0 12px' }}>
                <input
                  type="checkbox"
                  checked={appConsent}
                  onChange={(e) => setAppConsent(e.target.checked)}
                />
                <span>I confirm that all provided documents, address details, and identification numbers belong to me. I authorize Visasra Admin to verify these details for partner onboarding.</span>
              </label>
            </div>

            {/* Application Submit Bar */}
            <div className="bar" style={{ flexDirection: 'column', padding: '12px 16px' }}>
              <button
                type="button"
                className="btn"
                disabled={appSubmitting}
                onClick={handleSubmitApplicationForm}
              >
                {appSubmitting ? 'Submitting to Admin...' : 'Submit Application for Verification'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 4: KYC PENDING WAITING FOR ADMIN APPROVAL               */}
        {/* ============================================================= */}
        {screen === 'kycwait' && (
          <div className="screen active">
            <div style={{ background: '#123A69', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <b style={{ fontSize: 16 }}>Visasra Partner Portal</b>
                <div style={{ fontSize: 12, color: '#DCEAFB' }}>Application Verification</div>
              </div>
              <button
                type="button"
                className="link"
                style={{ color: '#fff', fontSize: 13, textDecoration: 'underline' }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            <div className="body" style={{ padding: '16px' }}>
              <div className="kwait">
                <div className="hg" style={{ background: '#FFF1E0', color: '#FF8A00' }}>
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 2h12M6 22h12M7 2v3.5c0 2 2.2 3.5 5 6.5-2.8 3-5 4.5-5 6.5V22M17 2v3.5c0 2-2.2 3.5-5 6.5 2.8 3 5 4.5 5 6.5V22" />
                  </svg>
                </div>
                <h3>Verification in Progress</h3>
                <p style={{ lineHeight: 1.5 }}>
                  Your application along with your Aadhaar, PAN card, Driving License, residential addresses, and photo has been sent to our Admin team.<br /><br />
                  <b>It will take some time for verification.</b> Once the admin accepts and approves your documents, you will automatically get full access to the portal to view all slots, jobs, and earnings.
                </p>
              </div>

              {/* Submitted Details Card */}
              <div className="card pad" style={{ margin: '14px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#123A69', marginBottom: 8 }}>Submitted Application Dossier</div>
                <dl className="kv" style={{ fontSize: 13 }}>
                  <dt>Partner</dt>
                  <dd>{worker?.name}</dd>
                  <dt>Primary Mobile</dt>
                  <dd>{worker?.phone}</dd>
                  <dt>Alternate Mobile</dt>
                  <dd>{worker?.altPhone || 'On file'}</dd>
                  <dt>Aadhaar</dt>
                  <dd>{worker?.aadhaarNumber ? `XXXX XXXX ${worker.aadhaarNumber.slice(-4)}` : 'Submitted'}</dd>
                  <dt>PAN</dt>
                  <dd>{worker?.panNumber ? `${worker.panNumber.slice(0, 3)}••••${worker.panNumber.slice(-1)}` : 'Submitted'}</dd>
                  <dt>Driving License</dt>
                  <dd>{worker?.drivingLicenseNumber ? `${worker.drivingLicenseNumber.slice(0, 4)}••••` : 'Submitted'}</dd>
                  <dt>Current Address</dt>
                  <dd>{worker?.currentAddress || 'On file'}</dd>
                </dl>
              </div>

              <button type="button" className="btn o" onClick={checkKycStatus}>
                Refresh Status / Check Admin Approval
              </button>
              <button
                type="button"
                className="btn red"
                style={{ marginTop: 10 }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 5: KYC REJECTED                                        */}
        {/* ============================================================= */}
        {screen === 'kycrej' && (
          <div className="screen active">
            <div style={{ background: '#123A69', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <b style={{ fontSize: 16 }}>Visasra Partner Portal</b>
                <div style={{ fontSize: 12, color: '#DCEAFB' }}>Verification Status</div>
              </div>
              <button
                type="button"
                className="link"
                style={{ color: '#fff', fontSize: 13, textDecoration: 'underline' }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            <div className="body" style={{ padding: '16px' }}>
              <div className="kwait rej">
                <div className="hg" style={{ background: '#FCE7E8', color: '#E51D2A' }}>
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" />
                  </svg>
                </div>
                <h3>Documents Require Correction</h3>
                <p>{worker?.kycReason || 'Some documents could not be verified by admin. Please review and resubmit.'}</p>
              </div>

              <button type="button" className="btn" onClick={() => setScreen('kycform')}>
                Update Application &amp; Resubmit
              </button>
              <button type="button" className="btn red" style={{ marginTop: 10 }} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 6: HOME DASHBOARD                                      */}
        {/* ============================================================= */}
        {screen === 'home' && (
          <div className="screen active">
            <div className="body">
              <div className="hello">
                {greeting}
              </div>
              <div className="name">{worker ? worker.name.split(' ')[0] : 'Partner'}!</div>
              <div className="m" style={{ margin: '2px 0 14px' }}>
                {worker?.status === 'active'
                  ? 'You are online. Real-time shopping orders in Chennai will appear here.'
                  : 'You are offline. Turn on online status in Profile to receive slots.'}
              </div>

              {/* 3 Stats Chips */}
              <div className="stats">
                <div className="stat" style={{ background: '#DCEAFB', color: '#1261B5' }}>
                  <b>{sessions.filter((s) => phaseOf(s) === 'open').length}</b>
                  <span>Open</span>
                </div>
                <div className="stat" style={{ background: '#FFF1E0', color: '#C26A00' }}>
                  <b>{sessions.filter((s) => ['assigned', 'progress', 'purchased'].includes(phaseOf(s))).length}</b>
                  <span>Active</span>
                </div>
                <div className="stat" style={{ background: '#E7F5E5', color: '#228A1B' }}>
                  <b>{(worker?.ordersDone || 0) + sessions.filter((s) => phaseOf(s) === 'done').length}</b>
                  <span>Completed</span>
                </div>
              </div>

              {/* Needs Your Action Cards */}
              {actionItems.length > 0 && (
                <>
                  <div className="sec">
                    <h3>Needs your action</h3>
                    <span className="pill o">{actionItems.length}</span>
                  </div>
                  {actionItems.map(({ session, item, type }) => (
                    <div
                      key={item.id}
                      className={`card act ${type}`}
                      onClick={() => {
                        setSelectedSlotKey(session.slotKey);
                        setSelectedItemId(item.id);
                        setScreen('prod');
                      }}
                    >
                      <div className="row">
                        <img
                          src={item.image || '/images/categories/jewellery-accessories.jpg'}
                          alt=""
                          className="ph"
                        />
                        <div className="grow">
                          <div className="b sm">{item.name}</div>
                          <div className="m">
                            {type === 'buy' && <>Admin paid · collect &amp; buy · <b>{inr(item.approvedAmount || 0)}</b></>}
                            {type === 'qr' && <>Approved <b>{inr(item.approvedAmount || 0)}</b> · upload shop counter QR</>}
                            {type === 'redo' && <>Customer rejected — find alternate options</>}
                          </div>
                        </div>
                        <button className={`btn s ${type === 'buy' ? 'g' : type === 'redo' ? 'o2' : ''}`}>
                          {type === 'buy' ? 'Buy' : type === 'qr' ? 'Send QR' : 'Find'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Today's Slots */}
              <div className="sec">
                <h3>Today&apos;s slots</h3>
                <button className="link" onClick={() => { setActiveTab('slots'); setScreen('slots'); }}>See all</button>
              </div>

              {todaysSlots.length > 0 ? (
                todaysSlots.map((j) => {
                  const p = phaseOf(j);
                  return (
                    <div
                      key={j.id}
                      className="card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedSlotKey(j.slotKey);
                        setScreen('detail');
                      }}
                    >
                      <div className="row">
                        <div className="av">{j.user.name.slice(0, 2).toUpperCase()}</div>
                        <div className="grow">
                          <div className="b">{j.user.name}</div>
                          <div className="m">{j.order?.slotLabel || j.slotKey}</div>
                        </div>
                        {p === 'open' ? (
                          tooSoon(j.slotKey) ? (
                            <span className="pill">Accept from {acceptLabel(j.slotKey)}</span>
                          ) : (
                            <button
                              className="btn s"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptSlot(j.slotKey);
                              }}
                            >
                              Accept
                            </button>
                          )
                        ) : (
                          <span className={`pill ${p === 'done' || p === 'purchased' ? 'g' : 'o'}`}>
                            {p.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="row m" style={{ marginTop: 10 }}>
                        <span><b>{j.order?.items.length || 1}</b> product(s)</span>
                        <span className="grow" style={{ background: '#EAF2FC', borderRadius: 9, padding: 5, textAlign: 'center' }}>
                          <b>{inr(j.order?.totalAmount || 2500)}</b> est.
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <b>No slots today</b>
                  Slots booked for today show up here. Tap &apos;See all&apos; for upcoming bookings.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 7: MY SLOTS (TODAY, UPCOMING, COMPLETED)               */}
        {/* ============================================================= */}
        {screen === 'slots' && (
          <div className="screen active">
            <div className="body">
              <div className="tabs">
                <button className={slotsTab === 'today' ? 'on' : ''} onClick={() => setSlotsTab('today')}>
                  Today ({sessions.filter((s) => slotDateOf(s.slotKey) === todayDateStr).length})
                </button>
                <button className={slotsTab === 'upcoming' ? 'on' : ''} onClick={() => setSlotsTab('upcoming')}>
                  Upcoming ({sessions.filter((s) => slotDateOf(s.slotKey) > todayDateStr).length})
                </button>
                <button className={slotsTab === 'completed' ? 'on' : ''} onClick={() => setSlotsTab('completed')}>
                  Completed ({sessions.filter((s) => phaseOf(s) === 'done' || phaseOf(s) === 'missed').length})
                </button>
              </div>

              {sessions
                .filter((s) => {
                  const d = slotDateOf(s.slotKey);
                  const p = phaseOf(s);
                  if (slotsTab === 'today') return d === todayDateStr && p !== 'done';
                  if (slotsTab === 'upcoming') return d > todayDateStr && p !== 'done';
                  return p === 'done' || p === 'missed';
                })
                .map((j) => {
                  const p = phaseOf(j);
                  return (
                    <div
                      key={j.id}
                      className="card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedSlotKey(j.slotKey);
                        setScreen('detail');
                      }}
                    >
                      <div className="row">
                        <div className="av">{j.user.name.slice(0, 2).toUpperCase()}</div>
                        <div className="grow">
                          <div className="b">{j.user.name}</div>
                          <div className="m">{j.order?.slotLabel || j.slotKey}</div>
                        </div>
                        {p === 'open' ? (
                          tooSoon(j.slotKey) ? (
                            <span className="pill">Opens {acceptLabel(j.slotKey)}</span>
                          ) : (
                            <button
                              className="btn s"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptSlot(j.slotKey);
                              }}
                            >
                              Accept
                            </button>
                          )
                        ) : (
                          <span className={`pill ${p === 'done' || p === 'purchased' ? 'g' : 'o'}`}>
                            {p.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="row m" style={{ marginTop: 10 }}>
                        <span><b>{j.order?.items.length || 1}</b> item(s)</span>
                        <span className="grow" style={{ background: '#EAF2FC', borderRadius: 9, padding: 5, textAlign: 'center' }}>
                          <b>{inr(j.order?.totalAmount || 2500)}</b> est.
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 8: SLOT DETAIL                                         */}
        {/* ============================================================= */}
        {screen === 'detail' && currentSession && (
          <div className="screen active">
            <div className="body has-bar">
              {/* 4 Steps Stepper */}
              <ul className="steps">
                <li className={['assigned', 'heading_to_store', 'shopping', 'purchased', 'packed'].includes(currentSession.stage) ? 'd' : ''}>
                  1. Accepted
                </li>
                <li className={['heading_to_store', 'shopping', 'purchased', 'packed'].includes(currentSession.stage) ? 'd' : ''}>
                  2. On the way
                </li>
                <li className={['shopping', 'purchased', 'packed'].includes(currentSession.stage) ? 'd' : ''}>
                  3. Shopping
                </li>
                <li className={['purchased', 'packed'].includes(currentSession.stage) ? 'd' : ''}>
                  4. Packed
                </li>
              </ul>

              {/* Customer Profile Card */}
              <div className="card">
                <div className="row" style={{ marginBottom: 10 }}>
                  <div className="av">{currentSession.user.name.slice(0, 2).toUpperCase()}</div>
                  <div className="grow">
                    <div className="b">{currentSession.user.name}</div>
                    <div className="m">{currentSession.order?.orderNumber || currentSession.slotKey}</div>
                  </div>
                </div>

                <div className="kv">
                  {svg(ICONS.cal)}
                  <span>{currentSession.order?.slotLabel || currentSession.slotKey}</span>
                </div>
                <div className="kv">
                  {svg(ICONS.pin)}
                  <span>{currentSession.storeAddress || 'Local Market / Artisan Store'}</span>
                </div>
                <div className="kv">
                  {svg(ICONS.bag)}
                  <span>{currentSession.order?.items.length || 0} product(s) to verify</span>
                </div>
              </div>

              {/* Timing Alerts */}
              {phaseOf(currentSession) === 'open' && tooSoon(currentSession.slotKey) && (
                <div className="note" style={{ background: '#EAF2FC' }}>
                  <b>Accepting opens {acceptLabel(currentSession.slotKey)}</b><br />
                  Slots can be accepted 4 hours before window start.
                </div>
              )}

              {/* Products List */}
              <div className="sec"><h3>Products to Source</h3></div>
              {currentSession.order?.items.map((it) => (
                <div key={it.id} className="card" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                  <div className="row">
                    <img
                      src={it.image || '/images/categories/jewellery-accessories.jpg'}
                      alt=""
                      className="ph"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomImg(it.image || '/images/categories/jewellery-accessories.jpg');
                      }}
                    />
                    <div className="grow">
                      <div className="b sm">{it.name}</div>
                      <div className="m">Qty: {it.qty} · Budget: ₹{it.estMin} – ₹{it.estMax}</div>
                      <span className={`pill ${it.status === 'approved' ? 'g' : 'o'}`} style={{ marginTop: 4 }}>
                        {it.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Bar Actions based on Stage */}
            <div className="bar">
              {phaseOf(currentSession) === 'open' ? (
                <button
                  className="btn"
                  disabled={tooSoon(currentSession.slotKey)}
                  onClick={() => handleAcceptSlot(currentSession.slotKey)}
                >
                  {tooSoon(currentSession.slotKey) ? `Accepting opens ${acceptLabel(currentSession.slotKey)}` : 'Accept slot'}
                </button>
              ) : currentSession.stage === 'assigned' ? (
                <button
                  className="btn"
                  onClick={() => handleStartTrip(currentSession.slotKey)}
                >
                  Start trip to store
                </button>
              ) : currentSession.stage === 'heading_to_store' ? (
                <button
                  className="btn"
                  onClick={() => handleArrive(currentSession.slotKey)}
                >
                  I&apos;ve started shopping
                </button>
              ) : currentSession.stage === 'shopping' ? (
                <button
                  className="btn"
                  onClick={() => setScreen('list')}
                >
                  Open shopping list
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() => setScreen('complete')}
                >
                  Finish &amp; pack
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 9: SHOPPING LIST (7 CATEGORIES & PROGRESS %)           */}
        {/* ============================================================= */}
        {screen === 'list' && currentSession && (
          <div className="screen active">
            <div className="body has-bar">
              {(() => {
                const items = currentSession.order?.items || [];
                const boughtCount = items.filter((i) => i.status === 'purchased').length;
                const pct = items.length ? Math.round((boughtCount / items.length) * 100) : 0;

                const readyToBuy = items.filter((i) => i.status === 'approved' && i.shopPaymentStatus === 'paid');
                const sendQr = items.filter((i) => i.status === 'approved' && (!i.shopPaymentStatus || i.shopPaymentStatus === 'none'));
                const waitingAdmin = items.filter((i) => i.status === 'approved' && i.shopPaymentStatus === 'qr_uploaded');
                const rejected = items.filter((i) => i.status === 'needs_options');
                const toFind = items.filter((i) => i.status === 'waiting');
                const waitingCustomer = items.filter((i) => i.status === 'options_ready');
                const completed = items.filter((i) => i.status === 'purchased');

                return (
                  <>
                    <div className="card">
                      <div className="row">
                        <div className="grow">
                          <div className="b">{boughtCount} of {items.length} bought</div>
                          <div className="m">
                            {readyToBuy.length ? 'Collect the paid items next.' :
                             sendQr.length ? 'Send shop QR for approved items.' :
                             waitingCustomer.length ? 'Waiting for customer approval.' : 'All items verified.'}
                          </div>
                        </div>
                        <b style={{ color: 'var(--blue)', fontSize: 20 }}>{pct}%</b>
                      </div>
                      <div className="prog"><i style={{ width: `${pct}%` }}></i></div>
                    </div>

                    {/* Section 1: Ready to buy */}
                    {readyToBuy.length > 0 && (
                      <div className="sec lsec gr">
                        <h3>Ready to buy — admin paid</h3>
                        <span className="pill g">{readyToBuy.length}</span>
                      </div>
                    )}
                    {readyToBuy.map((it) => (
                      <div key={it.id} className="card act buy" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Admin cleared · {inr(it.approvedAmount || 0)}</div>
                          </div>
                          <button className="btn s g" onClick={(e) => { e.stopPropagation(); setSelectedItemId(it.id); setScreen('prod'); }}>
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Section 2: Send QR */}
                    {sendQr.length > 0 && (
                      <div className="sec lsec or">
                        <h3>Send shop QR to admin</h3>
                        <span className="pill o">{sendQr.length}</span>
                      </div>
                    )}
                    {sendQr.map((it) => (
                      <div key={it.id} className="card act qr" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Customer approved · send shop QR</div>
                          </div>
                          <button className="btn s" onClick={(e) => { e.stopPropagation(); setSelectedItemId(it.id); setScreen('prod'); }}>
                            Send QR
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Section 3: Waiting Admin Payment */}
                    {waitingAdmin.length > 0 && (
                      <div className="sec">
                        <h3>Waiting for admin payment</h3>
                        <span className="pill o">{waitingAdmin.length}</span>
                      </div>
                    )}
                    {waitingAdmin.map((it) => (
                      <div key={it.id} className="card act" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Admin is reviewing shop QR transfer</div>
                          </div>
                          <span className="pill o">Admin paying</span>
                        </div>
                      </div>
                    ))}

                    {/* Section 4: Customer rejected / Redo */}
                    {rejected.length > 0 && (
                      <div className="sec lsec or">
                        <h3>Customer wants other options</h3>
                        <span className="pill o">{rejected.length}</span>
                      </div>
                    )}
                    {rejected.map((it) => (
                      <div key={it.id} className="card act redo" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Customer rejected — find different options</div>
                          </div>
                          <button className="btn s o2" onClick={(e) => { e.stopPropagation(); setSelectedItemId(it.id); setScreen('prod'); }}>
                            Find
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Section 5: To Find */}
                    {toFind.length > 0 && (
                      <div className="sec">
                        <h3>To find</h3>
                        <span className="pill o">{toFind.length}</span>
                      </div>
                    )}
                    {toFind.map((it) => (
                      <div key={it.id} className="card act" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Budget: ₹{it.estMin} – ₹{it.estMax}</div>
                          </div>
                          <button className="btn s o" onClick={(e) => { e.stopPropagation(); setSelectedItemId(it.id); setScreen('prod'); }}>
                            {it.options.length ? 'Options' : 'Find'}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Section 6: Waiting for Customer */}
                    {waitingCustomer.length > 0 && (
                      <div className="sec">
                        <h3>Waiting for customer</h3>
                        <span className="pill o">{waitingCustomer.length}</span>
                      </div>
                    )}
                    {waitingCustomer.map((it) => (
                      <div key={it.id} className="card act sent" onClick={() => { setSelectedItemId(it.id); setScreen('prod'); }}>
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">{it.options.length} options with customer</div>
                          </div>
                          <span className="pill o">Waiting</span>
                        </div>
                      </div>
                    ))}

                    {/* Section 7: Purchased */}
                    {completed.length > 0 && (
                      <div className="sec">
                        <h3>Bought</h3>
                        <span className="pill g">{completed.length}</span>
                      </div>
                    )}
                    {completed.map((it) => (
                      <div key={it.id} className="card act done">
                        <div className="row">
                          <img src={it.image || '/images/categories/jewellery-accessories.jpg'} alt="" className="ph" />
                          <div className="grow">
                            <div className="b sm">{it.name}</div>
                            <div className="m">Bought · {inr(it.approvedAmount || 0)}</div>
                          </div>
                          <span className="chk">{svg(ICONS.check)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Complete button */}
                    {items.length > 0 && items.every((i) => i.status === 'purchased') && (
                      <button className="btn" style={{ marginTop: 14 }} onClick={() => setScreen('complete')}>
                        Complete shopping
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 10: PRODUCT DETAILS & 3-STEP QR CLEARANCE              */}
        {/* ============================================================= */}
        {screen === 'prod' && currentItem && (
          <div className="screen active">
            <div className="body has-bar">
              {/* Customer Requirement */}
              <div className="card">
                <div className="b sm">Customer wants</div>
                <div className="m">
                  Qty: {currentItem.qty} · Budget: ₹{currentItem.estMin} – ₹{currentItem.estMax} each
                  {currentItem.notes && <><br />{currentItem.notes}</>}
                </div>
                <div className="refs">
                  <img
                    src={currentItem.image || '/images/categories/jewellery-accessories.jpg'}
                    alt="Reference"
                    className="ph"
                    onClick={() => setZoomImg(currentItem.image || '/images/categories/jewellery-accessories.jpg')}
                  />
                </div>
              </div>

              {/* Clearance Flow if Approved */}
              {currentItem.status === 'approved' && (
                <div className="card" style={{ border: '2px solid #22c55e', background: '#f0fdf4' }}>
                  <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ background: '#22c55e', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <div className="grow">
                      <b style={{ color: '#166534', fontSize: 16 }}>Customer Approved &amp; Paid from Wallet!</b>
                      <div style={{ color: '#15803d', fontSize: 13, marginTop: 2 }}>
                        Total {inr(currentItem.approvedAmount || 2440)} has been automatically debited from the customer's wallet.
                      </div>
                    </div>
                  </div>

                  <div className="note" style={{ background: '#dcfce7', color: '#166534', marginTop: 12, marginBottom: 12 }}>
                    <b>Ready for checkout:</b> Collect the item from the shop counter and confirm the purchase below.
                  </div>

                  <button
                    className="btn g"
                    style={{ width: '100%', fontSize: 15, padding: '12px 16px', fontWeight: 700 }}
                    onClick={() => handleMarkPurchased(currentItem.id)}
                  >
                    ✓ Confirm Purchased at Counter · {inr(currentItem.approvedAmount || 2440)}
                  </button>

                  <details style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
                    <summary style={{ cursor: 'pointer', padding: '6px 0', fontWeight: 600 }}>
                      Alternative: Need shop counter UPI QR payment from Admin treasury?
                    </summary>
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <label className="upload">
                        {shopQrImage ? <img src={shopQrImage} alt="QR" /> : <>{svg(ICONS.cam)}<span>Upload Shop Counter QR</span></>}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = () => setShopQrImage(String(r.result));
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                      <button
                        className="btn"
                        style={{ marginTop: 8 }}
                        disabled={!shopQrImage}
                        onClick={handleSendShopQr}
                      >
                        Send QR to Admin · {inr(currentItem.approvedAmount || 2440)}
                      </button>
                    </div>
                  </details>
                </div>
              )}

              {currentItem.status === 'purchased' && (
                <div className="card" style={{ border: '2px solid #22c55e', background: '#f0fdf4', textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🛍️</div>
                  <b style={{ color: '#166534', fontSize: 16 }}>Purchased &amp; Packed in Visasra Bag</b>
                  <div style={{ color: '#15803d', fontSize: 13, marginTop: 4 }}>
                    Total {inr(currentItem.approvedAmount || 2440)} debited from customer wallet.
                  </div>
                  <button
                    className="btn o"
                    style={{ marginTop: 12, width: '100%' }}
                    onClick={() => setScreen('list')}
                  >
                    ← Back to Shopping List (Next Product)
                  </button>
                </div>
              )}

              {currentItem.status === 'options_ready' && (
                <div className="card" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
                  <b style={{ color: '#92400e', fontSize: 14 }}>Waiting for Customer Selection</b>
                  <div style={{ color: '#b45309', fontSize: 13, marginTop: 2 }}>
                    Sent {currentItem.options.length} design option(s). Customer will review and select their choice in the Visasra app.
                  </div>
                </div>
              )}

              {/* Sourced Options List */}
              <div className="sec">
                <h3>Sourced Options</h3>
                <span className="pill">{currentItem.options.length} / {MAX_OPTIONS}</span>
              </div>

              {currentItem.options.map((opt, idx) => (
                <div key={opt.id} className="card">
                  <div className="row">
                    <img
                      src={opt.image}
                      alt=""
                      className="ph lg"
                      onClick={() => setZoomImg(opt.image)}
                    />
                    <div className="grow">
                      <div className="row">
                        <span className="m grow">Option {idx + 1}</span>
                        <span className={`pill ${opt.status === 'approved' ? 'g' : 'o'}`}>{opt.status}</span>
                      </div>
                      <div className="b" style={{ fontSize: 18 }}>₹{opt.price} <span className="m">each</span></div>
                      <div className="m">{opt.description}</div>
                    </div>
                  </div>
                  {opt.status === 'pending' && currentItem.status !== 'options_ready' && (
                    <button
                      className="link"
                      style={{ color: 'var(--danger)', marginTop: 8 }}
                      onClick={() => execAction({ action: 'remove_option', slotKey: selectedSlotKey, optionId: opt.id })}
                    >
                      Remove option
                    </button>
                  )}
                </div>
              ))}

              {currentItem.status !== 'approved' && currentItem.status !== 'purchased' && (
                <button
                  className="btn o"
                  disabled={currentItem.options.length >= MAX_OPTIONS}
                  onClick={() => setScreen('add')}
                >
                  + Add {currentItem.options.length ? 'another ' : ''}option
                </button>
              )}
            </div>

            {/* Bottom bar if options are ready to send */}
            {currentItem.status !== 'approved' && currentItem.status !== 'purchased' && (
              <div className="bar">
                <button
                  className="btn"
                  disabled={currentItem.options.length === 0}
                  onClick={handleSendOptionsToCustomer}
                >
                  Send {currentItem.options.length} option(s) to customer
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 11: ADD OPTION PHOTO & PRICING                         */}
        {/* ============================================================= */}
        {screen === 'add' && currentItem && (
          <div className="screen active">
            <div className="body has-bar">
              <div className="card">
                <div className="b sm">{currentItem.name}</div>
                <div className="m">Budget: ₹{currentItem.estMin} – ₹{currentItem.estMax} each</div>
              </div>

              <label>Photo of the product</label>
              <label className="upload">
                {optionImage ? <img src={optionImage} alt="" /> : <>{svg(ICONS.cam)}<span>Take or choose photo</span></>}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = () => setOptionImage(String(r.result));
                      r.readAsDataURL(f);
                    }
                  }}
                />
              </label>
              {optionImage && (
                <button className="link" style={{ marginTop: 6 }} onClick={() => setOptionImage('')}>
                  Remove photo
                </button>
              )}

              <label>Price per piece (₹)</label>
              <input
                type="number"
                placeholder="e.g. 2440"
                value={optionPrice}
                onChange={(e) => setOptionPrice(e.target.value)}
              />

              <label>Shop / Market Name &amp; Location</label>
              <input
                type="text"
                placeholder="e.g. Any local shop, market, weaver, or store across India"
                value={optionStore}
                onChange={(e) => setOptionStore(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 12 }}>
                {['Local Market', 'Artisan Store', 'Silk Weaver', 'Heritage Bazaar', 'City Mall'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      color: 'var(--text)',
                    }}
                    onClick={() => setOptionStore(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <label>Description <span className="m">(optional)</span></label>
              <textarea
                rows={3}
                placeholder="e.g. Pure silk, traditional zari border, fine craft"
                value={optionNote}
                onChange={(e) => setOptionNote(e.target.value)}
              />
            </div>

            <div className="bar">
              <button className="btn o" onClick={() => setScreen('prod')}>Cancel</button>
              <button className="btn" onClick={handleSaveOption}>Save option</button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 12: WAREHOUSE DROP-OFF & HANDOVER                      */}
        {/* ============================================================= */}
        {screen === 'complete' && currentSession && (
          <div className="screen active">
            <div className="body has-bar">
              {/* Shopping & Payout Summary Card */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="chk">{svg(ICONS.check)}</span>
                  <span className="grow b sm">All products purchased</span>
                  <b style={{ color: 'var(--blue)' }}>
                    {currentSession.order?.items.filter((i) => i.status === 'purchased').length} / {currentSession.order?.items.length}
                  </b>
                </div>
                <div className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="chk">{svg(ICONS.check)}</span>
                  <span className="grow b sm">Total customer billing</span>
                  <b style={{ color: 'var(--blue)' }}>{inr(currentSession.order?.totalAmount || 2440)}</b>
                </div>
                <div className="row" style={{ padding: '8px 0' }}>
                  <span className="chk">{svg(ICONS.check)}</span>
                  <span className="grow b sm">Your slot payout</span>
                  <b style={{ color: 'var(--success)' }}>+₹{PAY_PER_SLOT}</b>
                </div>
              </div>

              {/* Step 1: Drop-Off Location & Delivery Handover */}
              {(() => {
                const addr = currentSession.order?.shippingAddress as Record<string, string> | undefined;
                const formattedAddr = addr
                  ? [addr.line1, addr.line2, addr.city, addr.region, addr.zip, addr.country].filter(Boolean).join(', ')
                  : 'Coordinated via Visasra Central Hub';
                const hubAddress = 'Visasra Central Fulfillment Hub & QC Center, #42 Cathedral Road, Alwarpet, Chennai, Tamil Nadu 600086';

                return (
                  <div
                    className="card"
                    style={{
                      background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
                      border: '1.5px solid #BBF7D0',
                      marginBottom: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        🏢
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#15803D', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          Step 1 · Bring Packages to QC Hub / Delivery
                        </div>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                          Order #{currentSession.order?.orderNumber || 'Handover'}
                        </div>
                      </div>
                    </div>

                    {/* Visasra Central QC Warehouse Hub Location */}
                    <div style={{ background: '#F8FAFC', border: '1.5px solid #CFE0F3', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0A3A6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                        🏢 Primary Drop-Off: Visasra QC &amp; Packaging Hub
                      </div>
                      <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, fontWeight: 600 }}>
                        {hubAddress}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: '100%', fontSize: 12, fontWeight: 700, padding: '8px 12px', marginTop: 8, background: '#FFFFFF', color: '#0A3A6B', borderColor: '#93C5FD' }}
                        onClick={() => {
                          window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(hubAddress), '_blank');
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, marginRight: 6 }}>
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        Navigate to Visasra QC Hub (Google Maps)
                      </button>
                    </div>

                    {/* Customer Destination Address */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                        📍 Final Customer Destination
                      </div>
                      <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5, fontWeight: 600 }}>
                        {formattedAddr}
                      </div>
                      {addr?.phone && (
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          📞 <b>Customer Contact:</b> {addr.phone}
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: '100%', fontSize: 12, fontWeight: 700, padding: '8px 12px', marginTop: 8, background: '#FFFFFF', color: '#15803D', borderColor: '#86EFAC' }}
                        onClick={() => {
                          window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(formattedAddr), '_blank');
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, marginRight: 6 }}>
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        Navigate to Customer Address (Google Maps)
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Step 2: Handover Protocol & Admin OTP */}
              <div
                className="card"
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  marginBottom: 14,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    🔐
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2563EB', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Step 2 · Admin Quality Inspection &amp; OTP
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                      Admin Handover Verification
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>
                  1. Place all packages and original store bills on the QC counter.<br />
                  2. Admin will inspect all items and share the <b>4-digit Handover OTP</b>.<br />
                  3. Enter the OTP below to complete the slot and release your payout.
                </div>

                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                  Enter 4-Digit Handover OTP from Admin *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="e.g. 8492"
                  value={warehouseOtp}
                  onChange={(e) => setWarehouseOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 22,
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: 10,
                    borderRadius: 12,
                    border: '2px solid #93C5FD',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    marginBottom: 12,
                  }}
                />

                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                  Notes for Warehouse Packing Team (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fragile silk box. Store bill #GRT-8291 attached inside envelope."
                  value={finalPackingNote}
                  onChange={(e) => setFinalPackingNote(e.target.value)}
                  style={{ fontSize: 12.5 }}
                />
              </div>

              {handoverVerified && (
                <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 14, padding: 14, textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#15803D' }}>🎉 Handover Verified!</div>
                  <div style={{ fontSize: 12.5, color: '#166534', marginTop: 3 }}>
                    Packages accepted by Admin. +₹{PAY_PER_SLOT} payout credited to your wallet!
                  </div>
                </div>
              )}
            </div>

            <div className="bar">
              <button
                className="btn"
                style={{ background: '#0A3A6B', color: '#fff', padding: '14px', fontSize: 14, fontWeight: 800 }}
                onClick={handleFinishPacking}
              >
                Verify OTP &amp; Complete Handover (+₹{PAY_PER_SLOT})
              </button>
            </div>
          </div>
        )}



        {/* ============================================================= */}
        {/* SCREEN 14: EARNINGS & PAYOUTS                                 */}
        {/* ============================================================= */}
        {screen === 'earn' && (
          <div className="screen active">
            <div className="body">
              <div className="card pad" style={{ background: 'linear-gradient(135deg, #0F3567 0%, #164A8A 100%)', color: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#8FC0FF', fontWeight: 700 }}>Available Balance</div>
                <div style={{ fontSize: 36, fontWeight: 800, margin: '6px 0 12px' }}>₹{worker?.walletBalance || 0}</div>
                <div className="m" style={{ color: '#CFE0F3' }}>Earn ₹350 per fulfilled personal shopping slot</div>
              </div>

              <div className="tabs" style={{ marginTop: 14 }}>
                <button className={earnTab === 'hist' ? 'on' : ''} onClick={() => setEarnTab('hist')}>History</button>
                <button className={earnTab === 'pay' ? 'on' : ''} onClick={() => setEarnTab('pay')}>Weekly Payout</button>
                <button className={earnTab === 'emerg' ? 'on' : ''} onClick={() => setEarnTab('emerg')}>Emergency (30%)</button>
              </div>

              {earnTab === 'hist' && (
                <>
                  {sessions.filter((s) => phaseOf(s) === 'done' || s.stage === 'packed' || s.status === 'completed').length > 0 ? (
                    sessions
                      .filter((s) => phaseOf(s) === 'done' || s.stage === 'packed' || s.status === 'completed')
                      .map((s) => (
                        <div key={s.id} className="card pad">
                          <div className="row">
                            <div className="grow">
                              <div className="b sm">Shopping Slot Completed</div>
                              <div className="m">{s.storeName || 'Local Market / Store'} · {s.order?.orderNumber || s.slotKey}</div>
                            </div>
                            <b style={{ color: 'var(--success)' }}>+₹350</b>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="card pad" style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div className="b sm" style={{ color: 'var(--text)' }}>No completed slots yet</div>
                      <div className="m" style={{ marginTop: 4 }}>
                        Your completed shopping slots and +₹350 payouts will appear here in real time.
                      </div>
                    </div>
                  )}
                </>
              )}

              {earnTab === 'pay' && (
                <>
                  <div className="note" style={{ background: '#EAF2FC' }}>
                    <b>Weekly Payouts every Wednesday</b><br />
                    Earnings are directly transferred to your registered UPI address.
                  </div>
                  <button
                    className="btn"
                    disabled={(worker?.walletBalance || 0) <= 0}
                    onClick={() => {
                      execAction({ action: 'request_payout', payoutAmount: worker?.walletBalance || 0 });
                      showToast('Wednesday payout initiated to ' + (worker?.payoutUpi || 'registered UPI'));
                    }}
                  >
                    Withdraw full balance · ₹{worker?.walletBalance || 0}
                  </button>
                </>
              )}

              {earnTab === 'emerg' && (
                <>
                  <div className="note">
                    <b>Need money before Wednesday?</b><br />
                    You can take up to 30% of your earnings once per week in advance.
                  </div>
                  <div className="card row">
                    <div className="grow">
                      <div className="m">Emergency Withdrawal Cap</div>
                      <div className="b" style={{ fontSize: 24 }}>₹{Math.floor((worker?.walletBalance || 0) * 0.3)}</div>
                    </div>
                    <span className="pill g">1 left this week</span>
                  </div>
                  <button
                    className="btn red"
                    disabled={(worker?.walletBalance || 0) <= 0}
                    onClick={() => {
                      const cap = Math.floor((worker?.walletBalance || 0) * 0.3);
                      execAction({ action: 'request_payout', payoutAmount: cap });
                      showToast(`Emergency payout of ₹${cap} requested`);
                    }}
                  >
                    Withdraw 30% now · ₹{Math.floor((worker?.walletBalance || 0) * 0.3)}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 15: PROFILE & IDENTITY (COMPREHENSIVE DOSSIER)          */}
        {/* ============================================================= */}
        {screen === 'profile' && (
          <div className="screen active">
            <div className="body">
              {/* Partner Card */}
              <div className="card row" style={{ padding: '16px', background: '#fff' }}>
                <div className="av" style={{ width: 62, height: 62, fontSize: 20, background: 'linear-gradient(135deg, #123A69 0%, #1D5DA3 100%)', color: '#fff', fontWeight: 800 }}>
                  {worker?.name ? worker.name.slice(0, 2).toUpperCase() : 'HN'}
                </div>
                <div className="grow" style={{ marginLeft: 12 }}>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: '#123A69' }}>
                    {worker?.name || 'Partner Shopper'}
                  </div>
                  <div className="m" style={{ color: '#475569', fontSize: 13, marginTop: 2 }}>{worker?.phone}</div>
                  {worker?.email && (
                    <div className="m" style={{ color: '#64748B', fontSize: 12 }}>{worker.email}</div>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <span className="pill g" style={{ fontSize: 11, padding: '2px 8px' }}>★ {worker?.rating || 4.9} Rating</span>
                    <span className="pill" style={{ fontSize: 11, padding: '2px 8px', background: '#E0F2FE', color: '#0369A1' }}>
                      Partner ID: #{worker?.id ? worker.id.slice(0, 8).toUpperCase() : 'VIS-W840'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Identity & KYC Verification Dossier */}
              <div className="card" style={{ marginTop: 12, padding: '14px 16px', border: worker?.kycStatus === 'verified' ? '1.5px solid #22c55e' : '1px solid var(--border)' }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="chk" style={{ background: worker?.kycStatus === 'verified' ? 'var(--success)' : 'var(--warn)', width: 26, height: 26 }}>
                    {svg(worker?.kycStatus === 'verified' ? ICONS.check : ICONS.clock)}
                  </span>
                  <div className="grow" style={{ marginLeft: 8 }}>
                    <div className="b sm" style={{ color: worker?.kycStatus === 'verified' ? '#166534' : '#9A3412', fontSize: 14 }}>
                      {worker?.kycStatus === 'verified' ? 'Identity Verified & KYC Approved' : worker?.kycStatus === 'pending' ? 'Verification Pending Admin Approval' : 'KYC Required'}
                    </div>
                    <div className="m" style={{ fontSize: 12 }}>
                      Verified Partner · Eligible for Live Shopping &amp; Direct Sourcing
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>Government ID Application Records</div>
                  <dl className="kv" style={{ fontSize: 12, margin: 0 }}>
                    <dt>Aadhaar Number</dt>
                    <dd style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {worker?.aadhaarNumber ? `XXXX XXXX ${worker.aadhaarNumber.slice(-4)}` : 'XXXX XXXX 2222'}
                    </dd>
                    <dt>PAN Card</dt>
                    <dd style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {worker?.panNumber || 'ABCDE1234F'}
                    </dd>
                    <dt>Driving License</dt>
                    <dd style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {worker?.drivingLicenseNumber || 'TN01 20220001234'}
                    </dd>
                    <dt>Alt. Mobile</dt>
                    <dd>{worker?.altPhone || '+91 98765 43210'}</dd>
                    <dt>Present Address</dt>
                    <dd>{worker?.currentAddress || 'No. 42, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017'}</dd>
                    <dt>Permanent Address</dt>
                    <dd>{worker?.permanentAddress || 'Plot 15, Lake View Enclave, Anna Nagar West, Chennai, Tamil Nadu 600040'}</dd>
                  </dl>
                </div>
              </div>

              {/* Bank Account & Payout Details Card */}
              <div className="card" style={{ marginTop: 12, padding: '14px 16px', background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🏦</span>
                    <div>
                      <div className="b sm" style={{ color: '#166534', fontSize: 14 }}>Bank Account &amp; Payouts</div>
                      <div className="m" style={{ color: '#15803d', fontSize: 11 }}>Weekly Direct Deposit &amp; Shop QR Treasury</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="link"
                    style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textDecoration: 'underline' }}
                    onClick={openBankModal}
                  >
                    ✏️ Update
                  </button>
                </div>

                <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #BBF7D0' }}>
                  <dl className="kv" style={{ fontSize: 12, margin: 0 }}>
                    <dt>Bank Name</dt>
                    <dd style={{ fontWeight: 700, color: '#1E293B' }}>{worker?.bankName || 'HDFC Bank'}</dd>
                    <dt>Branch</dt>
                    <dd>{worker?.bankBranch || 'T. Nagar Branch, Chennai'}</dd>
                    <dt>Account Number</dt>
                    <dd style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                      {worker?.bankAccountNumber ? `•••• •••• •••• ${worker.bankAccountNumber.slice(-4)}` : '•••• •••• •••• 1456'}
                    </dd>
                    <dt>IFSC Code</dt>
                    <dd style={{ fontFamily: 'monospace', fontWeight: 700 }}>{worker?.bankIfscCode || 'HDFC0000124'}</dd>
                    <dt>Payout UPI</dt>
                    <dd style={{ fontFamily: 'monospace', color: '#15803d', fontWeight: 600 }}>{worker?.payoutUpi || 'partner@okhdfcbank'}</dd>
                  </dl>
                </div>
              </div>

              {/* Performance & Slots Stats */}
              <div className="stats" style={{ marginTop: 12 }}>
                <div className="stat" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                  <b>{worker?.ordersDone ?? 323}</b>
                  <span>Slots done</span>
                </div>
                <div className="stat" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                  <b style={{ color: 'var(--success)' }}>₹{worker?.walletBalance || 4200}</b>
                  <span>Wallet Balance</span>
                </div>
              </div>

              {/* Online / Offline Switch */}
              <div className="card row" style={{ marginTop: 12 }}>
                <div className="grow">
                  <div className="b">{worker?.status === 'active' ? 'Online' : 'Offline'}</div>
                  <div className="m">{worker?.status === 'active' ? 'You can receive new slots in Chennai.' : 'Slots are hidden while offline.'}</div>
                </div>
                <button
                  className={`toggle ${worker?.status === 'active' ? 'on' : ''}`}
                  onClick={() => {
                    const next = worker?.status !== 'active';
                    execAction({ action: 'toggle_online', isOnline: next });
                    showToast(next ? 'You are now Online' : 'You are now Offline');
                  }}
                  aria-label="Toggle Online"
                />
              </div>

              {/* Sign out */}
              <button
                className="btn red"
                style={{ marginTop: 14 }}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            {/* Modal: Update Bank Account Details */}
            {showBankModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}
                onClick={() => setShowBankModal(false)}
              >
                <div
                  style={{
                    background: '#fff',
                    width: '100%',
                    maxWidth: 480,
                    borderRadius: '16px 16px 0 0',
                    padding: '20px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <b style={{ fontSize: 17, color: '#123A69' }}>Update Bank &amp; Payout Account</b>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
                      onClick={() => setShowBankModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveBankDetails}>
                    <label className="fl">Bank Name</label>
                    <input
                      className="kin"
                      placeholder="e.g. HDFC Bank / State Bank of India"
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                    />

                    <label className="fl" style={{ marginTop: 10 }}>Branch Name</label>
                    <input
                      className="kin"
                      placeholder="e.g. T. Nagar Branch, Chennai"
                      value={editBankBranch}
                      onChange={(e) => setEditBankBranch(e.target.value)}
                    />

                    <label className="fl" style={{ marginTop: 10 }}>Bank Account Number <b style={{ color: '#E51D2A' }}>*</b></label>
                    <input
                      className="kin"
                      placeholder="Enter bank account number"
                      type="password"
                      value={editBankAccountNumber}
                      onChange={(e) => setEditBankAccountNumber(e.target.value)}
                    />

                    <label className="fl" style={{ marginTop: 10 }}>Confirm Bank Account Number <b style={{ color: '#E51D2A' }}>*</b></label>
                    <input
                      className="kin"
                      placeholder="Re-enter bank account number"
                      value={editBankConfirmAccountNumber}
                      onChange={(e) => setEditBankConfirmAccountNumber(e.target.value)}
                    />

                    <label className="fl" style={{ marginTop: 10 }}>IFSC Code <b style={{ color: '#E51D2A' }}>*</b></label>
                    <input
                      className="kin"
                      placeholder="e.g. HDFC0000124"
                      maxLength={11}
                      style={{ textTransform: 'uppercase' }}
                      value={editBankIfscCode}
                      onChange={(e) => setEditBankIfscCode(e.target.value.toUpperCase())}
                    />

                    <label className="fl" style={{ marginTop: 10 }}>Payout UPI ID (Optional)</label>
                    <input
                      className="kin"
                      placeholder="e.g. yourname@okaxis"
                      value={editPayoutUpi}
                      onChange={(e) => setEditPayoutUpi(e.target.value)}
                    />

                    <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="btn o2"
                        style={{ flex: 1 }}
                        onClick={() => setShowBankModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn"
                        style={{ flex: 2 }}
                        disabled={bankUpdating}
                      >
                        {bankUpdating ? 'Saving to Database...' : 'Save Bank Details'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* SCREEN 16: NOTIFICATIONS                                      */}
        {/* ============================================================= */}
        {screen === 'notes' && (
          <div className="screen active">
            <div className="body">
              {actionItems.length > 0 ? (
                actionItems.map(({ session, item, type }) => (
                  <div
                    key={item.id}
                    className="card note-row new"
                    onClick={() => {
                      setSelectedSlotKey(session.slotKey);
                      setSelectedItemId(item.id);
                      setScreen('prod');
                    }}
                  >
                    <div className="row">
                      <span className="chk" style={{ background: type === 'buy' ? 'var(--success)' : 'var(--warn)' }}>
                        {svg(type === 'buy' ? ICONS.check : ICONS.back)}
                      </span>
                      <div className="grow">
                        <div className="b sm">
                          {type === 'buy' ? 'Admin paid shop' : type === 'qr' ? 'Customer approved option' : 'Customer wants other options'}
                        </div>
                        <div className="m">{item.name} · Tap to view</div>
                      </div>
                      <i className="dot"></i>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <b>No notifications</b>
                  You will receive instant alerts here when customers approve options or admins clear payments.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* BOTTOM NAVIGATION BAR                                         */}
        {/* ============================================================= */}
        {isKYCOk() && !['login', 'otp', 'forgot', 'kycform', 'kycwait', 'kycrej'].includes(screen) && (
          <nav className="nav">
            <button
              className={activeTab === 'home' && screen === 'home' ? 'on' : ''}
              onClick={() => { setActiveTab('home'); setScreen('home'); }}
            >
              <span className="ic">{svg(ICONS.home)}</span>
              Home
            </button>
            <button
              className={activeTab === 'slots' || ['detail', 'list', 'prod', 'add', 'complete'].includes(screen) ? 'on' : ''}
              onClick={() => { setActiveTab('slots'); setScreen('slots'); }}
            >
              <span className="ic">
                {svg(ICONS.slots)}
                {actionItems.length > 0 && <i className="cnt">{actionItems.length}</i>}
              </span>
              My Slots
            </button>

            <button
              className={activeTab === 'earn' && screen === 'earn' ? 'on' : ''}
              onClick={() => { setActiveTab('earn'); setScreen('earn'); }}
            >
              <span className="ic">{svg(ICONS.wallet)}</span>
              Earnings
            </button>
            <button
              className={activeTab === 'profile' && screen === 'profile' ? 'on' : ''}
              onClick={() => { setActiveTab('profile'); setScreen('profile'); }}
            >
              <span className="ic">{svg(ICONS.user)}</span>
              Profile
            </button>
          </nav>
        )}

        {/* ============================================================= */}
        {/* FULLSCREEN IMAGE ZOOM MODAL                                   */}
        {/* ============================================================= */}
        {zoomImg && (
          <div className="zoom" onClick={() => setZoomImg(null)}>
            <img src={zoomImg} alt="" />
            <span>Tap anywhere to close</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* TOAST NOTIFICATION                                            */}
        {/* ============================================================= */}
        <div
          id="toast"
          className={`${toastMsg ? 'show' : ''} ${
            toastMsg && /error|failed|incorrect|invalid|not found|no account|warning/i.test(toastMsg)
              ? 'toast-error'
              : toastMsg && /success|congratulations|welcome|approved|verified|credited|complete|filled/i.test(toastMsg)
              ? 'toast-success'
              : ''
          }`}
          role="status"
        >
          {toastMsg && (
            <span className="toast-ico">
              {/error|failed|incorrect|invalid|not found|no account|warning/i.test(toastMsg)
                ? '✕'
                : /success|congratulations|welcome|approved|verified|credited|complete|filled/i.test(toastMsg)
                ? '✓'
                : 'ℹ'}
            </span>
          )}
          <span>{toastMsg}</span>
        </div>
      </div>
    </div>
  );
}
