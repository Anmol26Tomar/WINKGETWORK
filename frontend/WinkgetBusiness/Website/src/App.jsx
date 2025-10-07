import React from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Orders from './pages/Orders.jsx'
import Notifications from './pages/Notifications.jsx'
import Inventory from './pages/Inventory.jsx'
import Billing from './pages/Billing.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Home from './pages/Home.jsx'
import AdminVendors from './pages/AdminVendors.jsx'
import ContactExpress from './pages/ContactExpress.jsx'

function ProtectedRoute() {
  const { state } = useApp()
  const location = useLocation()
  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

function AdminRoute() {
  const { state } = useApp()
  if (!state.auth.isAuthenticated) return <Navigate to="/login" replace />
  if (state.auth.vendor?.role !== 'admin') return <Navigate to="/vendor/dashboard" replace />
  return <Outlet />
}

function AppLayout() {
  return (
    <div className="min-h-full grid grid-rows-[auto_1fr]">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar />
        <main className="p-4 md:p-6 bg-gray-50">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<ProtectedRoute />}> 
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/vendor/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route element={<AdminRoute />}> 
          <Route path="/admin/vendors" element={<AdminVendors />} />
          <Route path="/admin/dashboard" element={<AdminVendors />} />
          <Route path="/admin/contact" element={<ContactExpress />} />
        </Route>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AppProvider>
  )
}


