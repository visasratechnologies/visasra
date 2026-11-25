'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import '@/styles/admin.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  walletBalance?: number;
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  ordersDone: number;
  kycStatus: string; // 'none' | 'pending' | 'verified' | 'rejected'
  walletBalance: number;
  aadhaarNumber?: string | null;
  aadhaarFront?: string | null;
  aadhaarBack?: string | null;
  panNumber?: string | null;
  panDoc?: string | null;
  drivingLicenseNumber?: string | null;
  drivingLicenseDoc?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  altPhone?: string | null;
  selfie?: string | null;
  payoutUpi?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  status?: string; // 'active' | 'suspended' | 'offline'
  photo?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  createdAt: string;
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
  status: string;
  approvedAmount?: number;
  shopPaymentStatus?: string; // 'none' | 'pending_approval' | 'paid'
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
  orderType?: string;
  totalAmount: number;
  customerNotes?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
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
    workerLat?: number | null;
    workerLng?: number | null;
    worker?: {
      id: string;
      name: string;
      phone: string;
      rating: number;
      photo?: string | null;
      status?: string;
      currentLat?: number | null;
      currentLng?: number | null;
    };
    storeName?: string;
    storeAddress?: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminCockpit() {
  // Auth state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [adminLoading, setAdminLoading] = useState(false);

  // Core Navigation: Exactly 2 Operational Hubs
  const [activeTab, setActiveTab] = useState<'orders' | 'shoppers'>('orders');

  // Core Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Order Hub Filters & Modals
  const [orderFilter, setOrderFilter] = useState<'all' | 'unassigned' | 'in_market' | 'shop_payment_due' | 'shipped' | 'delivered'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [selectedShopperIdForAssign, setSelectedShopperIdForAssign] = useState<string>('');

  // Shipping form state inside drawer
  const [dispatchCarrier, setDispatchCarrier] = useState('DHL Express');
  const [dispatchAwb, setDispatchAwb] = useState('');
  const [dispatchUrl, setDispatchUrl] = useState('');

  // Shopper Hub Filters & Modals
  const [shopperFilter, setShopperFilter] = useState<'all' | 'kyc_pending' | 'active' | 'payout_due' | 'suspended'>('all');
  const [kycModalWorker, setKycModalWorker] = useState<Worker | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [payoutModalWorker, setPayoutModalWorker] = useState<Worker | null>(null);
  const [payoutUtr, setPayoutUtr] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Privacy Masking toggle
  const [revealedCustomerPiiOrderIds, setRevealedCustomerPiiOrderIds] = useState<Record<string, boolean>>({});

  // Image Zoom Lightbox
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleRevealPii = (orderId: string) => {
    setRevealedCustomerPiiOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const maskEmail = (email?: string | null) => {
    if (!email) return '—';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    return `${parts[0].slice(0, 2)}***@${parts[1]}`;
  };

  const maskPhone = (phone?: string | null) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '••••';
    return `+91 ••••• ••${digits.slice(-4)}`;
  };

  // 1. Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem('visasra_admin_jwt');
    const savedUser = localStorage.getItem('visasra_admin_user');
    if (token && savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch {
        // fallback
      }
    }
  }, []);

  // 2. Load Core Admin Data
  const fetchAdminData = async () => {
    const token = localStorage.getItem('visasra_admin_jwt');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setWorkers(data.workers || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch {
      showToast('Network error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
    }
  }, [adminUser]);

  // Auth Handlers
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const payload =
        authMethod === 'otp'
          ? { action: 'verify_otp', email: adminEmail.trim(), otp: adminOtp.trim() }
          : { action: 'login', email: adminEmail.trim(), password: adminPassword };

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('visasra_admin_jwt', data.token);
        localStorage.setItem('visasra_admin_user', JSON.stringify(data.admin));
        setAdminUser(data.admin);
        showToast(`Welcome back, ${data.admin.name}`);
      } else {
        showToast(data.error || 'Authentication failed');
      }
    } catch {
      showToast('Sign in connection failed');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSendAdminOtp = async () => {
    if (!adminEmail.trim()) {
      showToast('Enter your admin email address first');
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
        showToast('OTP code sent to your email.');
      } else {
        showToast(data.error || 'Failed to send OTP code');
      }
    } catch {
      showToast('Network error sending OTP');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('visasra_admin_jwt');
    localStorage.removeItem('visasra_admin_user');
    setAdminUser(null);
  };

  // Helper for admin POST actions
  const adminActionFetch = async (body: Record<string, unknown>) => {
    const token = localStorage.getItem('visasra_admin_jwt');
    if (!token) return { success: false, error: 'Unauthorized' };

    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Action request failed' };
    }
  };

  // Action: Assign Shopper
  const handleConfirmAssign = async () => {
    if (!assignModalOrder || !selectedShopperIdForAssign) {
      showToast('Please select a shopper first');
      return;
    }

    const res = await adminActionFetch({
      action: 'assign',
      slotKey: assignModalOrder.slotKey,
      workerId: selectedShopperIdForAssign,
    });

    if (res.success) {
      showToast('Shopper assigned successfully!');
      setAssignModalOrder(null);
      setSelectedShopperIdForAssign('');
      fetchAdminData();
      if (selectedOrder?.id === assignModalOrder.id) {
        setSelectedOrder(null);
      }
    } else {
      showToast(res.error || 'Failed to assign shopper');
    }
  };

  // Action: Unassign Shopper
  const handleUnassign = async (slotKey: string) => {
    if (!confirm('Unassign the current shopper from this booking?')) return;
    const res = await adminActionFetch({ action: 'unassign', slotKey });
    if (res.success) {
      showToast('Shopper unassigned');
      fetchAdminData();
      if (selectedOrder?.slotKey === slotKey) {
        setSelectedOrder(null);
      }
    } else {
      showToast(res.error || 'Failed to unassign shopper');
    }
  };

  // Action: Approve In-Store QR Payment
  const handleApproveShopPayment = async (itemId: string, defaultAmount: number) => {
    if (!confirm(`Confirm store payment clearance of ₹${defaultAmount.toLocaleString('en-IN')}?`)) return;
    const res = await adminActionFetch({
      action: 'approve_shop_payment',
      itemId,
      amount: defaultAmount,
    });
    if (res.success) {
      showToast('Shop counter payment approved and recorded!');
      fetchAdminData();
      if (selectedOrder) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((it) => (it.id === itemId ? { ...it, shopPaymentStatus: 'paid' } : it)),
              }
            : null
        );
      }
    } else {
      showToast(res.error || 'Failed to approve store payment');
    }
  };

  // Action: Mark Shipped & Enter Courier AWB
  const handleMarkShipped = async (orderId: string) => {
    if (!dispatchAwb.trim()) {
      showToast('Please enter the Airway Bill (AWB) or courier tracking number');
      return;
    }
    const res = await adminActionFetch({
      action: 'mark_shipped',
      orderId,
      carrier: dispatchCarrier,
      trackingNumber: dispatchAwb.trim(),
      trackingUrl: dispatchUrl.trim() || undefined,
    });

    if (res.success) {
      showToast(`Order marked shipped via ${dispatchCarrier}!`);
      setDispatchAwb('');
      setDispatchUrl('');
      fetchAdminData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } else {
      showToast(res.error || 'Failed to record shipment');
    }
  };

  // Action: Mark Delivered
  const handleMarkDelivered = async (orderId: string) => {
    if (!confirm('Mark this international order as delivered to the customer?')) return;
    const res = await adminActionFetch({ action: 'mark_delivered', orderId });
    if (res.success) {
      showToast('Order status updated to Delivered!');
      fetchAdminData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } else {
      showToast(res.error || 'Failed to mark delivered');
    }
  };

  // Action: Purge / Delete Test Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to permanently delete this order and all its live session data? This cannot be undone.')) {
      return;
    }
    const res = await adminActionFetch({ action: 'delete_order', orderId });
    if (res.success) {
      showToast('Order purged successfully from PostgreSQL');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      fetchAdminData();
    } else {
      showToast(res.error || 'Failed to delete order');
    }
  };

  // Action: KYC Review Decision
  const handleKycDecision = async (workerId: string, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !kycRejectReason.trim()) {
      showToast('Please provide a reason for rejecting the KYC documents');
      return;
    }

    const res = await adminActionFetch({
      action: 'kyc',
      workerId,
      decision,
      reason: decision === 'reject' ? kycRejectReason.trim() : undefined,
    });

    if (res.success) {
      showToast(decision === 'approve' ? 'Shopper KYC approved & activated!' : 'Shopper KYC rejected');
      setKycModalWorker(null);
      setKycRejectReason('');
      fetchAdminData();
    } else {
      showToast(res.error || 'Failed to update KYC status');
    }
  };

  // Action: Toggle Shopper Status (Active / Suspended)
  const handleToggleWorkerStatus = async (worker: Worker) => {
    const nextStatus = worker.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Change ${worker.name}'s status to "${nextStatus}"?`)) return;

    const res = await adminActionFetch({
      action: 'toggle_worker_status',
      workerId: worker.id,
      status: nextStatus,
    });

    if (res.success) {
      showToast(`Shopper status changed to ${nextStatus}`);
      fetchAdminData();
    } else {
      showToast(res.error || 'Failed to toggle shopper status');
    }
  };

  // Action: Settle Shopper Payout
  const handleSettlePayout = async () => {
    if (!payoutModalWorker) return;
    if (!payoutUtr.trim()) {
      showToast('Please enter the bank transaction reference or UPI UTR number');
      return;
    }

    setPayoutSubmitting(true);
    const res = await adminActionFetch({
      action: 'settle_payout',
      workerId: payoutModalWorker.id,
      utr: payoutUtr.trim(),
    });

    setPayoutSubmitting(false);
    if (res.success) {
      showToast(`Payout of ₹${payoutModalWorker.walletBalance.toLocaleString('en-IN')} marked settled!`);
      setPayoutModalWorker(null);
      setPayoutUtr('');
      fetchAdminData();
    } else {
      showToast(res.error || 'Failed to settle payout');
    }
  };

  // Computed Metrics & Filtered Data
  const unassignedCount = useMemo(() => orders.filter((o) => !o.liveSession?.workerId).length, [orders]);
  const activeInMarketCount = useMemo(
    () => orders.filter((o) => o.status === 'shopping' || o.trackingStage === 'shopping').length,
    [orders]
  );
  const shopPaymentPendingCount = useMemo(
    () => orders.filter((o) => o.items?.some((it) => it.shopPaymentStatus === 'pending_approval')).length,
    [orders]
  );
  const shippedTransitCount = useMemo(
    () => orders.filter((o) => o.trackingStage === 'shipped' || o.status === 'shipped').length,
    [orders]
  );
  const kycPendingCount = useMemo(() => workers.filter((w) => w.kycStatus === 'pending').length, [workers]);
  const payoutsDueCount = useMemo(() => workers.filter((w) => w.walletBalance > 0).length, [workers]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (orderFilter === 'unassigned') {
      result = result.filter((o) => !o.liveSession?.workerId);
    } else if (orderFilter === 'in_market') {
      result = result.filter((o) => o.status === 'shopping' || o.trackingStage === 'shopping');
    } else if (orderFilter === 'shop_payment_due') {
      result = result.filter((o) => o.items?.some((it) => it.shopPaymentStatus === 'pending_approval'));
    } else if (orderFilter === 'shipped') {
      result = result.filter((o) => o.trackingStage === 'shipped' || o.status === 'shipped');
    } else if (orderFilter === 'delivered') {
      result = result.filter((o) => o.trackingStage === 'delivered' || o.status === 'delivered' || o.status === 'completed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q) ||
          o.user.phone?.toLowerCase().includes(q) ||
          o.shippingAddress?.city?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, orderFilter, searchQuery]);

  // Filtered Shoppers
  const filteredShoppers = useMemo(() => {
    let result = workers;

    if (shopperFilter === 'kyc_pending') {
      result = result.filter((w) => w.kycStatus === 'pending');
    } else if (shopperFilter === 'active') {
      result = result.filter((w) => w.status === 'active' && w.kycStatus === 'verified');
    } else if (shopperFilter === 'payout_due') {
      result = result.filter((w) => w.walletBalance > 0);
    } else if (shopperFilter === 'suspended') {
      result = result.filter((w) => w.status === 'suspended');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q) ||
          w.email?.toLowerCase().includes(q) ||
          w.payoutUpi?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [workers, shopperFilter, searchQuery]);

  // LOGIN SCREEN (Clean & Secure)
  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#071F48', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: '36px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src="/images/decor/visasra-peacock.png" alt="Visasra" style={{ width: 64, height: 'auto', marginBottom: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-bodoni, Georgia, serif)', fontSize: 26, margin: '0 0 6px', color: '#092B55' }}>
              Visasra Cockpit
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#4C6180' }}>Authorized Operations &amp; Ground Force Management</p>
          </div>

          <div style={{ display: 'flex', background: '#E3ECF7', padding: 4, borderRadius: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              style={{
                flex: 1,
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12.5,
                background: authMethod === 'password' ? '#1B5AA6' : 'none',
                color: authMethod === 'password' ? '#fff' : '#4C6180',
                cursor: 'pointer',
              }}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('otp')}
              style={{
                flex: 1,
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12.5,
                background: authMethod === 'otp' ? '#1B5AA6' : 'none',
                color: authMethod === 'otp' ? '#fff' : '#4C6180',
                cursor: 'pointer',
              }}
            >
              Email OTP
            </button>
          </div>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 6 }}>
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@visasra.com"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBDBEE', borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {authMethod === 'password' ? (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 6 }}>
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBDBEE', borderRadius: 8, fontSize: 14 }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 6 }}>
                  One-Time Code (OTP)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    required
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value)}
                    placeholder="6-digit code"
                    style={{ flex: 1, padding: '10px 14px', border: '1px solid #CBDBEE', borderRadius: 8, fontSize: 14 }}
                  />
                  <button
                    type="button"
                    onClick={handleSendAdminOtp}
                    disabled={adminLoading}
                    style={{
                      background: '#123A69',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {adminOtpSent ? 'Resend' : 'Send'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1B5AA6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {adminLoading ? 'Authenticating...' : 'Sign In to Cockpit'}
            </button>
          </form>

          {toastMsg && (
            <div style={{ marginTop: 16, padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12, textAlign: 'center' }}>
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN COCKPIT VIEW
  return (
    <div className="shell">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99999,
            background: '#092B55',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            fontWeight: 700,
            fontSize: 13.5,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* DESKTOP SIDEBAR: LEAN 2-HUB ARCHITECTURE */}
      <aside className="side">
        <div className="brand">
          <img src="/images/decor/visasra-peacock.png" alt="Visasra" />
          <div>
            Visasra
            <small>OPERATIONS COCKPIT</small>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* HUB 1: ORDERS & FULFILLMENT */}
          <button
            className={`nv ${activeTab === 'orders' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              setSearchQuery('');
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Orders &amp; Fulfillment</span>
            {unassignedCount > 0 && (
              <b style={{ background: '#EF4444', color: '#fff', borderRadius: 999, padding: '2px 7px', fontSize: 11, marginLeft: 'auto' }}>
                {unassignedCount}
              </b>
            )}
          </button>

          {/* HUB 2: GROUND SHOPPERS & PAYOUTS */}
          <button
            className={`nv ${activeTab === 'shoppers' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('shoppers');
              setSearchQuery('');
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Shoppers &amp; Payouts</span>
            {(kycPendingCount > 0 || payoutsDueCount > 0) && (
              <b style={{ background: '#F59E0B', color: '#092B55', borderRadius: 999, padding: '2px 7px', fontSize: 11, marginLeft: 'auto' }}>
                {kycPendingCount + payoutsDueCount}
              </b>
            )}
          </button>
        </div>

        {/* BOTTOM ADMIN CARD */}
        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {adminUser.name}
          </div>
          <div style={{ fontSize: 11, color: '#8FC0FF', marginBottom: 10 }}>{adminUser.email}</div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 6,
              color: '#FCA5A5',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN COCKPIT WORKSPACE */}
      <main className="main" style={{ padding: '24px 32px' }}>
        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1B5AA6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Visasra Operations Hub &bull; {activeTab === 'orders' ? 'Fulfillment Pipeline' : 'Ground Shoppers Fleet'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-bodoni, Georgia, serif)', fontSize: 26, margin: '2px 0 0', color: '#092B55' }}>
              {activeTab === 'orders' ? 'Live Orders & International Fulfillment' : 'Ground Shoppers, KYC & Payouts'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'orders' ? 'Search by Order #, customer, city...' : 'Search by shopper name, phone, UPI...'}
              style={{
                width: 280,
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #CBDBEE',
                fontSize: 13,
                background: '#fff',
              }}
            />

            {/* Sync Database Button */}
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="btn o"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '9px 14px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{loading ? 'Syncing...' : 'Sync Database'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ORDERS & FULFILLMENT                                */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <>
            {/* KPI STATS ROW */}
            <div className="grid g4" style={{ marginBottom: 20 }}>
              <div className="kpi" style={{ ['--c' as string]: '#1B5AA6' }}>
                <div className="l">Total Active Bookings</div>
                <div className="v">{orders.length}</div>
                <div className="s">All confirmed customer orders</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: unassignedCount > 0 ? '#B3261E' : '#2F7D4A' }}>
                <div className="l">Needs Ground Shopper</div>
                <div className="v">{unassignedCount}</div>
                <div className="s">{unassignedCount > 0 ? 'Immediate assignment needed' : 'All slots assigned'}</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: '#E07B00' }}>
                <div className="l">Active in Market</div>
                <div className="v">{activeInMarketCount}</div>
                <div className="s">{shopPaymentPendingCount > 0 ? `${shopPaymentPendingCount} store payment(s) due` : 'Live shopping ongoing'}</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: '#123A69' }}>
                <div className="l">International Transit</div>
                <div className="v">{shippedTransitCount}</div>
                <div className="s">Courier AWB active</div>
              </div>
            </div>

            {/* FILTER PILLS */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { id: 'all', label: `All Orders (${orders.length})` },
                { id: 'unassigned', label: `Needs Shopper (${unassignedCount})` },
                { id: 'in_market', label: `In Market (${activeInMarketCount})` },
                { id: 'shop_payment_due', label: `Store Payment Due (${shopPaymentPendingCount})` },
                { id: 'shipped', label: `In Transit (${shippedTransitCount})` },
                { id: 'delivered', label: 'Delivered' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setOrderFilter(pill.id as typeof orderFilter)}
                  style={{
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    background: orderFilter === pill.id ? '#123A69' : '#fff',
                    color: orderFilter === pill.id ? '#fff' : '#4C6180',
                    boxShadow: orderFilter === pill.id ? '0 4px 12px rgba(18,58,105,0.2)' : 'none',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: orderFilter === pill.id ? '#123A69' : '#CBDBEE',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* ORDERS TABLE */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="t">
                <thead>
                  <tr>
                    <th>Order &amp; Slot</th>
                    <th>Customer &amp; Destination</th>
                    <th>Items &amp; Amount</th>
                    <th>Assigned Shopper</th>
                    <th>Fulfillment Stage</th>
                    <th>Store Clearance</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const isUnassigned = !o.liveSession?.workerId;
                    const hasPendingShopPayment = o.items?.some((it) => it.shopPaymentStatus === 'pending_approval');
                    const isPiiRevealed = revealedCustomerPiiOrderIds[o.id];

                    return (
                      <tr key={o.id} style={{ background: hasPendingShopPayment ? '#FFFBEB' : isUnassigned ? '#FEF2F2' : 'transparent' }}>
                        {/* Order & Slot */}
                        <td>
                          <div style={{ fontWeight: 800, color: '#092B55', fontSize: 13.5 }}>#{o.orderNumber}</div>
                          <div style={{ fontSize: 12, color: '#4C6180' }}>
                            {o.slotDate} &bull; {o.slotWindow}
                          </div>
                          <div style={{ fontSize: 11, color: '#1B5AA6', fontWeight: 600 }}>{o.shippingAddress?.city || 'Local Hub'}</div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#092B55' }}>
                            {o.user.name}{' '}
                            <button
                              onClick={() => toggleRevealPii(o.id)}
                              title={isPiiRevealed ? 'Hide PII' : 'Reveal customer details'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: '#1B5AA6', padding: '0 4px' }}
                            >
                              {isPiiRevealed ? '[Hide]' : '[Reveal]'}
                            </button>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#4C6180' }}>
                            {isPiiRevealed ? o.user.email : maskEmail(o.user.email)}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#4C6180' }}>
                            {isPiiRevealed ? o.user.phone || '—' : maskPhone(o.user.phone)}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2F7D4A', marginTop: 2 }}>
                            To: {o.shippingAddress?.country || 'International'}
                          </div>
                        </td>

                        {/* Items & Basket */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#092B55' }}>₹{o.totalAmount.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: 12, color: '#4C6180' }}>{o.items.length} item(s) requested</div>
                          <div style={{ fontSize: 11, color: '#8B9CB5', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {o.items.map((i) => i.name).join(', ')}
                          </div>
                        </td>

                        {/* Assigned Shopper */}
                        <td>
                          {o.liveSession?.worker ? (
                            <div>
                              <div style={{ fontWeight: 700, color: '#092B55' }}>{o.liveSession.worker.name}</div>
                              <div style={{ fontSize: 11.5, color: '#4C6180' }}>{o.liveSession.worker.phone}</div>
                              <button
                                onClick={() => handleUnassign(o.slotKey)}
                                style={{ background: 'none', border: 'none', color: '#B3261E', fontSize: 11, cursor: 'pointer', padding: 0 }}
                              >
                                &times; Unassign
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAssignModalOrder(o);
                                setSelectedShopperIdForAssign('');
                              }}
                              style={{
                                background: '#B3261E',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              + Assign Shopper
                            </button>
                          )}
                        </td>

                        {/* Fulfillment Stage */}
                        <td>
                          <span
                            className="pill"
                            style={{
                              background:
                                o.trackingStage === 'delivered'
                                  ? '#DCFCE7'
                                  : o.trackingStage === 'shipped'
                                  ? '#DBEAFE'
                                  : o.status === 'shopping'
                                  ? '#FEF3C7'
                                  : '#E0E7FF',
                              color:
                                o.trackingStage === 'delivered'
                                  ? '#166534'
                                  : o.trackingStage === 'shipped'
                                  ? '#1E40AF'
                                  : o.status === 'shopping'
                                  ? '#92400E'
                                  : '#3730A3',
                              fontWeight: 700,
                              fontSize: 11.5,
                            }}
                          >
                            {o.trackingStage === 'delivered'
                              ? 'Delivered'
                              : o.trackingStage === 'shipped'
                              ? 'Dispatched'
                              : o.status === 'shopping'
                              ? 'In Market'
                              : 'Slot Confirmed'}
                          </span>
                          {o.trackingNumber && (
                            <div style={{ fontSize: 11, color: '#1B5AA6', fontWeight: 600, marginTop: 4 }}>
                              AWB: {o.trackingNumber}
                            </div>
                          )}
                        </td>

                        {/* Store Clearance */}
                        <td>
                          {hasPendingShopPayment ? (
                            <button
                              onClick={() => setSelectedOrder(o)}
                              style={{
                                background: '#F59E0B',
                                color: '#092B55',
                                border: 'none',
                                borderRadius: 6,
                                padding: '5px 9px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>Approve QR</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 11.5, color: '#8B9CB5' }}>Clear</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="btn"
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                            >
                              Inspect / Manage
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o.id)}
                              title="Delete / Purge Test Order"
                              style={{
                                background: '#FEE2E2',
                                border: '1px solid #FCA5A5',
                                borderRadius: 6,
                                padding: '6px 9px',
                                color: '#B91C1C',
                                cursor: 'pointer',
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#8B9CB5' }}>
                        No orders match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GROUND SHOPPERS & PAYOUTS                           */}
        {/* ========================================================= */}
        {activeTab === 'shoppers' && (
          <>
            {/* KPI STATS ROW */}
            <div className="grid g4" style={{ marginBottom: 20 }}>
              <div className="kpi" style={{ ['--c' as string]: '#1B5AA6' }}>
                <div className="l">Total Registered Shoppers</div>
                <div className="v">{workers.length}</div>
                <div className="s">Ground personal shoppers</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: kycPendingCount > 0 ? '#B3261E' : '#2F7D4A' }}>
                <div className="l">KYC Pending Review</div>
                <div className="v">{kycPendingCount}</div>
                <div className="s">{kycPendingCount > 0 ? 'Identity documents awaiting approval' : 'All documents verified'}</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: '#2F7D4A' }}>
                <div className="l">Active Verified Fleet</div>
                <div className="v">{workers.filter((w) => w.status === 'active' && w.kycStatus === 'verified').length}</div>
                <div className="s">Ready to accept shopping slots</div>
              </div>

              <div className="kpi" style={{ ['--c' as string]: '#E07B00' }}>
                <div className="l">Shopper Payouts Due</div>
                <div className="v">
                  ₹{workers.reduce((acc, w) => acc + w.walletBalance, 0).toLocaleString('en-IN')}
                </div>
                <div className="s">{payoutsDueCount} shopper(s) with unpaid balance</div>
              </div>
            </div>

            {/* FILTER PILLS */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { id: 'all', label: `All Shoppers (${workers.length})` },
                { id: 'kyc_pending', label: `KYC Pending (${kycPendingCount})` },
                { id: 'active', label: 'Active Fleet' },
                { id: 'payout_due', label: `Payouts Due (${payoutsDueCount})` },
                { id: 'suspended', label: 'Suspended' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setShopperFilter(pill.id as typeof shopperFilter)}
                  style={{
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    background: shopperFilter === pill.id ? '#123A69' : '#fff',
                    color: shopperFilter === pill.id ? '#fff' : '#4C6180',
                    boxShadow: shopperFilter === pill.id ? '0 4px 12px rgba(18,58,105,0.2)' : 'none',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: shopperFilter === pill.id ? '#123A69' : '#CBDBEE',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* SHOPPERS TABLE */}
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="t">
                <thead>
                  <tr>
                    <th>Shopper Profile</th>
                    <th>KYC Verification</th>
                    <th>Performance</th>
                    <th>Account Status</th>
                    <th>Unpaid Earnings</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShoppers.map((w) => {
                    const isKycPending = w.kycStatus === 'pending';
                    const isKycVerified = w.kycStatus === 'verified';
                    const hasEarnings = w.walletBalance > 0;

                    return (
                      <tr key={w.id} style={{ background: isKycPending ? '#FFFBEB' : 'transparent' }}>
                        {/* Profile */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: '#E3ECF7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                color: '#1B5AA6',
                                overflow: 'hidden',
                              }}
                            >
                              {w.photo ? <img src={w.photo} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : w.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#092B55' }}>{w.name}</div>
                              <div style={{ fontSize: 11.5, color: '#4C6180' }}>{w.phone}</div>
                              {w.email && <div style={{ fontSize: 11, color: '#8B9CB5' }}>{w.email}</div>}
                              {typeof w.currentLat === 'number' && typeof w.currentLng === 'number' ? (
                                <a
                                  href={`https://maps.google.com/?q=${w.currentLat},${w.currentLng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#0284C7',
                                    textDecoration: 'none',
                                    marginTop: 4,
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                                  GPS: {w.currentLat.toFixed(4)}, {w.currentLng.toFixed(4)} &rarr;
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* KYC Status */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              className="pill"
                              style={{
                                background: isKycVerified ? '#DCFCE7' : isKycPending ? '#FEF3C7' : '#FEE2E2',
                                color: isKycVerified ? '#166534' : isKycPending ? '#92400E' : '#B91C1C',
                                fontWeight: 700,
                                fontSize: 11.5,
                              }}
                            >
                              {isKycVerified ? 'Verified' : isKycPending ? 'Review Pending' : 'Incomplete / Rejected'}
                            </span>
                          </div>
                          {w.aadhaarNumber && <div style={{ fontSize: 11, color: '#4C6180', marginTop: 3 }}>Aadhaar: {w.aadhaarNumber}</div>}
                          {w.panNumber && <div style={{ fontSize: 11, color: '#4C6180' }}>PAN: {w.panNumber}</div>}
                        </td>

                        {/* Performance */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#092B55' }}>Rating: {w.rating.toFixed(1)} / 5.0</div>
                          <div style={{ fontSize: 12, color: '#4C6180' }}>{w.ordersDone} completed trip(s)</div>
                        </td>

                        {/* Account Status */}
                        <td>
                          <button
                            onClick={() => handleToggleWorkerStatus(w)}
                            style={{
                              border: 'none',
                              borderRadius: 20,
                              padding: '4px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: w.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                              color: w.status === 'active' ? '#166534' : '#B91C1C',
                            }}
                          >
                            {w.status === 'active' ? 'Active' : 'Suspended'} &bull; Toggle
                          </button>
                        </td>

                        {/* Unpaid Earnings & Payout */}
                        <td>
                          <div style={{ fontWeight: 800, color: hasEarnings ? '#B45309' : '#092B55', fontSize: 13.5 }}>
                            ₹{w.walletBalance.toLocaleString('en-IN')}
                          </div>
                          {w.payoutUpi && <div style={{ fontSize: 11, color: '#1B5AA6', fontWeight: 600 }}>UPI: {w.payoutUpi}</div>}
                          {w.bankAccountNumber && (
                            <div style={{ fontSize: 11, color: '#4C6180' }}>
                              A/C: {w.bankAccountNumber} ({w.bankIfscCode || 'IFSC'})
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => {
                                setKycModalWorker(w);
                                setKycRejectReason('');
                              }}
                              className="btn o"
                              style={{ padding: '6px 10px', fontSize: 11.5 }}
                            >
                              Verify KYC
                            </button>

                            {hasEarnings && (
                              <button
                                onClick={() => {
                                  setPayoutModalWorker(w);
                                  setPayoutUtr('');
                                }}
                                className="btn"
                                style={{ background: '#2F7D4A', borderColor: '#2F7D4A', padding: '6px 10px', fontSize: 11.5 }}
                              >
                                Settle Payout
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredShoppers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#8B9CB5' }}>
                        No shoppers match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* SLIDE-IN ORDER INSPECTION & ACTIONS DRAWER                */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              background: '#fff',
              height: '100vh',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.25)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #E3ECF7', paddingBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1B5AA6', textTransform: 'uppercase' }}>Fulfillment Cockpit</span>
                <h2 style={{ fontFamily: 'var(--font-bodoni, Georgia, serif)', fontSize: 24, margin: '2px 0 4px', color: '#092B55' }}>
                  Order #{selectedOrder.orderNumber}
                </h2>
                <div style={{ fontSize: 12.5, color: '#4C6180' }}>
                  Slot: {selectedOrder.slotDate} ({selectedOrder.slotWindow}) &bull; City: {selectedOrder.shippingAddress?.city || 'Local Hub'}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: '#E3ECF7', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
              >
                &times;
              </button>
            </div>

            {/* Customer & International Shipping Address */}
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#123A69', marginBottom: 6, textTransform: 'uppercase' }}>
                Customer &amp; Delivery Destination
              </div>
              <div style={{ fontWeight: 700, color: '#092B55' }}>{selectedOrder.user.name}</div>
              <div style={{ fontSize: 12, color: '#4C6180' }}>
                Email: {selectedOrder.user.email} &bull; Phone: {selectedOrder.user.phone || '—'}
              </div>
              {selectedOrder.shippingAddress && (
                <div style={{ fontSize: 12, color: '#1E293B', marginTop: 6, lineHeight: 1.4 }}>
                  {selectedOrder.shippingAddress.line1}
                  {selectedOrder.shippingAddress.line2 && `, ${selectedOrder.shippingAddress.line2}`}
                  <br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.region} {selectedOrder.shippingAddress.zip}
                  <br />
                  <b>Country: {selectedOrder.shippingAddress.country}</b>
                </div>
              )}
            </div>

            {/* Shopper Assignment & Live GPS Tracking Block */}
            <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '16px', border: '1px solid #BAE6FD' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assigned Ground Shopper
                </span>
                {selectedOrder.liveSession?.stage && (
                  <span
                    style={{
                      background: '#E0F2FE',
                      color: '#0369A1',
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  >
                    {selectedOrder.liveSession.stage.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {selectedOrder.liveSession?.worker ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0C4A6E', fontSize: 14 }}>
                        {selectedOrder.liveSession.worker.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#0369A1', marginTop: 2 }}>
                        Phone: {selectedOrder.liveSession.worker.phone} &bull; Rating: {selectedOrder.liveSession.worker.rating.toFixed(1)} / 5.0
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnassign(selectedOrder.slotKey)}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        color: '#B91C1C',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Unassign
                    </button>
                  </div>

                  {/* Real-time GPS Tracker & Google Maps Link */}
                  {(() => {
                    const lat = selectedOrder.liveSession?.workerLat ?? selectedOrder.liveSession?.worker?.currentLat;
                    const lng = selectedOrder.liveSession?.workerLng ?? selectedOrder.liveSession?.worker?.currentLng;
                    const hasGps = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

                    return (
                      <div
                        style={{
                          background: hasGps ? '#F8FAFC' : '#F1F5F9',
                          border: `1px solid ${hasGps ? '#CBD5E1' : '#E2E8F0'}`,
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: hasGps ? '#16A34A' : '#94A3B8',
                                boxShadow: hasGps ? '0 0 0 3px rgba(22, 163, 74, 0.2)' : 'none',
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                              {hasGps ? `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'GPS: Awaiting satellite fix'}
                            </span>
                          </div>
                          {hasGps && (
                            <a
                              href={`https://maps.google.com/?q=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#123A69',
                                color: '#FFFFFF',
                                padding: '5px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              <span>View Live on Google Maps &rarr;</span>
                            </a>
                          )}
                        </div>
                        {selectedOrder.liveSession?.storeName && (
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                            Store Target: <b>{selectedOrder.liveSession.storeName}</b>
                            {selectedOrder.liveSession.storeAddress && ` &bull; ${selectedOrder.liveSession.storeAddress}`}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <button
                  onClick={() => {
                    setAssignModalOrder(selectedOrder);
                    setSelectedShopperIdForAssign('');
                  }}
                  style={{
                    background: '#0284C7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Assign Ground Shopper Now
                </button>
              )}
            </div>

            {/* Items Requested & Store Counter Payments */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#123A69', marginBottom: 10, textTransform: 'uppercase' }}>
                Items &amp; Store QR Clearances ({selectedOrder.items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#092B55', fontSize: 13.5 }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: '#4C6180' }}>
                          Qty: {item.qty} &bull; Est: ₹{item.estMin} - ₹{item.estMax}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          className="pill"
                          style={{
                            background: item.shopPaymentStatus === 'paid' ? '#DCFCE7' : item.shopPaymentStatus === 'pending_approval' ? '#FEF3C7' : '#F1F5F9',
                            color: item.shopPaymentStatus === 'paid' ? '#166534' : item.shopPaymentStatus === 'pending_approval' ? '#92400E' : '#475569',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.shopPaymentStatus === 'paid' ? 'Store Paid' : item.shopPaymentStatus === 'pending_approval' ? 'Store Payment Due' : 'Pending Market'}
                        </span>
                      </div>
                    </div>

                    {/* Pending Store Payment QR & 1-Click Approval */}
                    {item.shopPaymentStatus === 'pending_approval' && (
                      <div style={{ marginTop: 10, padding: '10px', background: '#FFFBEB', borderRadius: 6, border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                          Shopper uploaded store counter payment request
                        </div>
                        {item.shopPaymentQr && (
                          <div style={{ marginBottom: 8 }}>
                            <img
                              src={item.shopPaymentQr}
                              alt="Store Payment QR"
                              onClick={() => setZoomImg(item.shopPaymentQr || null)}
                              style={{ width: 120, height: 120, objectFit: 'contain', cursor: 'pointer', borderRadius: 6, border: '1px solid #CBD5E1' }}
                            />
                            <div style={{ fontSize: 10.5, color: '#64748B' }}>Click to zoom QR</div>
                          </div>
                        )}
                        <button
                          onClick={() => handleApproveShopPayment(item.id, item.shopPaymentAmount || item.estMin || 0)}
                          style={{
                            background: '#2F7D4A',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '7px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Confirm &amp; Pay Store (₹{(item.shopPaymentAmount || item.estMin || 0).toLocaleString('en-IN')})
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* International Courier Dispatch Form */}
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#123A69', marginBottom: 10, textTransform: 'uppercase' }}>
                International Courier Dispatch (DHL / FedEx)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Carrier</label>
                  <select
                    value={dispatchCarrier}
                    onChange={(e) => setDispatchCarrier(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  >
                    <option value="DHL Express">DHL Express</option>
                    <option value="FedEx International">FedEx International</option>
                    <option value="India Post EMS">India Post EMS</option>
                    <option value="Aramex">Aramex</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Airway Bill (AWB) #</label>
                  <input
                    type="text"
                    value={dispatchAwb}
                    onChange={(e) => setDispatchAwb(e.target.value)}
                    placeholder="e.g. 984521034"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleMarkShipped(selectedOrder.id)}
                  style={{
                    flex: 1,
                    background: '#1B5AA6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '9px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Record Shipment &amp; Notify Customer
                </button>
                <button
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                  style={{
                    background: '#2F7D4A',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Mark Delivered
                </button>
              </div>
            </div>

            {/* Footer Purge Button */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E3ECF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  borderRadius: 6,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Permanently Delete / Purge Order
              </button>
              <button onClick={() => setSelectedOrder(null)} className="btn o" style={{ fontSize: 12 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN SHOPPER                                     */}
      {/* ========================================================= */}
      {assignModalOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 18, color: '#092B55', margin: '0 0 6px' }}>Assign Ground Shopper</h3>
            <p style={{ fontSize: 12.5, color: '#4C6180', margin: '0 0 16px' }}>
              Assign an active, verified shopper to Order #{assignModalOrder.orderNumber} ({assignModalOrder.slotDate} &bull; {assignModalOrder.slotWindow})
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 6 }}>
                Select Active Shopper
              </label>
              <select
                value={selectedShopperIdForAssign}
                onChange={(e) => setSelectedShopperIdForAssign(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBDBEE', fontSize: 13 }}
              >
                <option value="">-- Choose verified shopper --</option>
                {workers
                  .filter((w) => w.status === 'active' || w.kycStatus === 'verified')
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.phone}) - Rating: {w.rating.toFixed(1)}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModalOrder(null)} className="btn o" style={{ fontSize: 12.5 }}>
                Cancel
              </button>
              <button onClick={handleConfirmAssign} className="btn" style={{ fontSize: 12.5 }}>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KYC VERIFICATION                                   */}
      {/* ========================================================= */}
      {kycModalWorker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 14,
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 19, color: '#092B55', margin: 0 }}>KYC Document Inspection</h3>
                <div style={{ fontSize: 12, color: '#4C6180' }}>
                  {kycModalWorker.name} &bull; {kycModalWorker.phone}
                </div>
              </div>
              <button onClick={() => setKycModalWorker(null)} style={{ background: '#E3ECF7', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            {/* Document Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Aadhaar Card</div>
                <div style={{ fontWeight: 700, color: '#092B55', fontSize: 13, marginBottom: 6 }}>
                  {kycModalWorker.aadhaarNumber || 'Not entered'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {kycModalWorker.aadhaarFront ? (
                    <img
                      src={kycModalWorker.aadhaarFront}
                      alt="Aadhaar Front"
                      onClick={() => setZoomImg(kycModalWorker.aadhaarFront || null)}
                      style={{ width: '48%', height: 70, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #CBD5E1' }}
                    />
                  ) : (
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>No Front Photo</div>
                  )}
                  {kycModalWorker.aadhaarBack && (
                    <img
                      src={kycModalWorker.aadhaarBack}
                      alt="Aadhaar Back"
                      onClick={() => setZoomImg(kycModalWorker.aadhaarBack || null)}
                      style={{ width: '48%', height: 70, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #CBD5E1' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>PAN Card</div>
                <div style={{ fontWeight: 700, color: '#092B55', fontSize: 13, marginBottom: 6 }}>
                  {kycModalWorker.panNumber || 'Not entered'}
                </div>
                {kycModalWorker.panDoc ? (
                  <img
                    src={kycModalWorker.panDoc}
                    alt="PAN Card"
                    onClick={() => setZoomImg(kycModalWorker.panDoc || null)}
                    style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #CBD5E1' }}
                  />
                ) : (
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>No PAN Photo</div>
                )}
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 4 }}>
                Reason for Rejection (if rejecting):
              </label>
              <input
                type="text"
                value={kycRejectReason}
                onChange={(e) => setKycRejectReason(e.target.value)}
                placeholder="e.g. Aadhaar name does not match bank account"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBDBEE', fontSize: 13 }}
              />
            </div>

            {/* Decision Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleKycDecision(kycModalWorker.id, 'reject')}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reject Documents
              </button>
              <button
                onClick={() => handleKycDecision(kycModalWorker.id, 'approve')}
                style={{
                  background: '#2F7D4A',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Approve KYC &amp; Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PAYOUT SETTLEMENT                                  */}
      {/* ========================================================= */}
      {payoutModalWorker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: 19, color: '#092B55', margin: '0 0 4px' }}>Settle Shopper Payout</h3>
            <p style={{ fontSize: 12.5, color: '#4C6180', margin: '0 0 16px' }}>
              Transfer wages to {payoutModalWorker.name} ({payoutModalWorker.phone})
            </p>

            <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: 8, border: '1px solid #BBF7D0', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Amount to Disburse</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D' }}>
                ₹{payoutModalWorker.walletBalance.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                UPI: <b>{payoutModalWorker.payoutUpi || 'Not set'}</b>
                {payoutModalWorker.bankAccountNumber && (
                  <div>
                    Bank: {payoutModalWorker.bankName || 'Bank'} A/C {payoutModalWorker.bankAccountNumber} ({payoutModalWorker.bankIfscCode})
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#092B55', marginBottom: 4 }}>
                Bank UTR / Transaction Reference #
              </label>
              <input
                type="text"
                required
                value={payoutUtr}
                onChange={(e) => setPayoutUtr(e.target.value)}
                placeholder="e.g. UTR-20261124-98432"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBDBEE', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPayoutModalWorker(null)} className="btn o" style={{ fontSize: 12.5 }}>
                Cancel
              </button>
              <button
                onClick={handleSettlePayout}
                disabled={payoutSubmitting}
                className="btn"
                style={{ background: '#2F7D4A', borderColor: '#2F7D4A', fontSize: 12.5 }}
              >
                {payoutSubmitting ? 'Recording...' : 'Confirm & Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* IMAGE ZOOM LIGHTBOX                                       */}
      {/* ========================================================= */}
      {zoomImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out',
          }}
          onClick={() => setZoomImg(null)}
        >
          <img
            src={zoomImg}
            alt="Enlarged inspection"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
      {/* MOBILE BOTTOM NAVIGATION (ONLY VISIBLE ON MOBILE) */}
      <nav className="admin-bottom-nav">
        <button
          className={`admin-bnav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setSearchQuery('');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Orders</span>
          {unassignedCount > 0 && <span className="bnav-badge">{unassignedCount}</span>}
        </button>

        <button
          className={`admin-bnav-btn ${activeTab === 'shoppers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('shoppers');
            setSearchQuery('');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          </svg>
          <span>Shoppers</span>
          {(kycPendingCount > 0 || payoutsDueCount > 0) && (
            <span className="bnav-badge">{kycPendingCount + payoutsDueCount}</span>
          )}
        </button>

        <button
          className="admin-bnav-btn"
          onClick={handleLogout}
          style={{ color: '#F87171' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
