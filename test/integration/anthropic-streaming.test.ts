/**
 * Anthropic Streaming Integration Tests
 * Tests SSE streaming response format for Claude Code compatibility
 */

import { createAnthropicTestServer } from './anthropic-helper';
import { AnthropicMessageRequest } from '../../src/types/anthropic';

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

describe('Anthropic Streaming API', () => {
  let server: any;

  beforeAll(async () => {
    server = await createAnthropicTestServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/messages with stream=true', () => {
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
    });

    it('should return SSE content-type header for streaming requests', async () => {
      // Mock stream response
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' world']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should emit message_start event first', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const firstEvent = events[0];

      expect(firstEvent.event).toBe('message_start');
      const data = JSON.parse(firstEvent.data);
      expect(data.type).toBe('message_start');
      expect(data.message).toBeDefined();
      expect(data.message.id).toBeDefined();
      expect(data.message.type).toBe('message');
      expect(data.message.role).toBe('assistant');
    });

    it('should emit content_block_start event after message_start', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const secondEvent = events[1];

      expect(secondEvent.event).toBe('content_block_start');
      const data = JSON.parse(secondEvent.data);
      expect(data.type).toBe('content_block_start');
      expect(data.index).toBe(0);
      expect(data.content_block).toBeDefined();
      expect(data.content_block.type).toBe('text');
    });

    it('should emit content_block_delta events with text chunks', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' world', '!']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const deltaEvents = events.filter((e) => e.event === 'content_block_delta');

      expect(deltaEvents.length).toBeGreaterThan(0);

      // Check first delta event
      const firstDelta = JSON.parse(deltaEvents[0].data);
      expect(firstDelta.type).toBe('content_block_delta');
      expect(firstDelta.index).toBe(0);
      expect(firstDelta.delta).toBeDefined();
      expect(firstDelta.delta.type).toBe('text_delta');
      expect(firstDelta.delta.text).toBeDefined();
    });

    it('should emit content_block_stop after deltas', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const stopEvents = events.filter((e) => e.event === 'content_block_stop');

      expect(stopEvents.length).toBeGreaterThan(0);
      const stopData = JSON.parse(stopEvents[0].data);
      expect(stopData.type).toBe('content_block_stop');
      expect(stopData.index).toBe(0);
    });

    it('should emit message_delta event before message_stop', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const deltaEvent = events.filter((e) => e.event === 'message_delta');

      expect(deltaEvent.length).toBeGreaterThan(0);
      const deltaData = JSON.parse(deltaEvent[0].data);
      expect(deltaData.type).toBe('message_delta');
      expect(deltaData.delta).toBeDefined();
      expect(deltaData.delta.stop_reason).toBeDefined();
      expect(deltaData.usage).toBeDefined();
    });

    it('should emit message_stop as final event', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const lastEvent = events[events.length - 1];

      expect(lastEvent.event).toBe('message_stop');
      const data = JSON.parse(lastEvent.data);
      expect(data.type).toBe('message_stop');
    });

    it('should maintain correct event order: start -> block_start -> deltas -> block_stop -> delta -> stop', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream(['Hello', ' world']));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      const events = parseSSEEvents(response.body);
      const eventTypes = events.map((e) => e.event);

      // Verify order
      const messageStartIndex = eventTypes.indexOf('message_start');
      const blockStartIndex = eventTypes.indexOf('content_block_start');
      const firstDeltaIndex = eventTypes.indexOf('content_block_delta');
      const blockStopIndex = eventTypes.indexOf('content_block_stop');
      const messageDeltaIndex = eventTypes.indexOf('message_delta');
      const messageStopIndex = eventTypes.indexOf('message_stop');

      expect(messageStartIndex).toBe(0);
      expect(blockStartIndex).toBeGreaterThan(messageStartIndex);
      expect(firstDeltaIndex).toBeGreaterThan(blockStartIndex);
      expect(blockStopIndex).toBeGreaterThan(firstDeltaIndex);
      expect(messageDeltaIndex).toBeGreaterThan(blockStopIndex);
      expect(messageStopIndex).toBeGreaterThan(messageDeltaIndex);
      expect(messageStopIndex).toBe(eventTypes.length - 1);
    });

    it('should handle empty response gracefully', async () => {
      mockChatStream.mockImplementation(() => createMockLlamaStream([]));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say nothing' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      const events = parseSSEEvents(response.body);

      // Should still have message_start and message_stop
      expect(events.some((e) => e.event === 'message_start')).toBe(true);
      expect(events.some((e) => e.event === 'message_stop')).toBe(true);
    });

    it('should handle errors during streaming', async () => {
      mockChatStream.mockRejectedValue(new Error('Backend connection failed'));

      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /v1/messages with stream=false', () => {
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
      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        stream: false,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.body);
      expect(body.type).toBe('message');
      expect(body.content).toBeDefined();
      expect(body.content[0].text).toBe('Hello world');
    });
  });

  describe('POST /v1/messages with stream undefined (defaults to non-streaming)', () => {
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
      const request: AnthropicMessageRequest = {
        model: 'qwen',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 100,
        // stream not specified - should default to false
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.body);
      expect(body.type).toBe('message');
    });
  });
});

// Helper function to create mock llama stream
function createMockLlamaStream(chunks: string[]): AsyncIterable<any> {
  return (async function* () {
    for (const chunk of chunks) {
      yield {
        choices: [
          {
            index: 0,
            delta: { content: chunk },
            finish_reason: null,
          },
        ],
      };
    }
    // Final chunk with finish_reason
    yield {
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: chunks.length,
        total_tokens: 10 + chunks.length,
      },
    };
  })();
}

// Helper function to parse SSE events
function parseSSEEvents(body: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const lines = body.split('\n');

  let currentEvent = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      events.push({
        event: currentEvent,
        data: line.slice(6).trim(),
      });
      currentEvent = ''; // Reset after data
    }
  }

  return events;
}
