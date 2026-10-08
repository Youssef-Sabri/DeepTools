import app from './app';
import { env } from './config/env';
import { closeDatabase } from './config/database';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`[DeepTools API] is running on: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown handling
const shutdown = (signal: string): void => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    closeDatabase()
      .then(() => {
        console.log('Database connections closed. Server terminated.');
        process.exit(0);
      })
      .catch((err: unknown) => {
        console.error('Error during shutdown:', err);
        process.exit(1);
      });
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

export default server;
