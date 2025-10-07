import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, Star, ShoppingCart, Grid, List, X, SlidersHorizontal, Search, ArrowUpDown } from 'lucide-react';
import { products, categories, vendors } from '../data/mockData';
import { useCart } from '../context/CartContext';

const ProductListing = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const [mobileSearch, setMobileSearch] = useState(searchQuery || '');
  
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [sortBy, setSortBy] = useState('name');
  const initialCategory = category ? category.replace(/-/g, ' ') : 'all';
  const [filterBy, setFilterBy] = useState({
    category: initialCategory,
    priceRange: 'all',
    rating: 'all',
    inStock: false
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const { addToCart } = useCart();
  useEffect(() => {
  if (!category) {
    setFilterBy((prev) => ({ ...prev, category: 'all' }));
  }
}, [category]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (category) {
      const categoryName = category.replace(/-/g, ' ');
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === categoryName.toLowerCase()
      );
    }

    // Filter by search query (name, description, category, vendor)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const vendor = vendors.find(v => v.id === product.vendorId);
        const vendorName = vendor ? vendor.name.toLowerCase() : '';
        return (
          product.name.toLowerCase().includes(q) ||
          (product.description && product.description.toLowerCase().includes(q)) ||
          (product.category && product.category.toLowerCase().includes(q)) ||
          vendorName.includes(q)
        );
      });
    }

    // Apply filters
    // Apply filters
if (filterBy.category !== 'all') {
  const filterSlug = filterBy.category.toLowerCase().replace(/\s+/g, '-');
  filtered = filtered.filter(
    (product) =>
      product.category.toLowerCase().replace(/\s+/g, '-') === filterSlug
  );
}


    if (filterBy.priceRange !== 'all') {
      const [min, max] = filterBy.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        }
        return product.price >= min;
      });
    }

    if (filterBy.rating !== 'all') {
      const minRating = Number(filterBy.rating);
      filtered = filtered.filter(product => product.rating >= minRating);
    }

    if (filterBy.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [category, searchQuery, filterBy, sortBy]);

  useEffect(() => {
    // Keep mobile search input in sync with URL param
    setMobileSearch(searchQuery || '');
  }, [searchQuery]);

  const handleAddToCart = (event, product) => {
    event.preventDefault();
    addToCart(product);
    
    // Show success feedback
    const button = event.currentTarget;
    const originalContent = button.innerHTML;
    
    button.innerHTML = '<span>✓ Added!</span>';
    button.classList.add('success');
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove('success');
      button.disabled = false;
    }, 1500);
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (mobileSearch && mobileSearch.trim().length > 0) {
      next.set('search', mobileSearch.trim());
    } else {
      next.delete('search');
    }
    setSearchParams(next);
  };

  return (
    <div className="product-listing">
      <div className="container">
        {/* Enhanced Header */}
        <div className="listing-header">
          <div className="header-info">
            <div className="breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span>Products</span>
              {category && (
                <>
                  <span>/</span>
                  <span>{category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </>
              )}
            </div>
            <h1 className="page-title">
              {category ? category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
               searchQuery ? `Search Results` : 'All Products'}
            </h1>
            {searchQuery && (
              <div className="search-info">
                <span className="search-term">for "{searchQuery}"</span>
              </div>
            )}
            <div className="results-info">
              <span className="results-count">{filteredProducts.length} products found</span>
              {filteredProducts.length > 0 && (
                <span className="results-range">Showing all results</span>
              )}
            </div>
          </div>
          
          <div className="header-controls">
            <form className="mobile-search" onSubmit={handleMobileSearchSubmit}>
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="mobile-search-btn">
                  <Search size={16} />
                </button>
              </div>
            </form>
            
            <div className="control-group">
              <div className="view-controls">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid size={18} />
                </button>
               
              </div>
              
              <div className="sort-container">
                <ArrowUpDown size={16} className="sort-icon" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              
              <button 
                className={`filter-toggle ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {Object.values(filterBy).some(v => v !== 'all' && v !== false) && (
                  <span className="filter-count">
                    {Object.values(filterBy).filter(v => v !== 'all' && v !== false).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="listing-content">
          {/* Enhanced Filters Sidebar */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button 
                className="close-filters"
                onClick={() => setShowFilters(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Active Filters */}
            {Object.values(filterBy).some(v => v !== 'all' && v !== false) && (
              <div className="active-filters">
                <h4>Active Filters</h4>
                <div className="filter-tags">
                  {filterBy.category !== 'all' && (
                    <span className="filter-tag">
                      {filterBy.category}
                      <button onClick={() => setFilterBy({...filterBy, category: 'all'})}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filterBy.priceRange !== 'all' && (
                    <span className="filter-tag">
                      ${filterBy.priceRange.replace('-', ' - $')}
                      <button onClick={() => setFilterBy({...filterBy, priceRange: 'all'})}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filterBy.rating !== 'all' && (
                    <span className="filter-tag">
                      {filterBy.rating}+ Stars
                      <button onClick={() => setFilterBy({...filterBy, rating: 'all'})}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {filterBy.inStock && (
                    <span className="filter-tag">
                      In Stock
                      <button onClick={() => setFilterBy({...filterBy, inStock: false})}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
                <button 
                  className="clear-all-filters"
                  onClick={() => setFilterBy({ category: 'all', priceRange: 'all', rating: 'all', inStock: false })}
                >
                  Clear All
                </button>
              </div>
            )}

            <div className="filter-section">
              <h4>Category</h4>
              <div className="filter-options">
                {['all', ...categories.map(cat => cat.name)].map(catName => (
                  <label key={catName} className="radio-label">
                    <input 
                      type="radio"
                      name="category"
                      value={catName}
                      checked={filterBy.category === catName}
                      onChange={(e) => setFilterBy({...filterBy, category: e.target.value})}
                    />
                    <span className="radio-custom"></span>
                    <span>{catName === 'all' ? 'All Categories' : catName}</span>
                    {catName !== 'all' && (
                      <span className="count">
                        ({products.filter(p => p.category === catName).length})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Price Range</h4>
              <div className="filter-options">
                {[
                  { value: 'all', label: 'All Prices' },
                  { value: '0-25', label: '$0 - $25' },
                  { value: '25-50', label: '$25 - $50' },
                  { value: '50-100', label: '$50 - $100' },
                  { value: '100-500', label: '$100 - $500' },
                  { value: '500', label: '$500+' }
                ].map(option => (
                  <label key={option.value} className="radio-label">
                    <input 
                      type="radio"
                      name="priceRange"
                      value={option.value}
                      checked={filterBy.priceRange === option.value}
                      onChange={(e) => setFilterBy({...filterBy, priceRange: e.target.value})}
                    />
                    <span className="radio-custom"></span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Rating</h4>
              <div className="filter-options">
                {[
                  { value: 'all', label: 'All Ratings' },
                  { value: '4', label: '4+ Stars' },
                  { value: '3', label: '3+ Stars' },
                  { value: '2', label: '2+ Stars' }
                ].map(option => (
                  <label key={option.value} className="radio-label">
                    <input 
                      type="radio"
                      name="rating"
                      value={option.value}
                      checked={filterBy.rating === option.value}
                      onChange={(e) => setFilterBy({...filterBy, rating: e.target.value})}
                    />
                    <span className="radio-custom"></span>
                    <span>{option.label}</span>
                    {option.value !== 'all' && (
                      <div className="stars-preview">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`star-icon ${i < parseInt(option.value) ? 'filled' : ''}`} 
                            size={12} 
                          />
                        ))}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Availability</h4>
              <label className="checkbox-label enhanced">
                <input 
                  type="checkbox"
                  checked={filterBy.inStock}
                  onChange={(e) => setFilterBy({...filterBy, inStock: e.target.checked})}
                />
                <span className="checkbox-custom"></span>
                <span>In Stock Only</span>
                <span className="count">({products.filter(p => p.inStock).length})</span>
              </label>
            </div>
          </aside>

          {/* Enhanced Products Grid */}
          <div className="products-container">
            {filteredProducts.length > 0 && (
              <div className="products-header">
                <div className="sort-info">
                  <span>Sorted by: </span>
                  <strong>
                    {sortBy === 'name' && 'Name A-Z'}
                    {sortBy === 'price-low' && 'Price: Low to High'}
                    {sortBy === 'price-high' && 'Price: High to Low'}
                    {sortBy === 'rating' && 'Highest Rated'}
                  </strong>
                </div>
              </div>
            )}
            
            <div className={`products-grid ${viewMode} animate-fade-in`}>
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className={`product-card ${viewMode === 'list' ? 'list-card' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link to={`/product/${product.id}`} className="product-link">
                    <div className="product-image">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.discount && (
                        <div className="discount-badge pulse">
                          <span className="discount-percent">-{product.discount}%</span>
                          <span className="discount-text">OFF</span>
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="out-of-stock-overlay">
                          <span>Out of Stock</span>
                        </div>
                      )}
                      <div className="product-overlay">
                        <button className="quick-view-btn">Quick View</button>
                        <button className="wishlist-btn">♡</button>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="product-info">
                    <div className="product-header">
                      <Link to={`/vendor/${product.vendorId}`} className="vendor-link">
                        <span className="vendor-name">{getVendorName(product.vendorId)}</span>
                      </Link>
                      <div className="product-category">{product.category}</div>
                    </div>
                    
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
                      <span className="reviews">({product.reviews} reviews)</span>
                    </div>
                    
                    <div className="product-price">
                      <div className="price-main">
                        <span className="current-price">${product.price}</span>
                        {product.originalPrice && (
                          <span className="original-price">${product.originalPrice}</span>
                        )}
                      </div>
                      <span className="unit">{product.unit}</span>
                      {product.discount && (
                        <span className="savings">Save ${(product.originalPrice - product.price).toFixed(2)}</span>
                      )}
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        className={`add-to-cart-btn ${!product.inStock ? 'disabled' : ''}`}
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={!product.inStock}
                      >
                        <ShoppingCart size={16} />
                        <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                      </button>
                      {viewMode === 'list' && (
                        <Link to={`/product/${product.id}`} className="view-details-btn">
                          View Details
                        </Link>
                      )}
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="product-description">
                        <p>{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">
                  <ShoppingCart size={64} />
                </div>
                <h3>No products found</h3>
                <p>We couldn't find any products matching your criteria</p>
                <div className="no-results-suggestions">
                  <p>Try:</p>
                  <ul>
                    <li>Removing some filters</li>
                    <li>Checking your spelling</li>
                    <li>Using more general terms</li>
                  </ul>
                </div>
                <Link to="/products" className="browse-all-btn">
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
