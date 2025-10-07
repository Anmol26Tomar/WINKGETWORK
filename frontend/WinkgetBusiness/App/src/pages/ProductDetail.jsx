import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Phone, MessageCircle, HelpCircle, MapPin, Clock, ArrowLeft, Plus, Minus } from 'lucide-react';
import { products, vendors } from '../data/mockData';
import { useCart } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find(p => p.id === parseInt(id));
  const vendor = product ? vendors.find(v => v.id === product.vendorId) : null;
  
  const [quantity, setQuantity] = useState(1);
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [queryData, setQueryData] = useState({
    subject: '',
    message: ''
  });
  
  const { addToCart } = useCart();

  if (!product || !vendor) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Product not found</h2>
          <Link to="/products" className="back-link">
            <ArrowLeft size={16} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setQuantity(1);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleCall = () => {
    window.open(`tel:${vendor.phone}`);
  };

  const handleMessage = () => {
    const message = `Hi, I'm interested in ${product.name}. Can you provide more information?`;
    window.open(`sms:${vendor.phone}?body=${encodeURIComponent(message)}`);
  };

  const handleQuerySubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the query to the backend
    alert('Your query has been sent to the vendor. They will respond soon!');
    setQueryData({ subject: '', message: '' });
    setShowQueryForm(false);
  };

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products/${product.category.toLowerCase().replace(/\s+/g, '-')}`}>
            {product.category}
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <Link to="/products" className="back-link">
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="product-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img src={product.image} alt={product.name} />
              {product.discount && (
                <div className="discount-badge">-{product.discount}%</div>
              )}
              {!product.inStock && (
                <div className="out-of-stock-overlay">Out of Stock</div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="vendor-info">
              <span>Sold by </span>
              <Link to={`/vendor/${vendor.id}`} className="vendor-link">
                {vendor.name}
              </Link>
            </div>

            <div className="product-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`star-icon ${i < Math.floor(product.rating) ? 'filled' : ''}`} 
                    size={16} 
                  />
                ))}
              </div>
              <span className="rating-text">{product.rating}</span>
              <span className="reviews">({product.reviews} reviews)</span>
            </div>

            <div className="price-section">
              <div className="price">
                <span className="current-price">${product.price}</span>
                {product.originalPrice && (
                  <span className="original-price">${product.originalPrice}</span>
                )}
                <span className="unit">{product.unit}</span>
              </div>
              {product.discount && (
                <div className="savings">
                  You save ${(product.originalPrice - product.price).toFixed(2)} ({product.discount}%)
                </div>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="stock-info">
              <span className={`stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? `In Stock (${product.quantity} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity and Add to Cart */}
            {product.inStock && (
              <div className="purchase-section">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity">{quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.quantity}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button className="add-to-cart-btn primary" onClick={handleAddToCart}>
                  <ShoppingCart size={20} />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </button>
              </div>
            )}

            {/* Contact Actions */}
            <div className="contact-actions">
              <h3>Contact Vendor</h3>
              <div className="action-buttons">
                <button className="contact-btn call" onClick={handleCall}>
                  <Phone size={16} />
                  Call Now
                </button>
                <button className="contact-btn message" onClick={handleMessage}>
                  <MessageCircle size={16} />
                  Send Message
                </button>
                <button 
                  className="contact-btn query" 
                  onClick={() => setShowQueryForm(!showQueryForm)}
                >
                  <HelpCircle size={16} />
                  Ask Question
                </button>
              </div>
            </div>

            {/* Query Form */}
            {showQueryForm && (
              <div className="query-form">
                <h4>Ask a Question</h4>
                <form onSubmit={handleQuerySubmit}>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={queryData.subject}
                    onChange={(e) => setQueryData({...queryData, subject: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder="Your question about this product..."
                    value={queryData.message}
                    onChange={(e) => setQueryData({...queryData, message: e.target.value})}
                    rows="4"
                    required
                  />
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">Send Question</button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowQueryForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Vendor Details */}
        <div className="vendor-details">
          <h3>About the Vendor</h3>
          <div className="vendor-card">
            <div className="vendor-image">
              <img src={vendor.image} alt={vendor.name} />
            </div>
            <div className="vendor-info">
              <h4>{vendor.name}</h4>
              <div className="vendor-rating">
                <Star className="star-icon filled" size={14} />
                <span>{vendor.rating}</span>
              </div>
              <div className="vendor-details-list">
                <div className="detail">
                  <MapPin size={14} />
                  <span>{vendor.address}</span>
                </div>
                <div className="detail">
                  <Clock size={14} />
                  <span>{vendor.openHours}</span>
                </div>
                <div className="detail">
                  <span>Delivery: {vendor.deliveryTime}</span>
                </div>
                <div className="detail">
                  <span>Min Order: ${vendor.minOrder}</span>
                </div>
              </div>
              <p>{vendor.description}</p>
              <Link to={`/vendor/${vendor.id}`} className="view-vendor-btn">
                View Vendor Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

