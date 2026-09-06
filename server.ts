import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists and is statically accessible
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // JSON and URL-encoded body parsers
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'KrishiMitra Full-Stack Server',
      timestamp: new Date().toISOString(),
    });
  });

  // Direct ZIP download endpoint
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.join(process.cwd(), 'krishimitra-app.zip');
    res.download(zipPath, 'krishimitra-app.zip', (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Zip file could not be downloaded' });
        }
      }
    });
  });

  // Mount main API routes
  app.use('/api', apiRouter);

  // Vite middleware for development vs static production serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KrishiMitra server running on http://localhost:${PORT}`);
  });
}

startServer();
