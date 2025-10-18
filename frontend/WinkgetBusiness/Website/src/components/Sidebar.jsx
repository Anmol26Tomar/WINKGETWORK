import React from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 hover:text-primary-700 ${
    isActive ? "bg-blue-100 text-primary-700" : "text-gray-700"
  }`;

export default function Sidebar() {
  const { state } = useApp();
  const { vendor } = state.auth;
  const isAdmin = vendor?.role === "admin";

  const dashboardPath = isAdmin ? "/admin/dashboard" : "/vendor/dashboard";

  // Admin navigation items
  const adminNavItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/admin/vendors", label: "Manage Vendors", icon: "👥" },
    { to: "/admin/contact", label: "Contact Express", icon: "📞" },
  ];

  // Vendor navigation items
  const vendorNavItems = [
    { to: "/vendor/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/products", label: "Products", icon: "📦" },
    { to: "/inventory", label: "Inventory", icon: "📋" },
    { to: "/orders", label: "Orders", icon: "📋" },
    { to: "/billing", label: "Billing", icon: "💰" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/profile", label: "Profile", icon: "👤" },
  ];

  const navItems = isAdmin ? adminNavItems : vendorNavItems;

  return (
<<<<<<< HEAD
    <aside className="hidden md:flex md:flex-col w-72 border-r bg-white shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
            <span className="text-lg font-bold">
              {(vendor?.name || vendor?.ownerName || 'V')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {vendor?.name || vendor?.ownerName || 'Vendor'}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-32">
              {vendor?.email || vendor?.ownerEmail || 'example@vendor.com'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to={dashboardPath} className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            Dashboard
          </span>
        </NavLink>
        <NavLink to="/products" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </span>
        </NavLink>
        <NavLink to="/inventory" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Inventory
          </span>
        </NavLink>
        <NavLink to="/orders" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Orders
          </span>
        </NavLink>
        <NavLink to="/billing" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Billing
          </span>
        </NavLink>
        <NavLink to="/notifications" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m0 0V3a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6" />
            </svg>
            Notifications
          </span>
        </NavLink>
        <NavLink to="/profile" className={navLinkClasses}>
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </span>
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 font-medium">Vendor Management System</div>
=======
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full text-white flex items-center justify-center ${
              isAdmin ? "bg-purple-600" : "bg-primary-600"
            }`}
          >
            {(vendor?.name || "U")[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {vendor?.name || (isAdmin ? "Admin" : "Vendor")}
            </p>
            <p className="text-xs text-gray-500">
              {vendor?.email || "example@email.com"}
            </p>
            {isAdmin && (
              <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full mt-1">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClasses}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 text-xs text-gray-400">
        {isAdmin ? "Admin Panel" : "Vendor Management"}
>>>>>>> 8ddfe9bcbf6d296c6af74a4afc9f4c14ba1cc746
      </div>
    </aside>
  );
}
