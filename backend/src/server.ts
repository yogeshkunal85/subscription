import app from './app';
import config from './config/env';

// Importing db triggers pool creation and initial connection test
import './config/db';

import { scheduleRenewalJob } from './jobs/renewalJob';

const server = app.listen(config.port, () => {
  console.log(`[SERVER] Running on port ${config.port} in ${config.nodeEnv} mode`);
  scheduleRenewalJob(config.cron.schedule);
});

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received — shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});
