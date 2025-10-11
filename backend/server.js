require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./WinkgetExpress/config/db');

const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const { setIO } = require('./WinkgetExpress/utils/socket');
const PORT = process.env.PORT || 3001;

// Configure CORS to allow credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001','*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(cookieParser());

connectDB();

const agentRoutes=require("./WinkgetExpress/routes/agent");

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./WinkgetExpress/routes/auth'));
app.use('/api/parcels', require('./WinkgetExpress/routes/parcelRoutes'));
app.use('/api/transport', require('./WinkgetExpress/routes/transportRoutes'));
// Winkget Business APIs
// app.use('/api/business', require('./WinkgetBusiness/routes/businessRoutes'));

//captain routing

app.use('/api/auth/agent', agentRoutes);
app.use('/api/agents', require('./WinkgetExpress/routes/agents'));
app.use('/api/agent', require('./WinkgetExpress/routes/agents'));

const io = new Server(http, { cors: { origin: '*'} });
setIO(io);

io.on('connection', (socket) => {
	socket.on('user:subscribe-ride', ({ rideId }) => {
		socket.join(`ride:${rideId}`);
	});
	socket.on('join-ride', ({ rideId }) => socket.join(`ride:${rideId}`));
	socket.on('subscribe-ride', ({ rideId }) => socket.join(`ride:${rideId}`));
});

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));


