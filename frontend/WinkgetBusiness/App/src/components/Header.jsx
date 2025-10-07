import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, Home, Package, Store, Bell, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AlertsModal from './AlertsModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout, signup, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleAuthOpen = () => {
    setAuthMode(isLoggedIn ? 'profile' : 'login');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        signup(authForm);
      } else if (authMode === 'login') {
        login({ email: authForm.email, password: authForm.password });
      }
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    setShowAuthModal(false);
  };

  const isActiveLink = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
              <div className="logo-container">
                <Store className="logo-icon" />
                <div className="logo-text">
                  <span className="logo-main">WinkGet</span>
                  <span className="logo-sub">Marketplace</span>
                </div>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <form className="search-form desktop-search" onSubmit={handleSearch}>
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products, vendors, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  <Search size={16} />
                  <span className="search-text">Search</span>
                </button>
              </div>
            </form>

            {/* Offer Banner placeholder on desktop spacing is handled below header */}

            {/* Desktop Navigation */}
            <nav className="nav desktop-nav">
              <Link 
                to="/" 
                className={`nav-link ${isActiveLink('/') ? 'nav-link-active' : ''}`}
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link 
                to="/products" 
                className={`nav-link ${isActiveLink('/products') ? 'nav-link-active' : ''}`}
              >
                <Package size={20} />
                <span>Products</span>
              </Link>
              <Link 
                to="/cart" 
                className={`nav-link cart-link ${isActiveLink('/cart') ? 'nav-link-active' : ''}`}
              >
                <div className="cart-icon-container">
                  <ShoppingCart size={20} />
                  {getTotalItems() > 0 && (
                    <span className="cart-badge animate-bounce">{getTotalItems()}</span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
              <button className="nav-link notification-btn" onClick={() => setShowAlerts(true)}>
                <Bell size={20} />
                <span>Alerts</span>
              </button>
              {!isLoggedIn ? (
                <button className="nav-link profile-btn" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>
                  <User size={20} />
                  <span>Login / Sign Up</span>
                </button>
              ) : (
                <Link to="/profile" className="nav-link profile-btn">
                  <User size={20} />
                  <span>{user?.name || 'Profile'}</span>
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button className="menu-button" onClick={toggleMenu}>
              <div className={`menu-icon ${isMenuOpen ? 'menu-icon-open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-overlay ${isMenuOpen ? 'mobile-overlay-open' : ''}`} onClick={toggleMenu}></div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${isMenuOpen ? 'mobile-nav-open' : ''}`}>
          <div className="mobile-nav-header">
            <div className="mobile-user-info">
              <div className="user-avatar">
                <User size={24} />
              </div>
              <div className="user-details">
                <span className="user-name">Welcome!</span>
                <span className="user-email">Sign in for better experience</span>
              </div>
            </div>
          </div>

            {/* Mobile Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="mobile-search-btn">
                <Search size={16} />
              </button>
            </div>
          </form>

          <div className="mobile-nav-links">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActiveLink('/') ? 'mobile-nav-link-active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={24} />
              <span>Home</span>
            </Link>
            <Link 
              to="/products" 
              className={`mobile-nav-link ${isActiveLink('/products') ? 'mobile-nav-link-active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Package size={24} />
              <span>All Products</span>
            </Link>
            <Link 
              to="/cart" 
              className={`mobile-nav-link ${isActiveLink('/cart') ? 'mobile-nav-link-active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="cart-icon-container">
                <ShoppingCart size={24} />
                {getTotalItems() > 0 && (
                  <span className="cart-badge">{getTotalItems()}</span>
                )}
              </div>
              <span>Shopping Cart</span>
            </Link>
            <button className="mobile-nav-link" onClick={() => { setIsMenuOpen(false); setShowAlerts(true); }}>
              <Bell size={24} />
              <span>Notifications</span>
            </button>
            {!isLoggedIn ? (
              <button className="mobile-nav-link" onClick={() => { setIsMenuOpen(false); setAuthMode('signup'); setShowAuthModal(true); }}>
                <User size={24} />
                <span>Login / Sign Up</span>
              </button>
            ) : (
              <Link to="/profile" className={`mobile-nav-link ${isActiveLink('/profile') ? 'mobile-nav-link-active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <User size={24} />
                <span>{user?.name || 'Profile'}</span>
              </Link>
            )}
          </div>

          <div className="mobile-nav-footer">
            <p>© 2024 WinkGet Marketplace</p>
          </div>
        </nav>
      </header>
      
      {/* Header Spacer */}
      <div className="header-spacer"></div>
      {/* Offer Banner (hidden on profile) */}
      {/* Offers moved to alert section on pages, not shown in header */}

      {/* Alerts Modal */}
      <AlertsModal open={showAlerts} onClose={() => setShowAlerts(false)} />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{authMode === 'signup' ? 'Sign Up' : authMode === 'login' ? 'Log In' : 'Profile'}</h3>
              <button className="close-btn" onClick={() => setShowAuthModal(false)}>
                <X size={18} />
              </button>
            </div>
            {authMode === 'profile' && isLoggedIn ? (
              <div className="modal-body">
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <div className="modal-actions">
                  <Link to="/profile" className="view-details-btn" onClick={() => setShowAuthModal(false)}>View Profile</Link>
                  <button className="add-to-cart-btn" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            ) : (
              <form className="modal-body" onSubmit={handleAuthSubmit}>
                {authMode === 'signup' && (
                  <input type="text" placeholder="Name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                )}
                <input type="email" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                <input type="password" placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                <div className="modal-actions">
                  <button type="submit" className="add-to-cart-btn">{authMode === 'signup' ? 'Create Account' : 'Log In'}</button>
                  <button type="button" className="view-details-btn" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>
                    {authMode === 'signup' ? 'Have an account? Log In' : 'New user? Sign Up'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
