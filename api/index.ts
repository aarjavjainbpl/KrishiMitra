import express, { Request, Response, NextFunction } from 'express';
import apiRouter from '../server/routes/api';

const app = express();

// 1. Universal CORS handler for Vercel preview environments and custom domains
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 2. High-capacity body parsers for base64 & JSON payloads (quality analysis, routes, etc.)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 3. Vercel Serverless URL Normalizer: handles catch-all rewrites, regex capture queries, and path variations
app.use((req: Request, res: Response, next: NextFunction) => {
  // If Vercel passed path segments via rewrite query parameters (e.g. rewrite [0], 'all', or 'path')
  const qPath = (req.query as any)?.all || (req.query as any)?.path || (req.query as any)?.[0] || (req.query as any)?.['0'];
  if (qPath && (req.url === '/' || req.url.startsWith('/api/index') || req.url === '/api')) {
    const p = Array.isArray(qPath) ? qPath.join('/') : String(qPath);
    req.url = p.startsWith('/') ? p : '/' + p;
  }

  // Normalize /api/ prefix so routes match cleanly
  if (req.url.startsWith('/api/')) {
    req.url = req.url.substring(4);
  } else if (req.url === '/api') {
    req.url = '/';
  }

  next();
});

// 4. Health check endpoint accessible at /health and /api/health
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'KrishiMitra Vercel Serverless Function',
    timestamp: new Date().toISOString(),
  });
});

// 5. Mount API router on both root and /api for absolute resilience on Vercel
app.use('/', apiRouter);
app.use('/api', apiRouter);

// 6. Global Serverless Error Handler - guarantees clean JSON response instead of HTML crash
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('KrishiMitra Vercel Function Unhandled Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Serverless Error',
    service: 'KrishiMitra Vercel API',
  });
});

export default app;
