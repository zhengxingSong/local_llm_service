/**
 * Unit tests for Anthropic streaming response utilities
 */

import {
  createMessageStartEvent,
  createContentBlockStartEvent,
  createContentBlockDeltaEvent,
  createContentBlockStopEvent,
  createMessageDeltaEvent,
  createMessageStopEvent,
  formatSSEEvent,
} from '../../src/utils/anthropic-streaming';
import type { AnthropicServerSentEvent } from '../../src/types/anthropic';

describe('Anthropic Streaming Utils', () => {
  describe('createMessageStartEvent', () => {
    it('should create a valid message_start event', () => {
      const event = createMessageStartEvent('msg_test123', 'qwen', 100);

      expect(event.type).toBe('message_start');
      expect(event.message.id).toBe('msg_test123');
      expect(event.message.type).toBe('message');
      expect(event.message.role).toBe('assistant');
      expect(event.message.model).toBe('qwen');
      expect(event.message.usage.input_tokens).toBe(100);
      expect(event.message.usage.output_tokens).toBe(0);
    });

    it('should generate unique IDs when not provided', () => {
      const event1 = createMessageStartEvent('', 'qwen', 100);
      const event2 = createMessageStartEvent('', 'qwen', 100);

      expect(event1.message.id).toBeDefined();
      expect(event2.message.id).toBeDefined();
      expect(event1.message.id).not.toBe(event2.message.id);
    });

    it('should include empty content array', () => {
      const event = createMessageStartEvent('msg_123', 'qwen', 100);

      expect(event.message.content).toEqual([]);
    });
  });

  describe('createContentBlockStartEvent', () => {
    it('should create a valid content_block_start event for text', () => {
      const event = createContentBlockStartEvent(0, 'text');

      expect(event.type).toBe('content_block_start');
      expect(event.index).toBe(0);
      expect(event.content_block.type).toBe('text');
      expect(event.content_block.text).toBe('');
    });

    it('should create a valid content_block_start event for tool_use', () => {
      const event = createContentBlockStartEvent(0, 'tool_use', 'test_tool');

      expect(event.type).toBe('content_block_start');
      expect(event.index).toBe(0);
      expect(event.content_block.type).toBe('tool_use');
      expect(event.content_block.id).toBeDefined();
      expect(event.content_block.name).toBe('test_tool');
    });

    it('should generate unique IDs for tool_use', () => {
      const event1 = createContentBlockStartEvent(0, 'tool_use', 'test_tool');
      const event2 = createContentBlockStartEvent(0, 'tool_use', 'test_tool');

      expect(event1.content_block.id).not.toBe(event2.content_block.id);
    });
  });

  describe('createContentBlockDeltaEvent', () => {
    it('should create a valid content_block_delta event for text', () => {
      const event = createContentBlockDeltaEvent(0, 'Hello');

      expect(event.type).toBe('content_block_delta');
      expect(event.index).toBe(0);
      expect(event.delta.type).toBe('text_delta');
      expect(event.delta.text).toBe('Hello');
    });

    it('should handle empty text', () => {
      const event = createContentBlockDeltaEvent(0, '');

      expect(event.delta.text).toBe('');
    });

    it('should handle special characters in text', () => {
      const event = createContentBlockDeltaEvent(0, 'Hello\nWorld\t!');

      expect(event.delta.text).toBe('Hello\nWorld\t!');
    });

    it('should handle unicode characters', () => {
      const event = createContentBlockDeltaEvent(0, 'Hello 世界');

      expect(event.delta.text).toBe('Hello 世界');
    });
  });

  describe('createContentBlockStopEvent', () => {
    it('should create a valid content_block_stop event', () => {
      const event = createContentBlockStopEvent(0);

      expect(event.type).toBe('content_block_stop');
      expect(event.index).toBe(0);
    });

    it('should handle different indices', () => {
      const event = createContentBlockStopEvent(5);

      expect(event.index).toBe(5);
    });
  });

  describe('createMessageDeltaEvent', () => {
    it('should create a valid message_delta event', () => {
      const event = createMessageDeltaEvent('end_turn', 42);

      expect(event.type).toBe('message_delta');
      expect(event.delta.stop_reason).toBe('end_turn');
      expect(event.usage.output_tokens).toBe(42);
    });

    it('should handle different stop reasons', () => {
      const stopReasons = ['end_turn', 'max_tokens', 'stop_sequence', 'tool_use'] as const;

      for (const reason of stopReasons) {
        const event = createMessageDeltaEvent(reason, 10);
        expect(event.delta.stop_reason).toBe(reason);
      }
    });
  });

  describe('createMessageStopEvent', () => {
    it('should create a valid message_stop event', () => {
      const event = createMessageStopEvent();

      expect(event.type).toBe('message_stop');
    });
  });

  describe('formatSSEEvent', () => {
    it('should format event as SSE with correct format', () => {
      const event: AnthropicServerSentEvent = {
        type: 'message_start',
        message: {
          id: 'msg_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'qwen',
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      };

      const formatted = formatSSEEvent('message_start', event);

      expect(formatted).toContain('event: message_start');
      expect(formatted).toContain('data: {"type":"message_start"');
      expect(formatted).toContain('\n\n');
    });

    it('should escape special characters in JSON', () => {
      const event: AnthropicServerSentEvent = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: 'Line 1\nLine 2',
        },
      };

      const formatted = formatSSEEvent('content_block_delta', event);

      expect(formatted).toContain('data: ');
      expect(formatted).toContain('\\n'); // Escaped newline
    });

    it('should handle multiple events', () => {
      const events = [
        createMessageStartEvent('msg_1', 'qwen', 10),
        createContentBlockStartEvent(0, 'text'),
      ];

      const formatted = events
        .map((e) => formatSSEEvent(e.type, e))
        .join('');

      const parts = formatted.split('\n\n');
      expect(parts.length).toBe(3); // 2 events + empty trailing part
      expect(parts[0]).toContain('event: message_start');
      expect(parts[1]).toContain('event: content_block_start');
    });
  });
});
