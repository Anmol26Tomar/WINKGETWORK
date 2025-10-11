import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Guard from "../components/Guard";
import api from "../lib/api";

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function loadAdmins() {
    const { data } = await api.get("/api/auth/admin/admins");
    setAdmins(data);
  }

  useEffect(() => {
    loadAdmins().catch(console.error);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/auth/admin/admins", form);
      setForm({ name: "", email: "", password: "" });
      await loadAdmins();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create admin");
    }
  }

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <Guard role="superadmin">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow p-4 flex justify-between">
          <h1 className="text-xl font-semibold">Superadmin Dashboard</h1>
          <button onClick={logout} className="text-sm text-red-600">
            Logout
          </button>
        </header>
        <main className="p-4 grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">All Admins</h2>
            <ul className="divide-y">
              {admins.map((a) => (
                <li key={a._id} className="py-2">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-gray-600">{a.email}</div>
                </li>
              ))}
              {admins.length === 0 && (
                <li className="py-2 text-sm text-gray-600">No admins yet</li>
              )}
            </ul>
          </section>
          <section className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Create Admin</h2>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm">Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm">Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Create
              </button>
            </form>
          </section>
        </main>
      </div>
    </Guard>
  );
}

