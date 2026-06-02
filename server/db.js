// server/db.js

import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();

// Open database file.
// If database.sqlite does not exist, SQLite creates it automatically.
const db = new sqlite.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

export default db;