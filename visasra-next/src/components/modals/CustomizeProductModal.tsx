'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';

interface CustomizeProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAdd: (customized: { qty: number; notes: string; images: string[] }) => Promise<void> | void;
  handleFileUpload: (file: File) => Promise<string | null>;
}

export default function CustomizeProductModal({
  product,
  onClose,
  onAdd,
  handleFileUpload,
}: CustomizeProductModalProps) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (product) {
      setQty(1);
      setNotes('');
      setImages([]);
      setActivePhotoIdx(0);
      setIsAdding(false);
    }
  }, [product]);

  if (!product) return null;

  const fallbackCatImg = '/images/placeholders/placeholder-item.svg';
  const baseImg = product.image || fallbackCatImg;
  const availablePhotos = product.images && product.images.length > 0 ? product.images : [baseImg];
  const activeDisplayPhoto = availablePhotos[activePhotoIdx] || baseImg;

  const handleConfirmAdd = async () => {
    setIsAdding(true);
    try {
      await onAdd({ qty, notes, images });
    } finally {
      setTimeout(() => {
        setIsAdding(false);
        onClose();
      }, 400);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', color: '#071D3A' }}>
              Add Reference &amp; Special Instructions
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              {product.categoryName || 'Catalog Item'} · Photo is optional
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 4-Photo Showcase Gallery */}
        <div className="product-modal-gallery">
          <div className="pmg-main-photo-wrap">
            <img
              src={activeDisplayPhoto}
              alt={product.name}
              className="pmg-main-img"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = fallbackCatImg;
              }}
            />
            <span className="pmg-photo-tag">
              {availablePhotos.length > 1 ? `Pic ${activePhotoIdx + 1} of ${availablePhotos.length}` : 'Official Product'}
            </span>
          </div>

          {availablePhotos.length > 1 && (
            <div className="pmg-thumbs-row">
              {availablePhotos.map((photoUrl, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  className={`pmg-thumb-btn ${activePhotoIdx === pIdx ? 'active' : ''}`}
                  onClick={() => setActivePhotoIdx(pIdx)}
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
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{product.name}</div>
              <div style={{ fontSize: 13, color: '#1261B5', fontWeight: 800, marginTop: 2 }}>
                Est. Budget: ₹{product.estMin.toLocaleString('en-IN')} – ₹{product.estMax.toLocaleString('en-IN')}
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
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              -
            </button>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{qty}</span>
            <button
              type="button"
              style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4, color: '#0B192E' }}>
            Reference Description &amp; Special Instructions
          </label>
          <textarea
            className="inp"
            rows={4}
            style={{ minHeight: 96, resize: 'vertical', lineHeight: 1.5, padding: '10px 12px' }}
            placeholder="e.g. Traditional peacock motif, size preferences, color, GRT Silks preferred, matte gold finish..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B192E' }}>
              Reference Photos / Sketches (Optional)
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: images.length >= 4 ? '#16A34A' : '#2563EB', background: images.length >= 4 ? '#DCFCE7' : '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
              {images.length}/4 Photos (Optional)
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
            Upload reference photos or sketches from your device if needed (photo is not mandatory).
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
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
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
                    setUploadingImage(true);
                    try {
                      const remainingSlots = 4 - images.length;
                      const toUpload = files.slice(0, remainingSlots);
                      let currentList = [...images];
                      for (const f of toUpload) {
                        const uploadedUrl = await handleFileUpload(f);
                        if (uploadedUrl) {
                          currentList = [...currentList, uploadedUrl];
                        }
                      }
                      setImages(currentList.slice(0, 4));
                    } finally {
                      setUploadingImage(false);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="mpc-add-icon">+</div>
                <div className="mpc-add-text">{uploadingImage ? 'Uploading...' : 'Add Photo'}</div>
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn-concierge-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '12px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-concierge-primary"
            onClick={handleConfirmAdd}
            disabled={isAdding}
            style={{
              flex: 2,
              padding: '12px',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              ...(isAdding ? { background: '#10B981', borderColor: '#059669', color: '#fff' } : {}),
            }}
          >
            {isAdding ? (
              <>✓ Added to Cart!</>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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
    </div>
  );
}
