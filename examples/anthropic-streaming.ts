/**
 * Example: Using Anthropic Streaming API with Claude Code SDK
 *
 * This demonstrates how to use the streaming API for real-time responses
 */

import { Anthropic } from '@anthropic-ai/sdk';

async function streamingExample() {
  const client = new Anthropic({
    baseURL: 'http://localhost:3000',
    apiKey: 'dummy-key', // Not used by llama.cpp backend
    dangerouslyAllowBrowser: true,
  });

  console.log('=== Streaming Example ===\n');

  // Stream a response
  const stream = await client.messages.stream({
    model: 'qwen',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'Tell me a short joke' }],
  });

  console.log('Response: ');

  for await (const event of stream) {
    switch (event.type) {
      case 'message_start':
        console.log(`[Message ID: ${event.message.id}]`);
        break;
      case 'content_block_start':
        console.log('[Content block started]');
        break;
      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          process.stdout.write(event.delta.text);
        }
        break;
      case 'content_block_stop':
        console.log('\n[Content block ended]');
        break;
      case 'message_delta':
        console.log(`[Stop reason: ${event.delta.stop_reason}]`);
        break;
      case 'message_stop':
        console.log('[Message completed]');
        break;
    }
  }
}

async function nonStreamingExample() {
  const client = new Anthropic({
    baseURL: 'http://localhost:3000',
    apiKey: 'dummy-key',
  });

  console.log('\n=== Non-Streaming Example ===\n');

  const message = await client.messages.create({
    model: 'qwen',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'What is the capital of France?' }],
  });

  console.log('Response:', message.content[0].text);
  console.log('Usage:', message.usage);
}

// Run examples if executed directly
if (require.main === module) {
  streamingExample()
    .then(() => nonStreamingExample())
    .then(() => console.log('\nDone!'))
    .catch(console.error);
}

export { streamingExample, nonStreamingExample };
