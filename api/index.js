// Vercel serverless - simplified version without database
const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../web/views'));
app.use(express.static(path.join(__dirname, '../web/public')));

// Simplified home page without database
app.get('/', (req, res) => {
  res.render('index', { 
    recentTests: [], 
    topSkills: [] 
  });
});

// API endpoints return placeholder data
app.get('/api/rankings', (req, res) => {
  res.json([]);
});

module.exports = app;
