import { Navigate } from "react-router-dom";

export default function Guard({ children, role }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  if (!token) return <Navigate to="/" replace />;
  if (role && userRole !== role) {
    return (
      <Navigate
        to={
          userRole === "superadmin"
            ? "/superadmin/dashboard"
            : "/admin/dashboard"
        }
        replace
      />
    );
  }
  return children;
}

