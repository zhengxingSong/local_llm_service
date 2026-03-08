/**
 * OpenAI Streaming Integration Tests
 * Tests SSE streaming response format for Chatbox/OpenAI SDK compatibility
 */

import Fastify from 'fastify';
import { chatRoutes } from '../../src/routes/openai/chat';
import { OpenAIChatRequest } from '../../src/types/openai';

// Mock the llama client module
const mockChat = jest.fn();
const mockChatStream = jest.fn();
const mockGetModels = jest.fn();
const mockGetHealth = jest.fn();

jest.mock('../../src/services/llama-client', () => {
  return {
    getLlamaClient: jest.fn(() => ({
      chat: mockChat,
      chatStream: mockChatStream,
      getModels: mockGetModels,
      getHealth: mockGetHealth,
    })),
    LlamaClient: jest.fn(),
  };
});

describe('OpenAI Streaming API', () => {
  let server: any;

  beforeAll(async () => {
    server = Fastify();
    await server.register(chatRoutes);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/chat/completions with stream=true', () => {
    beforeEach(() => {
      // Set default mock implementations
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));
      mockChat.mockResolvedValue({
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello world' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });
      mockGetModels.mockResolvedValue({
        object: 'list',
        data: [
          {
            id: 'qwen-3.5-9b',
            object: 'model',
            created: 1234567890,
            owned_by: 'qwen',
          },
        ],
      });
    });

    it('should return SSE content-type header for streaming requests', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' world']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should set correct SSE headers', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
      expect(response.headers['x-accel-buffering']).toBe('no');
    });

    it('should emit chunks with correct data: prefix format', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);

      expect(chunks.length).toBeGreaterThan(0);

      // First chunk should have data: prefix
      expect(chunks[0]).toMatch(/^data: /);

      // Parse and verify structure
      const firstChunk = JSON.parse(chunks[0].slice(6));
      expect(firstChunk.object).toBe('chat.completion.chunk');
      expect(firstChunk.id).toMatch(/^chatcmpl-/);
      expect(firstChunk.model).toBe('qwen-3.5-9b');
      expect(firstChunk.choices).toBeDefined();
      expect(firstChunk.choices[0].index).toBe(0);
      expect(firstChunk.choices[0].delta).toBeDefined();
    });

    it('should include content in delta field', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' world']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);

      // Find chunks with content
      const contentChunks = chunks
        .map((c) => {
          try {
            return JSON.parse(c.slice(6));
          } catch {
            return null;
          }
        })
        .filter((chunk) => chunk && chunk.choices[0].delta.content);

      expect(contentChunks.length).toBeGreaterThan(0);
      expect(contentChunks[0].choices[0].delta.content).toBeDefined();
    });

    it('should send data: [DONE] as final message', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const body = response.body;

      // Last line should be [DONE]
      expect(body).toContain('data: [DONE]');
    });

    it('should include finish_reason in final chunk', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);
      const lastChunk = chunks[chunks.length - 1]; // Last actual data chunk ([DONE] is filtered out)

      const parsed = JSON.parse(lastChunk.slice(6));
      expect(parsed.choices[0].finish_reason).toBe('stop');
    });

    it('should include usage in final chunk', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);
      const lastChunk = chunks[chunks.length - 1]; // Last actual data chunk ([DONE] is filtered out)

      const parsed = JSON.parse(lastChunk.slice(6));
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage.prompt_tokens).toBe(10);
      expect(parsed.usage.completion_tokens).toBe(1);
      expect(parsed.usage.total_tokens).toBe(11);
    });

    it('should handle empty response gracefully', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream([]));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say nothing' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('data: [DONE]');
    });

    it('should handle errors during streaming', async () => {
      // Mock to throw error before streaming starts
      mockChatStream.mockImplementation(async () => {
        throw new Error('Backend connection failed');
      });

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      // Headers should still be sent for streaming
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      // Error should be in the response body
      expect(response.body).toContain('error');
    });

    it('should accumulate content across multiple chunks', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' ', 'world', '!']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello world' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);
      const fullText = chunks
        .slice(0, -1) // Exclude [DONE]
        .map((c) => JSON.parse(c.slice(6)))
        .map((chunk) => chunk.choices[0].delta.content || '')
        .join('');

      expect(fullText).toBe('Hello world!');
    });

    it('should handle special characters in content', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Line 1\nLine 2']));

      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say lines' }],
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const chunks = parseOpenAIChunks(response.body);
      const content = chunks
        .slice(0, -1)
        .map((c) => JSON.parse(c.slice(6)))
        .map((chunk) => chunk.choices[0].delta.content || '')
        .join('');

      expect(content).toBe('Line 1\nLine 2');
    });
  });

  describe('POST /v1/chat/completions with stream=false', () => {
    beforeEach(() => {
      mockChat.mockResolvedValue({
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello world' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });
    });

    it('should return non-streaming response when stream is false', async () => {
      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: false,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.body);
      expect(body.object).toBe('chat.completion');
      expect(body.id).toBeDefined();
      expect(body.choices).toBeDefined();
      expect(body.choices[0].message.content).toBe('Hello world');
    });

    it('should include usage in non-streaming response', async () => {
      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: false,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const body = JSON.parse(response.body);
      expect(body.usage).toBeDefined();
      expect(body.usage.prompt_tokens).toBe(10);
      expect(body.usage.completion_tokens).toBe(5);
      expect(body.usage.total_tokens).toBe(15);
    });
  });

  describe('POST /v1/chat/completions with stream undefined', () => {
    beforeEach(() => {
      mockChat.mockResolvedValue({
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Default response' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });
    });

    it('should return non-streaming response when stream is not specified', async () => {
      const request: OpenAIChatRequest = {
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        // stream not specified - should default to false
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.body);
      expect(body.object).toBe('chat.completion');
    });
  });
});

// Helper function to create mock llama stream
function createMockLlamaStream(chunks: string[]): AsyncIterable<any> {
  return (async function* () {
    for (const chunk of chunks) {
      yield {
        content: chunk,
        stop: false,
      };
    }
    // Final chunk with finish_reason
    yield {
      content: '',
      stop: true,
      usage: {
        prompt_tokens: 10,
        completion_tokens: chunks.length,
        total_tokens: 10 + chunks.length,
      },
    };
  })();
}

// Helper function to parse OpenAI SSE chunks
function parseOpenAIChunks(body: string): string[] {
  const chunks: string[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('data: ')) {
      // Exclude [DONE] marker
      if (trimmedLine !== 'data: [DONE]') {
        chunks.push(trimmedLine);
      }
    }
  }

  return chunks;
}
