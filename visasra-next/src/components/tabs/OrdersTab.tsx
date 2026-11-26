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

  const isCompletedOrder = (o: Order) =>
    o.status === 'delivered' || o.status === 'shipped' || o.status === 'cancelled' || o.trackingStage === 'out_for_delivery';

  const isInProgressOrder = (o: Order) =>
    !isCompletedOrder(o) && (
      o.trackingStage === 'shopping' ||
      o.trackingStage === 'worker_assigned' ||
      o.trackingStage === 'purchased' ||
      o.trackingStage === 'packed' ||
      o.status === 'shopping' ||
      !!o.liveSession?.worker
    );

  const isUpcomingOrder = (o: Order) =>
    !isCompletedOrder(o) && !isInProgressOrder(o);

  const upcomingOrders = validOrders.filter(isUpcomingOrder);
  const inProgressOrders = validOrders.filter(isInProgressOrder);
  const completedOrders = validOrders.filter(isCompletedOrder);

  const currentList = activeFilter === 'completed'
    ? completedOrders
    : activeFilter === 'in_progress'
    ? inProgressOrders
    : upcomingOrders;

  // Active in-progress order for the featured card (only shown when viewing in-progress)
  const activeOrder = activeFilter === 'in_progress' && inProgressOrders.length > 0
    ? inProgressOrders[0]
    : null;

  const otherOrders = activeFilter === 'in_progress'
    ? inProgressOrders.slice(1)
    : currentList;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && (
              <button
                type="button"
                className="back-row"
                onClick={onBack}
                aria-label="Back"
                style={{ margin: 0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </button>
            )}
            <h1 className="orders-title" style={{ margin: 0 }}>Orders</h1>
          </div>
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
            Upcoming ({upcomingOrders.length})
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${activeFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setActiveFilter('in_progress')}
          >
            In progress ({inProgressOrders.length})
          </button>
          <button
            type="button"
            className={`orders-filter-pill ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            Completed ({completedOrders.length})
          </button>
        </div>

        {currentList.length === 0 ? (
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
            {/* Featured Active Order Card (Matching Official Mockup 4) */}
            {activeOrder && (() => {
              const stageIdx = getStageIndex(activeOrder);
              const isShoppingNow = stageIdx >= 3 || activeOrder.status === 'shopping' || activeOrder.trackingStage === 'shopping';
              const progressPct = stageIdx === 4 ? 100 : stageIdx === 3 ? 66 : stageIdx === 2 ? 33 : 0;
              const titleItem = (activeOrder.items || [])[0]?.name || 'Sourcing Order';
              const itemCount = activeOrder.items?.length || 1;
              const displayTitle = itemCount > 1 ? `${titleItem} and ${itemCount - 1} more item${itemCount > 2 ? 's' : ''}` : titleItem;
              const timingText = activeOrder.slotLabel || activeOrder.slotDate || 'Scheduled Slot';
              const totalText = `₹${Number(activeOrder.totalAmount || 0).toLocaleString('en-IN')}`;

              return (
                <div style={{ marginBottom: 20 }}>
                  {/* Order Snippet Card */}
                  <div className="order-card-active" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="order-card-icon" style={{ width: 48, height: 48, background: '#EDF5FD', borderRadius: 12 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="order-badge-pill" style={{ margin: 0, background: '#EFF6FF', color: '#1D4ED8' }}>
                            {isShoppingNow ? 'Shopping now' : stageIdx === 2 ? 'Shopper assigned' : 'Slot confirmed'}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748B' }}>
                            {activeOrder.orderNumber || 'VIS-33025'}
                          </span>
                        </div>
                        <div style={{ fontSize: 15.5, fontWeight: 700, color: '#071D3A', lineHeight: 1.3, marginBottom: 2 }}>
                          {displayTitle}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {timingText} · {totalText}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="order-card-view-btn"
                        onClick={() => onTrackOrder(activeOrder.slotKey)}
                        style={{ border: '1.2px solid #CBD5E1', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
                      >
                        Track
                      </button>
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
                  </div>

                  {/* High Visibility Royal Blue Active Shopper Callout Banner (Mockup 4) */}
                  {isShoppingNow && (
                    <div className="order-hero-shopper-banner">
                      <div className="order-hero-banner-title">
                        Your shopper is in the store now
                      </div>
                      <div className="order-hero-banner-body">
                        Join the live video to see each item as it is picked. Nothing is bought without your approval.
                      </div>
                      <button
                        type="button"
                        className="order-hero-banner-cta"
                        onClick={() => onJoinLiveShopping(activeOrder.slotKey)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span>Join live shopping</span>
                      </button>
                    </div>
                  )}

                  {/* What happens next section */}
                  <div className="order-next-steps-card">
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#071D3A', marginBottom: 12 }}>
                      What happens next
                    </div>
                    <div className="order-next-step-row">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>Shopper photos &amp; options</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Your shopper shares photos and prices directly from store counters.</div>
                      </div>
                    </div>

                    <div className="order-next-step-row">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', color: '#15803D', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>You approve each piece</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Nothing is purchased until you review and click approve.</div>
                      </div>
                    </div>

                    <div className="order-next-step-row">
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', color: '#B45309', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#071D3A' }}>Packed &amp; shipped overseas</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Consolidated at central hub, quality checked, and shipped with tracking.</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Other Orders List (Clean Minimal Cards matching Mockup) */}
            {otherOrders.map((o) => {
              const primaryItem = (o.items || [])[0]?.name || 'Sourcing order';
              const timing = o.slotLabel || o.slotDate || 'Oct 16, 11 AM to 2 PM IST';
              const total = `₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}`;
              const isComp = isCompletedOrder(o);
              const isInProg = isInProgressOrder(o);
              const statusLine = isComp
                ? (o.status === 'delivered' ? 'Delivered' : 'Dispatched with Tracking')
                : isInProg
                ? (o.status === 'shopping' || o.trackingStage === 'shopping' ? 'Shopping in store now' : 'Shopper assigned')
                : `Slot confirmed · ${timing}`;

              return (
                <div key={o.id} className="order-card-standard">
                  <div className="order-card-icon" style={{ background: isComp ? '#DCFCE7' : isInProg ? '#EFF6FF' : '#F1F5F9' }}>
                    {isComp ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isInProg ? '#0B4F9C' : '#64748B'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="7" />
                        <path d="M12 9v6" />
                        <path d="M9 12h6" />
                      </svg>
                    )}
                  </div>
                  <div className="order-card-info">
                    <div className="order-card-status-line" style={{ color: isComp ? '#15803D' : isInProg ? '#0B4F9C' : '#475569', fontWeight: 700 }}>
                      {statusLine}
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
