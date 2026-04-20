const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/authMiddleware');
const { getAnimeById, searchAnime } = require('../services/jikan');

const TITLE_COLUMNS = `
    id,
    name,
    type,
    format,
    genre,
    release_year,
    description,
    image_url,
    synopsis,
    external_source,
    external_id,
    score,
    episodes,
    airing_status
`;

async function upsertAnimeTitle(anime) {
    const existing = await db.query(
        `
        SELECT ${TITLE_COLUMNS}
        FROM titles
        WHERE external_source = $1 AND external_id = $2
        `,
        [anime.external_source, anime.external_id]
    );

    if (existing.rows[0]) {
        return existing.rows[0];
    }

    const { rows } = await db.query(
        `
        INSERT INTO titles (
            name,
            type,
            format,
            genre,
            release_year,
            description,
            image_url,
            synopsis,
            external_source,
            external_id,
            score,
            episodes,
            airing_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (name, type, release_year)
        DO UPDATE SET
            name = EXCLUDED.name,
            format = EXCLUDED.format,
            genre = EXCLUDED.genre,
            release_year = EXCLUDED.release_year,
            description = EXCLUDED.description,
            image_url = EXCLUDED.image_url,
            synopsis = EXCLUDED.synopsis,
            external_source = COALESCE(titles.external_source, EXCLUDED.external_source),
            external_id = COALESCE(titles.external_id, EXCLUDED.external_id),
            score = EXCLUDED.score,
            episodes = EXCLUDED.episodes,
            airing_status = EXCLUDED.airing_status,
            updated_at = NOW()
        RETURNING ${TITLE_COLUMNS}
        `,
        [
            anime.name,
            anime.type,
            anime.format,
            anime.genre,
            anime.release_year || 0,
            anime.description,
            anime.image_url,
            anime.synopsis,
            anime.external_source,
            anime.external_id,
            anime.score,
            anime.episodes,
            anime.airing_status,
        ]
    );

    return rows[0];
}

// GET /api/titles/search?q=<name>
router.get('/search', requireAuth, async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        const { rows } = await db.query(`
            SELECT ${TITLE_COLUMNS}
            FROM titles
            WHERE name ILIKE $1 OR genre ILIKE $1 OR type ILIKE $1
            ORDER BY name ASC
            LIMIT 20
        `, [`%${q.trim()}%`]);

        return res.status(200).json(rows);
    } catch (err) {
        return next(err);
    }
});

router.get('/external/search', requireAuth, async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        const results = await searchAnime(q.trim());
        return res.json(results);
    } catch (err) {
        return next(err);
    }
});

router.post('/import', requireAuth, async (req, res, next) => {
    const { externalSource, externalId } = req.body;

    if (externalSource !== 'jikan' || !externalId) {
        return res.status(400).json({ error: 'A Jikan externalId is required.' });
    }

    try {
        const anime = await getAnimeById(externalId);
        const title = await upsertAnimeTitle(anime);
        return res.status(201).json(title);
    } catch (err) {
        return next(err);
    }
});

router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const { rows } = await db.query(
            `
            SELECT ${TITLE_COLUMNS}
            FROM titles
            WHERE id = $1
            `,
            [req.params.id]
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Title not found.' });
        }

        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
