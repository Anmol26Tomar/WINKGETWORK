import React from 'react';

const OffersBar = ({ items = [] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="offer-banner">
      <div className="container max-width">
        <div className="offer-content" style={{ flexWrap: 'wrap' }}>
          {items.map((it, idx) => (
            <div key={idx} className="offer-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {it.brand && <span className="brand-badge">{it.brand}</span>}
              <span className="offer-text">{it.message}</span>
              {it.coupon && <span className="coupon-badge">{it.coupon}</span>}
              {it.discount && <span className="discount-chip">-{it.discount}%</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OffersBar;



