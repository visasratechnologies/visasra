'use client';

import React from 'react';
import { Order } from '@/types/customer';

interface RateShopperModalProps {
  order: Order | null;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  submittingReview: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const RateShopperModal: React.FC<RateShopperModalProps> = ({
  order,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  submittingReview,
  onClose,
  onSubmit,
}) => {
  if (!order) return null;

  return (
    <div className="modal-backdrop show" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{ maxWidth: 440, padding: 24, textAlign: 'center', borderRadius: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#071D3A', marginBottom: 4 }}>
          Rate Your Personal Shopper
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          {order.liveSession?.worker?.name || 'Personal Shopper'} · Order #{order.orderNumber}
        </div>

        {/* 5-Star Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 32,
                cursor: 'pointer',
                color: star <= reviewRating ? '#F59E0B' : '#CBD5E1',
                transform: star <= reviewRating ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              onClick={() => setReviewRating(star)}
              aria-label={`${star} star`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="inp"
          rows={3}
          placeholder="Write a brief review about your shopping experience (optional)..."
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          style={{ width: '100%', marginBottom: 18, resize: 'none' }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submittingReview}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={submittingReview}
            style={{ minWidth: 120 }}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
