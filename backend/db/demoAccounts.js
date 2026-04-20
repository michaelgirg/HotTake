require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const demoAccounts = [
    {
        username: 'demo_member',
        email: 'demo@hottake.app',
        password: 'DemoPass123!',
        role: 'Member',
        displayName: 'Demo Member',
        bio: 'Demo account for regular user flows.',
    },
    {
        username: 'demo_admin',
        email: 'admin@hottake.app',
        password: 'AdminPass123!',
        role: 'Admin',
        displayName: 'Demo Admin',
        bio: 'Demo account for admin and moderation flows.',
    },
];

async function upsertDemoAccount(account) {
    const passwordHash = bcrypt.hashSync(account.password, 10);

    const { rows } = await pool.query(
        `
        INSERT INTO users (username, email, password_hash, role, display_name, bio, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT (email)
        DO UPDATE SET
            username = EXCLUDED.username,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio,
            is_active = TRUE,
            updated_at = NOW()
        RETURNING id, username, email, role
        `,
        [
            account.username,
            account.email.toLowerCase(),
            passwordHash,
            account.role,
            account.displayName,
            account.bio,
        ]
    );

    return rows[0];
}

async function seedDemoAccounts() {
    for (const account of demoAccounts) {
        const user = await upsertDemoAccount(account);
        console.log(`Ready: ${user.email} (${user.role})`);
    }

    console.log('Demo accounts seeded. Plain-text passwords were not stored in the database.');
}

seedDemoAccounts()
    .catch((err) => {
        console.error('Demo account seed failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
