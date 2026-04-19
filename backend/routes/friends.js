const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT u.id, u.username, u.display_name, u.bio, f.created_at
            FROM friendships f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = $1 AND u.is_active = TRUE
            ORDER BY COALESCE(u.display_name, u.username), u.username
            `,
            [req.user.id]
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

router.get('/requests', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT fr.id, fr.status, fr.created_at, u.id AS requester_id, u.username, u.display_name
            FROM friend_requests fr
            JOIN users u ON u.id = fr.requester_id
            WHERE fr.receiver_id = $1 AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
            `,
            [req.user.id]
        );

        return res.json(rows);
    } catch (err) {
        return next(err);
    }
});

router.post('/requests', requireAuth, async (req, res, next) => {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    try {
        const { rows: users } = await db.query(
            'SELECT id, username FROM users WHERE lower(username) = lower($1) AND is_active = TRUE',
            [username]
        );
        const receiver = users[0];

        if (!receiver) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (Number(receiver.id) === Number(req.user.id)) {
            return res.status(400).json({ error: 'You cannot add yourself.' });
        }

        const existingFriendship = await db.query(
            'SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2',
            [req.user.id, receiver.id]
        );
        if (existingFriendship.rows[0]) {
            return res.status(409).json({ error: 'You are already friends.' });
        }

        const existingRequest = await db.query(
            `
            SELECT id, status FROM friend_requests
            WHERE (requester_id = $1 AND receiver_id = $2)
               OR (requester_id = $2 AND receiver_id = $1)
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [req.user.id, receiver.id]
        );

        if (existingRequest.rows[0]?.status === 'pending') {
            return res.status(409).json({ error: 'A friend request is already pending.' });
        }

        const { rows } = await db.query(
            `
            INSERT INTO friend_requests (requester_id, receiver_id)
            VALUES ($1, $2)
            ON CONFLICT (requester_id, receiver_id)
            DO UPDATE SET status = 'pending', updated_at = NOW()
            RETURNING id, requester_id, receiver_id, status, created_at
            `,
            [req.user.id, receiver.id]
        );

        return res.status(201).json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

router.post('/requests/:id/respond', requireAuth, async (req, res, next) => {
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'Action must be accept or decline.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
            SELECT id, requester_id, receiver_id, status
            FROM friend_requests
            WHERE id = $1 AND receiver_id = $2
            FOR UPDATE
            `,
            [req.params.id, req.user.id]
        );
        const request = rows[0];

        if (!request || request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pending friend request not found.' });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'declined';
        await client.query(
            'UPDATE friend_requests SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, request.id]
        );

        if (action === 'accept') {
            await client.query(
                `
                INSERT INTO friendships (user_id, friend_id)
                VALUES ($1, $2), ($2, $1)
                ON CONFLICT (user_id, friend_id) DO NOTHING
                `,
                [request.requester_id, request.receiver_id]
            );
        }

        await client.query('COMMIT');
        return res.json({ id: request.id, status: newStatus });
    } catch (err) {
        await client.query('ROLLBACK');
        return next(err);
    } finally {
        client.release();
    }
});

module.exports = router;
