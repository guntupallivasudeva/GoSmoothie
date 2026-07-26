const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gosmoothie';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth middleware
const { authMiddleware } = require('./server/middleware/auth');
app.use(authMiddleware);

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/cart', require('./server/routes/cart'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/addresses', require('./server/routes/addresses'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/payments', require('./server/routes/payments'));
app.use('/api/admins', require('./server/routes/admins'));

// Serve static frontend files (project root)
app.use(express.static(path.join(__dirname)));

// Serve Bootstrap Icons assets from the installed package.
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// Browsers auto-request /favicon.ico; return 204 when no icon file exists.
app.get('/favicon.ico', (req, res) => res.status(204).end());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
