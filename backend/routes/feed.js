const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res, next) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    try {
        const { rows } = await db.query(
            `
            WITH visible_users AS (
              SELECT friend_id AS id FROM friendships WHERE user_id = $1
              UNION SELECT $1::bigint AS id
            ),
            feed_items AS (
              SELECT
                'log' AS kind,
                l.id,
                l.user_id,
                l.title_id,
                l.status AS body,
                NULL::integer AS rating,
                l.updated_at AS created_at
              FROM logs l
              WHERE l.user_id IN (SELECT id FROM visible_users)
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
              WHERE r.user_id IN (SELECT id FROM visible_users)
              UNION ALL
              SELECT
                'review' AS kind,
                rv.id,
                rv.user_id,
                rv.title_id,
                rv.content AS body,
                NULL::integer AS rating,
                rv.updated_at AS created_at
              FROM reviews rv
              WHERE rv.user_id IN (SELECT id FROM visible_users)
            )
            SELECT
              fi.kind,
              fi.id,
              fi.body,
              fi.rating,
              fi.created_at,
              u.id AS user_id,
              u.username,
              u.display_name,
              t.id AS title_id,
              t.name AS title_name,
              t.type,
              t.genre,
              t.release_year
            FROM feed_items fi
            JOIN users u ON u.id = fi.user_id
            JOIN titles t ON t.id = fi.title_id
            WHERE u.is_active = TRUE
            ORDER BY fi.created_at DESC
            LIMIT $2
            `,
            [req.user.id, limit]
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
