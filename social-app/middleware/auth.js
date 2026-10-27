exports.requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.status(401).json({ error: 'Please log in' });
