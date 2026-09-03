import express from 'express';
import apiRouter from '../server/routes/api';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// URL Normalizer: Handles Vercel Serverless routing, catch-all queries, and path variations
app.use((req, res, next) => {
  // If Vercel catch-all route passed path segments in query (e.g. [...all].ts)
  const queryAll = req.query.all;
  if ((req.url === '/' || req.url === '/api' || req.url === '') && queryAll) {
    if (Array.isArray(queryAll)) {
      req.url = '/' + queryAll.join('/');
    } else if (typeof queryAll === 'string') {
      req.url = '/' + queryAll;
    }
  }

  // Strip leading /api prefix if present so router matches clean subpaths
  if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  } else if (req.url === '/api') {
    req.url = '/';
  }

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KrishiMitra Vercel Serverless Function',
    timestamp: new Date().toISOString(),
  });
});

// Mount the unified API router directly on normalized root
app.use('/', apiRouter);

export default app;
