const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'hottake.db');

const db = new Database(DB_PATH);

// Performance + referential integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// PBI 1: Users table with all constraints
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    username      TEXT     NOT NULL UNIQUE,
    email         TEXT     NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT     NOT NULL,
    role          TEXT     NOT NULL DEFAULT 'Member'
                           CHECK(role IN ('Member', 'Admin')),
    display_name  TEXT,
    bio           TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// PBI 8: Titles table
db.exec(`
  CREATE TABLE IF NOT EXISTS titles (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    name         TEXT     NOT NULL,
    type         TEXT     NOT NULL CHECK(type IN ('Anime', 'Manga', 'Movie')),
    genre        TEXT     NOT NULL,
    release_year INTEGER  NOT NULL
  );
`);

console.log('Database initialized. Users table ready.');

module.exports = db;