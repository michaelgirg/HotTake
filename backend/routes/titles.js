const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /api/titles/search?q=<name>
router.get('/search', requireAuth, async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        const { rows } = await db.query(`
            SELECT id, name, type, genre, release_year, description
            FROM titles
            WHERE name ILIKE $1 OR genre ILIKE $1 OR type ILIKE $1
            ORDER BY name ASC
            LIMIT 20
        `, [`%${q.trim()}%`]);

        return res.status(200).json(rows);
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT id, name, type, genre, release_year, description
            FROM titles
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Title not found.' });
        }

        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
