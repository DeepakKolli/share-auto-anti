require('dotenv').config({ path: '../.env' });
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

app.use(cors());
app.use(morgan('dev'));

const services = [
  { route: '/api/users', target: process.env.USER_SERVICE_URL || 'http://localhost:3001' },
  { route: '/api/drivers', target: process.env.DRIVER_SERVICE_URL || 'http://localhost:3002' },
  { route: '/api/bookings', target: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003' },
  { route: '/api/pricing', target: process.env.PRICING_SERVICE_URL || 'http://localhost:3004' },
  { route: '/api/pooling', target: process.env.POOLING_SERVICE_URL || 'http://localhost:3005' },
  { route: '/api/payments', target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006' },
  { route: '/api/admin', target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3007' },
  { route: '/api/notifications', target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008' },
  { route: '/api/routes', target: process.env.ROUTE_SERVICE_URL || 'http://localhost:3009' },
  { route: '/api/audit', target: process.env.AUDIT_SERVICE_URL || 'http://localhost:3010' }
];

services.forEach(({ route, target }) => {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      ['^' + route]: '' 
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${route} -> ${target}`, err.message);
      res.status(502).json({ error: 'Service Unavailable or Timeout' });
    }
  }));
});

// Global Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found at Gateway.' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
