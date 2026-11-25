'use client';

import React, { useState } from 'react';
import { WorkerProfile } from '@/types/worker';

interface WorkerProfileTabProps {
  worker: WorkerProfile | null;
  onExecAction: (data: Record<string, unknown>) => Promise<unknown> | unknown;
  onSignOut: () => void;
  showToast: (msg: string) => void;
}

export const WorkerProfileTab: React.FC<WorkerProfileTabProps> = ({
  worker,
  onExecAction,
  onSignOut,
  showToast,
}) => {
  const [showBankModal, setShowBankModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editBankConfirmAccountNumber, setEditBankConfirmAccountNumber] = useState('');
  const [editBankIfscCode, setEditBankIfscCode] = useState('');
  const [editPayoutUpi, setEditPayoutUpi] = useState('');
  const [bankUpdating, setBankUpdating] = useState(false);

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
    if (!editBankAccountNumber.trim()) {
      showToast('Please enter your Bank Account Number');
      return;
    }
    if (editBankAccountNumber.trim() !== editBankConfirmAccountNumber.trim()) {
      showToast('Account Numbers do not match');
      return;
    }
    if (!editBankIfscCode.trim()) {
      showToast('Please enter your Bank IFSC Code');
      return;
    }

    setBankUpdating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('visasra_worker_token') : null;
      const res = await fetch('/api/worker/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workerId: worker?.id,
          bankName: editBankName.trim() || 'Bank of India',
          bankBranch: editBankBranch.trim() || 'Main Branch',
          bankAccountNumber: editBankAccountNumber.trim(),
          bankIfscCode: editBankIfscCode.trim().toUpperCase(),
          payoutUpi: editPayoutUpi.trim(),
        }),
      });

      if (res.ok) {
        showToast('Bank details updated successfully!');
        setShowBankModal(false);
        if (worker) {
          worker.bankName = editBankName.trim();
          worker.bankBranch = editBankBranch.trim();
          worker.bankAccountNumber = editBankAccountNumber.trim();
          worker.bankIfscCode = editBankIfscCode.trim().toUpperCase();
          worker.payoutUpi = editPayoutUpi.trim();
        }
      } else {
        showToast('Failed to update bank details. Try again.');
      }
    } catch {
      showToast('Network error updating bank details');
    } finally {
      setBankUpdating(false);
    }
  };

  const isVerified = worker?.kycStatus === 'verified' || worker?.kycStatus === 'approved';
  const isOnline = worker?.status === 'active';

  return (
    <div className="screen active" style={{ paddingBottom: '90px' }}>
      <div className="body" style={{ maxWidth: '480px', margin: '0 auto', padding: '14px 16px' }}>
        
        {/* ========================================================= */}
        {/* 1. HERO PARTNER PROFILE CARD                              */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(11, 30, 54, 0.05)',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0C3270 0%, #1A5FA8 100%)',
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(12, 50, 112, 0.25)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {worker?.photo ? (
                <img src={worker.photo} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                worker?.name ? worker.name.slice(0, 2).toUpperCase() : 'HN'
              )}
            </div>

            {/* Partner Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#092B55', lineHeight: 1.2 }}>
                {worker?.name || 'Partner Shopper'}
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                {worker?.phone || '+91 70324 14481'}
              </div>
              {worker?.email && (
                <div style={{ fontSize: 12, color: '#8B9CB5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {worker.email}
                </div>
              )}

              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#ECFDF5',
                    color: '#065F46',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    border: '1px solid #A7F3D0',
                  }}
                >
                  <img src="/images/icons/star.png" alt="" style={{ width: 11, height: 11, objectFit: 'contain' }} />
                  {worker?.rating?.toFixed(1) || '5.0'} Rating
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#EFF6FF',
                    color: '#1E40AF',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    border: '1px solid #BFDBFE',
                  }}
                >
                  ID: #{worker?.id ? worker.id.slice(0, 8).toUpperCase() : 'FB657CA1'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. KYC VERIFIED TRUST SHIELD (NO BUREAUCRATIC RAW TABLE)   */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: isVerified ? '#F0FDF4' : '#FFFBEB',
            borderRadius: 14,
            padding: '14px 16px',
            border: isVerified ? '1px solid #86EFAC' : '1px solid #FDE68A',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isVerified ? '#DCFCE7' : '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <img
                  src={isVerified ? '/images/icons/check.png' : '/images/icons/kyc.png'}
                  alt=""
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: isVerified ? '#166534' : '#92400E' }}>
                  {isVerified ? 'Identity Verified & KYC Approved' : 'Verification Under Review'}
                </div>
                <div style={{ fontSize: 12, color: isVerified ? '#15803D' : '#B45309', marginTop: 2 }}>
                  {isVerified
                    ? 'Official Visasra Ground Partner · Eligible for Live Shopping'
                    : 'Documents submitted. Pending Operations team approval.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowKycModal(true)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: '#092B55',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              View Info
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. BANK & PAYOUTS CARD                                    */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '16px',
            border: '1px solid #E2E8F0',
            marginBottom: 14,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/images/icons/earnings.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#092B55' }}>Bank Account &amp; Payouts</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Direct Deposit Every Wednesday</div>
              </div>
            </div>

            <button
              type="button"
              onClick={openBankModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#1B5AA6',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Edit Details</span>
            </button>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Payout UPI ID</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                {worker?.payoutUpi || 'partner@okhdfcbank'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Bank Name</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                {worker?.bankName || 'HDFC Bank'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Account Number</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                {worker?.bankAccountNumber ? `•••• •••• •••• ${worker.bankAccountNumber.slice(-4)}` : '•••• •••• •••• 1456'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. PERFORMANCE & STATS (3 CLEAN TILES)                    */}
        {/* ========================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          {/* Slots Done */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 10px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <img src="/images/icons/slot.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#092B55' }}>
              {worker?.ordersDone ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Slots Completed</div>
          </div>

          {/* Wallet Balance */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 10px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <img src="/images/icons/earnings.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2F7D4A' }}>
              ₹{(worker?.walletBalance || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Available Balance</div>
          </div>

          {/* On-Time Rate */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '12px 10px',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
            }}
          >
            <img src="/images/icons/check.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#092B55' }}>
              100%
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>On-Time Rate</div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. ONLINE / OFFLINE AVAILABILITY TOGGLE                   */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '14px 16px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Custom animated status pulse dot */}
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isOnline ? '#22C55E' : '#94A3B8',
                boxShadow: isOnline ? '0 0 0 3px rgba(34, 197, 94, 0.25)' : 'none',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#092B55' }}>
                {isOnline ? 'Online · Accepting Slots' : 'Offline · Paused'}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                {isOnline ? 'You are visible for shopping slots in Chennai.' : 'Go online to receive customer slots.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${isOnline ? 'on' : ''}`}
            onClick={() => {
              const next = !isOnline;
              onExecAction({ action: 'toggle_online', isOnline: next });
              showToast(next ? 'You are now Online' : 'You are now Offline');
            }}
            aria-label="Toggle Online Status"
          />
        </div>

        {/* ========================================================= */}
        {/* 6. PARTNER GUIDELINES & POLICIES                          */}
        {/* ========================================================= */}
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '8px 14px',
            border: '1px solid #E2E8F0',
            marginBottom: 20,
          }}
        >
          <div style={{ padding: '8px 4px 6px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
            Partner Guidelines &amp; Policies
          </div>

          <a
            href="/worker-terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 4px',
              borderBottom: '1px solid #F1F5F9',
              textDecoration: 'none',
              color: '#092B55',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Worker Terms, Penalties &amp; Agreement</span>
            <span style={{ color: '#94A3B8' }}>&rsaquo;</span>
          </a>

          <a
            href="/acceptable-use"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 4px',
              borderBottom: '1px solid #F1F5F9',
              textDecoration: 'none',
              color: '#092B55',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Acceptable Use Policy</span>
            <span style={{ color: '#94A3B8' }}>&rsaquo;</span>
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 4px',
              textDecoration: 'none',
              color: '#092B55',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>Privacy Policy</span>
            <span style={{ color: '#94A3B8' }}>&rsaquo;</span>
          </a>
        </div>

        {/* ========================================================= */}
        {/* 7. DIGNIFIED SIGN OUT BUTTON                              */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: '12px',
            background: '#FFFFFF',
            border: '1.5px solid #FCA5A5',
            borderRadius: 12,
            color: '#DC2626',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <img src="/images/icons/close.png" alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL: VIEW ENCRYPTED KYC APPLICATION DETAILS              */}
      {/* ========================================================= */}
      {showKycModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowKycModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/images/icons/kyc.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#092B55', margin: 0 }}>Verified Credentials</h3>
              </div>
              <button
                onClick={() => setShowKycModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px', border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Aadhaar Number</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  {worker?.aadhaarNumber ? `XXXX XXXX ${worker.aadhaarNumber.slice(-4)}` : 'XXXX XXXX 9999'}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>PAN Card Number</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  {worker?.panNumber || 'ABCDE1234F'}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Operating City</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Chennai Hub, Tamil Nadu</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Verification Status</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#166534' }}>
                  Government Identity Verified
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowKycModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1B5AA6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE BANK & PAYOUT ACCOUNT                       */}
      {/* ========================================================= */}
      {showBankModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowBankModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/images/icons/earnings.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#092B55', margin: 0 }}>Payout Account Details</h3>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Payout UPI ID (Instant Transfer)
                </label>
                <input
                  type="text"
                  value={editPayoutUpi}
                  onChange={(e) => setEditPayoutUpi(e.target.value)}
                  placeholder="name@okaxis or name@paytm"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Bank Account Number
                </label>
                <input
                  type="password"
                  value={editBankAccountNumber}
                  onChange={(e) => setEditBankAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Confirm Bank Account Number
                </label>
                <input
                  type="text"
                  value={editBankConfirmAccountNumber}
                  onChange={(e) => setEditBankConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter account number"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  value={editBankIfscCode}
                  onChange={(e) => setEditBankIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000124"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#475569',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankUpdating}
                  style={{
                    background: '#1B5AA6',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#FFFFFF',
                  }}
                >
                  {bankUpdating ? 'Saving...' : 'Save Payout Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
