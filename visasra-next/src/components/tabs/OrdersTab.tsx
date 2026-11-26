import React, { useState } from 'react';
import { Order } from '@/types/customer';

interface OrdersTabProps {
  orders: Order[];
  onBack: () => void;
  onJoinLiveShopping: (slotKey: string) => void;
  onTrackOrder: (slotKey: string) => void;
  onRateShopper?: (order: Order) => void;
  onRefresh?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  onBack,
  onJoinLiveShopping,
  onTrackOrder,
  onRateShopper,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'in_progress' | 'completed'>('upcoming');

  const validOrders = orders.filter((o) => o && o.id);

  const filteredOrders = validOrders.filter((o) => {
    const isCompleted = o.status === 'delivered' || o.status === 'shipped';
    const isInProgress = o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping';

    if (activeFilter === 'completed') return isCompleted;
    if (activeFilter === 'in_progress') return isInProgress;
    return !isCompleted;
  });

  // Find the top active or in-flight order for the featured card
  const activeOrder = filteredOrders.find(
    (o) => o.trackingStage === 'shopping' || o.trackingStage === 'worker_assigned' || o.status === 'shopping'
  ) || (filteredOrders.length > 0 ? filteredOrders[0] : null);

  const otherOrders = activeOrder
    ? filteredOrders.filter((o) => o.id !== activeOrder.id)
    : filteredOrders;

  // Determine stage index for the 4-milestone stepper (Booked = 1, Assigned = 2, Shopping = 3, Shipped = 4)
  const getStageIndex = (order: Order) => {
    if (order.status === 'delivered' || order.status === 'shipped') return 4;
    if (order.trackingStage === 'shopping' || order.status === 'shopping') return 3;
    if (order.trackingStage === 'worker_assigned' || order.liveSession?.worker) return 2;
    return 1;
  };

  return (
    <section className="screen active screen-orders-root" data-screen="orders" style={{ padding: 0 }}>
      <div className="orders-modern-wrap">
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h1 className="orders-title" style={{ margin: 0 }}>Orders</h1>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              style={{
                background: 'none',
                border: 'none',
                color: '#0B4F9C',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>↻</span> Refresh
            </button>
          )}
        </div>

        {/* 3 Segmented Filter Tabs (Upcoming | In progress | Completed) */}
        <div className="orders-filter-bar">
          <button
            type="button"
            className={`orders-filter-pill ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${activeFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setActiveFilter('in_progress')}
          >
            In progress
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            Completed
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '36px 20px', textAlign: 'center', border: '1px solid #E2E8F0', marginTop: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#071D3A', marginBottom: 4 }}>
              {activeFilter === 'completed' ? 'No Completed Orders Yet' : activeFilter === 'in_progress' ? 'No Orders In Progress' : 'No Upcoming Orders'}
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#64748B' }}>
              Reserve a shopping slot to have your dedicated shopper visit physical stores in India.
            </p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                style={{ background: '#0B4F9C', color: '#FFFFFF', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Active Order Card (Matching Official Mockup) */}
            {activeOrder && (() => {
              const stageIdx = getStageIndex(activeOrder);
              const progressPct = stageIdx === 4 ? 100 : stageIdx === 3 ? 66 : stageIdx === 2 ? 33 : 0;
              const titleItem = (activeOrder.items || [])[0]?.name || 'Sourcing Order';
              const timingText = activeOrder.slotLabel || activeOrder.slotDate || 'Scheduled Slot';
              const totalText = `₹${Number(activeOrder.totalAmount || 0).toLocaleString('en-IN')}`;

              return (
                <div className="order-card-active">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div className="order-card-icon" style={{ width: 48, height: 48, background: '#EDF5FD', borderRadius: 12 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="order-badge-pill">
                        {stageIdx >= 3 ? 'Shopper is in store' : stageIdx === 2 ? 'Shopper assigned' : 'Slot confirmed'}
                      </div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: '#071D3A', lineHeight: 1.3, marginBottom: 2 }}>
                        {titleItem}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {timingText} · {totalText}
                      </div>
                    </div>
                  </div>

                  {/* 4-Milestone Progress Stepper */}
                  <div className="order-stepper-track">
                    <div className="order-stepper-line">
                      <div className="order-stepper-progress" style={{ width: `${progressPct}%` }} />
                    </div>

                    <div className="order-stepper-node">
                      <div className={`order-node-dot ${stageIdx >= 1 ? 'done' : ''}`} />
                      <span className={`order-node-label ${stageIdx === 1 ? 'active' : ''}`}>Booked</span>
                    </div>

                    <div className="order-stepper-node">
                      <div className={`order-node-dot ${stageIdx >= 2 ? 'done' : ''}`} />
                      <span className={`order-node-label ${stageIdx === 2 ? 'active' : ''}`}>Assigned</span>
                    </div>

                    <div className="order-stepper-node">
                      <div className={`order-node-dot ${stageIdx >= 3 ? (stageIdx === 3 ? 'current' : 'done') : ''}`} />
                      <span className={`order-node-label ${stageIdx === 3 ? 'active' : ''}`}>Shopping</span>
                    </div>

                    <div className="order-stepper-node">
                      <div className={`order-node-dot ${stageIdx >= 4 ? 'done' : ''}`} />
                      <span className={`order-node-label ${stageIdx === 4 ? 'active' : ''}`}>Shipped</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="order-actions-row">
                    {activeOrder.orderType !== 'online' && (
                      <button
                        type="button"
                        className="order-btn-solid"
                        onClick={() => onJoinLiveShopping(activeOrder.slotKey)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                          <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                        </svg>
                        <span>Join live shopping</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="order-btn-outline"
                      onClick={() => onTrackOrder(activeOrder.slotKey)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="6" cy="18" r="2.5" />
                        <circle cx="18" cy="6" r="2.5" />
                        <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                      </svg>
                      <span>Track order</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Other Orders List (Clean Minimal Cards matching Mockup) */}
            {otherOrders.map((o) => {
              const primaryItem = (o.items || [])[0]?.name || 'Sourcing order';
              const timing = o.slotLabel || o.slotDate || 'Oct 16, 11 AM to 2 PM IST';
              const total = `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`;

              return (
                <div key={o.id} className="order-card-standard">
                  <div className="order-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="7" />
                      <path d="M12 9v6" />
                      <path d="M9 12h6" />
                    </svg>
                  </div>
                  <div className="order-card-info">
                    <div className="order-card-status-line">
                      Slot confirmed · {timing}
                    </div>
                    <div className="order-card-name">
                      {primaryItem}
                    </div>
                    <div className="order-card-meta">
                      {o.orderNumber || 'VIS-ORDER'} · {total}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="order-card-view-btn"
                    onClick={() => onTrackOrder(o.slotKey)}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
};
