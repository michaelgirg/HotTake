const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// POST /api/auth/register
router.post('/register', (req, res) => {
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
    const existing = db.prepare(
        'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email.toLowerCase(), username);

    if (existing) {
        return res.status(409).json({ error: 'Email or username already in use.' });
    }

    // Hash password and insert
    const password_hash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `).run(username, email.toLowerCase(), password_hash);

    return res.status(201).json({
        message: 'User registered successfully.',
        userId: result.lastInsertRowid
    });
});

module.exports = router;