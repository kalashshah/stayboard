-- Email sign-in codes: one live code per address, stored as a SHA-256 hash.
CREATE TABLE login_codes (
  email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);
