import express, { Request, Response, NextFunction } from 'express';
import apiRouter from '../server/routes/api';

const app = express();

// Set CORS and preflight headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// JSON and URL-encoded parsers with generous limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check available at /api/health and /health
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'KrishiMitra Full-Stack Server (Vercel Serverless Ready)',
    timestamp: new Date().toISOString(),
  });
});

// Mount router on BOTH '/api' AND '/'
// This guarantees that whether Vercel preserves '/api/...' or strips it to '/...',
// all routes match without 404s!
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback JSON 404 handler for unmatched API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.url,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Server Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

export default app;
