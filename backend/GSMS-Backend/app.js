// app.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/usermanagement'));
app.use('/api/materials', require('./routes/rawMaterialRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Swagger (optional)
app.use('/api-docs', require('./utils/swagger'));

module.exports = app;
