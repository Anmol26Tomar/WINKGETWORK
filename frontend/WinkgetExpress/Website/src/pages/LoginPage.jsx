import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("expressAdmin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const endpoint =
        role === "superadmin"
          ? "/api/auth/admin/login/superadmin"
          : "/api/auth/admin/login";
      const { data } = await api.post(endpoint, { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (data.role === "superadmin") navigate("/superadmin/dashboard");
      else navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow rounded p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="space-y-1">
          <label className="text-sm">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="expressAdmin">Express Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
