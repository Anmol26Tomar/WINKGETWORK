import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { getVendorProfile, getVendorStats } from "../services/vendorService";
import { getVendorProducts } from "../services/productService";
import VendorProfileForm from "../components/VendorProfileForm";
import ProductForm from "../components/ProductForm";
import ProductCard from "../components/ProductCard";
import PendingApprovalModal from "../components/PendingApprovalModal";

export default function VendorDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [vendor, setVendor] = useState(null);
  const [vendorStats, setVendorStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData, productsData] = await Promise.all([
        getVendorProfile(),
        getVendorStats(),
        getVendorProducts(),
      ]);

      setVendor(profileData);
      setVendorStats(statsData);
      setProducts(productsData.products || []);

      // Check if vendor is approved
      if (profileData && !profileData.isApproved) {
        setShowPendingModal(true);
      }
    } catch (error) {
      console.error("Failed to load vendor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        const updated = await updateProduct(
          editingProduct._id || editingProduct.id,
          productData
        );
        setProducts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === (editingProduct._id || editingProduct.id)
              ? updated
              : p
          )
        );
      } else {
        // Create new product
        const created = await createProduct(productData);
        setProducts((prev) => [created, ...prev]);
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Delete ${product.title || product.name}?`)) return;
    try {
      await deleteProduct(product._id || product.id);
      setProducts((prev) =>
        prev.filter((p) => (p._id || p.id) !== (product._id || product.id))
      );
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vendor dashboard...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">Failed to load vendor data</div>
        <button
          onClick={loadVendorData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
      />

      {/* Header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{vendor.shopName}</h1>
            <p className="text-gray-600">Welcome back, {vendor.ownerName}</p>
            <div className="flex items-center mt-2">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  vendor.isApproved
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {vendor.isApproved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>
          <div className="text-right">
            {vendor.businessProfilePic && (
              <img
                src={vendor.businessProfilePic}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {vendorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold">
              {vendorStats.overall.totalProducts}
            </div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold">
              {vendorStats.overall.totalSold}
            </div>
            <div className="text-sm text-gray-600">Units Sold</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold">
              ₹{vendorStats.overall.totalRevenue?.toFixed(2) || 0}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold">
              {vendor.averageRating?.toFixed(1) || 0}
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "products", label: "Products", restricted: true },
              { id: "profile", label: "Profile" },
              { id: "analytics", label: "Analytics", restricted: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.restricted && !vendor.isApproved) {
                    setShowPendingModal(true);
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : tab.restricted && !vendor.isApproved
                    ? "border-transparent text-gray-400 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={tab.restricted && !vendor.isApproved}
              >
                {tab.label}
                {tab.restricted && !vendor.isApproved && (
                  <span className="ml-1 text-xs">🔒</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Products
                  </h3>
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div
                        key={product._id || product.id}
                        className="flex items-center space-x-3 p-3 border rounded"
                      >
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title || product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            {product.title || product.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            ₹{product.price}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.units || product.stock} in stock
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Business Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {vendor.category || "Not set"}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>{" "}
                      {vendor.businessAddress?.city || "Not set"}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span>{" "}
                      {vendor.businessContact ||
                        vendor.registeredContact ||
                        "Not set"}
                    </div>
                    <div>
                      <span className="font-medium">Website:</span>
                      {vendor.websiteLink ? (
                        <a
                          href={vendor.websiteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline ml-1"
                        >
                          {vendor.websiteLink}
                        </a>
                      ) : (
                        " Not set"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {!vendor.isApproved ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                    <svg
                      className="h-8 w-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Access Restricted
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Product management is available after your application is
                    approved.
                  </p>
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Check Application Status
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Products Management
                    </h3>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setShowProductForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Product
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">
                          {editingProduct ? "Edit Product" : "Add New Product"}
                        </h4>
                        <button
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <ProductForm
                        initialValues={editingProduct}
                        onSubmit={handleProductSubmit}
                        onCancel={() => {
                          setShowProductForm(false);
                          setEditingProduct(null);
                        }}
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>

                  {products.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No products found. Add your first product to get started!
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Profile Management</h3>
              <VendorProfileForm vendor={vendor} onUpdate={loadVendorData} />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {!vendor.isApproved ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                    <svg
                      className="h-8 w-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Access Restricted
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Analytics are available after your application is approved.
                  </p>
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Check Application Status
                  </button>
                </div>
              ) : vendorStats ? (
                <>
                  <h3 className="text-lg font-semibold">Analytics</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold mb-4">Sales by Category</h4>
                      <div className="space-y-3">
                        {vendorStats.byCategory.map((cat) => (
                          <div
                            key={cat._id}
                            className="flex justify-between items-center"
                          >
                            <span>{cat._id || "Uncategorized"}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                {cat.totalSold} sold
                              </span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (cat.totalSold /
                                        Math.max(
                                          ...vendorStats.byCategory.map(
                                            (c) => c.totalSold
                                          )
                                        )) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold mb-4">
                        Performance Metrics
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between">
                            <span>Average Price</span>
                            <span>
                              ₹
                              {vendorStats.overall.averagePrice?.toFixed(2) ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>Total Units</span>
                            <span>{vendorStats.overall.totalUnits}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>Conversion Rate</span>
                            <span>
                              {vendorStats.overall.totalUnits > 0
                                ? (
                                    (vendorStats.overall.totalSold /
                                      vendorStats.overall.totalUnits) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No analytics data available yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
