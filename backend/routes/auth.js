const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Check for duplicate email or username
    try {
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1 OR lower(username) = lower($2)',
            [email.toLowerCase(), username]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email or username already in use.' });
        }

        const password_hash = bcrypt.hashSync(password, 10);

        const result = await db.query(
            `
            INSERT INTO users (username, email, password_hash, display_name)
            VALUES ($1, $2, $3, $1)
            RETURNING id
            `,
            [username, email.toLowerCase(), password_hash]
        );

        return res.status(201).json({
            message: 'User registered successfully.',
            userId: result.rows[0].id
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email or username already in use.' });
        }
        return next(err);
    }
});

const passport = require('../config/passport');

// POST /api/auth/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({
                message: 'Logged in successfully.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        });
    })(req, res, next);
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Logged out successfully.' });
        });
    });
});
module.exports = router;
