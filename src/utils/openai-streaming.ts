/**
 * OpenAI Streaming Response Utilities
 * Generates SSE-formatted responses compatible with OpenAI API / Chatbox
 */

import type {
  OpenAIChatChunk,
  OpenAIStreamChoice,
  OpenAIStreamDelta,
  OpenAIUsage,
} from '../types/openai.js';

/**
 * Generate a unique chat completion ID
 * Format: chatcmpl-{timestamp}
 */
function generateChunkId(): string {
  return `chatcmpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current Unix timestamp
 */
function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create an OpenAI streaming chunk
 * @param id - Chunk ID (empty string to auto-generate)
 * @param model - Model name
 * @param index - Choice index
 * @param content - Delta content
 * @param finishReason - Finish reason (null if not finished)
 * @param usage - Optional usage information
 */
export function createStreamChunk(
  id: string,
  model: string,
  index: number,
  content: string,
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null,
  usage?: OpenAIUsage
): OpenAIChatChunk {
  const delta: OpenAIStreamDelta = {};

  // Only include content in delta if it's not empty
  // Final chunks should have empty delta object {}
  if (content !== '') {
    delta.content = content;
  }

  const choice: OpenAIStreamChoice = {
    index,
    delta,
    finish_reason: finishReason,
  };

  return {
    id: id || generateChunkId(),
    object: 'chat.completion.chunk',
    created: getTimestamp(),
    model,
    choices: [choice],
    ...(usage && { usage }),
  };
}

/**
 * Create a final chunk with finish_reason and usage
 * @param id - Chunk ID (empty string to auto-generate)
 * @param model - Model name
 * @param index - Choice index
 * @param finishReason - Finish reason
 * @param usage - Usage information
 */
export function createFinalChunk(
  id: string,
  model: string,
  index: number,
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter',
  usage: OpenAIUsage
): OpenAIChatChunk {
  return createStreamChunk(id, model, index, '', finishReason, usage);
}

/**
 * Format a chunk as Server-Sent Events (SSE) data line
 * OpenAI format: data: {JSON}\n\n
 * @param chunk - OpenAI chat chunk
 * @returns Formatted SSE string
 */
export function formatSSEChunk(chunk: OpenAIChatChunk): string {
  // Ensure proper JSON serialization with unicode escaping
  const jsonString = JSON.stringify(chunk);
  return `data: ${jsonString}\n\n`;
}

/**
 * Format the final [DONE] marker for OpenAI streaming
 * @returns Formatted SSE [DONE] string
 */
export function formatSSEDone(): string {
  return 'data: [DONE]\n\n';
}

/**
 * Parse a llama.cpp chunk into OpenAI format
 * @param llamaChunk - Raw llama chunk
 * @param model - Model name
 * @param chunkId - Chunk ID to use
 * @param index - Choice index
 * @returns OpenAI chat chunk
 */
export function parseOpenAIChunk(
  llamaChunk: any,
  model: string,
  chunkId: string,
  index: number
): OpenAIChatChunk {
  const content = llamaChunk.content ?? '';
  const isFinal = llamaChunk.stop === true;

  if (isFinal) {
    return createFinalChunk(
      chunkId,
      model,
      index,
      'stop',
      llamaChunk.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      }
    );
  }

  return createStreamChunk(chunkId, model, index, content, null);
}

/**
 * Create a streaming response generator from llama.cpp chunks
 * @param llamaStream - Async iterable of llama chunks
 * @param model - Model name
 * @returns Async generator of formatted SSE strings
 */
export async function* streamOpenAIResponse(
  llamaStream: AsyncIterable<any>,
  model: string
): AsyncGenerator<string, void, unknown> {
  const chunkId = generateChunkId();
  let index = 0;

  for await (const llamaChunk of llamaStream) {
    const openaiChunk = parseOpenAIChunk(llamaChunk, model, chunkId, index);
    yield formatSSEChunk(openaiChunk);
    index++;
  }

  // Send final [DONE] marker
  yield formatSSEDone();
}
