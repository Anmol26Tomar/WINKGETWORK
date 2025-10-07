import React from 'react';

const OffersAlertList = ({ items = [] }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="offers-alerts" aria-label="Offers and Coupons">
      <div className="container">
        <div className="section-header-center">
          <h2 className="section-title">Latest Alerts & Offers</h2>
          <p className="section-subtitle">Coupons, discounts and brand notifications</p>
        </div>
        <div className="offers-grid">
          {items.map((ofr) => (
            <div key={ofr.id} className="offer-card">
              <div className="offer-head">
                <span className="brand-badge">{ofr.brand}</span>
                {ofr.discount && <span className="discount-chip">-{ofr.discount}%</span>}
              </div>
              <div className="offer-body">
                <p className="offer-message">{ofr.message}</p>
              </div>
              <div className="offer-foot">
                {ofr.coupon && <span className="coupon-badge">{ofr.coupon}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OffersAlertList;




