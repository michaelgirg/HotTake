const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /api/titles/search?q=<name>
router.get('/search', requireAuth, (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    const results = db.prepare(`
    SELECT id, name, type, genre, release_year
    FROM titles
    WHERE name LIKE ?
    ORDER BY name ASC
    LIMIT 20
  `).all(`%${q.trim()}%`);

    return res.status(200).json(results);
});

module.exports = router;