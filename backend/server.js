require('./config/passport'); // loads strategy & serialize/deserialize
require('dotenv').config();
require('./db/database'); // initializes DB & creates tables on startup

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true  // required for session cookies to work cross-origin
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check, useful for Render deployment smoke tests
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes added as subsequent PBIs are completed
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/titles', require('./routes/titles'));

app.listen(PORT, () => {
    console.log(`HotTake API running on http://localhost:${PORT}`);
});

module.exports = app;