import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductForm from "../components/ProductForm.jsx";
import PendingApprovalModal from "../components/PendingApprovalModal.jsx";
import {
  createProduct,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
  fetchProducts,
} from "../services/productService.js";
import { useEffect } from "react";

export default function Products() {
<<<<<<< HEAD
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
=======
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

  const products = useMemo(() => state.products, [state.products]);

  useEffect(() => {
    (async () => {
      try {
<<<<<<< HEAD
        setLoading(true)
        setError(null)
        const list = await fetchProducts()
=======
        const list = await fetchProducts();
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
        // normalize to id field for UI
        const normalized = list.map((p) => ({ ...p, id: p._id }));
        // replace current state with fetched
        // simple approach: clear and add
        normalized.forEach(() => {});
        // dispatching a replace is not present; emulate by resetting via logout+login would be overkill.
        // Instead, remove duplicates and add missing
<<<<<<< HEAD
        const existingIds = new Set(state.products.map(p => p.id))
        normalized.forEach(p => {
          if (!existingIds.has(p.id)) dispatch({ type: 'ADD_PRODUCT', payload: p })
        })
      } catch (err) {
        setError('Failed to load products')
        console.error('Error loading products:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])
=======
        const existingIds = new Set(state.products.map((p) => p.id));
        normalized.forEach((p) => {
          if (!existingIds.has(p.id))
            dispatch({ type: "ADD_PRODUCT", payload: p });
        });
      } catch {}
    })();
  }, []);
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746

  const handleAdd = () => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    setEditing(null);
    setShowForm(true);
  };

  const handleSubmit = async (values) => {
    if (editing) {
      const updatedServer = await updateProductService({
        ...editing,
        ...values,
      });
      const updated = { ...updatedServer, id: updatedServer._id };
      dispatch({ type: "UPDATE_PRODUCT", payload: updated });
    } else {
      const created = await createProduct(values);
      const newProduct = { ...created, id: created._id };
      dispatch({ type: "ADD_PRODUCT", payload: newProduct });
    }
    setShowForm(false);
  };

  const handleEdit = (product) => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    setEditing(product);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    if (!confirm(`Delete ${product.name}?`)) return;
    await deleteProductService(product.id);
    dispatch({ type: "DELETE_PRODUCT", payload: product.id });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading products...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your products</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="px-6 py-3 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm"
=======
    <div className="space-y-6">
      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <button
          onClick={handleAdd}
          className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white"
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
        >
          Add Product
        </button>
      </div>

      {showForm && (
<<<<<<< HEAD
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editing ? 'Edit Product' : 'Add New Product'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
=======
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editing ? "Edit Product" : "Add Product"}
            </h3>
          </div>
          <div className="mt-4">
            <ProductForm
              initialValues={editing || undefined}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
          </div>
          <ProductForm 
            initialValues={editing || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      )}

<<<<<<< HEAD
      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first product to your catalog</p>
          <button 
            onClick={handleAdd} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onEdit={handleEdit} onDelete={handleDelete} />
=======
      {/* Show restricted access message if not approved */}
      {state.auth.vendor && !state.auth.vendor.isApproved ? (
        <div className="bg-white border rounded-lg p-8 text-center">
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
            Product management is available after your application is approved.
          </p>
          <button
            onClick={() => setShowPendingModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Application Status
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
          ))}
        </div>
      )}
    </div>
  );
}
