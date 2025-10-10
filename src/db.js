const path = require('path');

// This module will initialize either a SQLite3 database (default) or
// use Postgres when DATABASE_URL is provided (e.g., Heroku). It exposes
// a minimal subset of the sqlite3.Database API that the rest of the app
// expects: run, get, all, and a serialize helper for initialization.

if (process.env.DATABASE_URL) {
  // Use Postgres
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  // Helper wrappers to provide similar async callbacks used by sqlite3 in the codebase
  const db = {
    run(sql, params, cb) {
      // For INSERT/UPDATE/DELETE
      pool.query(sql, params)
        .then((res) => {
          // mimic sqlite's this.lastID / this.changes where possible
          if (cb) cb(null, res);
        })
        .catch((err) => cb && cb(err));
    },
    get(sql, params, cb) {
      pool.query(sql, params)
        .then((res) => cb && cb(null, res.rows[0]))
        .catch((err) => cb && cb(err));
    },
    all(sql, params, cb) {
      pool.query(sql, params)
        .then((res) => cb && cb(null, res.rows))
        .catch((err) => cb && cb(err));
    },
    serialize(cb) {
      // Immediately run the callback -- Postgres connections are pooled
      if (cb) cb();
    },
    pool,
  };

  // Ensure table exists (Postgres schema)
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      scopes TEXT DEFAULT 'default',
      expires_at TIMESTAMP,
      status TEXT DEFAULT 'active',
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, [], (err) => {
      if (err) console.error('Error creating table in Postgres:', err);
    });
  });

  module.exports = db;

} else {
  // Fallback to SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../api_keys.db');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      scopes TEXT DEFAULT 'default',
      expires_at DATETIME,
      status TEXT DEFAULT 'active',
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  module.exports = db;
}
