const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const m = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + ext[f.mimetype]),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, f, cb) =>
    ext[f.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only jpg, png or webp images'), { status: 400 })),
});
module.exports = { image: m.single('image'), avatar: m.single('avatar') };
