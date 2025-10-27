require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const TMDB_KEY = process.env.TMDB_API_KEY;

// Log un avertissement si la clé TMDB manque, au lieu de crash (plus robuste pour prod)
if (!TMDB_KEY) {
  console.warn('AVERTISSEMENT: TMDB_API_KEY non défini. Les endpoints TMDB échoueront.');
}

app.use(cors());
app.use(express.json());

// Route racine pour la documentation HTML (propre et stylée avec CSS inline)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>MyBox API - Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        h1 { color: #333; text-align: center; }
        p { color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        a { color: #007BFF; text-decoration: none; }
        a:hover { text-decoration: underline; }
        footer { text-align: center; margin-top: 40px; color: #888; }
      </style>
    </head>
    <body>
      <h1>MyBox API - Documentation Professionnelle</h1>
      <p>Cette API est une implémentation similaire à MovieBox, basée sur The Movie Database (TMDB). Elle fournit des endpoints pour rechercher, obtenir des infos, sources, homepage et trending pour films et séries TV. Tous les endpoints renvoient du JSON avec un champ "success" pour indiquer le statut.</p>
      <p>Utilisation : Ajoutez votre clé TMDB via variable d'environnement pour un fonctionnement optimal. Testez les endpoints ci-dessous.</p>
      
      <table>
        <tr><th>Endpoint</th><th>Description</th><th>Paramètres</th><th>Exemple</th></tr>
        <tr>
          <td>/api/search/:query</td>
          <td>Recherche films et séries</td>
          <td>query (ex: avatar)</td>
          <td><a href="/api/search/avatar" target="_blank">Tester /api/search/avatar</a></td>
        </tr>
        <tr>
          <td>/api/info/:id</td>
          <td>Infos détaillées</td>
          <td>id (ex: movie_19995 pour Avatar, tv_1399 pour Game of Thrones)</td>
          <td><a href="/api/info/movie_19995" target="_blank">Tester /api/info/movie_19995</a></td>
        </tr>
        <tr>
          <td>/api/sources/:id</td>
          <td>Sources (trailers, providers, et pour TV : ?season=1&episode=1)</td>
          <td>id, ?season, ?episode (pour séries)</td>
          <td><a href="/api/sources/movie_19995" target="_blank">Tester /api/sources/movie_19995</a></td>
        </tr>
        <tr>
          <td>/api/homepage</td>
          <td>Contenu homepage (populaires, en salle, TV populaires)</td>
          <td>-</td>
          <td><a href="/api/homepage" target="_blank">Tester /api/homepage</a></td>
        </tr>
        <tr>
          <td>/api/trending</td>
          <td>Trending (tous médias)</td>
          <td>-</td>
          <td><a href="/api/trending" target="_blank">Tester /api/trending</a></td>
        </tr>
        <tr>
          <td>/api/download/:encodedUrl</td>
          <td>Proxy pour téléchargement (décode et redirige ou renvoie JSON)</td>
          <td>encodedUrl (URL encodée)</td>
          <td><a href="/api/download/https%3A%2F%2Fexample.com%2Fvideo.mp4" target="_blank">Tester (demo)</a></td>
        </tr>
      </table>
      
      <p>Pour plus de détails ou personnalisations, consultez le code source ou contactez le développeur. Cette API est gratuite et open-source-inspired.</p>
      <footer>© 2025 MyBox API - Powered by TMDB | Déployé sur Render</footer>
    </body>
    </html>
  `);
});

// Utilitaires TMDB (avec gestion d'erreurs améliorée)
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbGet(path, params = {}) {
  if (!TMDB_KEY) {
    throw new Error('TMDB_API_KEY manquante - Configurez-la dans les variables d\'environnement.');
  }
  params.api_key = TMDB_KEY;
  const url = `${TMDB_BASE}${path}`;
  try {
    const res = await axios.get(url, { params });
    return res.data;
  } catch (err) {
    console.error(`Erreur TMDB sur ${path}: ${err.message}`);
    throw err;
  }
}

// Route: Search (movies + tv) - Améliorée avec normalisation et filtrage
app.get('/api/search/:query', async (req, res) => {
  try {
    const q = req.params.query;
    const movieResults = await tmdbGet('/search/movie', { query: q, include_adult: false, language: 'fr-FR' });
    const tvResults = await tmdbGet('/search/tv', { query: q, language: 'fr-FR' });

    // Normalisation des résultats pour cohérence
    const results = [
      ...movieResults.results.map(r => ({
        id: `movie_${r.id}`,
        tmdb_id: r.id,
        type: 'movie',
        title: r.title || r.name,
        year: (r.release_date || '').slice(0, 4),
        poster_path: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
        overview: r.overview,
        vote_average: r.vote_average
      })),
      ...tvResults.results.map(r => ({
        id: `tv_${r.id}`,
        tmdb_id: r.id,
        type: 'tv',
        title: r.name,
        year: (r.first_air_date || '').slice(0, 4),
        poster_path: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
        overview: r.overview,
        vote_average: r.vote_average
      }))
    ];
    res.json({ success: true, query: q, count: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche TMDB' });
  }
});

// Route: Info - Avec fallback et append_to_response pour plus de données
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

    let info;
    try {
      info = await tmdbGet(`/${type}/${tmdbId}`, { language: 'fr-FR', append_to_response: 'credits,images,videos' });
    } catch (e) {
      if (type === 'movie') {
        type = 'tv';
        info = await tmdbGet(`/tv/${tmdbId}`, { language: 'fr-FR', append_to_response: 'credits,images,videos' });
      } else {
        throw e;
      }
    }

    // Ajout de normalisation pour propreté
    info.poster_path = info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : null;
    info.backdrop_path = info.backdrop_path ? `https://image.tmdb.org/t/p/original${info.backdrop_path}` : null;

    res.json({ success: true, id: raw, tmdb_id: tmdbId, type, info });
  } catch (err) {
    res.status(404).json({ success: false, message: 'Contenu non trouvé ou erreur TMDB' });
  }
});

// Route: Sources - Avec vidéos, providers et episode info
app.get('/api/sources/:id', async (req, res) => {
  try {
    const raw = req.params.id;
    let type = 'movie';
    let tmdbId = raw;

    if (raw.startsWith('movie_')) { type = 'movie'; tmdbId = raw.split('_')[1]; }
    else if (raw.startsWith('tv_')) { type = 'tv'; tmdbId = raw.split('_')[1]; }

    const season = req.query.season;
    const episode = req.query.episode;

    const videos = await tmdbGet(`/${type}/${tmdbId}/videos`, { language: 'fr-FR' });
    const providers = await tmdbGet(`/${type}/${tmdbId}/watch/providers`);

    let episodeInfo = null;
    if (type === 'tv' && season && episode) {
      try {
        episodeInfo = await tmdbGet(`/tv/${tmdbId}/season/${season}/episode/${episode}`, { language: 'fr-FR', append_to_response: 'credits,videos' });
      } catch (e) {
        episodeInfo = { message: 'Épisode non trouvé' };
      }
    }

    res.json({
      success: true,
      id: raw,
      tmdb_id: tmdbId,
      type,
      season: season || null,
      episode: episode || null,
      videos: videos.results || [],
      providers: providers.results || {},
      episode_info: episodeInfo
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des sources' });
  }
});

// Route: Homepage - Avec sections featured, now_playing, tv_popular
app.get('/api/homepage', async (req, res) => {
  try {
    const popular = await tmdbGet('/movie/popular', { language: 'fr-FR', page: 1 });
    const nowPlaying = await tmdbGet('/movie/now_playing', { language: 'fr-FR', page: 1 });
    const tvPopular = await tmdbGet('/tv/popular', { language: 'fr-FR', page: 1 });

    // Normalisation des posters pour cohérence
    const normalize = (results) => results.map(r => ({
      ...r,
      poster_path: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null
    }));

    res.json({
      success: true,
      homepage: {
        featured: normalize(popular.results.slice(0, 6)),
        now_playing: normalize(nowPlaying.results.slice(0, 6)),
        tv_popular: normalize(tvPopular.results.slice(0, 6))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la construction de la homepage' });
  }
});

// Route: Trending - Trending quotidien
app.get('/api/trending', async (req, res) => {
  try {
    const trending = await tmdbGet('/trending/all/day', { language: 'fr-FR' });

    const normalize = (results) => results.map(r => ({
      ...r,
      poster_path: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      media_type: r.media_type,
      title: r.title || r.name
    }));

    res.json({ success: true, trending: normalize(trending.results) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des trending' });
  }
});

// Route: Download proxy - Décode et renvoie JSON (pour demo), ou redirect en prod
app.get('/api/download/:encodedUrl', (req, res) => {
  try {
    const encoded = req.params.encodedUrl;
    const url = decodeURIComponent(encoded);
    // Pour un vrai proxy streaming, utilisez axios avec responseType: 'stream' et pipe(res)
    // Ici, JSON pour demo sécurisée
    res.json({ success: true, proxiedUrl: url, note: 'Utilisez cette URL pour télécharger. Implémentez un stream proxy pour prod.' });
    // Alternative: res.redirect(url); // Pour redirect direct
  } catch (err) {
    res.status(400).json({ success: false, message: 'URL encodée invalide' });
  }
});

// Gestion des erreurs globales (pro)
app.use((err, req, res, next) => {
  console.error(`Erreur globale: ${err.message}`);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

app.listen(port, () => {
  console.log(`MyBox API professionnelle en écoute sur http://localhost:${port}`);
});
