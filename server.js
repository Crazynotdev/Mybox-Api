require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const TMDB_KEY = process.env.TMDB_API_KEY;


if (!TMDB_KEY) {
  console.warn('AVERTISSEMENT: TMDB_API_KEY non défini. Les endpoints TMDB échoueront.');
}

app.use(cors());
app.use(express.json());


let watchlist = [{ userId: 'user1', items: ['movie_19995'] }]; // :/


app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MyBox API - Documentation</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f0f4f8, #d9e2ec);
          color: #333;
        }
        h1 {
          text-align: center;
          color: #2c3e50;
          font-size: 2.5em;
          margin-bottom: 10px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        h2 {
          color: #34495e;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
          margin-top: 40px;
        }
        p {
          line-height: 1.6;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 20px 0;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #e9f1f7;
          transition: background 0.3s ease;
        }
        a {
          color: #3498db;
          text-decoration: none;
          font-weight: bold;
        }
        a:hover {
          color: #2980b9;
          text-decoration: underline;
        }
        .icon {
          margin-right: 8px;
          color: #3498db;
        }
        footer {
          text-align: center;
          margin-top: 50px;
          color: #777;
          font-size: 0.9em;
        }
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr { display: block; }
          th { position: absolute; top: -9999px; left: -9999px; }
          tr { border: 1px solid #ccc; margin-bottom: 10px; }
          td { border: none; border-bottom: 1px solid #eee; position: relative; padding-left: 50%; }
          td:before { position: absolute; top: 12px; left: 6px; width: 45%; padding-right: 10px; white-space: nowrap; font-weight: bold; }
          td:nth-of-type(1):before { content: "Endpoint"; }
          td:nth-of-type(2):before { content: "Description"; }
          td:nth-of-type(3):before { content: "Paramètres"; }
          td:nth-of-type(4):before { content: "Exemple"; }
        }
      </style>
    </head>
    <body>
      <h1><i class="fas fa-film icon"></i> MyBox API - Documentation by Crazy</h1>
      <p>Bienvenue sur l'API MyBox, une solution inspirée de MovieBox et propulsée par The Movie Database (TMDB). Elle offre des endpoints puissants pour gérer films, séries, streaming et plus. Tous les réponses sont en JSON avec un champ "success" pour le statut.</p>
      <p>Pour un site de streaming : Intégrez ces routes à votre frontend pour une expérience fluide. Les sources incluent des liens légaux vers des plateformes comme Netflix.</p>
      
      <h2><i class="fas fa-list icon"></i> Endpoints Disponibles</h2>
      <table>
        <tr><th>Endpoint</th><th>Description</th><th>Paramètres</th><th>Exemple</th></tr>
        <tr>
          <td>/api/search/:query</td>
          <td>Recherche films et séries</td>
          <td>query (ex: avatar)</td>
          <td><a href="/api/search/avatar" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/info/:id</td>
          <td>Infos détaillées</td>
          <td>id (ex: movie_19995)</td>
          <td><a href="/api/info/movie_19995" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/sources/:id</td>
          <td>Sources (trailers, providers)</td>
          <td>id, ?season=1&episode=1 (pour TV)</td>
          <td><a href="/api/sources/movie_19995" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/homepage</td>
          <td>Contenu homepage</td>
          <td>-</td>
          <td><a href="/api/homepage" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/trending</td>
          <td>Trending</td>
          <td>-</td>
          <td><a href="/api/trending" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/download/:encodedUrl</td>
          <td>Proxy pour téléchargement (demo)</td>
          <td>encodedUrl</td>
          <td><a href="/api/download/https%3A%2F%2Fexample.com%2Fvideo.mp4" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/genres</td>
          <td>Liste des genres</td>
          <td>?type=movie ou tv</td>
          <td><a href="/api/genres?type=movie" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/discover</td>
          <td>Découverte de contenu</td>
          <td>?type=movie ou tv, ?genre=28, ?page=1</td>
          <td><a href="/api/discover?type=movie&genre=28" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/seasons/:id</td>
          <td>Saisons d'une série</td>
          <td>id (ex: tv_1399)</td>
          <td><a href="/api/seasons/tv_1399" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/episodes/:id/:season</td>
          <td>Épisodes d'une saison</td>
          <td>id, season (ex: tv_1399/1)</td>
          <td><a href="/api/episodes/tv_1399/1" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
        <tr>
          <td>/api/watchlist (GET/POST)</td>
          <td>Gestion watchlist (demo)</td>
          <td>GET: ?userId=1 ; POST: body {userId, itemId}</td>
          <td>Utilisez Postman pour tester</td>
        </tr>
        <tr>
          <td>/api/embed/:id</td>
          <td>Embed pour trailer</td>
          <td>id</td>
          <td><a href="/api/embed/movie_19995" target="_blank">Tester <i class="fas fa-external-link-alt"></i></a></td>
        </tr>
      </table>
      
      <h2><i class="fas fa-info-circle icon"></i> Conseils d'Utilisation</h2>
      <p>Intégrez cette API à votre site de streaming pour une expérience utilisateur optimale. Pour des fonctionnalités avancées comme l'authentification, contactez le développeur.</p>
      
      <footer>© 2025 MyBox API - Powered by Crazy</footer>
    </body>
    </html>
  `);
});


const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbGet(path, params = {}) {
  if (!TMDB_KEY) {
    throw new Error('TMDB_API_KEY manquante');
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


app.get('/api/search/:query', async (req, res) => {
  try {
    const q = req.params.query;
    const movieResults = await tmdbGet('/search/movie', { query: q, include_adult: false, language: 'fr-FR' });
    const tvResults = await tmdbGet('/search/tv', { query: q, language: 'fr-FR' });

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
    res.status(500).json({ success: false, message: 'Erreur lors de la recherche' });
  }
});


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

    info.poster_path = info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : null;
    info.backdrop_path = info.backdrop_path ? `https://image.tmdb.org/t/p/original${info.backdrop_path}` : null;

    res.json({ success: true, id: raw, tmdb_id: tmdbId, type, info });
  } catch (err) {
    res.status(404).json({ success: false, message: 'Contenu non trouvé ou erreur TMDB' });
  }
});


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


app.get('/api/homepage', async (req, res) => {
  try {
    const popular = await tmdbGet('/movie/popular', { language: 'fr-FR', page: 1 });
    const nowPlaying = await tmdbGet('/movie/now_playing', { language: 'fr-FR', page: 1 });
    const tvPopular = await tmdbGet('/tv/popular', { language: 'fr-FR', page: 1 });

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


app.get('/api/download/:encodedUrl', (req, res) => {
  try {
    const encoded = req.params.encodedUrl;
    const url = decodeURIComponent(encoded);
    res.json({ success: true, proxiedUrl: url, note: 'Utilisez cette URL pour télécharger. Implémentez un stream proxy pour prod.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'URL encodée invalide' });
  }
});


app.get('/api/genres', async (req, res) => {
  try {
    const type = req.query.type || 'movie';
    const genres = await tmdbGet(`/genre/${type}/list`, { language: 'fr-FR' });
    res.json({ success: true, type, genres: genres.genres });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des genres' });
  }
});


app.get('/api/discover', async (req, res) => {
  try {
    const type = req.query.type || 'movie';
    const params = {
      language: 'fr-FR',
      sort_by: 'popularity.desc',
      page: req.query.page || 1,
      with_genres: req.query.genre
    };
    const discover = await tmdbGet(`/discover/${type}`, params);
    const results = discover.results.map(r => ({
      id: `${type}_${r.id}`,
      title: r.title || r.name,
      poster_path: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      vote_average: r.vote_average
    }));
    res.json({ success: true, page: discover.page, total_pages: discover.total_pages, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la découverte' });
  }
});


app.get('/api/seasons/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId.startsWith('tv_')) throw new Error('ID doit être tv_XXX');
    const tmdbId = rawId.split('_')[1];
    const seasons = await tmdbGet(`/tv/${tmdbId}`, { language: 'fr-FR' });
    res.json({ success: true, id: rawId, seasons: seasons.seasons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des saisons' });
  }
});


app.get('/api/episodes/:id/:season', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId.startsWith('tv_')) throw new Error('ID doit être tv_XXX');
    const tmdbId = rawId.split('_')[1];
    const season = req.params.season;
    const episodes = await tmdbGet(`/tv/${tmdbId}/season/${season}`, { language: 'fr-FR' });
    res.json({ success: true, id: rawId, season, episodes: episodes.episodes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des épisodes' });
  }
});


app.get('/api/watchlist', (req, res) => {
  const userId = req.query.userId;
  const userWatchlist = watchlist.find(w => w.userId === userId)?.items || [];
  res.json({ success: true, userId, items: userWatchlist });
});

app.post('/api/watchlist', (req, res) => {
  const { userId, itemId } = req.body;
  if (!userId || !itemId) return res.status(400).json({ success: false, message: 'userId et itemId requis' });
  let user = watchlist.find(w => w.userId === userId);
  if (!user) {
    user = { userId, items: [] };
    watchlist.push(user);
  }
  if (!user.items.includes(itemId)) user.items.push(itemId);
  res.json({ success: true, userId, items: user.items });
});

// Nouvelle Route: Embed pour trailer
app.get('/api/embed/:id', async (req, res) => {
  try {
    const raw = req.params.id;
    let type = raw.startsWith('movie_') ? 'movie' : 'tv';
    const tmdbId = raw.split('_')[1];
    const videos = await tmdbGet(`/${type}/${tmdbId}/videos`, { language: 'fr-FR' });
    const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (!trailer) return res.status(404).json({ success: false, message: 'Trailer non trouvé' });
    const embedUrl = `https://www.youtube.com/embed/${trailer.key}`;
    res.json({ success: true, embedUrl, html: `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la génération de l\'embed' });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(`Erreur globale: ${err.message}`);
  res.status(500).json({ success: false, message: 'Erreur serveur interne' });
});

app.listen(port, () => {
  console.log(`MyBox API pour streaming en écoute sur http://localhost:${port}`);
});
