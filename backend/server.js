require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./WinkgetExpress/config/db');

const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const { setIO } = require('./WinkgetExpress/utils/socket');
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

connectDB();

const agentRoutes=require("./WinkgetExpress/routes/agent");

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./WinkgetExpress/routes/auth'));
app.use('/api/parcels', require('./WinkgetExpress/routes/parcelRoutes'));
app.use('/api/transport', require('./WinkgetExpress/routes/transportRoutes'));
// Winkget Business APIs
app.use('/api/business', require('./WinkgetBusiness/routes/businessRoutes'));

//captain routing

app.use('/api/auth/agent',agentRoutes);
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


