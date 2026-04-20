const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/activity', requireAdmin, async (req, res, next) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    try {
        const { rows } = await db.query(
            `
            WITH admin_items AS (
              SELECT
                'log' AS kind,
                l.id,
                l.user_id,
                l.title_id,
                l.status AS body,
                NULL::numeric AS rating,
                l.updated_at AS created_at
              FROM logs l
              UNION ALL
              SELECT
                'rating' AS kind,
                r.id,
                r.user_id,
                r.title_id,
                NULL::text AS body,
                r.rating,
                r.updated_at AS created_at
              FROM ratings r
              UNION ALL
              SELECT
                'review' AS kind,
                rv.id,
                rv.user_id,
                rv.title_id,
                rv.content AS body,
                NULL::numeric AS rating,
                rv.updated_at AS created_at
              FROM reviews rv
            )
            SELECT
              ai.kind,
              ai.id,
              ai.body,
              ai.rating,
              ai.created_at,
              u.id AS user_id,
              u.username,
              u.display_name,
              u.is_active,
              t.id AS title_id,
              t.name AS title_name,
              t.type,
              t.format,
              t.genre,
              t.release_year,
              t.image_url
            FROM admin_items ai
            JOIN users u ON u.id = ai.user_id
            JOIN titles t ON t.id = ai.title_id
            ORDER BY ai.created_at DESC
            LIMIT $1
            `,
            [limit]
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

router.get('/users', requireAdmin, async (_req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT id, username, email, role, display_name, is_active, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 100
            `
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

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

router.delete('/ratings/:id', requireAdmin, async (req, res, next) => {
    try {
        const { rowCount } = await db.query('DELETE FROM ratings WHERE id = $1', [req.params.id]);

        if (!rowCount) {
            return res.status(404).json({ error: 'Rating not found.' });
        }

        return res.json({ message: 'Rating removed.' });
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
