'use client';

import React, { useState, useEffect } from 'react';
import { CartItem } from '@/types';

interface EditBasketItemModalProps {
  item: CartItem | null;
  onClose: () => void;
  onSave: (updated: CartItem) => void;
  handleFileUpload: (file: File) => Promise<string | null>;
}

export default function EditBasketItemModal({
  item,
  onClose,
  onSave,
  handleFileUpload,
}: EditBasketItemModalProps) {
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editImgs, setEditImgs] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (item) {
      setEditTitle(item.name || '');
      setEditNotes(item.notes || '');
      setEditMin(item.priceMin ? String(item.priceMin) : '');
      setEditMax(item.priceMax ? String(item.priceMax) : '');
      setEditQty(String(item.qty || 1));
      setEditImgs(item.images?.length ? item.images : item.image ? [item.image] : []);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const min = Number(editMin) || 0;
    const max = Number(editMax) || min;
    const qty = Math.max(1, Number(editQty) || 1);

    onSave({
      ...item,
      name: editTitle.trim(),
      notes: editNotes.trim(),
      priceMin: min,
      priceMax: max >= min ? max : min,
      qty,
      image: editImgs[0] || item.image || '',
      images: editImgs,
    });
  };

  return (
    <div className="edit-basket-overlay" onClick={onClose}>
      <div className="edit-basket-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span
              className={`basket-source-tag ${
                item.sourceType === 'online' ? 'tag-online' : item.sourceType === 'mind' ? 'tag-mind' : 'tag-catalog'
              }`}
              style={{ marginBottom: 6 }}
            >
              {item.sourceType === 'online' ? 'Online Store Item' : item.sourceType === 'mind' ? 'Customized Product' : 'Catalog Item'}
            </span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
              Edit Sourcing Item
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Item Name / Title *</span>
            <input
              type="text"
              className="inp"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
              onChange={(e) => setEditNotes(e.target.value)}
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
                onChange={(e) => {
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
                onChange={(e) => {
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
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setEditQty(val.replace(/^0+(?=\d)/, ''));
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B192E' }}>
                Reference Photos / Sketches (Up to 4)
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: editImgs.length >= 4 ? '#16A34A' : '#2563EB', background: editImgs.length >= 4 ? '#DCFCE7' : '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                {editImgs.length}/4 Photos
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
              Add photos to guide your concierge
            </div>

            <div className="multi-photo-grid">
              {editImgs.map((imgUrl, idx) => (
                <div key={idx} className="multi-photo-card">
                  <img src={imgUrl} alt={`Photo ${idx + 1}`} className="mpc-img" />
                  <span className="mpc-badge">{idx === 0 ? 'Main Photo' : `Pic #${idx + 1}`}</span>
                  <button
                    type="button"
                    className="mpc-remove-btn"
                    title="Remove photo"
                    onClick={() => setEditImgs(editImgs.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {editImgs.length < 4 && (
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
                        const remainingSlots = 4 - editImgs.length;
                        const toUpload = files.slice(0, remainingSlots);
                        let currentList = [...editImgs];
                        for (const f of toUpload) {
                          const uploadedUrl = await handleFileUpload(f);
                          if (uploadedUrl) {
                            currentList = [...currentList, uploadedUrl];
                          }
                        }
                        setEditImgs(currentList.slice(0, 4));
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

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
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
  );
}
