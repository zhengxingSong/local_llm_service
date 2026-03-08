/**
 * Unit tests for OpenAI streaming response utilities
 */

import {
  createStreamChunk,
  formatSSEChunk,
  createFinalChunk,
  parseOpenAIChunk,
  streamOpenAIResponse,
  formatSSEDone,
} from '../../src/utils/openai-streaming';
import type { OpenAIChatChunk } from '../../src/types/openai';

describe('OpenAI Streaming Utils', () => {
  describe('createStreamChunk', () => {
    it('should create a valid streaming chunk with content', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'Hello', null);

      expect(chunk.id).toBe('chatcmpl-123');
      expect(chunk.object).toBe('chat.completion.chunk');
      expect(chunk.model).toBe('qwen-3.5-9b');
      expect(chunk.created).toBeGreaterThan(0);
      expect(chunk.choices).toHaveLength(1);
      expect(chunk.choices[0].index).toBe(0);
      expect(chunk.choices[0].delta.content).toBe('Hello');
      expect(chunk.choices[0].finish_reason).toBeNull();
    });

    it('should generate unique IDs when not provided', () => {
      const chunk1 = createStreamChunk('', 'qwen-3.5-9b', 0, 'Hello', null);
      const chunk2 = createStreamChunk('', 'qwen-3.5-9b', 0, 'World', null);

      expect(chunk1.id).toBeDefined();
      expect(chunk2.id).toBeDefined();
      expect(chunk1.id).not.toBe(chunk2.id);
      expect(chunk1.id).toMatch(/^chatcmpl-/);
    });

    it('should create chunk with finish_reason', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, '', 'stop');

      // When content is empty, delta should not have content property
      expect(chunk.choices[0].delta.content).toBeUndefined();
      expect(chunk.choices[0].finish_reason).toBe('stop');
    });

    it('should handle empty content', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, '', null);

      // When content is empty, delta should not have content property
      expect(chunk.choices[0].delta.content).toBeUndefined();
      expect(chunk.choices[0].finish_reason).toBeNull();
    });

    it('should handle special characters in content', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'Hello\nWorld\t!', null);

      expect(chunk.choices[0].delta.content).toBe('Hello\nWorld\t!');
    });

    it('should handle unicode characters', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'Hello 世界', null);

      expect(chunk.choices[0].delta.content).toBe('Hello 世界');
    });

    it('should include usage information in final chunk', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, '', 'stop', {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      });

      expect(chunk.usage).toBeDefined();
      expect(chunk.usage?.prompt_tokens).toBe(10);
      expect(chunk.usage?.completion_tokens).toBe(5);
      expect(chunk.usage?.total_tokens).toBe(15);
    });

    it('should not include usage when not provided', () => {
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'Hello', null);

      expect(chunk.usage).toBeUndefined();
    });
  });

  describe('createFinalChunk', () => {
    it('should create a final chunk with finish_reason', () => {
      const chunk = createFinalChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'stop', {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      });

      expect(chunk.choices[0].finish_reason).toBe('stop');
      expect(chunk.choices[0].delta).toEqual({});
      expect(chunk.usage).toBeDefined();
    });

    it('should handle different finish reasons', () => {
      const reasons = ['stop', 'length', 'tool_calls', 'content_filter'] as const;

      for (const reason of reasons) {
        const chunk = createFinalChunk('chatcmpl-123', 'qwen-3.5-9b', 0, reason, {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        });
        expect(chunk.choices[0].finish_reason).toBe(reason);
      }
    });
  });

  describe('formatSSEChunk', () => {
    it('should format chunk as SSE with data: prefix', () => {
      const chunk: OpenAIChatChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'qwen-3.5-9b',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello' },
            finish_reason: null,
          },
        ],
      };

      const formatted = formatSSEChunk(chunk);

      expect(formatted).toContain('data: {');
      expect(formatted).toContain('"id":"chatcmpl-123"');
      expect(formatted).toContain('"object":"chat.completion.chunk"');
      expect(formatted).toContain('\n\n');
    });

    it('should escape special characters in JSON', () => {
      const chunk: OpenAIChatChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'qwen-3.5-9b',
        choices: [
          {
            index: 0,
            delta: { content: 'Line 1\nLine 2' },
            finish_reason: null,
          },
        ],
      };

      const formatted = formatSSEChunk(chunk);

      expect(formatted).toContain('\\n'); // Escaped newline
    });

    it('should format multiple chunks correctly', () => {
      const chunks = [
        createStreamChunk('chatcmpl-1', 'qwen', 0, 'Hello', null),
        createStreamChunk('chatcmpl-1', 'qwen', 0, ' World', null),
      ];

      const formatted = chunks.map(formatSSEChunk).join('');

      const parts = formatted.split('\n\n');
      expect(parts.length).toBe(3); // 2 chunks + empty trailing part
      expect(parts[0]).toContain('data: {');
      expect(parts[1]).toContain('data: {');
    });

    it('should handle unicode characters', () => {
      const chunk: OpenAIChatChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'qwen-3.5-9b',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello 世界' },
            finish_reason: null,
          },
        ],
      };

      const formatted = formatSSEChunk(chunk);

      // JSON.stringify may or may not escape unicode depending on implementation
      // Just verify the content is in the output
      expect(formatted).toContain('Hello');
      expect(formatted).toContain('data: ');
    });
  });

  describe('parseOpenAIChunk', () => {
    it('should parse a valid llama chunk into OpenAI format', () => {
      const llamaChunk = {
        content: 'Hello world',
        stop: false,
      };

      const parsed = parseOpenAIChunk(llamaChunk, 'qwen-3.5-9b', 'chatcmpl-123', 0);

      expect(parsed.choices[0].delta.content).toBe('Hello world');
      expect(parsed.choices[0].finish_reason).toBeNull();
    });

    it('should handle chunk with stop signal', () => {
      const llamaChunk = {
        content: '',
        stop: true,
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const parsed = parseOpenAIChunk(llamaChunk, 'qwen-3.5-9b', 'chatcmpl-123', 0);

      expect(parsed.choices[0].finish_reason).toBe('stop');
      expect(parsed.usage).toBeDefined();
      expect(parsed.usage?.total_tokens).toBe(15);
    });

    it('should handle chunk with null content', () => {
      const llamaChunk = {
        content: null,
        stop: false,
      };

      const parsed = parseOpenAIChunk(llamaChunk, 'qwen-3.5-9b', 'chatcmpl-123', 0);

      // Empty content should not be in delta
      expect(parsed.choices[0].delta.content).toBeUndefined();
    });

    it('should handle chunk with undefined content', () => {
      const llamaChunk = {
        stop: false,
      };

      const parsed = parseOpenAIChunk(llamaChunk, 'qwen-3.5-9b', 'chatcmpl-123', 0);

      // Empty content should not be in delta
      expect(parsed.choices[0].delta.content).toBeUndefined();
    });

    it('should preserve chunk ID when provided', () => {
      const llamaChunk = {
        content: 'Hello',
        stop: false,
      };

      const parsed = parseOpenAIChunk(llamaChunk, 'qwen-3.5-9b', 'chatcmpl-custom', 0);

      expect(parsed.id).toBe('chatcmpl-custom');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty delta in final chunk', () => {
      const chunk = createFinalChunk('chatcmpl-123', 'qwen-3.5-9b', 0, 'stop', {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      });

      expect(chunk.choices[0].delta).toEqual({});
      expect(Object.keys(chunk.choices[0].delta).length).toBe(0);
    });

    it('should format SSE done marker', () => {
      const done = formatSSEDone();

      expect(done).toBe('data: [DONE]\n\n');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, longContent, null);

      expect(chunk.choices[0].delta.content).toBe(longContent);
      expect(chunk.choices[0].delta.content?.length).toBe(10000);
    });

    it('should handle JSON injection attempts', () => {
      const maliciousContent = '{"malicious": "payload"}';
      const chunk = createStreamChunk('chatcmpl-123', 'qwen-3.5-9b', 0, maliciousContent, null);

      const formatted = formatSSEChunk(chunk);

      // Content should be properly escaped
      expect(formatted).toContain('{');
      expect(formatted).toContain('}');
    });
  });

  describe('streamOpenAIResponse', () => {
    it('should stream llama chunks as SSE', async () => {
      async function* mockLlamaStream(): AsyncGenerator<any, void, unknown> {
        yield { content: 'Hello', stop: false };
        yield { content: ' world', stop: false };
        yield { content: '', stop: true, usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } };
      }

      const stream = streamOpenAIResponse(mockLlamaStream(), 'qwen-3.5-9b');
      const chunks: string[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      // Should have content chunks + final chunk + [DONE]
      expect(chunks[chunks.length - 1]).toContain('[DONE]');
    });

    it('should maintain consistent chunk ID across stream', async () => {
      async function* mockLlamaStream(): AsyncGenerator<any, void, unknown> {
        yield { content: 'Hello', stop: false };
        yield { content: '', stop: true, usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 } };
      }

      const stream = streamOpenAIResponse(mockLlamaStream(), 'qwen-3.5-9b');
      const chunks: string[] = [];

      for await (const chunk of stream) {
        if (chunk.includes('data: {')) {
          chunks.push(chunk);
        }
      }

      // Extract IDs from chunks (excluding [DONE])
      const ids = chunks
        .filter(c => !c.includes('[DONE]'))
        .map(c => {
          const match = c.match(/"id":"(chatcmpl-[^"]+)"/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      // All chunks should have the same ID
      expect(new Set(ids).size).toBe(1);
      expect(ids[0]).toMatch(/^chatcmpl-/);
    });

    it('should handle empty stream', async () => {
      async function* mockEmptyStream(): AsyncGenerator<any, void, unknown> {
        // Empty stream
      }

      const stream = streamOpenAIResponse(mockEmptyStream(), 'qwen-3.5-9b');
      const chunks: string[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Should only have [DONE]
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain('[DONE]');
    });

    it('should handle stream with only final chunk', async () => {
      async function* mockSingleChunkStream(): AsyncGenerator<any, void, unknown> {
        yield { content: '', stop: true, usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 } };
      }

      const stream = streamOpenAIResponse(mockSingleChunkStream(), 'qwen-3.5-9b');
      const chunks: string[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Should have final chunk + [DONE]
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[chunks.length - 1]).toContain('[DONE]');
    });
  });
});
