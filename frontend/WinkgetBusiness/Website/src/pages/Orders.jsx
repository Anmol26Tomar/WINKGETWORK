import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import OrderCard from "../components/OrderCard.jsx";
import PendingApprovalModal from "../components/PendingApprovalModal.jsx";

export default function Orders() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [showPendingModal, setShowPendingModal] = useState(false);

  const orders = useMemo(() => {
    if (filter === "All") return state.orders;
    return state.orders.filter((o) => o.status === filter);
  }, [state.orders, filter]);

  const handleChangeStatus = (order, status) => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    dispatch({
      type: "UPDATE_ORDER_STATUS",
      payload: { id: order.id, status },
    });
  };

  const handleGenerateBill = (order) => {
    // Check if vendor is approved
    if (state.auth.vendor && !state.auth.vendor.isApproved) {
      setShowPendingModal(true);
      return;
    }
    const first = order.items[0];
    navigate("/billing", {
      state: {
        initial: {
          customerName: order.customerName,
          productId: first?.productId,
          quantity: first?.quantity,
          price: first?.price,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Pending Approval Modal */}
      <PendingApprovalModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {["All", "Pending", "Confirmed", "Dispatched", "Completed"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        </div>
      </div>

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
            Order management is available after your application is approved.
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
          <div className="grid md:grid-cols-2 gap-4">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onChangeStatus={handleChangeStatus}
                onGenerateBill={handleGenerateBill}
              />
            ))}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Items</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2">{o.id}</td>
                      <td className="py-2">{o.customerName}</td>
                      <td className="py-2">
                        {o.items.map((i) => i.name).join(", ")}
                      </td>
                      <td className="py-2">${o.total}</td>
                      <td className="py-2">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
