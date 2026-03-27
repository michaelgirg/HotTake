// Blocks any request that doesn't have an active session
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ error: 'You must be logged in to access this resource.' });
};

// Blocks any request where the logged-in user is not an Admin
const requireAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'Admin') return next();
    return res.status(403).json({ error: 'Admin access required.' });
};

module.exports = { requireAuth, requireAdmin };