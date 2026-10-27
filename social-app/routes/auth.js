const r = require('express').Router();
const bcrypt = require('bcryptjs');
const { db, userById } = require('../db');
const { requireAuth } = require('../middleware/auth');

r.post('/register', (q, s) => {
  const username = String(q.body.username || ''), email = String(q.body.email || '').toLowerCase(), password = String(q.body.password || '');
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return s.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return s.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 6) return s.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const i = db.prepare('INSERT INTO users(username,email,password_hash,display_name) VALUES(?,?,?,?)')
      .run(username.toLowerCase(), email, bcrypt.hashSync(password, 10), username);
    q.session.userId = Number(i.lastInsertRowid);
    s.status(201).json(userById(q.session.userId, q.session.userId));
  } catch (e) {
    if (/UNIQUE constraint/.test(e.message)) return s.status(409).json({ error: 'Username or email already taken' });
    throw e;
  }
});

r.post('/login', (q, s) => {
  const l = String(q.body.login || '').toLowerCase(), p = String(q.body.password || '');
  const u = db.prepare('SELECT id,password_hash FROM users WHERE username=? OR email=?').get(l, l);
  if (!u || !bcrypt.compareSync(p, u.password_hash)) return s.status(401).json({ error: 'Wrong username or password' });
  q.session.regenerate(() => { q.session.userId = u.id; s.json(userById(u.id, u.id)); });
});

r.post('/logout', (q, s) => q.session.destroy(() => s.json({ ok: true })));
r.get('/me', requireAuth, (q, s) => s.json(userById(q.session.userId, q.session.userId)));
module.exports = r;
