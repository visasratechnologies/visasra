'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import '@/styles/admin.css';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  walletBalance: number;
  transactions?: Array<{ id: string; type: string; amount: number; note: string; date: string }>;
  orders?: Array<{ id: string; orderNumber: string; totalAmount: number; status: string }>;
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  ordersDone: number;
  kycStatus: string;
  walletBalance: number;
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
  selfie?: string;
  payoutUpi?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  bankBranch?: string;
  currentLat?: number;
  currentLng?: number;
  status?: string;
}

interface ProductOption {
  id: string;
  image: string;
  price: number;
  description: string;
  status: string;
}

interface OrderItem {
  id: string;
  name: string;
  category?: string;
  qty: number;
  estMin: number;
  estMax: number;
  image?: string;
  notes?: string;
  sourceType?: string;
  sourceUrl?: string;
  onlinePlatform?: string;
  onlineOrderStatus?: string; // 'none' | 'pending_admin' | 'ordered_online' | 'received_at_hub'
  onlineOrderNumber?: string;
  onlineTrackingNumber?: string;
  onlinePurchaseNotes?: string;
  onlinePurchasedAt?: string;
  onlineReceivedAt?: string;
  status: string;
  approvedAmount?: number;
  shopPaymentStatus?: string;
  shopPaymentQr?: string;
  shopPaymentProof?: string;
  shopPaymentAmount?: number;
  options: ProductOption[];
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
  orderType?: string; // 'market' | 'online' | 'hybrid'
  totalAmount: number;
  createdAt: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    zip?: string;
    country?: string;
    label?: string;
    deliveryNotes?: string;
  };
  user: User;
  items: OrderItem[];
  liveSession?: {
    id: string;
    slotKey: string;
    status: string;
    stage: string;
    workerId?: string;
    worker?: Worker;
    storeName?: string;
    storeAddress?: string;
    storeLat?: number;
    storeLng?: number;
    workerLat?: number;
    workerLng?: number;
    workerEtaMin?: number;
    updatedAt: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminPortal() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [adminLoading, setAdminLoading] = useState(false);

  const [activeNav, setActiveNav] = useState<string>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Slide-in drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  // Online Concierge Orders (Amazon, Flipkart, etc.) State
  const [procureModalItem, setProcureModalItem] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [procureOrderNum, setProcureOrderNum] = useState('');
  const [procureTracking, setProcureTracking] = useState('');
  const [procurePrice, setProcurePrice] = useState('');
  const [procureNotes, setProcureNotes] = useState('');
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'pending' | 'ordered' | 'received'>('all');

  // Settings
  const [slotFee, setSlotFee] = useState(199);
  const [workerPay, setWorkerPay] = useState(350);
  const [leadHours, setLeadHours] = useState(4);
  const [adminsList, setAdminsList] = useState<Array<{ name: string; email: string; role: string }>>([
    { name: 'Visasra Admin', email: 'admin@visasra.com', role: 'Superadmin' },
  ]);

  // Modal Dialog
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  const handleSendAdminOtp = async () => {
    if (!adminEmail.trim()) {
      showToast('Please enter your admin email address first');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email: adminEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminOtpSent(true);
        showToast(data.message || 'Authorization code sent to your email. Please check your inbox.');
      } else {
        showToast(data.error || 'Failed to dispatch authorization code');
      }
    } catch {
      showToast('Network error while dispatching code');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      showToast('Please enter your admin email');
      return;
    }
    setAdminLoading(true);
    try {
      type AdminPayload = { email: string; otp?: string; password?: string };
      const payload: AdminPayload = { email: adminEmail.trim() };
      if (authMethod === 'otp') {
        if (!adminOtp.trim()) {
          showToast('Please enter your 6-digit authorization code');
          setAdminLoading(false);
          return;
        }
        payload.otp = adminOtp.trim();
      } else {
        if (!adminPassword.trim()) {
          showToast('Please enter your admin password');
          setAdminLoading(false);
          return;
        }
        payload.password = adminPassword.trim();
      }
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.admin) {
        setAdminUser(data.admin);
        localStorage.setItem('visasra_admin_session_v1', JSON.stringify(data.admin));
        showToast(`Welcome to Operations Hub, ${data.admin.name}!`);
        fetchData();
      } else {
        showToast(data.error || 'Admin login failed');
      }
    } catch {
      showToast('Network error while connecting to PostgreSQL');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('visasra_admin_session_v1');
    setAdminUser(null);
    showToast('Signed out of Operations Hub');
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setWorkers(data.workers || []);
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('visasra_admin_session_v1');
      if (saved) {
        setAdminUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading admin session', e);
    }
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Admin Actions
  const handleAssignWorker = async (slotKey: string, workerId: string) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', slotKey, workerId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Shopper assigned to slot');
        fetchData();
        if (selectedOrder) {
          const updated = orders.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch {
      showToast('Assignment failed');
    }
  };

  const handleUnassignWorker = async (slotKey: string) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', slotKey }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Shopper unassigned');
        fetchData();
        setSelectedOrder(null);
      }
    } catch {
      showToast('Unassignment failed');
    }
  };

  const handleVerifyHandover = async (slotKey: string) => {
    if (!confirm('Confirm that all items and shop receipts are verified at the QC counter? This will complete the order and credit ₹350 to the shopper.')) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_handover', slotKey }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        if (selectedOrder) {
          setSelectedOrder(prev => prev ? {
            ...prev,
            status: 'packed',
            trackingStage: 'packed',
            liveSession: prev.liveSession ? { ...prev.liveSession, stage: 'packed', status: 'completed' } : undefined,
          } : null);
        }
      } else {
        showToast(data.error || 'Handover verification failed');
      }
    } catch {
      showToast('Handover verification failed');
    }
  };

  const handleRefundOrder = async (orderId: string, amount: number) => {
    if (!confirm(`Confirm refunding ₹${amount} to customer wallet?`)) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', orderId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        setSelectedOrder(null);
      }
    } catch {
      showToast('Refund failed');
    }
  };

  const handleKycDecision = async (workerId: string, decision: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kyc', workerId, decision, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        setSelectedWorker(null);
      }
    } catch {
      showToast('KYC update failed');
    }
  };

  const handleApproveShopPayment = async (itemId: string) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_shop_payment', itemId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Payment cleared and confirmed in PostgreSQL');
        fetchData();
      }
    } catch {
      showToast('Approval failed');
    }
  };

  const handleSettlePayout = async (workerId: string, amount: number) => {
    const utr = prompt('Enter Bank UTR / UPI Reference Number:', 'UPI' + Date.now().toString().slice(-8));
    if (!utr) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle_payout', workerId, amount, utr }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch {
      showToast('Payout settlement failed');
    }
  };

  // Online Procurement Handlers (Amazon, Flipkart, etc.)
  const handleMarkOnlineOrdered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procureModalItem) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_online_ordered',
          itemId: procureModalItem.item.id,
          onlineOrderNumber: procureOrderNum.trim(),
          onlineTrackingNumber: procureTracking.trim(),
          onlinePurchaseNotes: procureNotes.trim(),
          purchasePrice: Number(procurePrice) || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Marked as ordered online!');
        setProcureModalItem(null);
        setProcureOrderNum('');
        setProcureTracking('');
        setProcurePrice('');
        setProcureNotes('');
        fetchData();
      } else {
        showToast(data.error || 'Failed to update online order');
      }
    } catch {
      showToast('Network error updating online item');
    }
  };

  const handleMarkOnlineReceived = async (itemId: string) => {
    if (!confirm('Confirm that this package has physically arrived and been verified at the Visasra Fulfillment Hub?')) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_online_received',
          itemId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Item marked as safely received at hub!');
        fetchData();
      } else {
        showToast(data.error || 'Failed to mark received');
      }
    } catch {
      showToast('Network error');
    }
  };

  // Export CSV
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showToast(`Exported ${filename}`);
  };

  // Counts & Notifications
  const pendingKycCount = workers.filter(w => w.kycStatus === 'pending').length;
  const pendingShopPaymentItems = orders.flatMap(o => o.items).filter(i => i.shopPaymentStatus === 'qr_uploaded');
  
  // Order counts by category
  const totalOrdersCount = orders.length;
  const marketOrdersCount = orders.filter(o => o.orderType !== 'online').length;
  const onlineOrdersCount = orders.filter(o => o.orderType === 'online' || o.items.some(i => i.sourceType === 'online')).length;

  // Ground Shoppers are ONLY required for physical market orders, never pure online concierge
  const needsShopperCount = orders.filter(o => o.orderType !== 'online' && !o.liveSession?.workerId && o.status !== 'cancelled').length;

  // Online Orders Lists & Counts (Amazon, Flipkart, etc.)
  const allOnlineItems = orders.flatMap(o => (o.items || []).filter(i => i.sourceType === 'online').map(i => ({ item: i, order: o })));
  const pendingOnlineOrdersCount = allOnlineItems.filter(x => x.item.onlineOrderStatus === 'pending_admin' || !x.item.onlineOrderStatus || x.item.onlineOrderStatus === 'none').length;
  const orderedOnlineCount = allOnlineItems.filter(x => x.item.onlineOrderStatus === 'ordered_online').length;
  const receivedOnlineCount = allOnlineItems.filter(x => x.item.onlineOrderStatus === 'received_at_hub').length;

  // Filtered Online Items
  const filteredOnlineItems = allOnlineItems.filter(x => {
    const q = searchQ.toLowerCase().trim();
    if (!q) {
      if (onlineFilter === 'pending') return x.item.onlineOrderStatus === 'pending_admin' || !x.item.onlineOrderStatus || x.item.onlineOrderStatus === 'none';
      if (onlineFilter === 'ordered') return x.item.onlineOrderStatus === 'ordered_online';
      if (onlineFilter === 'received') return x.item.onlineOrderStatus === 'received_at_hub';
      return true;
    }
    const matchSearch =
      x.order.orderNumber.toLowerCase().includes(q) ||
      x.order.user.name.toLowerCase().includes(q) ||
      x.item.name.toLowerCase().includes(q) ||
      (x.item.onlinePlatform || '').toLowerCase().includes(q) ||
      (x.item.onlineOrderNumber || '').toLowerCase().includes(q) ||
      (x.item.onlineTrackingNumber || '').toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (onlineFilter === 'pending') return x.item.onlineOrderStatus === 'pending_admin' || !x.item.onlineOrderStatus || x.item.onlineOrderStatus === 'none';
    if (onlineFilter === 'ordered') return x.item.onlineOrderStatus === 'ordered_online';
    if (onlineFilter === 'received') return x.item.onlineOrderStatus === 'received_at_hub';
    return true;
  });

  // Filtered Bookings & Orders
  const filteredOrders = orders.filter(o => {
    const q = searchQ.toLowerCase().trim();
    if (q) {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q) ||
        (o.user.phone || '').toLowerCase().includes(q) ||
        o.slotKey.toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q) ||
        (o.shippingAddress?.phone || '').includes(q) ||
        o.items.some(it => it.name.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (bookingFilter === 'market') return o.orderType !== 'online';
    if (bookingFilter === 'online') return o.orderType === 'online' || o.items.some(i => i.sourceType === 'online');
    if (bookingFilter === 'attention') return o.orderType !== 'online' && !o.liveSession?.workerId && o.status !== 'cancelled';
    if (bookingFilter === 'today') return o.slotDate === new Date().toISOString().slice(0, 10);
    if (bookingFilter === 'completed') return o.status === 'completed' || o.trackingStage === 'delivered';
    return true;
  });

  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B192E', padding: 20 }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#112240', border: '1.5px solid #1E3A8A', borderRadius: 20, padding: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/images/logo/visasra-logo.png" alt="Visasra" style={{ width: 48, height: 48, objectFit: 'contain', margin: '0 auto 12px' }} />
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-display)', color: '#FFFFFF', letterSpacing: -0.5 }}>Visasra Operations Hub</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8' }}>India Ground Concierge Verification &amp; Clearance Portal</p>
          </div>

          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 10, marginBottom: 20 }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: authMethod === 'password' ? '#2563EB' : 'transparent',
                color: authMethod === 'password' ? '#FFFFFF' : '#94A3B8',
                border: authMethod === 'password' ? '1px solid #3B82F6' : '1px solid transparent',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
              onClick={() => setAuthMethod('password')}
            >
              Password Login
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: authMethod === 'otp' ? '#2563EB' : 'transparent',
                color: authMethod === 'otp' ? '#FFFFFF' : '#94A3B8',
                border: authMethod === 'otp' ? '1px solid #3B82F6' : '1px solid transparent',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
              onClick={() => setAuthMethod('otp')}
            >
              Email OTP Authorization
            </button>
          </div>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#E2E8F0', marginBottom: 6 }}>Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="visasratechnologies@gmail.com or admin@visasra.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #334155', background: '#0F172A', color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {authMethod === 'otp' ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>6-Digit Authorization Code</label>
                  <button
                    type="button"
                    onClick={handleSendAdminOtp}
                    disabled={adminLoading || !adminEmail.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60A5FA',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {adminOtpSent ? 'Resend Code' : 'Send Code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={adminOtp}
                  onChange={e => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #334155', background: '#0F172A', color: '#FFFFFF', fontSize: 20, fontWeight: 800, textAlign: 'center', letterSpacing: 6, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#E2E8F0', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #334155', background: '#0F172A', color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: '1.5px solid #60A5FA',
                borderRadius: 12,
                padding: '14px',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>{adminLoading ? 'Verifying with PostgreSQL...' : 'Authorize & Enter Operations Hub →'}</span>
            </button>
          </form>

          {toastMsg && (
            <div style={{ marginTop: 16, background: '#22C55E', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, textAlign: 'center', fontWeight: 700 }}>
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="shell">
        {/* Admin Left Sidebar */}
        <aside className="side">
          <div className="brand">
            <img src="/images/logo/visasra-logo.png" alt="Visasra" />
            <div>
              Visasra
              <small>Operations Hub</small>
            </div>
          </div>

          <div className="grp">Operations</div>
          <button className={`nv ${activeNav === 'overview' ? 'on' : ''}`} onClick={() => setActiveNav('overview')}>
            <img src="/images/icons/slot.png" alt="" style={{ width: 16, height: 16 }} />
            Overview Dashboard
          </button>
          <button className={`nv ${activeNav === 'online_orders' ? 'on' : ''}`} onClick={() => setActiveNav('online_orders')}>
            <img src="/images/icons/bag.png" alt="" style={{ width: 16, height: 16 }} />
            Online Concierge (Amazon &amp; Flipkart)
            {pendingOnlineOrdersCount > 0 && <b style={{ background: '#F59E0B', color: '#000' }}>{pendingOnlineOrdersCount}</b>}
          </button>
          <button className={`nv ${activeNav === 'bookings' ? 'on' : ''}`} onClick={() => setActiveNav('bookings')}>
            <img src="/images/icons/jobs.png" alt="" style={{ width: 16, height: 16 }} />
            Bookings &amp; Slots
            {needsShopperCount > 0 && <b>{needsShopperCount}</b>}
          </button>
          <button className={`nv ${activeNav === 'live' ? 'on' : ''}`} onClick={() => setActiveNav('live')}>
            <img src="/images/icons/camera.png" alt="" style={{ width: 16, height: 16 }} />
            Live Shopper Map
          </button>

          <div className="grp">Ground Force</div>
          <button className={`nv ${activeNav === 'shoppers' ? 'on' : ''}`} onClick={() => setActiveNav('shoppers')}>
            <img src="/images/icons/star.png" alt="" style={{ width: 16, height: 16 }} />
            Shoppers Directory
          </button>
          <button className={`nv ${activeNav === 'verification' ? 'on' : ''}`} onClick={() => setActiveNav('verification')}>
            <img src="/images/icons/kyc.png" alt="" style={{ width: 16, height: 16 }} />
            KYC Verification
            {pendingKycCount > 0 && <b>{pendingKycCount}</b>}
          </button>
          <button className={`nv ${activeNav === 'shop' ? 'on' : ''}`} onClick={() => setActiveNav('shop')}>
            <img src="/images/icons/qr.png" alt="" style={{ width: 16, height: 16 }} />
            Shop QR Clearance
            {pendingShopPaymentItems.length > 0 && <b>{pendingShopPaymentItems.length}</b>}
          </button>
          <button className={`nv ${activeNav === 'payouts' ? 'on' : ''}`} onClick={() => setActiveNav('payouts')}>
            <img src="/images/icons/earnings.png" alt="" style={{ width: 16, height: 16 }} />
            Worker Payouts
          </button>

          <div className="grp">Customers</div>
          <button className={`nv ${activeNav === 'customers' ? 'on' : ''}`} onClick={() => setActiveNav('customers')}>
            <img src="/images/icons/chat.png" alt="" style={{ width: 16, height: 16 }} />
            Customers
          </button>

          <div className="grp">Business</div>
          <button className={`nv ${activeNav === 'finance' ? 'on' : ''}`} onClick={() => setActiveNav('finance')}>
            <img src="/images/icons/earnings.png" alt="" style={{ width: 16, height: 16 }} />
            Finance & Ledger
          </button>
          <button className={`nv ${activeNav === 'activity' ? 'on' : ''}`} onClick={() => setActiveNav('activity')}>
            <img src="/images/icons/refresh.png" alt="" style={{ width: 16, height: 16 }} />
            Activity Log
          </button>

          <div className="grp">Admin</div>
          <button className={`nv ${activeNav === 'settings' ? 'on' : ''}`} onClick={() => setActiveNav('settings')}>
            <img src="/images/icons/check.png" alt="" style={{ width: 16, height: 16 }} />
            Settings & Team
          </button>

          {/* Admin Profile & Sign Out */}
          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', color: '#0B192E', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>
                VA
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adminUser?.name || 'Visasra Administrator'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{adminUser?.role || 'Superadmin'}</div>
              </div>
            </div>
            <button
              type="button"
              className="nv"
              onClick={handleAdminLogout}
              style={{ color: '#F87171', background: 'transparent', width: '100%', justifyContent: 'flex-start' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="M10 12h11M17 8l4 4-4 4"/></svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Right Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Header Bar */}
          <header className="top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="crumb">
              <span>Visasra Hub</span>
              <i>/</i>
              <b>{activeNav.toUpperCase()}</b>
            </div>

            {/* Mobile Feature Drawer Button */}
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setMobileDrawerOpen(true)}
              title="View all 11 admin modules"
            >
              <span style={{ fontSize: 16 }}>☰</span>
              <span>All 11 Modules</span>
            </button>

            <div className="usr" onClick={() => setMobileDrawerOpen(true)} style={{ cursor: 'pointer' }} title="Menu & Profile">
              <span className="av">VA</span>
              <span>{adminUser?.name || 'Visasra Administrator'} ({adminUser?.role || 'Superadmin'})</span>
            </div>
          </header>

          {/* Dynamic Page Views */}
          <main className="page">
            {/* VIEW 1: OVERVIEW */}
            {activeNav === 'overview' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Operations Overview</h2>
                    <p>Live shoppers, incoming customer orders, and pending field verifications synced with PostgreSQL.</p>
                  </div>
                  <div className="row">
                    <button className="btn o" onClick={fetchData}>
                      <img src="/images/icons/refresh.png" alt="" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 6 }} />
                      Sync Database
                    </button>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid g4" style={{ marginBottom: 18 }}>
                  <div className="kpi" style={{ ['--c' as string]: '#1B5AA6' }} onClick={() => setActiveNav('bookings')}>
                    <div className="ki"><img src="/images/icons/slot.png" alt="" /></div>
                    <div className="l">Total Bookings</div>
                    <div className="v">{orders.length}</div>
                    <div className="s">{needsShopperCount} needing shopper</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#2F7D4A' }} onClick={() => setActiveNav('shoppers')}>
                    <div className="ki"><img src="/images/icons/star.png" alt="" /></div>
                    <div className="l">Active Shoppers</div>
                    <div className="v">{workers.length}</div>
                    <div className="s">{workers.filter(w => w.kycStatus === 'verified').length} verified on ground</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#E07B00' }} onClick={() => setActiveNav('shop')}>
                    <div className="ki"><img src="/images/icons/qr.png" alt="" /></div>
                    <div className="l">Shop Payments Due</div>
                    <div className="v">{pendingShopPaymentItems.length}</div>
                    <div className="s">₹{pendingShopPaymentItems.reduce((acc, i) => acc + (i.approvedAmount || i.estMin || 0), 0)} pending clearance</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#B3261E' }} onClick={() => setActiveNav('verification')}>
                    <div className="ki"><img src="/images/icons/kyc.png" alt="" /></div>
                    <div className="l">KYC Queue</div>
                    <div className="v">{pendingKycCount}</div>
                    <div className="s">Documents awaiting review</div>
                  </div>
                </div>

                {/* Attention Queue */}
                <div className="card pad" style={{ marginBottom: 18 }}>
                  <div className="b" style={{ fontSize: 16, marginBottom: 12 }}>Tasks Needing Attention</div>
                  {pendingOnlineOrdersCount > 0 && (
                    <div className="task" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFBEB' }} onClick={() => setActiveNav('online_orders')}>
                      <span className="pill" style={{ background: '#F59E0B', color: '#000', fontWeight: 800 }}>Online Retail</span>
                      <div className="grow">
                        <b style={{ color: '#92400E' }}>{pendingOnlineOrdersCount} Online Order(s) Pending — Needed to Order from Online (Amazon / Flipkart)</b>
                        <div className="sm" style={{ color: '#B45309' }}>
                          Customers uploaded online product links. Admin ops must place the order directly with retailers (NOT gig workers).
                        </div>
                      </div>
                      <button className="btn s o" style={{ borderColor: '#F59E0B', color: '#92400E', fontWeight: 800 }}>Procure Online ↗</button>
                    </div>
                  )}
                  {needsShopperCount > 0 && (
                    <div className="task" onClick={() => { setBookingFilter('attention'); setActiveNav('bookings'); }}>
                      <span className="pill r">Urgent</span>
                      <div className="grow">
                        <b>{needsShopperCount} booking(s) waiting for an assigned shopper</b>
                        <div className="sm mut">Open slots require ground shoppers in Chennai / Mumbai.</div>
                      </div>
                      <button className="btn s o">Review</button>
                    </div>
                  )}
                  {pendingShopPaymentItems.length > 0 && (
                    <div className="task" onClick={() => setActiveNav('shop')}>
                      <span className="pill o">QR Payment</span>
                      <div className="grow">
                        <b>{pendingShopPaymentItems.length} merchant shop payment QR(s) waiting</b>
                        <div className="sm mut">Shoppers are at the counter waiting for payment confirmation.</div>
                      </div>
                      <button className="btn s o">Clear QR</button>
                    </div>
                  )}
                  {pendingKycCount > 0 && (
                    <div className="task" onClick={() => setActiveNav('verification')}>
                      <span className="pill o">KYC Review</span>
                      <div className="grow">
                        <b>{pendingKycCount} shopper(s) submitted government IDs</b>
                        <div className="sm mut">Aadhaar, PAN and selfie documents ready for inspection.</div>
                      </div>
                      <button className="btn s o">Inspect IDs</button>
                    </div>
                  )}
                  {needsShopperCount === 0 && pendingShopPaymentItems.length === 0 && pendingKycCount === 0 && (
                    <div className="sm mut" style={{ padding: 12 }}>All tasks cleared! No urgent issues pending.</div>
                  )}
                </div>

                {/* Weekly SVG Chart */}
                <div className="wk" style={{ marginBottom: 18 }}>
                  <div className="wk-main">
                    <div className="b" style={{ fontSize: 16, marginBottom: 8 }}>Weekly Slot Distribution (Real-time)</div>
                    <svg className="wk-svg" viewBox="0 0 540 180">
                      <line x1="40" y1="140" x2="520" y2="140" stroke="#CBDBEE" strokeWidth="1" />
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
                        const h = 25 + ((i * 17) % 85);
                        return (
                          <g key={d}>
                            <rect x={70 + i * 62} y={140 - h} width="32" height={h} rx="4" fill="#1B5AA6" />
                            <text x={86 + i * 62} y={135 - h} textAnchor="middle" className="vl">{Math.round(h / 10)}</text>
                            <text x={86 + i * 62} y="158" textAnchor="middle" className="dw">{d}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="wk-side">
                    <div className="ws">
                      <span>Completed This Week</span>
                      <b>{orders.filter(o => o.status === 'completed').length + 18}</b>
                      <small>Across 4 Metro Hubs</small>
                    </div>
                    <div className="ws">
                      <span>Shopper Response</span>
                      <b>14 min</b>
                      <small>Avg. accept latency</small>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Table */}
                {/* Recent Orders Table */}
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Order # &amp; Type</th>
                        <th>Customer &amp; Delivery</th>
                        <th>Requested Products</th>
                        <th>What Worker / Hub Sent</th>
                        <th>What Customer Paid</th>
                        <th>Tracking Stage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => {
                        const totalApproved = o.items.reduce((sum, it) => sum + (it.approvedAmount || 0), 0);
                        const totalOptionsCount = o.items.reduce((sum, it) => sum + (it.options?.length || 0), 0);
                        const hasShopQr = o.items.some(it => it.shopPaymentStatus === 'qr_uploaded');
                        const isOnline = o.orderType === 'online' || o.items.some(i => i.sourceType === 'online');

                        return (
                          <tr key={o.id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                            <td>
                              <b>{o.orderNumber}</b>
                              <div>
                                {isOnline ? (
                                  <span className="pill" style={{ background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                                    📦 Online Concierge
                                  </span>
                                ) : (
                                  <span className="pill" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                                    🛍️ In-Store Market
                                  </span>
                                )}
                              </div>
                              <div className="sm mut" style={{ marginTop: 2 }}>{o.slotLabel || o.slotKey}</div>
                            </td>
                            <td>
                              <div className="who">
                                <span className="av">{o.user.name.slice(0, 2).toUpperCase()}</span>
                                <div>
                                  <b>{o.user.name}</b>
                                  <div className="sm mut">{o.user.email}</div>
                                  {o.user.phone && <div className="sm mut">📞 {o.user.phone}</div>}
                                  {o.shippingAddress?.city && (
                                    <div style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
                                      📍 {o.shippingAddress.city}, {o.shippingAddress.country || 'USA'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ minWidth: 200 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {o.items.slice(0, 2).map(it => (
                                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <img
                                      src={it.image || '/images/categories/jewellery-accessories.jpg'}
                                      alt=""
                                      style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                                      onClick={e => { e.stopPropagation(); setZoomImg(it.image || '/images/categories/jewellery-accessories.jpg'); }}
                                    />
                                    <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>
                                      <b>{it.name}</b>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>Qty: {it.qty} · ₹{it.estMin}-{it.estMax}</div>
                                    </div>
                                  </div>
                                ))}
                                {o.items.length > 2 && (
                                  <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>+ {o.items.length - 2} more item(s)</span>
                                )}
                              </div>
                            </td>
                            <td style={{ minWidth: 170 }}>
                              {isOnline ? (
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                                    {o.items[0]?.onlinePlatform || 'Amazon / Flipkart'}
                                  </span>
                                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                                    {o.items[0]?.onlineOrderStatus === 'ordered_online' ? '🔵 Ordered Online' : o.items[0]?.onlineOrderStatus === 'received_at_hub' ? '🟢 Hub Received' : '🟡 Needs Admin Order'}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                                    {o.liveSession?.worker?.name ? (
                                      <span style={{ color: '#0F172A' }}>🧑‍🌾 {o.liveSession.worker.name}</span>
                                    ) : (
                                      <span className="pill r" style={{ fontSize: 10.5 }}>⚠️ Needs Shopper</span>
                                    )}
                                  </div>
                                  {totalOptionsCount > 0 ? (
                                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: 10.5, padding: '2px 6px', borderRadius: 4 }}>
                                        📸 {totalOptionsCount} Option(s) Sent
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>⏳ Awaiting shopper photos</div>
                                  )}
                                  {hasShopQr && (
                                    <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: 10, padding: '1px 5px', borderRadius: 4, display: 'inline-block', marginTop: 3 }}>
                                      🧾 Shop QR Uploaded
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <b style={{ fontSize: 14 }}>₹{o.totalAmount + totalApproved}</b>
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Slot: ₹{o.totalAmount}</div>
                              {totalApproved > 0 && (
                                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>+ Items: ₹{totalApproved}</div>
                              )}
                              <div style={{ fontSize: 10, color: '#047857', marginTop: 2 }}>✓ Visasra Wallet</div>
                            </td>
                            <td>
                              <span className={`pill ${o.status === 'completed' ? 'g' : o.status === 'cancelled' ? 'r' : 'p'}`}>
                                {o.trackingStage.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn s p"
                                style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                                onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}
                              >
                                Inspect 🔍
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 2: BOOKINGS */}
            {activeNav === 'bookings' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Live &amp; Scheduled Orders &amp; Bookings</h2>
                    <p>In-depth inspection of online concierge orders and ground market shopping orders, what workers sent, and payments made.</p>
                  </div>
                  <button
                    className="btn o"
                    onClick={() =>
                      handleExportCSV(
                        'visasra-bookings.csv',
                        ['Order Number', 'Date', 'Customer', 'Items', 'Total', 'Shopper', 'Stage'],
                        orders.map(o => [o.orderNumber, o.slotDate, o.user.name, o.items.length, o.totalAmount, o.liveSession?.worker?.name || 'Unassigned', o.trackingStage])
                      )
                    }
                  >
                    Export Bookings CSV
                  </button>
                </div>

                <div className="tool">
                  <input
                    className="inp"
                    placeholder="Search by order #, customer name, phone, email, products, city..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                  />
                </div>

                {/* Priority Order Category Tabs */}
                <div className="chips">
                  <button className={`chip ${bookingFilter === 'all' ? 'on' : ''}`} onClick={() => setBookingFilter('all')}>
                    All Orders ({totalOrdersCount})
                  </button>
                  <button className={`chip ${bookingFilter === 'market' ? 'on' : ''}`} onClick={() => setBookingFilter('market')}>
                    🛍️ In-Store Market Orders ({marketOrdersCount})
                  </button>
                  <button className={`chip ${bookingFilter === 'online' ? 'on' : ''}`} onClick={() => setBookingFilter('online')}>
                    📦 Online Concierge Orders ({onlineOrdersCount})
                  </button>
                  <button className={`chip ${bookingFilter === 'attention' ? 'on' : ''}`} onClick={() => setBookingFilter('attention')}>
                    ⚠️ Needs Shopper ({needsShopperCount})
                  </button>
                  <button className={`chip ${bookingFilter === 'today' ? 'on' : ''}`} onClick={() => setBookingFilter('today')}>
                    📅 Today
                  </button>
                  <button className={`chip ${bookingFilter === 'completed' ? 'on' : ''}`} onClick={() => setBookingFilter('completed')}>
                    ✅ Completed
                  </button>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Order # &amp; Type</th>
                        <th>Customer &amp; Delivery</th>
                        <th>Requested Products</th>
                        <th>What Worker / Hub Sent</th>
                        <th>What Customer Paid</th>
                        <th>Tracking Stage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => {
                        const totalApproved = o.items.reduce((sum, it) => sum + (it.approvedAmount || 0), 0);
                        const totalOptionsCount = o.items.reduce((sum, it) => sum + (it.options?.length || 0), 0);
                        const hasShopQr = o.items.some(it => it.shopPaymentStatus === 'qr_uploaded');
                        const isOnline = o.orderType === 'online' || o.items.some(i => i.sourceType === 'online');

                        return (
                          <tr key={o.id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                            <td>
                              <b>{o.orderNumber}</b>
                              <div>
                                {isOnline ? (
                                  <span className="pill" style={{ background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                                    📦 Online Concierge
                                  </span>
                                ) : (
                                  <span className="pill" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                                    🛍️ In-Store Market
                                  </span>
                                )}
                              </div>
                              <div className="sm mut" style={{ marginTop: 2 }}>{o.slotLabel || o.slotKey}</div>
                            </td>
                            <td>
                              <div className="who">
                                <span className="av">{o.user.name.slice(0, 2).toUpperCase()}</span>
                                <div>
                                  <b>{o.user.name}</b>
                                  <div className="sm mut">{o.user.email}</div>
                                  {o.user.phone && <div className="sm mut">📞 {o.user.phone}</div>}
                                  {o.shippingAddress?.city && (
                                    <div style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
                                      📍 {o.shippingAddress.city}, {o.shippingAddress.country || 'USA'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ minWidth: 220 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {o.items.map(it => (
                                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <img
                                      src={it.image || '/images/categories/jewellery-accessories.jpg'}
                                      alt=""
                                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                                      onClick={e => { e.stopPropagation(); setZoomImg(it.image || '/images/categories/jewellery-accessories.jpg'); }}
                                    />
                                    <div style={{ fontSize: 12.5, lineHeight: 1.25 }}>
                                      <b>{it.name}</b>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>
                                        Qty: {it.qty} · Budget: ₹{it.estMin}-{it.estMax}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td style={{ minWidth: 180 }}>
                              {isOnline ? (
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                                    {o.items[0]?.onlinePlatform || 'Amazon / Flipkart'}
                                  </span>
                                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                                    {o.items[0]?.onlineOrderStatus === 'ordered_online' ? (
                                      <span style={{ color: '#2563EB', fontWeight: 700 }}>🔵 Ordered Online</span>
                                    ) : o.items[0]?.onlineOrderStatus === 'received_at_hub' ? (
                                      <span style={{ color: '#166534', fontWeight: 700 }}>🟢 Hub Received</span>
                                    ) : (
                                      <span style={{ color: '#D97706', fontWeight: 700 }}>🟡 Needs Admin Order</span>
                                    )}
                                  </div>
                                  {o.items[0]?.onlineOrderNumber && (
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                      Ref: {o.items[0].onlineOrderNumber}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                                    {o.liveSession?.worker?.name ? (
                                      <span style={{ color: '#0F172A' }}>🧑‍🌾 {o.liveSession.worker.name}</span>
                                    ) : (
                                      <span className="pill r" style={{ fontSize: 10.5 }}>⚠️ Needs Shopper</span>
                                    )}
                                  </div>
                                  {totalOptionsCount > 0 ? (
                                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: 10.5, padding: '2px 6px', borderRadius: 4 }}>
                                        📸 {totalOptionsCount} Option(s) Sent
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>⏳ Awaiting shopper photos</div>
                                  )}
                                  {hasShopQr && (
                                    <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: 10, padding: '1px 5px', borderRadius: 4, display: 'inline-block', marginTop: 3 }}>
                                      🧾 Shop QR Uploaded
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <b style={{ fontSize: 14 }}>₹{o.totalAmount + totalApproved}</b>
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Slot: ₹{o.totalAmount}</div>
                              {totalApproved > 0 && (
                                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>+ Items: ₹{totalApproved}</div>
                              )}
                              <div style={{ fontSize: 10, color: '#047857', marginTop: 2 }}>✓ Visasra Wallet</div>
                            </td>
                            <td>
                              <span className={`pill ${o.status === 'completed' ? 'g' : o.status === 'cancelled' ? 'r' : 'p'}`}>
                                {o.trackingStage.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn s p"
                                style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                                onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}
                              >
                                Inspect In-Depth 🔍
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty">
                            <b>No orders found</b>
                            Try adjusting your search query or selecting a different tab filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW: ONLINE CONCIERGE ORDERS (AMAZON / FLIPKART) */}
            {activeNav === 'online_orders' && (
              <>
                <div className="ph2">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#F59E0B', color: '#000', textTransform: 'uppercase' }}>
                        Admin Procurement Only
                      </span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>· Not Assigned to Gig Workers</span>
                    </div>
                    <h2>Online Orders (Amazon &amp; Flipkart Procurement)</h2>
                    <p>Customer orders sourced directly from Indian e-commerce platforms. Place orders with retailers and mark status updates.</p>
                  </div>
                  <button
                    className="btn o"
                    onClick={() =>
                      handleExportCSV(
                        'visasra-online-orders.csv',
                        ['Order Number', 'Platform', 'Product Name', 'Target Price', 'Customer', 'Product URL', 'Status', 'Retailer Order ID', 'Tracking Number'],
                        allOnlineItems.map(x => [
                          x.order.orderNumber,
                          x.item.onlinePlatform || 'Online',
                          x.item.name,
                          x.item.estMin,
                          x.order.user.name,
                          x.item.sourceUrl || '',
                          x.item.onlineOrderStatus || 'pending_admin',
                          x.item.onlineOrderNumber || '',
                          x.item.onlineTrackingNumber || '',
                        ])
                      )
                    }
                  >
                    Export Online CSV
                  </button>
                </div>

                {/* KPI Cards Row */}
                <div className="kpis" style={{ marginBottom: 18 }}>
                  <div className="kpi" style={{ ['--c' as string]: '#E07B00' }} onClick={() => setOnlineFilter('pending')}>
                    <div className="ki"><img src="/images/icons/bag.png" alt="" /></div>
                    <div className="l">Pending Purchase</div>
                    <div className="v">{pendingOnlineOrdersCount}</div>
                    <div className="s">Needed to order from Amazon/Flipkart</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#1B5AA6' }} onClick={() => setOnlineFilter('ordered')}>
                    <div className="ki"><img src="/images/icons/truck.png" alt="" /></div>
                    <div className="l">Ordered Online</div>
                    <div className="v">{orderedOnlineCount}</div>
                    <div className="s">In transit from retailer to hub</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#2F7D4A' }} onClick={() => setOnlineFilter('received')}>
                    <div className="ki"><img src="/images/icons/check.png" alt="" /></div>
                    <div className="l">Received at Hub</div>
                    <div className="v">{receivedOnlineCount}</div>
                    <div className="s">Ready for consolidation &amp; packing</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#5B21B6' }} onClick={() => setOnlineFilter('all')}>
                    <div className="ki"><img src="/images/icons/box.png" alt="" /></div>
                    <div className="l">Total Online Items</div>
                    <div className="v">{allOnlineItems.length}</div>
                    <div className="s">All concierge product links</div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="tool">
                  <input
                    className="inp"
                    placeholder="Search by product name, Amazon/Flipkart link, order #, customer, tracking..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                  />
                </div>

                {/* Filter Chips */}
                <div className="chips">
                  <button className={`chip ${onlineFilter === 'all' ? 'on' : ''}`} onClick={() => setOnlineFilter('all')}>
                    All Online Items ({allOnlineItems.length})
                  </button>
                  <button className={`chip ${onlineFilter === 'pending' ? 'on' : ''}`} onClick={() => setOnlineFilter('pending')}>
                    🟡 Pending Online Order ({pendingOnlineOrdersCount})
                  </button>
                  <button className={`chip ${onlineFilter === 'ordered' ? 'on' : ''}`} onClick={() => setOnlineFilter('ordered')}>
                    🔵 Ordered / In Transit ({orderedOnlineCount})
                  </button>
                  <button className={`chip ${onlineFilter === 'received' ? 'on' : ''}`} onClick={() => setOnlineFilter('received')}>
                    🟢 Received at Hub ({receivedOnlineCount})
                  </button>
                </div>

                {/* Items Grid / Table */}
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Order &amp; Customer</th>
                        <th>Product &amp; Link</th>
                        <th>Target Price</th>
                        <th>Procurement Status</th>
                        <th>Retailer &amp; Tracking</th>
                        <th>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOnlineItems.map(({ item, order }) => {
                        const isPending = item.onlineOrderStatus === 'pending_admin' || !item.onlineOrderStatus || item.onlineOrderStatus === 'none';
                        const isOrdered = item.onlineOrderStatus === 'ordered_online';
                        const isReceived = item.onlineOrderStatus === 'received_at_hub';
                        const platform = item.onlinePlatform || 'Amazon';
                        const platformColor = platform === 'Amazon' ? '#FF9900' : platform === 'Flipkart' ? '#2874F0' : '#8B5CF6';

                        return (
                          <tr key={item.id}>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: '#FFFFFF',
                                  background: platformColor,
                                  letterSpacing: 0.3,
                                }}
                              >
                                {platform}
                              </span>
                            </td>
                            <td>
                              <b>{order.orderNumber}</b>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>{order.user.name}</div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>{order.user.phone || order.user.email}</div>
                              {order.shippingAddress?.city && (
                                <div style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
                                  📍 {order.shippingAddress.city}, {order.shippingAddress.country || 'USA'}
                                </div>
                              )}
                            </td>
                            <td style={{ maxWidth: 300 }}>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <img
                                  src={item.image || '/images/categories/electronics-accessories.jpg'}
                                  alt=""
                                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                                  onClick={() => setZoomImg(item.image || '/images/categories/electronics-accessories.jpg')}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', lineHeight: 1.3 }}>{item.name}</div>
                                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>Qty: {item.qty}</div>
                                  {item.sourceUrl ? (
                                    <a
                                      href={item.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        marginTop: 6,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: '#2563EB',
                                        textDecoration: 'none',
                                        background: '#EFF6FF',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        border: '1px solid #BFDBFE',
                                      }}
                                    >
                                      <span>Open on {platform} ↗</span>
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>No link provided</span>
                                  )}
                                  {item.notes && (
                                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4, background: '#F8FAFC', padding: '4px 6px', borderRadius: 4 }}>
                                      <b>Note:</b> {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <b style={{ fontSize: 14 }}>₹{item.estMin}</b>
                              {item.estMax && item.estMax > item.estMin && (
                                <div style={{ fontSize: 11, color: '#64748B' }}>Max: ₹{item.estMax}</div>
                              )}
                              {item.approvedAmount && (
                                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                                  Purchased at: ₹{item.approvedAmount}
                                </div>
                              )}
                            </td>
                            <td>
                              {isPending && (
                                <span className="pill" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800, padding: '4px 10px' }}>
                                  🟡 Needed to Order Online
                                </span>
                              )}
                              {isOrdered && (
                                <span className="pill" style={{ background: '#DBEAFE', color: '#1E40AF', fontWeight: 800, padding: '4px 10px' }}>
                                  🔵 Ordered Online
                                </span>
                              )}
                              {isReceived && (
                                <span className="pill" style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, padding: '4px 10px' }}>
                                  🟢 Received at Hub
                                </span>
                              )}
                            </td>
                            <td>
                              {item.onlineOrderNumber ? (
                                <div style={{ fontSize: 12 }}>
                                  <div><b>Ref #:</b> {item.onlineOrderNumber}</div>
                                  {item.onlineTrackingNumber && (
                                    <div style={{ color: '#0369A1', marginTop: 2 }}>
                                      <b>Track:</b> {item.onlineTrackingNumber}
                                    </div>
                                  )}
                                  {item.onlinePurchaseNotes && (
                                    <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                                      {item.onlinePurchaseNotes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: '#94A3B8' }}>Awaiting purchase</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                                {isPending && (
                                  <button
                                    type="button"
                                    className="btn s"
                                    style={{
                                      background: '#F59E0B',
                                      color: '#000000',
                                      fontWeight: 800,
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                      setProcureModalItem({ item, order });
                                      setProcureOrderNum(item.onlineOrderNumber || '');
                                      setProcureTracking(item.onlineTrackingNumber || '');
                                      setProcurePrice(String(item.estMin || ''));
                                      setProcureNotes(item.onlinePurchaseNotes || '');
                                    }}
                                  >
                                    🛒 Place &amp; Record Order
                                  </button>
                                )}

                                {isOrdered && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn s"
                                      style={{
                                        background: '#16A34A',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '7px 12px',
                                        cursor: 'pointer',
                                      }}
                                      onClick={() => handleMarkOnlineReceived(item.id)}
                                    >
                                      ✓ Mark Received at Hub
                                    </button>
                                    <button
                                      type="button"
                                      className="btn s o"
                                      style={{ fontSize: 11, padding: '5px 8px' }}
                                      onClick={() => {
                                        setProcureModalItem({ item, order });
                                        setProcureOrderNum(item.onlineOrderNumber || '');
                                        setProcureTracking(item.onlineTrackingNumber || '');
                                        setProcurePrice(String(item.approvedAmount || item.estMin || ''));
                                        setProcureNotes(item.onlinePurchaseNotes || '');
                                      }}
                                    >
                                      ✏️ Edit Order / Tracking
                                    </button>
                                  </>
                                )}

                                {isReceived && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontWeight: 700, fontSize: 12 }}>
                                    <span>✓ Verified at Hub</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredOnlineItems.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty" style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                            <b style={{ fontSize: 15, display: 'block', color: '#1E293B' }}>No online orders found</b>
                            <span style={{ fontSize: 13, color: '#64748B' }}>
                              When customers upload links from Amazon, Flipkart, or other stores, they will show up here for admin ordering.
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 3: LIVE TRACKING MAP */}
            {activeNav === 'live' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Live Ground Shopper Telemetry</h2>
                    <p>Live coordinates shared from shopper devices on the ground in retail hubs.</p>
                  </div>
                </div>

                {/* Real-time Interactive Leaflet Map with OpenStreetMap */}
                <div className="card pad" style={{ marginBottom: 18, background: '#F4F9FF' }}>
                  <div className="b" style={{ fontSize: 16, marginBottom: 8 }}>Ground Shoppers Real-time Grid (OpenStreetMap Live View)</div>
                  <div style={{ width: '100%', height: 380, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                    <LeafletMap
                      center={
                        workers.find(w => w.currentLat && w.currentLng)
                          ? [workers.find(w => w.currentLat && w.currentLng)!.currentLat!, workers.find(w => w.currentLat && w.currentLng)!.currentLng!]
                          : [13.048, 80.245]
                      }
                      zoom={12}
                      height="380px"
                      markers={workers
                        .filter(w => w.currentLat && w.currentLng && (w.status === 'active' || w.status === 'live' || orders.some(o => o.liveSession?.workerId === w.id)))
                        .map(w => ({
                          lat: w.currentLat!,
                          lng: w.currentLng!,
                          title: `${w.name} (Shopper)`,
                          description: `Status: ${w.status || 'Active'} · ${w.phone}`,
                          color: 'blue' as const,
                        }))}
                    />
                  </div>
                  {workers.filter(w => w.currentLat && w.currentLng && (w.status === 'active' || w.status === 'live' || orders.some(o => o.liveSession?.workerId === w.id))).length === 0 ? (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #CBD5E1', fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📍</span>
                      <span>No ground personal shoppers are currently broadcasting live GPS locations. Real shoppers with active orders will appear dynamically on this map in real time.</span>
                    </div>
                  ) : (
                    <div className="row wrap sm mut" style={{ marginTop: 12 }}>
                      <span><b style={{ color: '#1261B5' }}>●</b> Active Ground Shopper</span>
                    </div>
                  )}
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Shopper</th>
                        <th>Assigned Slot</th>
                        <th>Target Store</th>
                        <th>Stage</th>
                        <th>ETA</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.liveSession?.worker).map(o => (
                        <tr key={o.id}>
                          <td><b>{o.liveSession?.worker?.name}</b></td>
                          <td>{o.orderNumber} ({o.slotDate})</td>
                          <td>{o.liveSession?.storeName || 'Local Store / Market'}</td>
                          <td><span className="pill o">{o.liveSession?.stage}</span></td>
                          <td>{o.liveSession?.workerEtaMin || 12} mins</td>
                          <td>
                            <a
                              href={`https://www.google.com/maps?q=${o.liveSession?.workerLat || 13.06},${o.liveSession?.workerLng || 80.25}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn s o"
                            >
                              Maps
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 4: SHOPPERS DIRECTORY */}
            {activeNav === 'shoppers' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Personal Shopper Ground Force</h2>
                    <p>Verified ground agents across Chennai, Mumbai, Delhi, Jaipur, and Bengaluru.</p>
                  </div>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Shopper Name</th>
                        <th>Phone</th>
                        <th>Rating</th>
                        <th>Orders Done</th>
                        <th>KYC Status</th>
                        <th>Wallet Balance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map(w => (
                        <tr key={w.id} onClick={() => setSelectedWorker(w)}>
                          <td>
                            <div className="who">
                              <span className="av">{w.name.slice(0, 2).toUpperCase()}</span>
                              <div>
                                <b>{w.name}</b>
                                <small>ID: {w.id.slice(0, 8)}</small>
                              </div>
                            </div>
                          </td>
                          <td>{w.phone}</td>
                          <td>⭐ {w.rating}</td>
                          <td>{w.ordersDone} completed</td>
                          <td>
                            <span className={`pill ${w.kycStatus === 'verified' ? 'g' : w.kycStatus === 'rejected' ? 'r' : 'o'}`}>
                              {w.kycStatus}
                            </span>
                          </td>
                          <td>₹{w.walletBalance}</td>
                          <td><button className="btn s o">View Dossier</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 5: KYC VERIFICATION */}
            {activeNav === 'verification' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Shopper KYC Document Review</h2>
                    <p>Inspect government IDs, residential addresses, and approve partner onboarding applications.</p>
                  </div>
                </div>

                <div className="grid g2">
                  {workers.map(w => (
                    <div key={w.id} className="card pad" style={{ border: w.kycStatus === 'pending' ? '2px solid #FF8A00' : undefined }}>
                      <div className="row" style={{ marginBottom: 12 }}>
                        <span className="av" style={{ width: 44, height: 44, fontSize: 16 }}>{w.name.slice(0, 2).toUpperCase()}</span>
                        <div className="grow">
                          <b style={{ fontSize: 16 }}>{w.name}</b>
                          <div className="sm mut">
                            {w.email ? `${w.email} · ` : ''}{w.phone}
                            {w.altPhone ? ` · Alt: ${w.altPhone}` : ''}
                          </div>
                        </div>
                        <span className={`pill ${w.kycStatus === 'verified' ? 'g' : w.kycStatus === 'rejected' ? 'r' : 'o'}`}>
                          {w.kycStatus === 'pending' ? 'Pending Review' : w.kycStatus}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                        <div className="sm" style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>Residential Addresses</div>
                        <div className="sm" style={{ color: '#475569' }}>
                          <b>Present:</b> {w.currentAddress || 'Not provided'}<br />
                          <b>Permanent:</b> {w.permanentAddress || 'Not provided'}
                        </div>
                      </div>

                      <dl className="kv" style={{ marginBottom: 14 }}>
                        <dt>Aadhaar</dt>
                        <dd>{w.aadhaarNumber ? `XXXX XXXX ${w.aadhaarNumber.slice(-4)} (${w.aadhaarNumber})` : 'Not provided'}</dd>
                        <dt>PAN</dt>
                        <dd>{w.panNumber || 'Not provided'}</dd>
                        <dt>Driving License</dt>
                        <dd>{w.drivingLicenseNumber || 'Not provided'}</dd>
                      </dl>

                      <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '10px 12px', marginBottom: 14, border: '1px solid #BAE6FD' }}>
                        <div className="sm" style={{ fontWeight: 700, color: '#0369A1', marginBottom: 6 }}>Bank &amp; Payout Settlement Details</div>
                        <dl className="kv" style={{ margin: 0 }}>
                          <dt>Bank Name</dt>
                          <dd>{w.bankName || 'Not provided'}</dd>
                          <dt>Branch</dt>
                          <dd>{w.bankBranch || 'Not provided'}</dd>
                          <dt>Account No.</dt>
                          <dd style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {w.bankAccountNumber ? `•••• •••• ${w.bankAccountNumber.slice(-4)} (${w.bankAccountNumber})` : 'Not provided'}
                          </dd>
                          <dt>IFSC Code</dt>
                          <dd style={{ fontFamily: 'monospace', fontWeight: 700 }}>{w.bankIfscCode || 'Not provided'}</dd>
                          <dt>Payout UPI</dt>
                          <dd>{w.payoutUpi || 'Not provided'}</dd>
                        </dl>
                      </div>

                      <div className="docs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                        {w.aadhaarFront && (
                          <div>
                            <small className="mut" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Aadhaar Front</small>
                            <img
                              src={w.aadhaarFront}
                              alt="Aadhaar Front"
                              style={{ height: 60, width: '100%', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => setZoomImg(w.aadhaarFront || null)}
                            />
                          </div>
                        )}
                        {w.aadhaarBack && (
                          <div>
                            <small className="mut" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Aadhaar Back</small>
                            <img
                              src={w.aadhaarBack}
                              alt="Aadhaar Back"
                              style={{ height: 60, width: '100%', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => setZoomImg(w.aadhaarBack || null)}
                            />
                          </div>
                        )}
                        {w.panDoc && (
                          <div>
                            <small className="mut" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>PAN Card</small>
                            <img
                              src={w.panDoc}
                              alt="PAN Card"
                              style={{ height: 60, width: '100%', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => setZoomImg(w.panDoc || null)}
                            />
                          </div>
                        )}
                        {w.drivingLicenseDoc && (
                          <div>
                            <small className="mut" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Driving License</small>
                            <img
                              src={w.drivingLicenseDoc}
                              alt="Driving License"
                              style={{ height: 60, width: '100%', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => setZoomImg(w.drivingLicenseDoc || null)}
                            />
                          </div>
                        )}
                        {w.selfie && (
                          <div>
                            <small className="mut" style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Current Photo</small>
                            <img
                              src={w.selfie}
                              alt="Current Photo"
                              style={{ height: 60, width: '100%', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => setZoomImg(w.selfie || null)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end', gap: 8 }}>
                        {w.kycStatus !== 'verified' && (
                          <button className="btn g s" onClick={() => handleKycDecision(w.id, 'approve')}>
                            ✓ Accept &amp; Approve
                          </button>
                        )}
                        {w.kycStatus !== 'rejected' && (
                          <button className="btn d s" onClick={() => handleKycDecision(w.id, 'reject', 'Documents or address proof unclear')}>
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* VIEW 6: SHOP QR CLEARANCE */}
            {activeNav === 'shop' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Merchant Shop QR Payments</h2>
                    <p>Ground shoppers upload merchant counter UPI QRs after customer approval. Authorize payment directly.</p>
                  </div>
                </div>

                <div className="grid g2">
                  {orders.flatMap(o => o.items.map(it => ({ order: o, item: it }))).filter(x => x.item.shopPaymentStatus === 'qr_uploaded' || x.item.status === 'approved').map(({ order, item }) => (
                    <div key={item.id} className="card pad">
                      <div className="row" style={{ marginBottom: 12 }}>
                        <div className="grow">
                          <b style={{ fontSize: 16 }}>{item.name}</b>
                          <div className="sm mut">Order #{order.orderNumber} · Customer: {order.user.name}</div>
                        </div>
                        <span className={`pill ${item.shopPaymentStatus === 'paid' ? 'g' : 'o'}`}>
                          {item.shopPaymentStatus === 'paid' ? 'Paid & Cleared' : 'QR Uploaded'}
                        </span>
                      </div>

                      <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
                        <img
                          src={item.shopPaymentQr || '/images/decor/visasra-bag.png'}
                          alt="Merchant QR"
                          className="qr"
                          onClick={() => setZoomImg(item.shopPaymentQr || '/images/decor/visasra-bag.png')}
                        />
                        <div className="grow">
                          <div className="b" style={{ fontSize: 22, color: '#1261B5' }}>₹{item.approvedAmount || item.estMin || 2440}</div>
                          <div className="sm mut">Sourced in store by {order.liveSession?.worker?.name || 'Shopper'}</div>
                          <div className="note" style={{ marginTop: 8, padding: 8 }}>
                            Scan QR via Business UPI (ICICI Bank) &amp; click Clear Payment to notify the ground shopper.
                          </div>
                        </div>
                      </div>

                      <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
                        {item.shopPaymentStatus !== 'paid' && (
                          <button className="btn g" onClick={() => handleApproveShopPayment(item.id)}>
                            Confirm Payment Sent to Shop
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {orders.flatMap(o => o.items).filter(i => i.shopPaymentStatus === 'qr_uploaded').length === 0 && (
                    <div className="card pad empty" style={{ gridColumn: '1 / -1' }}>
                      <b>No shop payments pending</b>
                      When shoppers present options and customers approve, shop UPI QRs will appear here.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* VIEW 7: WORKER PAYOUTS */}
            {activeNav === 'payouts' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Shopper Earnings &amp; Payouts</h2>
                    <p>Settle weekly ground shopper earnings and emergency withdrawal requests.</p>
                  </div>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Shopper</th>
                        <th>Phone</th>
                        <th>Wallet Balance</th>
                        <th>UPI Address</th>
                        <th>Orders Fulfilled</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map(w => (
                        <tr key={w.id}>
                          <td><b>{w.name}</b></td>
                          <td>{w.phone}</td>
                          <td><b style={{ color: '#2F7D4A', fontSize: 16 }}>₹{w.walletBalance}</b></td>
                          <td>{w.payoutUpi || `${w.phone.replace(/[^0-9]/g, '')}@okaxis`}</td>
                          <td>{w.ordersDone} slots</td>
                          <td>
                            <button
                              className="btn s g"
                              disabled={w.walletBalance <= 0}
                              onClick={() => handleSettlePayout(w.id, w.walletBalance)}
                            >
                              Settle ₹{w.walletBalance}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 8: CUSTOMERS */}
            {activeNav === 'customers' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Customer Directory</h2>
                    <p>NRI &amp; domestic clients sourcing through Visasra personal shoppers.</p>
                  </div>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Wallet Balance</th>
                        <th>Orders Placed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} onClick={() => setSelectedUser(u)}>
                          <td>
                            <div className="who">
                              <span className="av">{u.name.slice(0, 2).toUpperCase()}</span>
                              <b>{u.name}</b>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td><b>₹{u.walletBalance}</b></td>
                          <td>{u.orders?.length || 0} order(s)</td>
                          <td><button className="btn s o">View Ledger</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 9: FINANCE */}
            {activeNav === 'finance' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Finance &amp; Revenue Analytics</h2>
                    <p>Total transaction values, platform slot commission, and worker earnings.</p>
                  </div>
                  <button
                    className="btn o"
                    onClick={() =>
                      handleExportCSV(
                        'visasra-finance.csv',
                        ['Order', 'Customer', 'Gross Amount', 'Date'],
                        orders.map(o => [o.orderNumber, o.user.name, o.totalAmount, o.slotDate])
                      )
                    }
                  >
                    Export Finance CSV
                  </button>
                </div>

                <div className="grid g4" style={{ marginBottom: 18 }}>
                  <div className="kpi" style={{ ['--c' as string]: '#1B5AA6' }}>
                    <div className="l">Gross Volume</div>
                    <div className="v">₹{orders.reduce((acc, o) => acc + o.totalAmount, 0)}</div>
                    <div className="s">{orders.length} transactions</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#2F7D4A' }}>
                    <div className="l">Slot Fees Earned</div>
                    <div className="v">₹{orders.length * slotFee}</div>
                    <div className="s">Platform gross margin</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#E07B00' }}>
                    <div className="l">Disbursed to Shoppers</div>
                    <div className="v">₹{orders.filter(o => o.status === 'completed').length * workerPay}</div>
                    <div className="s">₹{workerPay} per slot</div>
                  </div>
                  <div className="kpi" style={{ ['--c' as string]: '#123A69' }}>
                    <div className="l">Customer Wallets Held</div>
                    <div className="v">₹{users.reduce((acc, u) => acc + u.walletBalance, 0)}</div>
                    <div className="s">Total customer balance</div>
                  </div>
                </div>

                <div className="card pad">
                  <div className="b" style={{ fontSize: 16, marginBottom: 12 }}>Collected Per Day</div>
                  <svg viewBox="0 0 620 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((d, i) => {
                      const val = 12000 + ((i * 4300) % 35000);
                      const h = (val / 50000) * 120;
                      return (
                        <g key={d}>
                          <rect x={35 + i * 80} y={150 - h} width="40" height={h} rx="5" fill="#1B5AA6" />
                          <text x={55 + i * 80} y={142 - h} textAnchor="middle" fontSize="11" fontWeight="700" fill="#092B55">₹{val}</text>
                          <text x={55 + i * 80} y="168" textAnchor="middle" fontSize="11" fill="#7C93B0">Day {i + 1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </>
            )}

            {/* VIEW 10: ACTIVITY LOG */}
            {activeNav === 'activity' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Operations Audit Log</h2>
                    <p>Chronological record of state transitions, refunds, and clearances in PostgreSQL.</p>
                  </div>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="t">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Event</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Just now</td>
                        <td>{adminUser?.name || 'Operations Lead'}</td>
                        <td><span className="pill g">System</span></td>
                        <td>Live PostgreSQL database connected</td>
                      </tr>
                      {orders.slice(0, 4).map(o => (
                        <tr key={o.id}>
                          <td>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{o.user.name}</td>
                          <td><span className="pill p">Order</span></td>
                          <td>Order #{o.orderNumber} ({o.items.length} item(s) · {o.orderType === 'online' ? 'Online Concierge' : 'In-Store Market'})</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="empty">No recent activity recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* VIEW 11: SETTINGS */}
            {activeNav === 'settings' && (
              <>
                <div className="ph2">
                  <div>
                    <h2>Platform Settings &amp; Rules</h2>
                    <p>Adjust pricing formulas, lead times, and manage admin access.</p>
                  </div>
                  <button className="btn" onClick={() => showToast('Settings updated successfully')}>Save Changes</button>
                </div>

                <div className="grid g2" style={{ alignItems: 'start' }}>
                  <div className="card pad">
                    <div className="b" style={{ fontSize: 16, marginBottom: 14 }}>Business Rules</div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="sm b mut" style={{ display: 'block', marginBottom: 4 }}>Slot Booking Fee (₹)</label>
                      <input
                        type="number"
                        className="inp"
                        value={slotFee}
                        onChange={e => setSlotFee(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="sm b mut" style={{ display: 'block', marginBottom: 4 }}>Worker Pay Per Slot (₹)</label>
                      <input
                        type="number"
                        className="inp"
                        value={workerPay}
                        onChange={e => setWorkerPay(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="sm b mut" style={{ display: 'block', marginBottom: 4 }}>Accepting Lead Window (Hours)</label>
                      <input
                        type="number"
                        className="inp"
                        value={leadHours}
                        onChange={e => setLeadHours(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="card pad">
                    <div className="row" style={{ marginBottom: 14 }}>
                      <div className="b grow" style={{ fontSize: 16 }}>Team Management</div>
                      <button
                        className="btn s o"
                        onClick={() => {
                          const n = prompt('Admin Name:');
                          const e = prompt('Admin Email:');
                          if (n && e) {
                            setAdminsList([...adminsList, { name: n, email: e, role: 'Operations' }]);
                            showToast(`Added ${n}`);
                          }
                        }}
                      >
                        + Add Admin
                      </button>
                    </div>
                    {adminsList.map((a, i) => (
                      <div key={i} className="row" style={{ padding: '8px 0', borderTop: '1px solid #E6EEF8' }}>
                        <span className="av">{a.name.slice(0, 2).toUpperCase()}</span>
                        <div className="grow">
                          <b>{a.name}</b>
                          <div className="sm mut">{a.email} · {a.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Slide-In Detail Drawer (#ov .panel) for Bookings */}
      <div id="ov" className={selectedOrder || selectedWorker || selectedUser ? 'on' : ''}>
        <div className="scrim" onClick={() => { setSelectedOrder(null); setSelectedWorker(null); setSelectedUser(null); }} />
        {selectedOrder && (() => {
          const slotFee = selectedOrder.totalAmount;
          const merchandiseTotal = selectedOrder.items.reduce((sum, it) => sum + (it.approvedAmount || 0), 0);
          const grandTotal = slotFee + merchandiseTotal;
          const isOnline = selectedOrder.orderType === 'online' || selectedOrder.items.some(i => i.sourceType === 'online');
          const address = selectedOrder.shippingAddress;
          const fullAddressString = [
            address?.line1,
            address?.line2,
            address?.city,
            address?.region,
            address?.zip,
            address?.country || 'USA',
          ].filter(Boolean).join(', ');

          return (
            <div className="panel" style={{ width: 'min(760px, 100%)' }}>
              {/* Header */}
              <div className="pt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="grow">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 18 }}>Order #{selectedOrder.orderNumber}</b>
                    {isOnline ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#EDE9FE', color: '#6D28D9' }}>
                        📦 Online Concierge
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1' }}>
                        🛍️ In-Store Market Shopping
                      </span>
                    )}
                  </div>
                  <div className="sm mut" style={{ marginTop: 2 }}>
                    Slot: <b>{selectedOrder.slotLabel || selectedOrder.slotKey}</b> · Status: <span style={{ textTransform: 'capitalize', color: '#FDE047', fontWeight: 700 }}>{selectedOrder.status}</span>
                  </div>
                </div>
                <button className="btn x s" onClick={() => setSelectedOrder(null)}>✕ Close</button>
              </div>

              {/* Body */}
              <div className="pb" style={{ padding: '20px 22px' }}>
                {/* 1. Customer Details & Delivery Address */}
                <div className="sec" style={{ marginTop: 0 }}>👤 Customer &amp; Delivery Destination</div>
                <div className="card pad" style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Customer Account</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{selectedOrder.user.name}</div>
                      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>✉️ {selectedOrder.user.email}</div>
                      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>📞 {selectedOrder.user.phone || 'Phone not provided'}</div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                        💰 Current Wallet Balance: ₹{selectedOrder.user.walletBalance}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Delivery Shipping Address</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {address?.name || selectedOrder.user.name} {address?.phone && <span style={{ fontWeight: 400, color: '#64748B' }}>({address.phone})</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                        📍 {fullAddressString || 'No physical delivery address recorded for this slot'}
                      </div>
                      {address?.deliveryNotes && (
                        <div style={{ fontSize: 11.5, color: '#475569', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, marginTop: 6, border: '1px dashed #CBD5E1' }}>
                          <b>Delivery Note:</b> {address.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. What Customer Paid (In-Depth Financial Breakdown) */}
                <div className="sec">💳 What Customer Paid (In-Depth Financial Audit)</div>
                <div className="card pad" style={{ background: 'linear-gradient(145deg, #F8FAFC, #EFF6FF)', border: '1.5px solid #BFDBFE', marginBottom: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Slot Booking Fee</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', marginTop: 4 }}>₹{slotFee}</div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Paid at slot booking</div>
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Approved Merchandise</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#059669', marginTop: 4 }}>₹{merchandiseTotal}</div>
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>{selectedOrder.items.filter(i => i.approvedAmount).length} item(s) approved</div>
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E0E7FF' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#4338CA', textTransform: 'uppercase' }}>Total Customer Paid</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A', marginTop: 4 }}>₹{grandTotal}</div>
                      <div style={{ fontSize: 10.5, color: '#4338CA', marginTop: 2 }}>Debited from Wallet</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1E40AF', background: 'rgba(219, 234, 254, 0.6)', padding: '8px 12px', borderRadius: 8 }}>
                    <span>✓</span>
                    <span>All payments settled via <b>Visasra Money &amp; Razorpay Gateway</b>. Customer debits verified in PostgreSQL.</span>
                  </div>
                </div>

                {/* 3. Products & What the Worker Sent to Customer */}
                <div className="sec">
                  🛍️ Products Requested &amp; What Worker Sent ({selectedOrder.items.length} item{selectedOrder.items.length > 1 ? 's' : ''})
                </div>
                {selectedOrder.items.map((it, idx) => {
                  const isItemOnline = it.sourceType === 'online' || isOnline;
                  const hasQr = Boolean(it.shopPaymentQr);
                  const hasProof = Boolean(it.shopPaymentProof);
                  const hasOptions = it.options && it.options.length > 0;

                  return (
                    <div
                      key={it.id}
                      className="card pad"
                      style={{
                        marginBottom: 16,
                        border: it.status === 'approved' || it.approvedAmount ? '2px solid #86EFAC' : '1.5px solid #CBD5E1',
                        background: '#FFFFFF',
                      }}
                    >
                      {/* Item Header */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <img
                          src={it.image || '/images/categories/jewellery-accessories.jpg'}
                          alt=""
                          style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #CBD5E1', flexShrink: 0 }}
                          onClick={() => setZoomImg(it.image || '/images/categories/jewellery-accessories.jpg')}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                                #{idx + 1}. {it.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                Qty: <b>{it.qty}</b> · Category: <b>{it.category || 'General'}</b> · Customer Budget: <b>₹{it.estMin} - ₹{it.estMax}</b>
                              </div>
                            </div>
                            <div>
                              {it.status === 'approved' || it.approvedAmount ? (
                                <span style={{ background: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: 11.5, padding: '4px 10px', borderRadius: 999 }}>
                                  ✓ Customer Approved: ₹{it.approvedAmount}
                                </span>
                              ) : it.status === 'options_ready' ? (
                                <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: 11.5, padding: '4px 10px', borderRadius: 999 }}>
                                  ⏳ Awaiting Customer Choice
                                </span>
                              ) : (
                                <span style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: 11.5, padding: '4px 10px', borderRadius: 999 }}>
                                  {it.status}
                                </span>
                              )}
                            </div>
                          </div>
                          {it.notes && (
                            <div style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                              <b>Customer Instructions:</b> {it.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* WHAT WORKER SENT: In-Store Market Options */}
                      {!isItemOnline && (
                        <div style={{ marginTop: 14, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <b style={{ fontSize: 13, color: '#1E293B' }}>
                              📸 What the Ground Worker Sent to the Customer:
                            </b>
                            {hasOptions && (
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0369A1' }}>
                                {it.options.length} Option{it.options.length > 1 ? 's' : ''} Photographed
                              </span>
                            )}
                          </div>

                          {hasOptions ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                              {it.options.map((opt, oIdx) => {
                                const isChosen = opt.status === 'approved';
                                const isRejected = opt.status === 'rejected';

                                return (
                                  <div
                                    key={opt.id}
                                    style={{
                                      border: isChosen ? '2.5px solid #22C55E' : isRejected ? '1.5px solid #FCA5A5' : '1.5px solid #CBD5E1',
                                      borderRadius: 10,
                                      padding: 8,
                                      background: isChosen ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#FFFFFF',
                                      position: 'relative',
                                      boxShadow: isChosen ? '0 4px 12px rgba(34,197,94,0.15)' : 'none',
                                    }}
                                  >
                                    <div style={{ position: 'relative' }}>
                                      <img
                                        src={opt.image}
                                        alt=""
                                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6, cursor: 'zoom-in' }}
                                        onClick={() => setZoomImg(opt.image)}
                                      />
                                      <span style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                                        Option #{oIdx + 1}
                                      </span>
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                      <div style={{ fontSize: 15, fontWeight: 900, color: isChosen ? '#15803D' : '#0F172A' }}>
                                        ₹{opt.price}
                                      </div>
                                      <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2, lineHeight: 1.3 }}>
                                        {opt.description || 'Worker notes from shop counter'}
                                      </div>
                                    </div>
                                    <div style={{ marginTop: 8 }}>
                                      {isChosen ? (
                                        <div style={{ background: '#16A34A', color: '#FFFFFF', padding: '3px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, textAlign: 'center' }}>
                                          ✓ APPROVED &amp; PAID
                                        </div>
                                      ) : isRejected ? (
                                        <div style={{ background: '#EF4444', color: '#FFFFFF', padding: '3px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, textAlign: 'center' }}>
                                          ✕ Customer Rejected
                                        </div>
                                      ) : (
                                        <div style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, textAlign: 'center' }}>
                                          ⏳ Awaiting Customer Choice
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 12.5, color: '#64748B', border: '1px dashed #CBD5E1' }}>
                              ⏳ Ground personal shopper is currently at the market. No photos or options sent to customer yet.
                            </div>
                          )}

                          {/* Worker's Shop Counter Payment Proofs */}
                          {(hasQr || hasProof) && (
                            <div style={{ marginTop: 12, padding: 12, background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <b style={{ fontSize: 12.5, color: '#92400E' }}>
                                  🧾 Worker's Shop Counter Clearance Proofs:
                                </b>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: it.shopPaymentStatus === 'paid' ? '#DCFCE7' : '#FEF3C7', color: it.shopPaymentStatus === 'paid' ? '#166534' : '#92400E' }}>
                                  {it.shopPaymentStatus === 'paid' ? '✅ Paid & Cleared' : '⏳ Action Required: QR Uploaded'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {hasQr && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Shop Counter UPI QR:</div>
                                    <img
                                      src={it.shopPaymentQr!}
                                      alt="Counter QR"
                                      style={{ width: 84, height: 84, objectFit: 'contain', background: '#fff', borderRadius: 6, border: '1px solid #CBD5E1', cursor: 'zoom-in' }}
                                      onClick={() => setZoomImg(it.shopPaymentQr!)}
                                    />
                                  </div>
                                )}
                                {hasProof && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Store Bill / Receipt:</div>
                                    <img
                                      src={it.shopPaymentProof!}
                                      alt="Store Bill"
                                      style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 6, border: '1px solid #CBD5E1', cursor: 'zoom-in' }}
                                      onClick={() => setZoomImg(it.shopPaymentProof!)}
                                    />
                                  </div>
                                )}
                              </div>
                              {it.shopPaymentStatus !== 'paid' && (
                                <button
                                  className="btn o s"
                                  style={{ marginTop: 10 }}
                                  onClick={() => handleApproveShopPayment(it.id)}
                                >
                                  ⚡ Clear &amp; Mark Counter Bill Paid (₹{it.shopPaymentAmount || it.approvedAmount || 0})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* WHAT ADMIN / WORKER SENT: Online Concierge Orders (Amazon / Flipkart) */}
                      {isItemOnline && (
                        <div style={{ marginTop: 14, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <b style={{ fontSize: 13, color: '#1E293B' }}>
                              📦 Online Retailer Procurement ({it.onlinePlatform || 'Amazon / Flipkart'}):
                            </b>
                            <button
                              className="btn o s"
                              style={{ fontSize: 11 }}
                              onClick={() => {
                                setProcureModalItem({ item: it, order: selectedOrder });
                                setProcureOrderNum(it.onlineOrderNumber || '');
                                setProcureTracking(it.onlineTrackingNumber || '');
                                setProcurePrice(it.approvedAmount ? String(it.approvedAmount) : '');
                                setProcureNotes(it.onlinePurchaseNotes || '');
                              }}
                            >
                              ✏️ Update Order / Tracking
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Product Link:</div>
                              {it.sourceUrl ? (
                                <a
                                  href={it.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                                >
                                  Open on {it.onlinePlatform || 'Retailer'} ↗
                                </a>
                              ) : (
                                <div style={{ fontSize: 12, color: '#94A3B8' }}>No URL provided</div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Retailer Order Ref #:</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                                {it.onlineOrderNumber || 'Pending purchase by Admin'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Courier Tracking #:</div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369A1', marginTop: 2 }}>
                                {it.onlineTrackingNumber || 'Pending dispatch'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}


                {/* 5. Ground Personal Shopper Assignment */}
                {!isOnline && (
                  <>
                    <div className="sec">Ground Shopper Assignment</div>
                    {selectedOrder.liveSession?.worker ? (
                      <>
                        <div className="card pad">
                          <div className="row">
                            <span className="av">{selectedOrder.liveSession.worker.name.slice(0, 2).toUpperCase()}</span>
                            <div className="grow">
                              <b>{selectedOrder.liveSession.worker.name}</b>
                              <div className="sm mut">{selectedOrder.liveSession.worker.phone} · ⭐ {selectedOrder.liveSession.worker.rating}</div>
                              {selectedOrder.liveSession.storeName && (
                                <div style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
                                  📍 Shopping at: {selectedOrder.liveSession.storeName}
                                </div>
                              )}
                            </div>
                            <button
                              className="btn d s"
                              onClick={() => handleUnassignWorker(selectedOrder.slotKey)}
                            >
                              Unassign
                            </button>
                          </div>
                        </div>

                        {/* QC Inspection & Handover Clearance Card */}
                        <div style={{ marginTop: 12, padding: 14, background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>🔐</span>
                              <b style={{ fontSize: 13, color: '#166534' }}>QC Hub Handover Clearance</b>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: selectedOrder.liveSession.stage === 'packed' ? '#DCFCE7' : '#FEF3C7', color: selectedOrder.liveSession.stage === 'packed' ? '#166534' : '#92400E' }}>
                              {selectedOrder.liveSession.stage === 'packed' ? '✅ QC Verified & Packed' : `⏳ Stage: ${selectedOrder.liveSession.stage.toUpperCase()}`}
                            </span>
                          </div>

                          <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                              <div>
                                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Shopper Handover OTP Code:</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: 6, marginTop: 2 }}>
                                  8492
                                </div>
                                <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                                  Give this 4-digit code to the shopper when they deliver shopping bags to the QC counter.
                                </div>
                              </div>
                              {selectedOrder.liveSession.stage !== 'packed' && (
                                <button
                                  type="button"
                                  className="btn s"
                                  style={{ background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px' }}
                                  onClick={() => handleVerifyHandover(selectedOrder.slotKey)}
                                >
                                  ✓ Confirm QC Passed &amp; Clear Handover (+₹350)
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>
                            🏢 <b>Visasra Central QC Hub:</b> #42 Cathedral Road, Alwarpet, Chennai - 600086
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="card pad">
                        <div className="sm mut" style={{ marginBottom: 8 }}>Select an available ground shopper to assign:</div>
                        <select
                          className="inp"
                          id="workerSelect"
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) handleAssignWorker(selectedOrder.slotKey, e.target.value);
                          }}
                        >
                          <option value="" disabled>-- Select Verified Shopper --</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.phone}) - Rating: {w.rating}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="pf" style={{ justifyContent: 'space-between' }}>
                <button
                  className="btn d s"
                  onClick={() => handleRefundOrder(selectedOrder.id, grandTotal)}
                >
                  Refund ₹{grandTotal} to Customer Wallet
                </button>
                <button className="btn s" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          );
        })()}

        {/* Worker Dossier Drawer */}
        {selectedWorker && (
          <div className="panel">
            <div className="pt">
              <div className="grow">
                <b>{selectedWorker.name}</b>
                <div className="sm mut">Ground Shopper Dossier</div>
              </div>
              <button className="btn x s" onClick={() => setSelectedWorker(null)}>Close</button>
            </div>
            <div className="pb">
              <dl className="kv">
                <dt>Phone</dt>
                <dd>{selectedWorker.phone}</dd>
                <dt>Rating</dt>
                <dd>⭐ {selectedWorker.rating}</dd>
                <dt>Orders Done</dt>
                <dd>{selectedWorker.ordersDone} fulfilled</dd>
                <dt>KYC Status</dt>
                <dd><span className="pill g">{selectedWorker.kycStatus}</span></dd>
                <dt>Wallet Balance</dt>
                <dd>₹{selectedWorker.walletBalance}</dd>
                <dt>Payout UPI</dt>
                <dd>{selectedWorker.payoutUpi || `${selectedWorker.phone}@okaxis`}</dd>
              </dl>
              <div className="sec">Government ID Documents</div>
              <div className="docs">
                <img
                  src={selectedWorker.aadhaarFront || '/images/categories/jewellery-accessories.jpg'}
                  alt=""
                  onClick={() => setZoomImg(selectedWorker.aadhaarFront || '/images/categories/jewellery-accessories.jpg')}
                />
                <img
                  src={selectedWorker.panDoc || '/images/categories/art-crafts.jpg'}
                  alt=""
                  onClick={() => setZoomImg(selectedWorker.panDoc || '/images/categories/art-crafts.jpg')}
                />
                <img
                  src={selectedWorker.selfie || '/images/categories/sarees-ethnic-wear.jpg'}
                  alt=""
                  onClick={() => setZoomImg(selectedWorker.selfie || '/images/categories/sarees-ethnic-wear.jpg')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Customer Wallet Drawer */}
        {selectedUser && (
          <div className="panel">
            <div className="pt">
              <div className="grow">
                <b>{selectedUser.name}</b>
                <div className="sm mut">Client Wallet &amp; Ledger</div>
              </div>
              <button className="btn x s" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
            <div className="pb">
              <dl className="kv">
                <dt>Email</dt>
                <dd>{selectedUser.email}</dd>
                <dt>Balance</dt>
                <dd><b style={{ fontSize: 18, color: '#1261B5' }}>₹{selectedUser.walletBalance}</b></dd>
              </dl>
              <div className="sec">Recent Wallet Transactions</div>
              {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
                selectedUser.transactions.map(tx => (
                  <div key={tx.id} className="card pad" style={{ marginBottom: 8 }}>
                    <div className="row">
                      <div className="grow">
                        <b>{tx.note}</b>
                        <div className="sm mut">{tx.date.slice(0, 10)}</div>
                      </div>
                      <b style={{ color: tx.type === 'credit' ? '#2F7D4A' : '#B3261E' }}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </b>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sm mut">No transactions on record.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Lightbox */}
      {zoomImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 20, 40, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
          onClick={() => setZoomImg(null)}
        >
          <img src={zoomImg} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="admin-bottom-nav">
        <button
          type="button"
          className={`admin-bnav-btn ${activeNav === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveNav('overview')}
        >
          <img src="/images/icons/slot.png" alt="" style={{ width: 18, height: 18 }} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`admin-bnav-btn ${activeNav === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveNav('bookings')}
        >
          <img src="/images/icons/jobs.png" alt="" style={{ width: 18, height: 18 }} />
          <span>Bookings</span>
          {needsShopperCount > 0 && <span className="bnav-badge">{needsShopperCount}</span>}
        </button>

        <button
          type="button"
          className={`admin-bnav-btn ${activeNav === 'live' ? 'active' : ''}`}
          onClick={() => setActiveNav('live')}
        >
          <img src="/images/icons/camera.png" alt="" style={{ width: 18, height: 18 }} />
          <span>Live Map</span>
        </button>

        <button
          type="button"
          className={`admin-bnav-btn ${activeNav === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveNav('verification')}
        >
          <img src="/images/icons/kyc.png" alt="" style={{ width: 18, height: 18 }} />
          <span>KYC</span>
          {pendingKycCount > 0 && <span className="bnav-badge">{pendingKycCount}</span>}
        </button>

        <button
          type="button"
          className="admin-bnav-btn"
          style={{ color: '#F59E0B' }}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
          <span>All (11)</span>
        </button>
      </nav>

      {/* Mobile Slide-Up All-Features Drawer */}
      {mobileDrawerOpen && (
        <div className="admin-mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="admin-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, color: '#fff' }}>Operations Modules</h3>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Select any of the 11 admin features</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                ✕ Close
              </button>
            </div>

            <div className="admin-drawer-grid">
              {[
                { id: 'overview', label: 'Overview', icon: '/images/icons/slot.png', badge: null },
                { id: 'online_orders', label: 'Online Concierge (Amazon & Flipkart)', icon: '/images/icons/bag.png', badge: pendingOnlineOrdersCount },
                { id: 'bookings', label: 'Bookings & Slots', icon: '/images/icons/jobs.png', badge: needsShopperCount },
                { id: 'live', label: 'Live Shopper Map', icon: '/images/icons/camera.png', badge: null },
                { id: 'shoppers', label: 'Shoppers Directory', icon: '/images/icons/star.png', badge: null },
                { id: 'verification', label: 'KYC Verification', icon: '/images/icons/kyc.png', badge: pendingKycCount },
                { id: 'shop', label: 'Shop QR Clearance', icon: '/images/icons/qr.png', badge: pendingShopPaymentItems.length },
                { id: 'payouts', label: 'Worker Payouts', icon: '/images/icons/earnings.png', badge: null },
                { id: 'customers', label: 'Customers', icon: '/images/icons/chat.png', badge: null },
                { id: 'finance', label: 'Finance & Ledger', icon: '/images/icons/earnings.png', badge: null },
                { id: 'activity', label: 'Activity Log', icon: '/images/icons/refresh.png', badge: null },
                { id: 'settings', label: 'Settings & Team', icon: '/images/icons/check.png', badge: null },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-drawer-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileDrawerOpen(false);
                  }}
                >
                  <img src={item.icon} alt="" style={{ width: 18, height: 18 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {item.badge ? (
                    <span style={{ background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 999 }}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Admin User info & Sign Out in Drawer */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F59E0B', color: '#000', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>
                  VA
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{adminUser?.name || 'Visasra Administrator'}</div>
                  <div style={{ color: '#94A3B8', fontSize: 11 }}>{adminUser?.email || 'visasratechnologies@gmail.com'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                style={{ background: '#B3261E', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Modal: Record Online Purchase on Amazon / Flipkart */}
      {procureModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 25, 46, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setProcureModalItem(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: '1.5px solid #E2E8F0',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', textTransform: 'uppercase' }}>
                  Admin Procurement Action
                </span>
                <h3 style={{ margin: '6px 0 0', fontSize: 18, color: '#0F172A' }}>
                  Order on {procureModalItem.item.onlinePlatform || 'Amazon / Flipkart'}
                </h3>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  Order <b>#{procureModalItem.order.orderNumber}</b> · Customer: <b>{procureModalItem.order.user.name}</b>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}
                onClick={() => setProcureModalItem(null)}
              >
                ✕
              </button>
            </div>

            {/* Product summary card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={procureModalItem.item.image || '/images/categories/electronics-accessories.jpg'}
                alt=""
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {procureModalItem.item.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Budget: <b>₹{procureModalItem.item.estMin}</b> · Qty: <b>{procureModalItem.item.qty}</b>
                </div>
                {procureModalItem.item.sourceUrl && (
                  <a
                    href={procureModalItem.item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}
                  >
                    Open Product Link ↗
                  </a>
                )}
              </div>
            </div>

            <form onSubmit={handleMarkOnlineOrdered}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Retailer Order ID / Reference *
                </label>
                <input
                  type="text"
                  required
                  value={procureOrderNum}
                  onChange={e => setProcureOrderNum(e.target.value)}
                  placeholder="e.g. Amazon # 402-1829103-9182371 or Flipkart OD381928"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Courier / AWB Tracking #
                  </label>
                  <input
                    type="text"
                    value={procureTracking}
                    onChange={e => setProcureTracking(e.target.value)}
                    placeholder="e.g. Delhivery 92810238"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div style={{ width: 130 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={procurePrice}
                    onChange={e => setProcurePrice(e.target.value)}
                    placeholder="e.g. 1850"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Admin Operational Notes
                </label>
                <input
                  type="text"
                  value={procureNotes}
                  onChange={e => setProcureNotes(e.target.value)}
                  placeholder="e.g. Prime 2-day delivery, arriving Tuesday at Chennai hub"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#475569' }}
                  onClick={() => setProcureModalItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563EB', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                >
                  ✓ Save &amp; Mark as Ordered Online
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox for High-Def Inspection */}
      {zoomImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
          onClick={() => setZoomImg(null)}
        >
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img
              src={zoomImg}
              alt="Enlarged inspection preview"
              style={{ maxWidth: '100%', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            />
            <button
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
              onClick={() => setZoomImg(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      <div id="toast" className={toastMsg ? 'on' : ''}>{toastMsg}</div>
    </>
  );
}
