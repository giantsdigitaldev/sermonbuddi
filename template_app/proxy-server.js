// Simple CORS proxy server for local development
// Run with: node proxy-server.js

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

// Claude API proxy
app.use('/api/claude', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/claude': '/v1/messages',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add required headers
    proxyReq.setHeader('anthropic-version', '2023-06-01');
  },
}));

app.listen(PORT, () => {
  console.log(`CORS proxy server running on http://localhost:${PORT}`);
  console.log(`Use this URL in your app: http://localhost:${PORT}/api/claude`);
});

// package.json dependencies needed:
/*
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "http-proxy-middleware": "^2.0.6"
  }
}
*/ 