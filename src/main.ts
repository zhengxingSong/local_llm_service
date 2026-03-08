import { loadConfig } from './config/index.js';
import { initLogger, getLogger } from './utils/logger.js';
import { createServer } from './server.js';
import { healthRoutes } from './routes/admin/health.js';
import { modelRoutes } from './routes/admin/models.js';
import { toolRoutes } from './routes/admin/tools.js';
import { chatRoutes as openaiChatRoutes } from './routes/openai/chat.js';
import { messageRoutes as anthropicMessageRoutes } from './routes/anthropic/messages.js';

const logger = getLogger();

async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    logger.info('Starting Qwen AI Service...', {
      host: config.server.host,
      port: config.server.port,
      env: process.env.NODE_ENV || 'development',
    });

    // Initialize logging
    initLogger();

    // Create server
    const server = await createServer();

    // Register routes
    await server.register(healthRoutes);
    await server.register(modelRoutes);
    await server.register(toolRoutes);
    await server.register(openaiChatRoutes);
    await server.register(anthropicMessageRoutes);


    // Start listening
    const address = await server.listen({
      host: config.server.host,
      port: config.server.port,
    });

    logger.info(`Server listening at ${address}`);
    logger.info('Available endpoints:');
    logger.info('  Health:    GET  /api/health');
    logger.info('  Models:    GET  /api/models');
    logger.info('             GET  /api/models/current');
    logger.info('             POST /api/models/load');
    logger.info('  Tools:     GET  /api/tools');
    logger.info('             POST /api/tools/execute');
    logger.info('  OpenAI:    POST /v1/chat/completions');
    logger.info('             GET  /v1/models');
    logger.info('  Anthropic: POST /v1/messages');
    logger.info('             GET  /v1/models');

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server
main();
