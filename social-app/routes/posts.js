const r = require('express').Router();
const fs = require('fs');
const path = require('path');
const { db, POST, fmtPost, paging } = require('../db');
const { requireAuth } = require('../middleware/auth');
const up = require('../middleware/upload');
const uid = (q) => q.session.userId || 0;
const one = (id, me) => fmtPost(db.prepare(POST + ' WHERE p.id=@id').get({ me, id }));
const rm = (f) => f && fs.unlink(path.join(__dirname, '..', 'uploads', f), () => {});
const CM = 'SELECT c.id,c.content,c.created_at,u.username,u.display_name,u.avatar_path FROM comments c JOIN users u ON u.id=c.user_id';
const postExists = (q, s) => {
  const ok = db.prepare('SELECT 1 FROM posts WHERE id=?').get(q.params.id);
  if (!ok) s.status(404).json({ error: 'Post not found' });
  return !!ok;
};

r.get('/feed', requireAuth, (q, s) => {
  const rows = db.prepare(POST + ' WHERE p.user_id=@me OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id=@me) ORDER BY p.id DESC LIMIT @limit OFFSET @offset')
    .all({ me: uid(q), ...paging(q) });
  s.json({ posts: rows.map(fmtPost) });
});

r.post('/posts', requireAuth, up.image, (q, s) => {
  const c = String(q.body.content || '').trim();
  if (!c || c.length > 280) {
    if (q.file) rm(q.file.filename);
    return s.status(400).json({ error: c ? 'Posts can be up to 280 characters' : 'Write something first' });
  }
  const i = db.prepare('INSERT INTO posts(user_id,content,image_path) VALUES(?,?,?)').run(uid(q), c, q.file ? q.file.filename : null);
  s.status(201).json(one(i.lastInsertRowid, uid(q)));
});

r.get('/posts/:id', (q, s) => {
  const p = one(q.params.id, uid(q));
  p ? s.json(p) : s.status(404).json({ error: 'Post not found' });
});

r.delete('/posts/:id', requireAuth, (q, s) => {
  const p = db.prepare('SELECT user_id,image_path FROM posts WHERE id=?').get(q.params.id);
  if (!p) return s.status(404).json({ error: 'Post not found' });
  if (p.user_id !== uid(q)) return s.status(403).json({ error: 'You can only delete your own posts' });
  db.prepare('DELETE FROM posts WHERE id=?').run(q.params.id);
  rm(p.image_path);
  s.json({ ok: true });
});

r.post('/posts/:id/like', requireAuth, (q, s) => {
  if (!postExists(q, s)) return;
  db.prepare('INSERT OR IGNORE INTO likes(post_id,user_id) VALUES(?,?)').run(q.params.id, uid(q));
  s.json({ ok: true });
});
r.delete('/posts/:id/like', requireAuth, (q, s) => {
  db.prepare('DELETE FROM likes WHERE post_id=? AND user_id=?').run(q.params.id, uid(q));
  s.json({ ok: true });
});

r.get('/posts/:id/comments', (q, s) => {
  if (!postExists(q, s)) return;
  s.json({ comments: db.prepare(CM + ' WHERE c.post_id=? ORDER BY c.id').all(q.params.id) });
});
r.post('/posts/:id/comments', requireAuth, (q, s) => {
  if (!postExists(q, s)) return;
  const c = String(q.body.content || '').trim();
  if (!c || c.length > 280) return s.status(400).json({ error: 'Comments must be 1-280 characters' });
  const i = db.prepare('INSERT INTO comments(post_id,user_id,content) VALUES(?,?,?)').run(q.params.id, uid(q), c);
  s.status(201).json(db.prepare(CM + ' WHERE c.id=?').get(i.lastInsertRowid));
});
r.delete('/comments/:id', requireAuth, (q, s) => {
  const c = db.prepare('SELECT user_id FROM comments WHERE id=?').get(q.params.id);
  if (!c) return s.status(404).json({ error: 'Comment not found' });
  if (c.user_id !== uid(q)) return s.status(403).json({ error: 'You can only delete your own comments' });
  db.prepare('DELETE FROM comments WHERE id=?').run(q.params.id);
  s.json({ ok: true });
});
module.exports = r;
