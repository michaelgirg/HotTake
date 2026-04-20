const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

function pickImage(anime) {
    return (
        anime.images?.webp?.large_image_url ||
        anime.images?.jpg?.large_image_url ||
        anime.images?.webp?.image_url ||
        anime.images?.jpg?.image_url ||
        null
    );
}

function pickYear(anime) {
    return anime.year || anime.aired?.prop?.from?.year || 0;
}

function mapAnime(anime) {
    const genres = [...(anime.genres || []), ...(anime.demographics || [])]
        .map((genre) => genre.name)
        .filter(Boolean);

    return {
        name: anime.title_english || anime.title,
        type: 'Anime',
        format: anime.type || 'Anime',
        genre: genres.join(', ') || 'Anime',
        release_year: pickYear(anime),
        description: anime.synopsis || '',
        image_url: pickImage(anime),
        synopsis: anime.synopsis || '',
        external_source: 'jikan',
        external_id: String(anime.mal_id),
        score: anime.score || null,
        episodes: anime.episodes || null,
        airing_status: anime.status || null,
        url: anime.url,
    };
}

async function jikanRequest(path, params = {}) {
    const url = new URL(`${JIKAN_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Jikan request failed with status ${response.status}`);
    }

    return response.json();
}

async function searchAnime(query, limit = 8) {
    const data = await jikanRequest('/anime', {
        q: query,
        sfw: true,
        limit,
        order_by: 'popularity',
        sort: 'asc',
    });

    return (data.data || []).map(mapAnime).filter((anime) => anime.name && anime.external_id);
}

async function getAnimeById(malId) {
    const data = await jikanRequest(`/anime/${malId}`);
    return mapAnime(data.data);
}

module.exports = {
    getAnimeById,
    searchAnime,
};
