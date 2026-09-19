/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.post('/clients', authenticate, requireRole('admin'), handler)
 *   router.post('/review/approve', authenticate, requireRole('reviewer', 'admin'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
