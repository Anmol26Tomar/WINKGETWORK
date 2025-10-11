import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Guard from "../components/Guard";
import api from "../lib/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("parcels"); // parcels | drivers | create
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";
  const [form, setForm] = useState({
    receiverName: "",
    receiverContact: "",
    pickupHub: "",
    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",
    deliveryAddress: "",
    deliveryLat: "",
    deliveryLng: "",
    packageName: "",
    packageSize: "",
    packageWeight: "",
    packageDescription: "",
    fareEstimate: "",
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [updating, setUpdating] = useState(false);
  const [deliverySuggestions, setDeliverySuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  let autoEstimateTimer;

  async function loadAgents() {
    const [d] = await Promise.all([api.get("/api/agents")]);
    setDrivers(d.data.agents || []);
  }

  async function loadApprovedAgents() {
    const [d] = await Promise.all([api.get("/api/agents?approved=true")]);
    setApprovedDrivers(d.data.agents || []);
  }

  async function loadParcels() {
    const [p] = await Promise.all([api.get("/api/parcels")]);
    setParcels(p.data.parcels || []);
  }

  async function loadAll() {
    await Promise.all([loadAgents(), loadApprovedAgents(), loadParcels()]);
  }

  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  async function reverseGeocode(lat, lon) {
    // Try MapTiler first if key provided
    if (MAPTILER_KEY) {
      try {
        const url = `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${MAPTILER_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const feature = data?.features?.[0];
        if (feature?.place_name) return feature.place_name;
      } catch {}
    }
    // Fallback to Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data?.display_name) return data.display_name;
    } catch {}
    return "Current location";
  }

  function useCurrentLocationForPickup() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const address =
          (await reverseGeocode(lat, lon)) ||
          `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        setForm((f) => ({
          ...f,
          pickupLat: String(lat),
          pickupLng: String(lon),
          pickupAddress: address,
        }));
      },
      (err) => {
        console.warn("geolocation error", err);
        alert("Unable to fetch current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  let deliverySuggestTimer;
  let pickupSuggestTimer;
  function onPickupAddressInput(value) {
    setForm({ ...form, pickupAddress: value });
    if (pickupSuggestTimer) clearTimeout(pickupSuggestTimer);
    if (!value || value.trim().length < 3) {
      setPickupSuggestions([]);
      return;
    }
    setSuggesting(true);
    pickupSuggestTimer = setTimeout(async () => {
      try {
        let items = [];
        if (MAPTILER_KEY) {
          const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
            value
          )}.json?key=${MAPTILER_KEY}&limit=5`;
          const res = await fetch(url);
          const data = await res.json();
          items = (data?.features || []).map((f) => ({
            id: f.id,
            label: f.place_name,
            lat: f.center?.[1],
            lon: f.center?.[0],
          }));
        } else {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}`;
          const res = await fetch(url, {
            headers: { "Accept-Language": "en" },
          });
          const list = await res.json();
          items = (Array.isArray(list) ? list.slice(0, 5) : []).map((i) => ({
            id: i.place_id,
            label: i.display_name,
            lat: parseFloat(i.lat),
            lon: parseFloat(i.lon),
          }));
        }
        setPickupSuggestions(items);
      } catch {
        setPickupSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);
  }
  function onDeliveryAddressInput(value) {
    setForm({ ...form, deliveryAddress: value });
    if (deliverySuggestTimer) clearTimeout(deliverySuggestTimer);
    if (!value || value.trim().length < 3) {
      setDeliverySuggestions([]);
      return;
    }
    setSuggesting(true);
    deliverySuggestTimer = setTimeout(async () => {
      try {
        let items = [];
        if (MAPTILER_KEY) {
          const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
            value
          )}.json?key=${MAPTILER_KEY}&limit=5`;
          const res = await fetch(url);
          const data = await res.json();
          items = (data?.features || []).map((f) => ({
            id: f.id,
            label: f.place_name,
            lat: f.center?.[1],
            lon: f.center?.[0],
          }));
        } else {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}`;
          const res = await fetch(url, {
            headers: { "Accept-Language": "en" },
          });
          const list = await res.json();
          items = (Array.isArray(list) ? list.slice(0, 5) : []).map((i) => ({
            id: i.place_id,
            label: i.display_name,
            lat: parseFloat(i.lat),
            lon: parseFloat(i.lon),
          }));
        }
        setDeliverySuggestions(items);
      } catch {
        setDeliverySuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);

    // Debounced auto-estimate when fields are sufficient
    if (autoEstimateTimer) clearTimeout(autoEstimateTimer);
    autoEstimateTimer = setTimeout(() => {
      const hasPickup = form.pickupLat && form.pickupLng && form.pickupAddress;
      const hasDelivery =
        form.deliveryLat && form.deliveryLng && value.trim().length >= 3;
      if (hasPickup && hasDelivery) {
        estimateFare().catch(() => {});
      }
    }, 600);
  }

  function choosePickupSuggestion(item) {
    setForm({
      ...form,
      pickupAddress: item.label,
      pickupLat: item.lat != null ? String(item.lat) : form.pickupLat,
      pickupLng: item.lon != null ? String(item.lon) : form.pickupLng,
    });
    setPickupSuggestions([]);
    setTimeout(() => {
      estimateFare().catch(() => {});
    }, 0);
  }

  function chooseDeliverySuggestion(item) {
    setForm({
      ...form,
      deliveryAddress: item.label,
      deliveryLat: item.lat != null ? String(item.lat) : form.deliveryLat,
      deliveryLng: item.lon != null ? String(item.lon) : form.deliveryLng,
    });
    setDeliverySuggestions([]);
    // Auto-estimate fare after selecting an address, if pickup exists
    setTimeout(() => {
      estimateFare().catch(() => {});
    }, 0);
  }

  async function createParcel(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const pickupObj =
        form.pickupLat !== "" && form.pickupLng !== "" && form.pickupAddress
          ? {
              lat: Number(form.pickupLat),
              lng: Number(form.pickupLng),
              address: form.pickupAddress,
            }
          : undefined;

      const deliveryObj =
        form.deliveryLat !== "" &&
        form.deliveryLng !== "" &&
        form.deliveryAddress
          ? {
              lat: Number(form.deliveryLat),
              lng: Number(form.deliveryLng),
              address: form.deliveryAddress,
            }
          : undefined;

      const packageObj =
        form.packageName && form.packageSize && form.packageWeight !== ""
          ? {
              name: form.packageName,
              size: form.packageSize,
              weight: Number(form.packageWeight || 0),
              description: form.packageDescription || undefined,
            }
          : undefined;

      await api.post("/api/parcels/parceladmin", {
        receiverName: form.receiverName,
        receiverContact: form.receiverContact,
        pickupHub: form.pickupHub || undefined,
        pickup: pickupObj,
        deliveryAddress: deliveryObj ? undefined : form.deliveryAddress,
        delivery: deliveryObj,
        package: packageObj,
        fareEstimate:
          form.fareEstimate !== "" ? Number(form.fareEstimate) : undefined,
      });
      setForm({
        receiverName: "",
        receiverContact: "",
        pickupHub: "",
        pickupAddress: "",
        pickupLat: "",
        pickupLng: "",
        deliveryAddress: "",
        deliveryLat: "",
        deliveryLng: "",
        packageName: "",
        packageSize: "",
        packageWeight: "",
        packageDescription: "",
        fareEstimate: "",
      });
      await loadAll();
    } finally {
      setCreating(false);
    }
  }

  async function estimateFare() {
    try {
      const pickupObj =
        form.pickupLat !== "" && form.pickupLng !== "" && form.pickupAddress
          ? {
              lat: Number(form.pickupLat),
              lng: Number(form.pickupLng),
              address: form.pickupAddress,
            }
          : undefined;
      const deliveryObj =
        form.deliveryLat !== "" &&
        form.deliveryLng !== "" &&
        form.deliveryAddress
          ? {
              lat: Number(form.deliveryLat),
              lng: Number(form.deliveryLng),
              address: form.deliveryAddress,
            }
          : undefined;
      if (!pickupObj || !deliveryObj) {
        alert("Please provide both pickup and delivery with coordinates.");
        return;
      }
      const { data } = await api.post("/api/parcels/estimate", {
        pickup: pickupObj,
        delivery: deliveryObj,
        vehicleType: "bike",
      });
      const fare = data?.fare ?? data?.fareEstimate ?? "";
      setForm((f) => ({ ...f, fareEstimate: fare === "" ? "" : String(fare) }));
    } catch (e) {
      alert("Failed to estimate fare.");
    }
  }

  async function approve(id) {
    await api.patch(`/api/agents/${id}/approve`);
    await loadAll();
  }

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  function openDetails(parcel) {
    setSelectedParcel(parcel);
    setSelectedStatus(parcel.status || "pending");
    setSelectedDriverId(parcel.captainRef || "");
    setDetailsOpen(true);
    // Ensure approved drivers are loaded for selection
    loadApprovedAgents().catch(() => {});
  }

  async function updateStatus() {
    if (!selectedParcel) return;
    setUpdating(true);
    try {
      await api.put(`/api/parcels/${selectedParcel._id}/status`, {
        status: selectedStatus,
        driverId: selectedDriverId || undefined,
      });
      await loadParcels();
      setDetailsOpen(false);
      setSelectedParcel(null);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Guard role="admin">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button onClick={logout} className="text-sm text-red-600">
            Logout
          </button>
        </header>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-3 xl:col-span-2 bg-white rounded shadow p-3">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("parcels")}
                className={`w-full text-left px-3 py-2 rounded border ${
                  activeTab === "parcels"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                All India Parcel
              </button>
              <button
                onClick={() => setActiveTab("drivers")}
                className={`w-full text-left px-3 py-2 rounded border ${
                  activeTab === "drivers"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`w-full text-left px-3 py-2 rounded border ${
                  activeTab === "create"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                Create Parcel
              </button>
            </nav>
          </aside>
          <main className="lg:col-span-9 xl:col-span-10 space-y-4">
            {activeTab === "parcels" && (
              <section className="bg-white rounded shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">All India Parcel</h2>
                  <button
                    onClick={loadParcels}
                    className="text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {parcels.map((p) => (
                    <div
                      key={p._id}
                      className="border rounded p-3 hover:shadow-sm transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold truncate">
                          {p.package?.name || "Parcel"}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            p.status === "delivered"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : p.status === "in_transit"
                              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>From: {p.pickup?.address}</div>
                        <div>To: {p.delivery?.address}</div>
                        <div>
                          Receiver: {p.receiverName} • {p.receiverContact}
                        </div>
                        <div>Vehicle: {p.vehicleType}</div>
                        <div>
                          Fare: ₹{Number(p.fareEstimate || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Created: {new Date(p.createdAt).toLocaleString()}
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => openDetails(p)}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {parcels.length === 0 && (
                  <div className="text-sm text-gray-600">No parcels found</div>
                )}
              </section>
            )}

            {activeTab === "drivers" && (
              <section className="bg-white rounded shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Drivers</h2>
                  <button
                    onClick={loadAgents}
                    className="text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <ul className="divide-y">
                  {drivers.map((d) => (
                    <li
                      key={d._id}
                      className="py-2 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {d.fullName} — {d.city}
                        </div>
                        <div className="text-sm text-gray-600">
                          {d.email} | {d.phone}
                        </div>
                        <div className="text-sm text-gray-600">
                          {d.vehicleType}
                          {d.vehicleSubType
                            ? ` (${d.vehicleSubType})`
                            : ""} • {d.serviceType}
                        </div>
                      </div>
                      {!d.approved ? (
                        <button
                          onClick={() => approve(d._id)}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-sm text-green-700">Approved</span>
                      )}
                    </li>
                  ))}
                  {drivers.length === 0 && (
                    <li className="py-2 text-sm text-gray-600">
                      No drivers found
                    </li>
                  )}
                </ul>
              </section>
            )}

            {activeTab === "create" && (
              <section className="bg-white rounded shadow p-4">
                <h2 className="font-semibold mb-3">Create Parcel</h2>
                <form
                  onSubmit={createParcel}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <div className="md:col-span-2 border-b pb-1 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Admin
                    </h3>
                  </div>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Pickup Hub (optional)"
                    value={form.pickupHub}
                    onChange={(e) =>
                      setForm({ ...form, pickupHub: e.target.value })
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Fare Estimate (optional)"
                    value={form.fareEstimate}
                    onChange={(e) =>
                      setForm({ ...form, fareEstimate: e.target.value })
                    }
                  />
                  <div className="relative">
                    <input
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Pickup Address (optional)"
                      value={form.pickupAddress}
                      onChange={(e) => onPickupAddressInput(e.target.value)}
                    />
                    {pickupSuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 border rounded bg-white shadow-lg max-h-56 overflow-auto">
                        <ul>
                          {pickupSuggestions.map((s) => (
                            <li
                              key={s.id}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={() => choosePickupSuggestion(s)}
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="Pickup Lat (optional)"
                      value={form.pickupLat}
                      onChange={(e) =>
                        setForm({ ...form, pickupLat: e.target.value })
                      }
                    />
                    <input
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="Pickup Lng (optional)"
                      value={form.pickupLng}
                      onChange={(e) =>
                        setForm({ ...form, pickupLng: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={useCurrentLocationForPickup}
                      className="text-sm px-3 py-2 border rounded whitespace-nowrap"
                      title="Use current browser location"
                    >
                      Use current location
                    </button>
                  </div>

                  <div className="md:col-span-2 border-b pb-1 mt-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Receiver
                    </h3>
                  </div>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Receiver Name"
                    value={form.receiverName}
                    onChange={(e) =>
                      setForm({ ...form, receiverName: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Receiver Contact"
                    value={form.receiverContact}
                    onChange={(e) =>
                      setForm({ ...form, receiverContact: e.target.value })
                    }
                    required
                  />
                  <div className="relative">
                    <input
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Delivery Address"
                      value={form.deliveryAddress}
                      onChange={(e) => onDeliveryAddressInput(e.target.value)}
                      required
                    />
                    {deliverySuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 border rounded bg-white shadow-lg max-h-56 overflow-auto">
                        <ul>
                          {deliverySuggestions.map((s) => (
                            <li
                              key={s.id}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={() => chooseDeliverySuggestion(s)}
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Delivery Lat (optional)"
                      value={form.deliveryLat}
                      onChange={(e) =>
                        setForm({ ...form, deliveryLat: e.target.value })
                      }
                    />
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Delivery Lng (optional)"
                      value={form.deliveryLng}
                      onChange={(e) =>
                        setForm({ ...form, deliveryLng: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 border-b pb-1 mt-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Package Details
                    </h3>
                  </div>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Package Name (optional)"
                    value={form.packageName}
                    onChange={(e) =>
                      setForm({ ...form, packageName: e.target.value })
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Package Size (optional)"
                    value={form.packageSize}
                    onChange={(e) =>
                      setForm({ ...form, packageSize: e.target.value })
                    }
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Package Weight (optional)"
                    value={form.packageWeight}
                    onChange={(e) =>
                      setForm({ ...form, packageWeight: e.target.value })
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 md:col-span-2"
                    placeholder="Package Description (optional)"
                    value={form.packageDescription}
                    onChange={(e) =>
                      setForm({ ...form, packageDescription: e.target.value })
                    }
                  />
                  <button
                    disabled={creating}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded md:col-span-2"
                  >
                    {creating ? "Creating..." : "Create Parcel"}
                  </button>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={estimateFare}
                      className="text-sm px-3 py-1.5 border rounded"
                    >
                      Estimate Fare
                    </button>
                    <span className="text-sm text-gray-700">
                      {form.fareEstimate !== "" &&
                        `Estimated: ₹${Number(
                          form.fareEstimate
                        ).toLocaleString()}`}
                    </span>
                  </div>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  Note: This form posts to /api/parcels/admin. Vehicle/driver
                  not required; status defaults to in_transit with admin vehicle
                  type.
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
      {detailsOpen && selectedParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded shadow-xl w-full max-w-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Parcel Details</h3>
              <button
                onClick={() => setDetailsOpen(false)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Package</div>
                <div className="font-medium">
                  {selectedParcel.package?.name || "Parcel"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Fare</div>
                <div className="font-medium">
                  ₹{Number(selectedParcel.fareEstimate || 0).toLocaleString()}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">From</div>
                <div className="font-medium">
                  {selectedParcel.pickup?.address}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500">To</div>
                <div className="font-medium">
                  {selectedParcel.delivery?.address}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Receiver</div>
                <div className="font-medium">
                  {selectedParcel.receiverName} •{" "}
                  {selectedParcel.receiverContact}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Vehicle</div>
                <div className="font-medium">{selectedParcel.vehicleType}</div>
              </div>
              <div className="col-span-2 border-t pt-3 mt-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Assign Driver (approved)
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {approvedDrivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} — {d.city} ({d.vehicleType}
                      {d.vehicleSubType ? `-${d.vehicleSubType}` : ""})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Status
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="accepted">accepted</option>
                  <option value="in_transit">in_transit</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDetailsOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateStatus}
                disabled={updating}
                className="px-4 py-2 rounded text-white bg-blue-600 disabled:opacity-60"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Guard>
  );
}
