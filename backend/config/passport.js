const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/database');

passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    (email, password, done) => {
        const user = db.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).get(email.toLowerCase());

        if (!user) {
            return done(null, false, { message: 'Invalid email or password.' });
        }

        const match = bcrypt.compareSync(password, user.password_hash);
        if (!match) {
            return done(null, false, { message: 'Invalid email or password.' });
        }

        return done(null, user);
    }
));

// Store user id & role in session
passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
});

// Attach full user to req.user on every request
passport.deserializeUser((sessionUser, done) => {
    const user = db.prepare(
        'SELECT id, username, email, role, display_name, bio FROM users WHERE id = ?'
    ).get(sessionUser.id);

    if (!user) return done(null, false);
    done(null, user);
});

module.exports = passport;