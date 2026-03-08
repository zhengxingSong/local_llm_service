/**
 * E2E Tests for Anthropic Streaming API
 * Tests real-world compatibility with Claude Code SDK
 *
 * Note: These tests require a running server at TEST_BASE_URL
 * Run with: TEST_BASE_URL=http://localhost:3000 npm test -- test/e2e
 */

import { Anthropic } from '@anthropic-ai/sdk';

const describeIfServer = process.env.TEST_BASE_URL ? describe : describe.skip;

describeIfServer('Anthropic Streaming E2E Tests', () => {
  let client: Anthropic;
  let baseURL: string;

  beforeAll(() => {
    // Use environment variable or default to localhost
    baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    client = new Anthropic({
      baseURL,
      apiKey: 'test-key', // Llama.cpp backend doesn't require real key
    });
  });

  describe('Streaming messages', () => {
    it('should stream a simple message', async () => {
      const stream = await client.messages.stream({
        model: 'qwen',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      const events: any[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Verify we got the expected events
      expect(events.length).toBeGreaterThan(0);

      // Check for message_start
      const messageStart = events.find((e) => e.type === 'message_start');
      expect(messageStart).toBeDefined();
      expect(messageStart.message.id).toBeDefined();

      // Check for content_block_start
      const contentBlockStart = events.find((e) => e.type === 'content_block_start');
      expect(contentBlockStart).toBeDefined();

      // Check for content_block_delta events
      const deltas = events.filter((e) => e.type === 'content_block_delta');
      expect(deltas.length).toBeGreaterThan(0);

      // Check for message_stop
      const messageStop = events.find((e) => e.type === 'message_stop');
      expect(messageStop).toBeDefined();
    });

    it('should accumulate text from delta events', async () => {
      const stream = await client.messages.stream({
        model: 'qwen',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'What is 2+2?' }],
      });

      let fullText = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
        }
      }

      // Verify we got some response
      expect(fullText.length).toBeGreaterThan(0);
    });

    it('should handle onText callback for streaming', async () => {
      let accumulatedText = '';

      const stream = await client.messages.stream({
        model: 'qwen',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      stream.on('text', (text) => {
        accumulatedText += text;
      });

      await stream.finalMessage();

      // Verify we got some response
      expect(accumulatedText.length).toBeGreaterThan(0);
    });
  });

  describe('Non-streaming messages', () => {
    it('should return complete response', async () => {
      const message = await client.messages.create({
        model: 'qwen',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      expect(message.type).toBe('message');
      expect(message.id).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.content.length).toBeGreaterThan(0);
      expect(message.content[0].type).toBe('text');
      expect(message.content[0].text).toBeDefined();
    });
  });
});
