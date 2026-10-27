const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'app.db'));
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', avatar_path TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, image_path TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS likes(id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(post_id, user_id));
CREATE TABLE IF NOT EXISTS follows(id INTEGER PRIMARY KEY, follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(follower_id, following_id), CHECK(follower_id != following_id));
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
`);
const USER = `SELECT u.id,u.username,u.display_name,u.bio,u.avatar_path,u.created_at,
(SELECT COUNT(*) FROM posts WHERE user_id=u.id) posts,
(SELECT COUNT(*) FROM follows WHERE following_id=u.id) followers,
(SELECT COUNT(*) FROM follows WHERE follower_id=u.id) following,
EXISTS(SELECT 1 FROM follows WHERE follower_id=@me AND following_id=u.id) is_following FROM users u`;
const POST = `SELECT p.id,p.content,p.image_path,p.created_at,u.username,u.display_name,u.avatar_path,
(SELECT COUNT(*) FROM likes WHERE post_id=p.id) like_count,
(SELECT COUNT(*) FROM comments WHERE post_id=p.id) comment_count,
EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=@me) liked
FROM posts p JOIN users u ON u.id=p.user_id`;
const fmtUser = (r, me) => r && { ...r, is_following: !!r.is_following, is_me: r.id === me };
const fmtPost = (r) => r && { ...r, liked: !!r.liked };
const userById = (id, me) => fmtUser(db.prepare(USER + ' WHERE u.id=@id').get({ me, id }), me);
const paging = (q) => {
  const limit = Math.min(Math.max(+q.query.limit || 10, 1), 50);
  const page = Math.max(+q.query.page || 1, 1);
  return { limit, offset: (page - 1) * limit };
};
module.exports = { db, USER, POST, fmtUser, fmtPost, userById, paging };
