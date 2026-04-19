const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

async function loadProfile(userId, viewerId) {
    const { rows: users } = await db.query(
        `
        SELECT id, username, display_name, bio, created_at
        FROM users
        WHERE id = $1 AND is_active = TRUE
        `,
        [userId]
    );

    if (!users[0]) return null;

    const { rows: activities } = await db.query(
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
          rv.content AS review,
          rv.updated_at AS reviewed_at
        FROM logs l
        JOIN titles t ON t.id = l.title_id
        LEFT JOIN ratings r ON r.user_id = l.user_id AND r.title_id = l.title_id
        LEFT JOIN reviews rv ON rv.user_id = l.user_id AND rv.title_id = l.title_id
        WHERE l.user_id = $1
          AND (
            $1 = $2
            OR EXISTS (
              SELECT 1 FROM friendships
              WHERE user_id = $2 AND friend_id = $1
            )
          )
        ORDER BY l.updated_at DESC
        LIMIT 30
        `,
        [userId, viewerId]
    );

    return {
        user: users[0],
        activity: activities,
    };
}

router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const profile = await loadProfile(req.user.id, req.user.id);
        return res.json(profile);
    } catch (err) {
        return next(err);
    }
});

router.patch('/me', requireAuth, async (req, res, next) => {
    const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : '';
    const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : '';

    if (displayName.length > 80) {
        return res.status(400).json({ error: 'Display name must be 80 characters or less.' });
    }

    if (bio.length > 500) {
        return res.status(400).json({ error: 'Bio must be 500 characters or less.' });
    }

    try {
        const { rows } = await db.query(
            `
            UPDATE users
            SET display_name = NULLIF($1, ''), bio = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, username, email, role, display_name, bio
            `,
            [displayName, bio, req.user.id]
        );

        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const profile = await loadProfile(req.params.id, req.user.id);

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        return res.json(profile);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
