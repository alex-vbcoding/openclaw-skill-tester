const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'skills.db'));
    this.init();
  }

  init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skillName TEXT NOT NULL,
        score INTEGER NOT NULL,
        passed BOOLEAN NOT NULL,
        timestamp TEXT NOT NULL,
        result TEXT NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_skill_score 
      ON test_results(skillName, score DESC)
    `);
  }

  saveTestResult(data) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO test_results (skillName, score, passed, timestamp, result)
         VALUES (?, ?, ?, ?, ?)`,
        [data.skillName, data.score, data.passed ? 1 : 0, data.timestamp, data.result],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getRecentTests(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, skillName, score, passed, timestamp
         FROM test_results
         ORDER BY timestamp DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getTopSkills(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
           skillName,
           MAX(score) as bestScore,
           AVG(score) as avgScore,
           COUNT(*) as testCount,
           MAX(timestamp) as lastTested
         FROM test_results
         GROUP BY skillName
         ORDER BY bestScore DESC, avgScore DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getTestResult(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM test_results WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Database;
