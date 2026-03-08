import { FastifyInstance } from 'fastify';
import { getLlamaClient } from '../../services/llama-client.js';
import { anthropicToLlama, llamaToAnthropic } from '../../transformers/anthropic.js';
import { AnthropicMessageRequest } from '../../types/anthropic.js';
import { getLogger } from '../../utils/logger.js';
import { streamAnthropicResponse } from '../../utils/anthropic-streaming.js';

const logger = getLogger();

export async function messageRoutes(fastify: FastifyInstance) {
  // Messages API
  fastify.post('/v1/messages', async (request, reply) => {
    const body = request.body as AnthropicMessageRequest;

    logger.info('Anthropic message request', {
      model: body.model,
      messagesCount: body.messages.length,
      stream: body.stream || false,
    });

    try {
      // Transform request
      const llamaRequest = anthropicToLlama(body);

      // Check if streaming is requested
      if (body.stream === true) {
        // Set SSE headers
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('X-Accel-Buffering', 'no');

        // Get llama.cpp client
        const llamaClient = getLlamaClient();

        // Start streaming
        const llamaStream = await llamaClient.chatStream(llamaRequest);

        // Stream response
        const inputTokens = 10; // We'll estimate this, could be calculated from request
        for await (const sseEvent of streamAnthropicResponse(llamaStream, body.model, inputTokens)) {
          reply.raw.write(sseEvent);
        }

        // End the response
        reply.raw.end();
        return reply;
      }

      // Non-streaming response
      const llamaClient = getLlamaClient();
      const llamaResponse = await llamaClient.chat(llamaRequest);

      // Transform response
      const anthropicResponse = llamaToAnthropic(llamaResponse, body.model);

      return anthropicResponse;
    } catch (error: any) {
      logger.error('Message request failed', { error });
      throw error;
    }
  });
}
