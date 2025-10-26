// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) {
  console.error('ERREUR: définis TMDB_API_KEY dans .env');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Utilitaires TMDB
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbGet(path, params = {}) {
  params.api_key = TMDB_KEY;
  const url = `${TMDB_BASE}${path}`;
  const res = await axios.get(url, { params });
  return res.data;
}

// Route: Search (movies + tv)
app.get('/api/search/:query', async (req, res) => {
  try {
    const q = req.params.query;
    const movieResults = await tmdbGet('/search/movie', { query: q, include_adult: false, language: 'fr-FR' });
    const tvResults = await tmdbGet('/search/tv', { query: q, language: 'fr-FR' });

    // On normalise un peu le résultat
    const results = [
      ...movieResults.results.map(r => ({ id: `movie_${r.id}`, tmdb_id: r.id, type: 'movie', title: r.title || r.name, year: (r.release_date||'').slice(0,4) })),
      ...tvResults.results.map(r => ({ id: `tv_${r.id}`, tmdb_id: r.id, type: 'tv', title: r.name, year: (r.first_air_date||'').slice(0,4) }))
    ];
    res.json({ success: true, query: q, count: results.length, results });
  } catch (err) {
    console.error(err?.message || err);
    res.status(500).json({ success: false, message: 'TMDB search failed' });
  }
});

// Route: Info (we accept id like "movie_123" or "tv_456" or plain numeric assume movie)
app.get('/api/info/:id', async (req, res) => {
  try {
    const raw = req.params.id;
    let type = 'movie';
    let tmdbId = raw;

    if (raw.startsWith('movie_')) {
      type = 'movie';
      tmdbId = raw.split('_')[1];
    } else if (raw.startsWith('tv_')) {
      type = 'tv';
      tmdbId = raw.split('_')[1];
    }

    // fallback: if numeric but unknown, try movie first then tv
    let info;
    try {
      info = await tmdbGet(`/${type}/${tmdbId}`, { language: 'fr-FR', append_to_response: 'credits,images' });
    } catch (e) {
      if (type === 'movie') {
        // try tv
        info = await tmdbGet(`/tv/${tmdbId}`, { language: 'fr-FR', append_to_response: 'credits,images' });
      } else {
        throw e;
      }
    }

    res.json({ success: true, id: raw, tmdb_id: tmdbId, info });
  } catch (err) {
    console.error(err?.message || err);
    res.status(404).json({ success: false, message: 'Not found or TMDB error' });
  }
});

// Route: Sources (returns trailers, videos and where to watch/providers if available)
// Accepts query ?season=&episode= for tv
app.get('/api/sources/:id', async (req, res) => {
  try {
    const raw = req.params.id;
    let type = 'movie';
    let tmdbId = raw;

    if (raw.startsWith('movie_')) { type = 'movie'; tmdbId = raw.split('_')[1]; }
    else if (raw.startsWith('tv_')) { type = 'tv'; tmdbId = raw.split('_')[1]; }

    // for tv episodes we still use tv/{id}/season/{s}/episode/{e} for episode-specific info if provided
    const season = req.query.season;
    const episode = req.query.episode;

    // Get videos (trailers, teasers)
    const videos = await tmdbGet(`/${type}/${tmdbId}/videos`, { language: 'fr-FR' });

    // Get watch/providers
    const providers = await tmdbGet(`/${type}/${tmdbId}/watch/providers`);

    // If tv episode provided, get episode details (if available)
    let episodeInfo = null;
    if (type === 'tv' && season && episode) {
      try {
        episodeInfo = await tmdbGet(`/tv/${tmdbId}/season/${season}/episode/${episode}`, { language: 'fr-FR', append_to_response: 'credits' });
      } catch (e) {
        episodeInfo = null;
      }
    }

    // Build "sources": we will expose official TMDB videos (youtube/vimeo keys), and providers object
    const results = {
      success: true,
      id: raw,
      tmdb_id: tmdbId,
      type,
      season: season || null,
      episode: episode || null,
      videos: videos.results || [],
      providers: providers.results || {},
      episode_info: episodeInfo
    };

    res.json(results);
  } catch (err) {
    console.error(err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to fetch sources' });
  }
});

// Route: homepage (we return popular movies + trending)
app.get('/api/homepage', async (req, res) => {
  try {
    const popular = await tmdbGet('/movie/popular', { language: 'fr-FR', page: 1 });
    const nowPlaying = await tmdbGet('/movie/now_playing', { language: 'fr-FR', page: 1 });
    const tvPopular = await tmdbGet('/tv/popular', { language: 'fr-FR', page: 1 });

    res.json({
      success: true,
      homepage: {
        featured: popular.results.slice(0,6),
        now_playing: nowPlaying.results.slice(0,6),
        tv_popular: tvPopular.results.slice(0,6)
      }
    });
  } catch (err) {
    console.error(err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to build homepage' });
  }
});

// Route: trending
app.get('/api/trending', async (req, res) => {
  try {
    const trending = await tmdbGet('/trending/all/day', { language: 'fr-FR' });
    res.json({ success: true, trending: trending.results });
  } catch (err) {
    console.error(err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to fetch trending' });
  }
});

// Route: download proxy demo — decodes the encoded URL and offers a redirect or JSON.
// NOTE: for real streaming proxy implement streaming with proper headers and CORS.
app.get('/api/download/:encodedUrl', (req, res) => {
  try {
    const encoded = req.params.encodedUrl;
    const url = decodeURIComponent(encoded);
    // Option A: redirect to the original URL (fast but won't hide referrer)
    // res.redirect(url);

    // Option B: return JSON showing decoded URL (for demo)
    res.json({ success: true, proxiedUrl: url, note: 'Pour un vrai proxy, implémente le streaming côté serveur avec les headers adéquats.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid encoded url' });
  }
});

app.listen(port, () => {
  console.log(`MovieBox-like API (TMDB) running on http://localhost:${port}`);
});
