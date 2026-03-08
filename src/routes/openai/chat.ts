import { FastifyInstance } from 'fastify';
import { getLlamaClient } from '../../services/llama-client.js';
import { openaiToLlama, llamaToOpenai, llamaChunkToOpenai } from '../../transformers/openai.js';
import { OpenAIChatRequest } from '../../types/openai.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger();

export async function chatRoutes(fastify: FastifyInstance) {
  // Chat completions
  fastify.post('/v1/chat/completions', async (request, reply) => {
    const body = request.body as OpenAIChatRequest;

    logger.info('OpenAI chat request', {
      model: body.model,
      messagesCount: body.messages.length,
      stream: body.stream,
    });

    // Transform request
    const llamaRequest = openaiToLlama(body);

    // Call llama.cpp
    const llamaClient = getLlamaClient();

    // Handle streaming
    if (body.stream) {
      // Set headers before any processing
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      try {
        const stream = await llamaClient.chatStream(llamaRequest);
        let index = 0;

        for await (const chunk of stream) {
          const openaiChunk = llamaChunkToOpenai(chunk, body.model, index);
          const sseData = `data: ${JSON.stringify(openaiChunk)}\n\n`;
          reply.raw.write(sseData);
          index++;
        }

        // Send final [DONE] message
        reply.raw.write('data: [DONE]\n\n');
      } catch (error: any) {
        logger.error('Streaming error', { error });
        // Try to send error to client, but connection might be closed
        try {
          reply.raw.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        } catch {
          // Ignore write errors
        }
      } finally {
        reply.raw.end();
      }
      return reply;
    } else {
      // Non-streaming response
      const llamaResponse = await llamaClient.chat(llamaRequest);
      const openaiResponse = llamaToOpenai(llamaResponse, body.model);
      return openaiResponse;
    }
  });

  // Models list - supports both OpenAI and Anthropic formats
  fastify.get('/v1/models', async (request) => {
    const llamaClient = getLlamaClient();
    const llamaResponse = await llamaClient.getModels();

    // Check if this is an Anthropic client request
    const isAnthropic = request.headers['anthropic-version'];

    if (isAnthropic) {
      // Return Anthropic format
      return llamaResponse.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        size: model.meta?.size || 0,
        displayName: model.id,
      }));
    } else {
      // Return OpenAI format
      return {
        object: 'list',
        data: llamaResponse.data.map((model: any) => ({
          id: model.id,
          object: 'model',
          created: model.created,
          owned_by: model.owned_by,
        })),
      };
    }
  });
}
