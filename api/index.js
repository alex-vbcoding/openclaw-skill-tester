// Vercel serverless - simple test version without database
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { testSkill } = require('../src/tester');

const app = express();
const upload = multer({ dest: '/tmp/uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home page - simple upload form only
app.get('/', (req, res) => {
  res.render('index', { 
    recentTests: [], 
    topSkills: [],
    simple: true  // Flag to hide rankings
  });
});

// Test upload endpoint
app.post('/api/test-upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const tempDir = path.join('/tmp', `test-${Date.now()}`);
  
  try {
    await fs.ensureDir(tempDir);
    
    // Reconstruct directory structure
    for (const file of req.files) {
      const relativePath = file.originalname;
      const targetPath = path.join(tempDir, relativePath);
      await fs.ensureDir(path.dirname(targetPath));
      await fs.move(file.path, targetPath);
    }
    
    // Run tests (no execution for security)
    const result = await testSkill(tempDir, { 
      execution: false,
      performance: true 
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await fs.remove(tempDir).catch(() => {});
  }
});

module.exports = app;
