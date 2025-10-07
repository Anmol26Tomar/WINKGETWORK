import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { vendors } from '../data/mockData';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discountPct }
  const [orderData, setOrderData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash'
  });

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  const handleQuantityChange = (productId, change) => {
    const item = items.find(item => item.id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    // In a real app, this would process the order
    const totalAfterPromo = grandTotal.toFixed(2);
    alert(`Order placed successfully! Total: $${totalAfterPromo}`);
    clearCart();
    setShowCheckout(false);
    setOrderData({ name: '', phone: '', address: '', paymentMethod: 'cash' });
    setPromoCode('');
    setAppliedPromo(null);
  };

  const subtotal = useMemo(() => getTotalPrice(), [items]);
  const deliveryFee = items.length > 0 ? 5 : 0;
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    return (subtotal * (appliedPromo.discountPct / 100));
  }, [appliedPromo, subtotal]);
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'WINK20') {
      setAppliedPromo({ code, discountPct: 20 });
    } else if (code === 'FRESH50') {
      // Free delivery
      setAppliedPromo({ code, discountPct: 0 });
    } else {
      alert('Invalid promo code');
      return;
    }
    setPromoCode('');
  };

  const groupedItems = items.reduce((groups, item) => {
    const vendorId = item.vendorId;
    if (!groups[vendorId]) {
      groups[vendorId] = [];
    }
    groups[vendorId].push(item);
    return groups;
  }, {});

  if (items.length === 0) {
    return (
      <div className="cart empty-cart" style={{marginLeft:"400px"}}>
        <div className="container">
          <div className="empty-state">
            <ShoppingBag size={64} className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Add some products to get started</p>
            <Link to="/products" className="shop-now-btn">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="container max-width">
        <div className="cart-steps">
          <div className="step active">Cart</div>
          <div className={`step ${showCheckout ? 'active' : ''}`}>Checkout</div>
          <div className="step">Done</div>
        </div>
        <div className="cart-header">
          <Link to="/products" className="back-link">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
          <h1>Shopping Cart</h1>
          <button className="clear-cart-btn" onClick={clearCart}>
            <Trash2 size={16} />
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {Object.entries(groupedItems).map(([vendorId, vendorItems]) => (
              <div key={vendorId} className="vendor-section">
                <div className="vendor-header">
                  <h3>From {getVendorName(parseInt(vendorId))}</h3>
                  <Link to={`/vendor/${vendorId}`} className="vendor-link">
                    View Store
                  </Link>
                </div>
                
                <div className="items-list">
                  {vendorItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <Link to={`/product/${item.id}`} className="item-image">
                        <img src={item.image} alt={item.name} />
                      </Link>
                      
                      <div className="item-details">
                        <Link to={`/product/${item.id}`} className="item-name">
                          {item.name}
                        </Link>
                        <div className="item-price">
                          ${item.price} {item.unit}
                        </div>
                      </div>
                      
                      <div className="quantity-controls">
                        <button 
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="quantity-btn"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="quantity-btn"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="item-total">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <div className="summary-title">
                <h3>Order Summary</h3>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>${grandTotal.toFixed(2)}</strong>
                </div>
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                {appliedPromo && appliedPromo.discountPct > 0 && (
                  <div className="summary-row">
                    <span>Promo ({appliedPromo.code})</span>
                    <span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <form className="promo-form" onSubmit={applyPromo}>
                <input 
                  type="text" 
                  placeholder="Promo code (e.g. WINK20)" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button type="submit" className="apply-promo-btn">Apply</button>
              </form>
              {appliedPromo && (
                <div className="applied-promo">
                  <span className="coupon-badge">{appliedPromo.code}</span>
                  {appliedPromo.discountPct > 0 ? (
                    <span className="discount-chip">-{appliedPromo.discountPct}%</span>
                  ) : (
                    <span className="brand-badge">Free Delivery</span>
                  )}
                  <button className="remove-promo" onClick={() => setAppliedPromo(null)}>Remove</button>
                </div>
              )}
              
              <button 
                className="checkout-btn"
                onClick={() => setShowCheckout(true)}
              >
                <CreditCard size={16} />
                Proceed to Checkout
              </button>
            </div>

            {/* Delivery Info */}
            <div className="delivery-info">
              <h4>Delivery Information</h4>
              <p>Estimated delivery time varies by vendor:</p>
              {Object.keys(groupedItems).map(vendorId => {
                const vendor = vendors.find(v => v.id === parseInt(vendorId));
                return vendor ? (
                  <div key={vendorId} className="vendor-delivery">
                    <span>{vendor.name}:</span>
                    <span>{vendor.deliveryTime}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="checkout-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Checkout</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowCheckout(false)}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCheckout} className="checkout-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={orderData.name}
                    onChange={(e) => setOrderData({...orderData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={orderData.phone}
                    onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <textarea
                    value={orderData.address}
                    onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={orderData.paymentMethod}
                    onChange={(e) => setOrderData({...orderData, paymentMethod: e.target.value})}
                  >
                    <option value="cash">Cash on Delivery</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI Payment</option>
                  </select>
                </div>
                
                <div className="order-summary-checkout">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery:</span>
                    <span>$5.00</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>${(getTotalPrice() + 5).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="place-order-btn">
                    Place Order
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowCheckout(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

