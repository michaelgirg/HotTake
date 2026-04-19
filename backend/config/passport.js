const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/database');

passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
        try {
            const { rows } = await db.query(
                'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
                [email.toLowerCase()]
            );
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: 'Invalid email or password.' });
            }

            const match = bcrypt.compareSync(password, user.password_hash);
            if (!match) {
                return done(null, false, { message: 'Invalid email or password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Store user id & role in session
passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
});

// Attach full user to req.user on every request
passport.deserializeUser(async (sessionUser, done) => {
    try {
        const { rows } = await db.query(
            'SELECT id, username, email, role, display_name, bio FROM users WHERE id = $1 AND is_active = TRUE',
            [sessionUser.id]
        );
        const user = rows[0];

        if (!user) return done(null, false);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
