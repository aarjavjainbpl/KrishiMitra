import express from 'express';
import apiRouter from '../server/routes/api';

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KrishiMitra Vercel Serverless Function',
    timestamp: new Date().toISOString(),
  });
});

// Mount router on /api and / to seamlessly support both raw path and rewritten paths
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
