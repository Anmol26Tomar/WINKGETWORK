import React, { useEffect, useState } from "react";
import { API_BASE_URL, endpoints } from "../apiConfig.js";

function authHeaders() {
  const token = localStorage.getItem("wb_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVendors() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}${endpoints.business.vendors}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load vendors");
      // The API returns { vendors: [...], pagination: {...} }
      setVendors(data.vendors || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  async function approveVendor(id) {
    try {
      const res = await fetch(
        `${API_BASE_URL}${endpoints.business.vendors}/${id}/approve`,
        { method: "PATCH", headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      // The approve endpoint returns the updated vendor object directly
      setVendors((prev) => prev.map((v) => (v._id === id ? data : v)));
    } catch (error) {
      alert(error.message || "Failed to approve vendor");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vendors</h1>
        <button
          onClick={loadVendors}
          className="px-3 py-2 text-sm rounded-md border"
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vendors.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No vendors found
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v._id}
              className="bg-white border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {v.name || v.ownerName} • {v.storeName || v.shopName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {v.email || v.ownerEmail}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    v.approved || v.isApproved
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {v.approved || v.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
              {(v.websiteUrl || v.websiteLink) && (
                <a
                  href={v.websiteUrl || v.websiteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-700 underline"
                >
                  Open Website
                </a>
              )}
              <div className="flex gap-2">
                {!(v.approved || v.isApproved) && (
                  <button
                    onClick={() => approveVendor(v._id)}
                    className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
