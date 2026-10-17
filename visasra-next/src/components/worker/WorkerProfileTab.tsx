'use client';

import React, { useState } from 'react';
import { WorkerProfile } from '@/types/worker';

interface WorkerProfileTabProps {
  worker: WorkerProfile | null;
  onExecAction: (data: any) => Promise<any> | any;
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
      const res = await fetch('/api/worker/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
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
              {worker?.kycStatus === 'verified' ? '✓' : '⏱'}
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
              onExecAction({ action: 'toggle_online', isOnline: next });
              showToast(next ? 'You are now Online' : 'You are now Offline');
            }}
            aria-label="Toggle Online"
          />
        </div>

        {/* Sign out */}
        <button
          className="btn red"
          style={{ marginTop: 14 }}
          onClick={onSignOut}
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
  );
};
