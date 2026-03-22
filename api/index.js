// Minimal test - does Express even work on Vercel?
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>🧪 OpenClaw Skill Tester</h1><p>It works!</p>');
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

module.exports = app;
