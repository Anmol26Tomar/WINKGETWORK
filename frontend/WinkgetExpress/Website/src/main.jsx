import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/superadmin/dashboard", element: <SuperadminDashboard /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
]);

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

