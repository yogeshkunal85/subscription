import express, { Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import errorHandler from './middleware/errorHandler';
import config from './config/env';

const app = express();

const corsOrigins =
  config.corsOrigin === '*'
    ? true
    : config.corsOrigin.split(',').map((origin) => origin.trim());

app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api', apiRoutes);

// 404 handler — must be after all routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  });
});

app.use(errorHandler);

export default app;
