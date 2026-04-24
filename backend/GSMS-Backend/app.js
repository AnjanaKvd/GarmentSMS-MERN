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
app.use('/api/customers', require('./routes/customerRoutes'));

// Swagger (optional)
app.use('/api-docs', require('./utils/swagger'));

// Serve React static build if API route not matched
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend-dist')));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend-dist', 'index.html'));
});

module.exports = app;
