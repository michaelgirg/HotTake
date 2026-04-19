require('dotenv').config();

const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const cors = require('cors');
require('./config/passport');

const { requireAuth, requireAdmin } = require('./middleware/authMiddleware');
const { pool } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

app.set('trust proxy', 1);
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

app.use(session({
    store: new PgSession({
        pool,
        createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
app.use('/api/titles', require('./routes/titles'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin/moderation', require('./routes/moderation'));

app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`HotTake API running on port ${PORT}`);
});

module.exports = app;
