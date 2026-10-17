'use client';

import React, { useState } from 'react';
import { WorkerProfile, LiveSession } from '@/types/worker';

interface WorkerEarnTabProps {
  worker: WorkerProfile | null;
  sessions: LiveSession[];
  onExecAction: (data: any) => Promise<any> | any;
  showToast: (msg: string) => void;
  phaseOf: (s: LiveSession) => string;
}

export const WorkerEarnTab: React.FC<WorkerEarnTabProps> = ({
  worker,
  sessions,
  onExecAction,
  showToast,
  phaseOf,
}) => {
  const [earnTab, setEarnTab] = useState<'hist' | 'pay' | 'emerg'>('hist');

  return (
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
                onExecAction({ action: 'request_payout', payoutAmount: worker?.walletBalance || 0 });
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
                onExecAction({ action: 'request_payout', payoutAmount: cap });
                showToast(`Emergency payout of ₹${cap} requested`);
              }}
            >
              Withdraw 30% now · ₹{Math.floor((worker?.walletBalance || 0) * 0.3)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
