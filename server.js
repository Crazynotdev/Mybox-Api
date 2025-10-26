const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // Remplacez par votre clé TMDB
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Pour servir la doc HTML

// Helper pour requêtes TMDB
async function tmdbRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: { ...params, api_key: TMDB_API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la requête TMDB');
  }
}

// /api/search/:query - Recherche films/séries
app.get('/api/search/:query', async (req, res) => {
  try {
    const data = await tmdbRequest('/search/multi', { query: req.params.query });
    res.json(data.results.map(item => ({
      id: item.id,
      title: item.title || item.name,
      type: item.media_type,
      release_date: item.release_date || item.first_air_date,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erreur de recherche' });
  }
});

// /api/info/:id - Infos détaillées (film ou série)
app.get('/api/info/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Déterminer si film ou série (on essaie film d'abord)
    let data = await tmdbRequest(`/movie/${id}`);
    if (!data.title) {
      data = await tmdbRequest(`/tv/${id}`);
    }
    res.json({
      title: data.title || data.name,
      synopsis: data.overview,
      release_date: data.release_date || data.first_air_date,
      rating: data.vote_average,
      genres: data.genres.map(g => g.name),
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      cast: (await tmdbRequest(`/movie/${id}/credits` || `/tv/${id}/credits`)).cast.slice(0, 5).map(c => c.name),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur d\'infos' });
  }
});

// /api/sources/:id - Sources de téléchargement (dummy pour l'exemple, remplacez par scraping réel)
app.get('/api/sources/:id', (req, res) => {
  const season = req.query.season;
  const episode = req.query.episode;
  const isTV = season && episode;
  res.json([
    { quality: '360p', url: `https://dummy-link.com/${req.params.id}${isTV ? `?s=${season}&e=${episode}` : ''}/360p.mp4`, proxy_url: `/api/download/dummy360` },
    { quality: '720p', url: `https://dummy-link.com/${req.params.id}${isTV ? `?s=${season}&e=${episode}` : ''}/720p.mp4`, proxy_url: `/api/download/dummy720` },
    { quality: '1080p', url: `https://dummy-link.com/${req.params.id}${isTV ? `?s=${season}&e=${episode}` : ''}/1080p.mp4`, proxy_url: `/api/download/dummy1080` },
  ]);
});

// /api/homepage - Contenu homepage (populaires)
app.get('/api/homepage', async (req, res) => {
  try {
    const movies = await tmdbRequest('/movie/popular');
    const tv = await tmdbRequest('/tv/popular');
    res.json({
      featured: movies.results.slice(0, 5),
      trending_movies: movies.results,
      trending_tv: tv.results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur homepage' });
  }
});

// /api/trending - Trending
app.get('/api/trending', async (req, res) => {
  try {
    const data = await tmdbRequest('/trending/all/week');
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ error: 'Erreur trending' });
  }
});

// /api/download/:encodedVideoUrl - Proxy pour téléchargement (ajoute headers mobiles)
app.get('/api/download/:encodedVideoUrl', (req, res) => {
  const url = decodeURIComponent(req.params.encodedVideoUrl);
  // Proxy simple avec headers (remplacez url par une vraie si besoin)
  axios.get(url, { responseType: 'stream', headers: { 'User-Agent': 'MovieBoxApp/1.0' } })
    .then(response => response.data.pipe(res))
    .catch(() => res.status(500).json({ error: 'Erreur de proxy' }));
});

// Endpoint supplémentaire (plus avancé) : /api/recommendations/:id - Recommandations
app.get('/api/recommendations/:id', async (req, res) => {
  try {
    const data = await tmdbRequest(`/movie/${req.params.id}/recommendations`); // Ou /tv pour séries
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ error: 'Erreur de recommandations' });
  }
});

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
