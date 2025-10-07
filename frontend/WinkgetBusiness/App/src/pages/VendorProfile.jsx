import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Phone, MessageCircle, Mail, MapPin, Clock, ArrowLeft, ShoppingCart, HelpCircle } from 'lucide-react';
import { vendors, products } from '../data/mockData';
import { useCart } from '../context/CartContext';

const VendorProfile = () => {
  const { id } = useParams();
  const vendor = vendors.find(v => v.id === parseInt(id));
  const vendorProducts = products.filter(p => p.vendorId === parseInt(id));
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({
    subject: '',
    message: ''
  });
  
  const { addToCart } = useCart();

  if (!vendor) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Vendor not found</h2>
          <Link to="/products" className="back-link">
            <ArrowLeft size={16} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleCall = () => {
    window.open(`tel:${vendor.phone}`);
  };

  const handleMessage = () => {
    const message = `Hi ${vendor.name}, I'm interested in your products. Can you provide more information?`;
    window.open(`sms:${vendor.phone}?body=${encodeURIComponent(message)}`);
  };

  const handleEmail = () => {
    window.open(`mailto:${vendor.email}?subject=Inquiry about your products`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the message to the backend
    alert('Your message has been sent to the vendor. They will respond soon!');
    setContactData({ subject: '', message: '' });
    setShowContactForm(false);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="vendor-profile">
      <div className="container">
        <Link to="/products" className="back-link">
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        {/* Vendor Header */}
        <div className="vendor-header">
          <div className="vendor-image">
            <img src={vendor.image} alt={vendor.name} />
            <div className={`status-badge ${vendor.isOpen ? 'open' : 'closed'}`}>
              {vendor.isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>
          
          <div className="vendor-info">
            <h1 className="vendor-name">{vendor.name}</h1>
            <div className="vendor-category">{vendor.category}</div>
            
            <div className="vendor-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`star-icon ${i < Math.floor(vendor.rating) ? 'filled' : ''}`} 
                    size={16} 
                  />
                ))}
              </div>
              <span className="rating-text">{vendor.rating}</span>
            </div>

            <p className="vendor-description">{vendor.description}</p>

            <div className="vendor-details">
              <div className="detail">
                <MapPin size={16} />
                <span>{vendor.address}</span>
              </div>
              <div className="detail">
                <Clock size={16} />
                <span>{vendor.openHours}</span>
              </div>
              <div className="detail">
                <span>Delivery Time: {vendor.deliveryTime}</span>
              </div>
              <div className="detail">
                <span>Minimum Order: ${vendor.minOrder}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2>Contact {vendor.name}</h2>
          <div className="contact-methods">
            <button className="contact-btn call" onClick={handleCall}>
              <Phone size={16} />
              <div>
                <span>Call Now</span>
                <small>{vendor.phone}</small>
              </div>
            </button>
            
            <button className="contact-btn message" onClick={handleMessage}>
              <MessageCircle size={16} />
              <div>
                <span>Send SMS</span>
                <small>Quick message</small>
              </div>
            </button>
            
            <button className="contact-btn email" onClick={handleEmail}>
              <Mail size={16} />
              <div>
                <span>Send Email</span>
                <small>{vendor.email}</small>
              </div>
            </button>
            
            <button 
              className="contact-btn query" 
              onClick={() => setShowContactForm(!showContactForm)}
            >
              <HelpCircle size={16} />
              <div>
                <span>Ask Question</span>
                <small>General inquiry</small>
              </div>
            </button>
          </div>

          {/* Contact Form */}
          {showContactForm && (
            <div className="contact-form">
              <h3>Send a Message</h3>
              <form onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  placeholder="Subject"
                  value={contactData.subject}
                  onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Your message to the vendor..."
                  value={contactData.message}
                  onChange={(e) => setContactData({...contactData, message: e.target.value})}
                  rows="4"
                  required
                />
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Send Message</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowContactForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="vendor-products">
          <div className="section-header">
            <h2>Products from {vendor.name}</h2>
            <span className="product-count">{vendorProducts.length} products</span>
          </div>
          
          {vendorProducts.length > 0 ? (
            <div className="products-grid">
              {vendorProducts.map(product => (
                <div key={product.id} className="product-card">
                  <Link to={`/product/${product.id}`} className="product-link">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} />
                      {product.discount && (
                        <div className="discount-badge">-{product.discount}%</div>
                      )}
                      {!product.inStock && (
                        <div className="out-of-stock-overlay">Out of Stock</div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="product-info">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="product-name">{product.name}</h3>
                    </Link>
                    
                    <div className="product-rating">
                      <Star className="star-icon filled" size={14} />
                      <span>{product.rating}</span>
                      <span className="reviews">({product.reviews})</span>
                    </div>
                    
                    <div className="product-price">
                      <span className="current-price">${product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">${product.originalPrice}</span>
                      )}
                      <span className="unit">{product.unit}</span>
                    </div>
                    
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart size={16} />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">
              <h3>No products available</h3>
              <p>This vendor hasn't listed any products yet.</p>
            </div>
          )}
        </div>

        {/* Business Hours */}
        <div className="business-hours">
          <h2>Business Hours</h2>
          <div className="hours-info">
            <div className="current-status">
              <span className={`status ${vendor.isOpen ? 'open' : 'closed'}`}>
                {vendor.isOpen ? 'Currently Open' : 'Currently Closed'}
              </span>
              <span className="hours">{vendor.openHours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;

