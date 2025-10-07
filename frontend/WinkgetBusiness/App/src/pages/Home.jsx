import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, TrendingUp, Zap, Shield, Truck } from 'lucide-react';
import { categories, vendors, featuredProducts } from '../data/mockData';
import { useCart } from '../context/CartContext';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const { addToCart } = useCart();

  const heroSlides = [
    {
      title: "Discover Local Businesses & Products",
      subtitle: "Shop from trusted local vendors for groceries, electronics, and daily essentials",
      cta: "Start Shopping",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Fresh Groceries Delivered Fast",
      subtitle: "Get farm-fresh produce and daily essentials delivered to your doorstep",
      cta: "Shop Groceries",
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Latest Electronics & Gadgets",
      subtitle: "Discover cutting-edge technology from trusted electronics vendors",
      cta: "Browse Electronics",
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[id^="animate-"]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = (event, product) => {
    event.preventDefault();
    addToCart(product);
    
    // Show success feedback
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    
    button.innerHTML = '✓ Added!';
    button.classList.add('success');
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove('success');
      button.disabled = false;
    }, 1500);
  };

  return (
    <div className="home">
      {/* Enhanced Hero Section */}
      <section className="hero">
        <div className="hero-slider">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'hero-slide-active' : ''}`}
              style={{ background: slide.background }}
            >
              <div className="container max-width">
                <div className="hero-content">
                  <div className="hero-text">
                    <h1 className="hero-title animate-fade-up">
                      {slide.title}
                    </h1>
                    <p className="hero-subtitle animate-fade-up-delay">
                      {slide.subtitle}
                    </p>
                    <div className="hero-actions animate-fade-up-delay-2">
                      <Link to="/products" className="cta-button primary">
                        {slide.cta}
                        <ArrowRight size={20} />
                      </Link>
                      <Link to="/products" className="cta-button secondary">
                        Browse Categories
                      </Link>
                    </div>
                  </div>
                  <div className="hero-stats">
                    <div className="stat-item">
                      <div className="stat-number">500+</div>
                      <div className="stat-label">Products</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">50+</div>
                      <div className="stat-label">Vendors</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">1000+</div>
                      <div className="stat-label">Happy Customers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="hero-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'indicator-active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>


      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Truck />
              </div>
              <h3>Fast Delivery</h3>
              <p>Quick delivery from local vendors to your doorstep</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Secure Shopping</h3>
              <p>Safe and secure transactions with trusted vendors</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>Easy Ordering</h3>
              <p>Simple and intuitive ordering process</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp />
              </div>
              <h3>Best Prices</h3>
              <p>Competitive prices from multiple vendors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" id="animate-categories">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Discover products from various categories</p>
          </div>
          <div className={`categories-grid ${isVisible['animate-categories'] ? 'animate-slide-up' : ''}`}>
            {categories.map((category, index) => (
              <Link 
                key={category.id} 
                to={`/products/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="category-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="category-icon-wrapper">
                  <div className="category-icon">{category.icon}</div>
                </div>
                <div className="category-content">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                  <div className="category-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section" id="animate-featured">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🔥 Hot Deals</h2>
              <p className="section-subtitle">Limited time offers you don't want to miss</p>
            </div>
            <Link to="/products" className="view-all-link">
              View All Deals <ArrowRight size={16} />
            </Link>
          </div>
          <div className={`products-grid featured-grid ${isVisible['animate-featured'] ? 'animate-slide-up' : ''}`}>
            {featuredProducts.slice(0, 4).map((product, index) => (
              <div 
                key={product.id} 
                className="product-card featured-product-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/product/${product.id}`}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {product.discount && (
                      <div className="discount-badge pulse">
                        <span className="discount-percent">-{product.discount}%</span>
                        <span className="discount-text">OFF</span>
                      </div>
                    )}
                    <div className="product-overlay">
                      <button className="quick-view-btn">Quick View</button>
                    </div>
                  </div>
                </Link>
                <div className="product-info">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="product-name">{product.name}</h3>
                  </Link>
                  <div className="product-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`star-icon ${i < Math.floor(product.rating) ? 'filled' : ''}`} 
                          size={14} 
                        />
                      ))}
                    </div>
                    <span className="rating-text">{product.rating}</span>
                    <span className="reviews">({product.reviews})</span>
                  </div>
                  <div className="product-price">
                    <span className="current-price">${product.price}</span>
                    {product.originalPrice && (
                      <span className="original-price">${product.originalPrice}</span>
                    )}
                    <span className="savings">Save ${(product.originalPrice - product.price).toFixed(2)}</span>
                  </div>
                  <button 
                    className="add-to-cart-btn-home"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Vendors */}
      <section className="vendors-section" id="animate-vendors">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">⭐ Top Rated Vendors</h2>
              <p className="section-subtitle">Trusted partners delivering quality products</p>
            </div>
            <Link to="/products" className="view-all-link">
              View All Vendors <ArrowRight size={16} />
            </Link>
          </div>
          <div className={`vendors-grid enhanced-vendors-grid ${isVisible['animate-vendors'] ? 'animate-slide-up' : ''}`}>
            {vendors.slice(0, 3).map((vendor, index) => (
              <div 
                key={vendor.id} 
                className="vendor-card enhanced-vendor-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/vendor/${vendor.id}`}>
                  <div className="vendor-image">
                    <img src={vendor.image} alt={vendor.name} loading="lazy" />
                    <div className={`status-badge ${vendor.isOpen ? 'open' : 'closed'}`}>
                      <div className="status-dot"></div>
                      {vendor.isOpen ? 'Open Now' : 'Closed'}
                    </div>
                    <div className="vendor-overlay">
                      <div className="vendor-stats">
                        <div className="stat">
                          <Star className="star-icon filled" size={16} />
                          <span>{vendor.rating}</span>
                        </div>
                        <div className="stat">
                          <Clock size={16} />
                          <span>{vendor.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="vendor-info">
                    <h3 className="vendor-name">{vendor.name}</h3>
                    <div className="vendor-category">{vendor.category}</div>
                    <div className="vendor-details">
                      <div className="detail">
                        <MapPin size={14} />
                        <span>{vendor.address.split(',')[0]}</span>
                      </div>
                    </div>
                    <p className="vendor-description">{vendor.description}</p>
                    <div className="vendor-actions">
                      <button className="vendor-btn primary">View Store</button>
                      <button className="vendor-btn secondary">Contact</button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h2>Stay Updated with Latest Deals</h2>
              <p>Subscribe to our newsletter and never miss out on amazing offers from local vendors</p>
            </div>
            <form className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
