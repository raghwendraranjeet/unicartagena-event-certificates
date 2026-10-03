import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(process.env.DATABASE_PATH || join(root, 'registrations.db'));
db.exec(`CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  document_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  institution TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const columns = new Set(db.prepare('PRAGMA table_info(registrations)').all().map(column => column.name));
if (!columns.has('username')) db.exec('ALTER TABLE registrations ADD COLUMN username TEXT');
if (!columns.has('password_salt')) db.exec('ALTER TABLE registrations ADD COLUMN password_salt TEXT');
if (!columns.has('password_hash')) db.exec('ALTER TABLE registrations ADD COLUMN password_hash TEXT');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS registrations_username_unique ON registrations(username) WHERE username IS NOT NULL');
const findNext = db.prepare("SELECT MAX(CAST(substr(document_id, 10) AS INTEGER)) AS last_serial FROM registrations WHERE document_id LIKE ?");
const insert = db.prepare('INSERT INTO registrations (full_name, document_id, email, phone, institution, role, username, password_salt, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const findUser = db.prepare('SELECT * FROM registrations WHERE username = ?');
const sessions = new Map();
const nextId = (year = new Date().getFullYear()) => {
  const prefix = `UDC-${year}-`;
  const serial = (findNext.get(`${prefix}%`).last_serial ?? 0) + 1;
  return `${prefix}${String(serial).padStart(4, '0')}`;
};
const publicUser = row => ({ full_name: row.full_name, document_id: row.document_id, email: row.email, role: row.role, username: row.username });
const currentUser = req => {
  const token = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('event_session='))?.slice('event_session='.length);
  const username = token && sessions.get(token);
  return username ? findUser.get(username) : null;
};

const json = (res, status, value) => {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true });
  if (req.method === 'GET' && url.pathname === '/api/next-id') return json(res, 200, { id: nextId() });
  if (req.method === 'GET' && url.pathname === '/api/me') {
    const user = currentUser(req);
    return user ? json(res, 200, { user: publicUser(user) }) : json(res, 401, { error: 'Please sign in.' });
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const input = JSON.parse(raw);
      const username = String(input.username || '').trim().toLowerCase();
      const row = findUser.get(username);
      if (!row?.password_salt || !row?.password_hash || typeof input.password !== 'string') return json(res, 401, { error: 'Username or password is incorrect.' });
      const submitted = scryptSync(input.password, row.password_salt, 64);
      const stored = Buffer.from(row.password_hash, 'hex');
      if (submitted.length !== stored.length || !timingSafeEqual(submitted, stored)) return json(res, 401, { error: 'Username or password is incorrect.' });
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, username);
      const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader('Set-Cookie', `event_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secureCookie}`);
      return json(res, 200, { user: publicUser(row) });
    } catch { return json(res, 400, { error: 'Please enter your username and password.' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    const token = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('event_session='))?.slice('event_session='.length);
    if (token) sessions.delete(token);
    const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `event_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie}`);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url.pathname === '/api/register') {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const input = JSON.parse(raw);
      const fields = ['full_name', 'email', 'phone', 'institution', 'role', 'username', 'password'];
      const registration = Object.fromEntries(fields.map(key => [key, String(input[key] ?? '').trim()]));
      registration.password = String(input.password ?? '');
      if (fields.some(key => !registration[key])) return json(res, 400, { error: 'Please complete all required fields.' });
      if (!['attendee', 'speaker'].includes(registration.role)) return json(res, 400, { error: 'Choose attendee or speaker.' });
      registration.username = registration.username.toLowerCase();
      if (!/^[a-z0-9._-]{3,32}$/.test(registration.username)) return json(res, 400, { error: 'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.' });
      if (registration.password.length < 8) return json(res, 400, { error: 'Password must be at least 8 characters.' });
      registration.document_id = nextId();
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(registration.password, salt, 64).toString('hex');
      insert.run(registration.full_name, registration.document_id, registration.email, registration.phone, registration.institution, registration.role, registration.username, salt, hash);
      delete registration.password;
      return json(res, 201, { ok: true, registration });
    } catch (error) {
      if (error.code === 'ERR_SQLITE_ERROR' && error.message.includes('UNIQUE')) return json(res, 409, { error: 'That username is already in use. Please choose another.' });
      return json(res, 400, { error: 'We couldn\'t save your registration. Please try again.' });
    }
  }
  if (req.method === 'GET') {
    const path = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (path.includes('..') || path.includes('\\') || path.includes('/')) return res.writeHead(404).end();
    try {
      const body = await readFile(join(root, path));
      const contentType = path.endsWith('.html') ? 'text/html; charset=utf-8' : path.endsWith('.png') ? 'image/png' : path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : 'text/plain; charset=utf-8';
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end(body);
    } catch { return res.writeHead(404).end('Not found'); }
  }
  res.writeHead(404).end();
});

const port = Number(process.env.PORT || 8000);
server.listen(port, '0.0.0.0', () => console.log(`Event certificates app listening on port ${port}`));

