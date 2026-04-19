const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin } = require('../middleware/authMiddleware');

router.delete('/reviews/:id', requireAdmin, async (req, res, next) => {
    try {
        const { rowCount } = await db.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);

        if (!rowCount) {
            return res.status(404).json({ error: 'Review not found.' });
        }

        return res.json({ message: 'Review removed.' });
    } catch (err) {
        return next(err);
    }
});

router.delete('/logs/:id', requireAdmin, async (req, res, next) => {
    try {
        const { rowCount } = await db.query('DELETE FROM logs WHERE id = $1', [req.params.id]);

        if (!rowCount) {
            return res.status(404).json({ error: 'Log not found.' });
        }

        return res.json({ message: 'Log removed.' });
    } catch (err) {
        return next(err);
    }
});

router.patch('/users/:id/deactivate', requireAdmin, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            UPDATE users
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1
            RETURNING id, username, is_active
            `,
            [req.params.id]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
