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
    { to: "/admin/categories", label: "Categories", icon: "🗂️" },
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
      </div>
    </aside>
  );
}
