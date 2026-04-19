const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

const VALID_STATUSES = new Set(['planning', 'watching', 'reading', 'completed', 'paused', 'dropped']);

async function ensureTitleExists(titleId) {
    const { rows } = await db.query('SELECT id FROM titles WHERE id = $1', [titleId]);
    return rows[0];
}

router.post('/logs', requireAuth, async (req, res, next) => {
    const { titleId, status } = req.body;

    if (!titleId || !status) {
        return res.status(400).json({ error: 'titleId and status are required.' });
    }

    if (!VALID_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid log status.' });
    }

    try {
        if (!(await ensureTitleExists(titleId))) {
            return res.status(404).json({ error: 'Title not found.' });
        }

        const { rows } = await db.query(
            `
            INSERT INTO logs (user_id, title_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, title_id)
            DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
            RETURNING id, user_id, title_id, status, created_at, updated_at
            `,
            [req.user.id, titleId, status]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

router.post('/ratings', requireAuth, async (req, res, next) => {
    const { titleId, rating } = req.body;
    const numericRating = Number(rating);

    if (!titleId || !Number.isInteger(numericRating)) {
        return res.status(400).json({ error: 'titleId and an integer rating are required.' });
    }

    if (numericRating < 1 || numericRating > 10) {
        return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
    }

    try {
        if (!(await ensureTitleExists(titleId))) {
            return res.status(404).json({ error: 'Title not found.' });
        }

        const { rows } = await db.query(
            `
            INSERT INTO ratings (user_id, title_id, rating)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, title_id)
            DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
            RETURNING id, user_id, title_id, rating, created_at, updated_at
            `,
            [req.user.id, titleId, numericRating]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

router.post('/reviews', requireAuth, async (req, res, next) => {
    const { titleId, logId, content } = req.body;
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!titleId || !trimmedContent) {
        return res.status(400).json({ error: 'titleId and review content are required.' });
    }

    if (trimmedContent.length > 2000) {
        return res.status(400).json({ error: 'Review must be 2000 characters or less.' });
    }

    try {
        if (!(await ensureTitleExists(titleId))) {
            return res.status(404).json({ error: 'Title not found.' });
        }

        let attachedLogId = logId || null;
        if (attachedLogId) {
            const { rows: logRows } = await db.query(
                'SELECT id FROM logs WHERE id = $1 AND user_id = $2 AND title_id = $3',
                [attachedLogId, req.user.id, titleId]
            );
            if (!logRows[0]) {
                return res.status(404).json({ error: 'Log not found for this title.' });
            }
        } else {
            const { rows: logRows } = await db.query(
                `
                INSERT INTO logs (user_id, title_id, status)
                VALUES ($1, $2, 'watching')
                ON CONFLICT (user_id, title_id)
                DO UPDATE SET updated_at = logs.updated_at
                RETURNING id
                `,
                [req.user.id, titleId]
            );
            attachedLogId = logRows[0].id;
        }

        const { rows } = await db.query(
            `
            INSERT INTO reviews (user_id, title_id, log_id, content)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, title_id)
            DO UPDATE SET log_id = EXCLUDED.log_id, content = EXCLUDED.content, updated_at = NOW()
            RETURNING id, user_id, title_id, log_id, content, created_at, updated_at
            `,
            [req.user.id, titleId, attachedLogId, trimmedContent]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT
              l.id AS log_id,
              l.status,
              l.updated_at AS logged_at,
              t.id AS title_id,
              t.name,
              t.type,
              t.genre,
              t.release_year,
              r.rating,
              rv.id AS review_id,
              rv.content AS review
            FROM logs l
            JOIN titles t ON t.id = l.title_id
            LEFT JOIN ratings r ON r.user_id = l.user_id AND r.title_id = l.title_id
            LEFT JOIN reviews rv ON rv.user_id = l.user_id AND rv.title_id = l.title_id
            WHERE l.user_id = $1
            ORDER BY l.updated_at DESC
            LIMIT 50
            `,
            [req.user.id]
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
