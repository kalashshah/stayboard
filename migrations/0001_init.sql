CREATE TABLE hosts (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pass_hash TEXT NOT NULL, salt TEXT NOT NULL,
  created_at INTEGER NOT NULL);
CREATE TABLE sessions (id TEXT PRIMARY KEY, host_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE properties (
  id TEXT PRIMARY KEY, host_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, config TEXT NOT NULL,
  updated_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE devices (
  code TEXT PRIMARY KEY, secret TEXT NOT NULL UNIQUE, property_id TEXT, label TEXT,
  paired_at INTEGER, last_seen_at INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE questions (
  id TEXT PRIMARY KEY, property_id TEXT NOT NULL, source TEXT NOT NULL, question TEXT NOT NULL,
  answer TEXT NOT NULL, answered INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL);
CREATE INDEX properties_host ON properties(host_id);
CREATE INDEX devices_property ON devices(property_id);
CREATE INDEX questions_property ON questions(property_id, created_at);
CREATE INDEX sessions_host ON sessions(host_id);
