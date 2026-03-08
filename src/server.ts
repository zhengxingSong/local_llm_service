import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { loadConfig } from './config/index.js';
import { getLogger } from './utils/logger.js';

const logger = getLogger();

export async function createServer(): Promise<FastifyInstance> {
  const config = loadConfig();

  const server = Fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // Register plugins
  await server.register(cors, {
    origin: config.server.cors.origin,
    credentials: config.server.cors.credentials,
  });

  await server.register(websocket);

  // Health check
  server.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 404 handler
  server.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
      error: {
        message: 'Not Found',
        code: 'NOT_FOUND',
        path: request.url,
      },
    });
  });

  // Error handler
  server.setErrorHandler(async (error, request, reply) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      url: request.url,
    });

    reply.code(error.statusCode || 500).send({
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      },
    });
  });

  return server;
}
