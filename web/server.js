const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { testSkill } = require('../src/tester');
const Database = require('./database');

const app = express();
const db = new Database();
const upload = multer({ dest: 'web/uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home page
app.get('/', async (req, res) => {
  const recentTests = await db.getRecentTests(10);
  const topSkills = await db.getTopSkills(10);
  res.render('index', { recentTests, topSkills });
});

// Test skill endpoint with directory upload
app.post('/api/test-upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const tempDir = path.join('web/uploads', `test-${Date.now()}`);
  
  try {
    await fs.ensureDir(tempDir);
    
    // Reconstruct directory structure from uploaded files
    for (const file of req.files) {
      const relativePath = file.originalname;
      const targetPath = path.join(tempDir, relativePath);
      await fs.ensureDir(path.dirname(targetPath));
      await fs.move(file.path, targetPath);
    }
    
    // Run tests
    const result = await testSkill(tempDir, { 
      execution: false, // Skip execution for web (security)
      performance: true 
    });

    // Save to database
    await db.saveTestResult({
      skillName: result.skillName,
      score: result.score,
      passed: result.passed,
      timestamp: new Date().toISOString(),
      result: JSON.stringify(result)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Cleanup
    await fs.remove(tempDir).catch(() => {});
  }
});

// Get skill rankings
app.get('/api/rankings', async (req, res) => {
  const skills = await db.getTopSkills(50);
  res.json(skills);
});

// Get test result by ID
app.get('/api/test/:id', async (req, res) => {
  const result = await db.getTestResult(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Test not found' });
  }
  res.json(JSON.parse(result.result));
});

// Export for Vercel serverless
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🧪 OpenClaw Skill Tester Web running on http://localhost:${PORT}`);
  });
}
