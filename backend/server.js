require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./WinkgetExpress/config/db");
const adminAuthRoutes = require("./WinkgetExpress/routes/AdminAuth");

const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const { setIO } = require("./WinkgetExpress/utils/socket");
const PORT = process.env.SERVER_PORT || 5000;
console.log('dabsv',PORT);
const SERVER_IP = process.env.SERVER_IP || 'localhost';

// Configure CORS to allow credentials
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001','*'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());

connectDB();

const agentRoutes = require("./WinkgetExpress/routes/agent");

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Health endpoint under /api to match frontend baseURL that appends /api
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Test endpoint to create a transport request
app.post("/test/transport", (req, res) => {
  const {
    notifyCaptainsNewTransport,
  } = require("./WinkgetExpress/utils/notificationService");

  const testTrip = {
    id: "test_" + Date.now(),
    vehicleType: req.body.vehicleType || "truck",
    vehicleSubType: req.body.vehicleSubType || "truck_mini_van",
    fareEstimate: 150,
    pickup: { lat: 12.9716, lng: 77.5946, address: "Test Pickup Location" },
    destination: { lat: 12.9352, lng: 77.6245, address: "Test Destination" },
    distanceKm: 5.2,
    status: "pending",
    type: "transport",
  };

  notifyCaptainsNewTransport(testTrip.id, testTrip);

  res.json({
    message: "Test transport request created",
    trip: testTrip,
  });
});

app.use("/api/auth", require("./WinkgetExpress/routes/auth"));
app.use("/api/parcels", require("./WinkgetExpress/routes/parcelRoutes"));
app.use("/api/transport", require("./WinkgetExpress/routes/transportRoutes"));
app.use("/api/packers", require("./WinkgetExpress/routes/packersMoveRoutes"));

// Winkget Business APIs
app.use("/api/business/auth", require("./WinkgetBusiness/routes/auth"));
app.use("/api/business/vendors", require("./WinkgetBusiness/routes/vendors"));
app.use("/api/business/products", require("./WinkgetBusiness/routes/products"));
app.use("/api/business/contact", require("./WinkgetBusiness/routes/contact"));
app.use("/api/business/bills", require("./WinkgetBusiness/routes/bills"));
app.use(
  "/api/business/categories",
  require("./WinkgetBusiness/routes/categories")
);

// Captain routing
app.use("/api/v1/captain/auth", require("./WinkgetExpress/captain/routes/captain.auth.routes"));
app.use("/api/v1/captain/trips", require("./WinkgetExpress/captain/routes/captain.trip.routes"));

app.use("/api/auth/agent", agentRoutes);
app.use("/api/agents", require("./WinkgetExpress/routes/agents"));
app.use("/api/agent", require("./WinkgetExpress/routes/agent"));
app.use("/api/auth/admin", adminAuthRoutes);

// express admin routing

const io = new Server(http, { cors: { origin: process.env.SOCKET_CORS_ORIGIN || "*" } });
setIO(io);

// Initialize captain sockets
try {
  const { initCaptainSockets } = require("./WinkgetExpress/captain/sockets/captain.socket");
  initCaptainSockets(io);
  console.log("Captain sockets initialized successfully");
} catch (error) {
  console.error("Error initializing captain sockets:", error);
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("user:subscribe-ride", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });
  socket.on("join-ride", ({ rideId }) => socket.join(`ride:${rideId}`));
  socket.on("subscribe-ride", ({ rideId }) => socket.join(`ride:${rideId}`));

  // Handle captain joining
  socket.on("captain:join", ({ captainId, vehicleType, isAvailable }) => {
    console.log("Captain joined:", { captainId, vehicleType, isAvailable });
    socket.join(`captain:${captainId}`);
    socket.join(`vehicle:${vehicleType}`);
    if (isAvailable) {
      socket.join("available-captains");
    }
  });

  socket.on("test", (data) => {
    console.log("Test message received from captain:", data);
    socket.emit("test-response", {
      message: "Hello from server!",
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

http.listen(PORT, SERVER_IP, () => console.log(`Server running on ${SERVER_IP}:${PORT}`));
