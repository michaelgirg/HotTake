require('dotenv').config();
require('./db/database');

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('./config/passport');

const { requireAuth, requireAdmin } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes AFTER passport middleware
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, you are authenticated.` });
});

app.get('/api/admin', requireAdmin, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, you have admin access.` });
});

app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`HotTake API running on http://localhost:${PORT}`);
});

app.use('/api/titles', require('./routes/titles'));

module.exports = app;