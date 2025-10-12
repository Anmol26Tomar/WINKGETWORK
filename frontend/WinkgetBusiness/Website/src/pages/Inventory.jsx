import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import PendingApprovalModal from "../components/PendingApprovalModal.jsx";

export default function Inventory() {
  const { state, dispatch } = useApp();
  const [updates, setUpdates] = useState({});
  const [showPendingModal, setShowPendingModal] = useState(false);
  const products = useMemo(() => state.products, [state.products]);

  const handleChange = (id, value) => {
    setUpdates((prev) => ({ ...prev, [id]: value }));
  };

  const applyUpdate = (id) => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    const stock = parseInt(updates[id], 10);
    if (Number.isNaN(stock)) return;
    dispatch({ type: "UPDATE_STOCK", payload: { productId: id, stock } });
  };

  return (
    <div className="space-y-6">
      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
      />

      <h1 className="text-xl font-semibold">Inventory</h1>

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
            Inventory management is available after your application is
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
        <div className="bg-white border rounded-lg divide-y">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-600">
            <div className="col-span-5">Product</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Stock</div>
            <div className="col-span-3">Update</div>
          </div>
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
            >
              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-10 w-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p
                    className={`text-xs ${
                      p.stock < 5 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {p.stock < 5 ? "Low Stock" : "In Stock"}
                  </p>
                </div>
              </div>
              <div className="col-span-2">${p.price}</div>
              <div className="col-span-2 font-semibold">{p.stock}</div>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded-md border px-3 py-2"
                  value={updates[p.id] ?? ""}
                  onChange={(e) => handleChange(p.id, e.target.value)}
                  placeholder="New stock"
                />
                <button
                  onClick={() => applyUpdate(p.id)}
                  className="px-3 py-2 text-sm rounded-md border"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
