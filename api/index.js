// Vercel serverless - simple upload and test
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.render('index', { 
    recentTests: [], 
    topSkills: [],
    simple: true
  });
});

// Test upload - simplified without fs-extra
app.post('/api/test-upload', upload.array('files'), async (req, res) => {
  try {
    // For now, just return mock result
    // (full implementation needs different approach for Vercel)
    res.json({
      skillName: 'uploaded-skill',
      score: 85,
      passed: true,
      tests: [
        { name: 'Structure check', passed: true, message: 'Valid structure' },
        { name: 'Files present', passed: true, message: 'All files found' }
      ],
      warnings: ['This is a demo result - full testing coming soon']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
