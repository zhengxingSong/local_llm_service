#!/usr/bin/env node
/**
 * Qwen AI Service - JavaScript Client Example
 */

import OpenAI from 'openai';

// Initialize client
const client = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'dummy' // Not used, but required
});

async function simpleChat() {
  console.log('=== Simple Chat ===\n');

  const response = await client.chat.completions.create({
    model: 'Qwen3.5-9B-Q6_K.gguf',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello! Please introduce yourself.' }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  console.log(`Assistant: ${response.choices[0].message.content}`);
  console.log(`\nTokens used: ${response.usage.total_tokens}`);
}

async function streamingChat() {
  console.log('\n=== Streaming Chat ===\n');

  const stream = await client.chat.completions.create({
    model: 'Qwen3.5-9B-Q6_K.gguf',
    messages: [
      { role: 'user', content: 'Explain quantum computing in 3 sentences' }
    ],
    stream: true,
    max_tokens: 200
  });

  console.log('Assistant: ');
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
  console.log('\n');
}

async function multiTurnConversation() {
  console.log('\n=== Multi-turn Conversation ===\n');

  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' }
  ];

  while (true) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const userInput = await new Promise(resolve => {
      rl.question('\nYou (or "quit"): ', resolve);
    });
    rl.close();

    if (userInput.toLowerCase() === 'quit') break;

    messages.push({ role: 'user', content: userInput });

    const response = await client.chat.completions.create({
      model: 'Qwen3.5-9B-Q6_K.gguf',
      messages,
      max_tokens: 300
    });

    const assistantMessage = response.choices[0].message.content;
    console.log(`\nAssistant: ${assistantMessage}`);

    messages.push({ role: 'assistant', content: assistantMessage });
  }
}

async function main() {
  try {
    // Test connection
    const models = await client.models.list();
    console.log(`Connected to Qwen AI Service`);
    console.log(`Available models: ${models.data.length}\n`);

    // Run examples
    await simpleChat();
    // await streamingChat();
    // await multiTurnConversation();

  } catch (error) {
    console.error('\nError:', error.message);
    console.log('\nMake sure:');
    console.log('1. Qwen AI Service is running (npm run dev)');
    console.log('2. llama.cpp is running on port 8001');
  }
}

main();
