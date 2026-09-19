const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'audit-workflow-secret-change-in-prod';

/**
 * Verifies the JWT from the Authorization header.
 * Attaches req.user = { id, firmId, role, name, email } on success.
 */
async function authenticate(req, res, next) {
  // Accept token from Authorization header OR ?token= query param
  // (query param needed for window.open() file downloads — browsers can't set headers on new tabs)
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }

  try {
    const user = await db.queryOne(
      'SELECT id, firm_id, name, email, role FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = {
      id:     user.id,
      firmId: user.firm_id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

module.exports = { authenticate, JWT_SECRET };
