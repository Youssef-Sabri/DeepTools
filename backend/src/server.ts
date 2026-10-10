import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const server = app.listen(env.PORT, () => {
  console.log(`[Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

// Handle graceful termination to prevent database connection leaks
const gracefulShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    void (async () => {
      try {
        await prisma.$disconnect();
        console.log("[Database] Disconnected cleanly.");
        process.exit(0);
      } catch (error) {
        console.error("[Shutdown Error] Failed to disconnect cleanly:", error);
        process.exit(1);
      }
    })();
  });

  // Force close if cleanup takes too long
  setTimeout(() => {
    console.error("[Server] Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
