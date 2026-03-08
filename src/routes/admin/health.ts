import { FastifyInstance } from 'fastify';
import { getLlamaClient } from '../../services/llama-client.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger();

export async function healthRoutes(fastify: FastifyInstance) {
  // Detailed health check
  fastify.get('/api/health/detailed', async () => {
    try {
      const llamaClient = getLlamaClient();
      const llamaHealth = await llamaClient.getHealth();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          api: 'running',
          llama: llamaHealth.status,
        },
        memory: process.memoryUsage(),
      };
    } catch (error: any) {
      logger.error('Health check failed', { error });
      throw error;
    }
  });

  // Llama.cpp health
  fastify.get('/api/health/llama', async () => {
    const llamaClient = getLlamaClient();
    return await llamaClient.getHealth();
  });
}
