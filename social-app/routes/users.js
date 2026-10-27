const r = require('express').Router();
const { db, USER, POST, fmtUser, fmtPost, userById, paging } = require('../db');
const { requireAuth } = require('../middleware/auth');
const up = require('../middleware/upload');
const uid = (q) => q.session.userId || 0;
const target = (q, s) => {
  const t = db.prepare('SELECT id FROM users WHERE username=?').get(q.params.username.toLowerCase());
  if (!t) s.status(404).json({ error: 'User not found' });
  return t;
};

r.get('/search', (q, s) => {
  const t = String(q.query.q || '').trim().slice(0, 50);
  if (!t) return s.json({ users: [] });
  const like = '%' + t.replace(/[\\%_]/g, '\\$&') + '%';
  const rows = db.prepare(USER + " WHERE u.username LIKE @like ESCAPE '\\' OR u.display_name LIKE @like ESCAPE '\\' ORDER BY u.username LIMIT 20").all({ me: uid(q), like });
  s.json({ users: rows.map((x) => fmtUser(x, uid(q))) });
});

r.put('/me', requireAuth, up.avatar, (q, s) => {
  const d = String(q.body.display_name ?? '').trim().slice(0, 50), b = String(q.body.bio ?? '').trim().slice(0, 160);
  if (!d) return s.status(400).json({ error: 'Display name is required' });
  db.prepare('UPDATE users SET display_name=?,bio=?,avatar_path=COALESCE(?,avatar_path) WHERE id=?').run(d, b, q.file ? q.file.filename : null, uid(q));
  s.json(userById(uid(q), uid(q)));
});

r.get('/:username', (q, s) => {
  const t = target(q, s); if (!t) return;
  s.json(userById(t.id, uid(q)));
});

r.post('/:username/follow', requireAuth, (q, s) => {
  const t = target(q, s); if (!t) return;
  if (t.id === uid(q)) return s.status(400).json({ error: "You can't follow yourself" });
  db.prepare('INSERT OR IGNORE INTO follows(follower_id,following_id) VALUES(?,?)').run(uid(q), t.id);
  s.json({ ok: true });
});
r.delete('/:username/follow', requireAuth, (q, s) => {
  const t = target(q, s); if (!t) return;
  db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(uid(q), t.id);
  s.json({ ok: true });
});

const list = (col, other) => (q, s) => {
  const t = target(q, s); if (!t) return;
  const rows = db.prepare(USER + ` WHERE u.id IN (SELECT ${col} FROM follows WHERE ${other}=@t) ORDER BY u.username`).all({ me: uid(q), t: t.id });
  s.json({ users: rows.map((x) => fmtUser(x, uid(q))) });
};
r.get('/:username/followers', list('follower_id', 'following_id'));
r.get('/:username/following', list('following_id', 'follower_id'));

r.get('/:username/posts', (q, s) => {
  const t = target(q, s); if (!t) return;
  const rows = db.prepare(POST + ' WHERE p.user_id=@t ORDER BY p.id DESC LIMIT @limit OFFSET @offset').all({ me: uid(q), t: t.id, ...paging(q) });
  s.json({ posts: rows.map(fmtPost) });
});
module.exports = r;
