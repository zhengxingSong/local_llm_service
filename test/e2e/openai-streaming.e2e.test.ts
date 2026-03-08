/**
 * E2E Tests for OpenAI Streaming API
 * Tests real-world compatibility with OpenAI SDK / Chatbox
 *
 * Note: These tests require a running server at TEST_BASE_URL
 * Run with: TEST_BASE_URL=http://localhost:3000 npm test -- test/e2e
 */

import { OpenAI } from 'openai';

const describeIfServer = process.env.TEST_BASE_URL ? describe : describe.skip;

describeIfServer('OpenAI Streaming E2E Tests', () => {
  let client: OpenAI;
  let baseURL: string;

  beforeAll(() => {
    // Use environment variable or default to localhost
    baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
    client = new OpenAI({
      baseURL,
      apiKey: 'test-key', // Llama.cpp backend doesn't require real key
    });
  });

  describe('Streaming chat completions', () => {
    it('should stream a simple message', async () => {
      const stream = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      });

      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      // Verify we got the expected chunks
      expect(chunks.length).toBeGreaterThan(0);

      // Check for chat.completion.chunk object type
      const firstChunk = chunks[0];
      expect(firstChunk.object).toBe('chat.completion.chunk');
      expect(firstChunk.id).toMatch(/^chatcmpl-/);
      expect(firstChunk.model).toBeDefined();
    });

    it('should accumulate text from delta events', async () => {
      const stream = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'What is 2+2?' }],
        stream: true,
      });

      let fullText = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
      }

      // Verify we got some response
      expect(fullText.length).toBeGreaterThan(0);
    });

    it('should include finish_reason in final chunk', async () => {
      const stream = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
      });

      let lastChunk: any = null;

      for await (const chunk of stream) {
        lastChunk = chunk;
      }

      // Last chunk should have finish_reason
      expect(lastChunk.choices[0]?.finish_reason).toBe('stop');
    });

    it('should handle non-streaming requests', async () => {
      const message = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      expect(message.object).toBe('chat.completion');
      expect(message.id).toBeDefined();
      expect(message.choices).toBeDefined();
      expect(message.choices[0].message).toBeDefined();
      expect(message.choices[0].finish_reason).toBeDefined();
    });

    it('should include usage in response', async () => {
      const message = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [{ role: 'user', content: 'Say hello' }],
      });

      expect(message.usage).toBeDefined();
      expect(message.usage?.prompt_tokens).toBeGreaterThanOrEqual(0);
      expect(message.usage?.completion_tokens).toBeGreaterThan(0);
      expect(message.usage?.total_tokens).toBeGreaterThan(0);
    });

    it('should handle system messages', async () => {
      const message = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello' },
        ],
      });

      expect(message.choices[0].message.content).toBeDefined();
    });

    it('should handle conversation history', async () => {
      const message = await client.chat.completions.create({
        model: 'qwen-3.5-9b',
        messages: [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'Hello Alice!' },
          { role: 'user', content: 'What is my name?' },
        ],
      });

      expect(message.choices[0].message.content).toBeDefined();
      const content = (message.choices[0].message.content || '').toLowerCase();
      // Should reference the name
      expect(content).toContain('alice');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid model gracefully', async () => {
      await expect(
        client.chat.completions.create({
          model: 'non-existent-model',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();
    });
  });
});
