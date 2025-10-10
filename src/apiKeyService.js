const crypto = require('crypto');
const db = require('./db');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}


function saveApiKey(key, scopes = ['default'], expiresAt = null) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO api_keys (key, scopes, expires_at, status) VALUES (?, ?, ?, ?)',
      [key, JSON.stringify(scopes), expiresAt, 'active'],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, key, scopes, expiresAt });
      }
    );
  });
}


function verifyApiKey(key, requiredScope = null) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM api_keys WHERE key = ?', [key], (err, row) => {
      if (err) return reject(err);
      if (!row || row.status !== 'active') return resolve(false);
      if (row.expires_at && new Date(row.expires_at) < new Date()) return resolve(false);
      if (requiredScope) {
        const scopes = JSON.parse(row.scopes || '[]');
        if (!scopes.includes(requiredScope)) return resolve(false);
      }
      // Atualiza uso
      db.run('UPDATE api_keys SET usage_count = usage_count + 1 WHERE key = ?', [key]);
      resolve(true);
    });
  });
}

function revokeApiKey(key) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE api_keys SET status = ? WHERE key = ?', ['revoked', key], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function renewApiKey(key, newExpiresAt) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE api_keys SET expires_at = ? WHERE key = ?', [newExpiresAt, key], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function listApiKeys() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM api_keys', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getApiKeyUsage(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT usage_count FROM api_keys WHERE key = ?', [key], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.usage_count : null);
    });
  });
}

module.exports = {
  generateApiKey,
  saveApiKey,
  verifyApiKey,
  revokeApiKey,
  renewApiKey,
  listApiKeys,
  getApiKeyUsage,
};
