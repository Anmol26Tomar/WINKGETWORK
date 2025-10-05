require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./WinkgetExpress/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

const agentRoutes=require("./WinkgetExpress/routes/agent");

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./WinkgetExpress/routes/auth'));
app.use('/api/parcels', require('./WinkgetExpress/routes/parcelRoutes'));

//captain routing

app.use('/api/auth/agent',agentRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


