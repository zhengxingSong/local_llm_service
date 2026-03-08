// Integration Tests for API
import { describe, test, expect, beforeAll } from '@jest/globals';

// Mock ESM dependencies before importing
jest.mock('p-queue', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      add: jest.fn((fn) => fn()),
      on: jest.fn(),
      pause: jest.fn(),
      start: jest.fn(),
      clear: jest.fn(),
      size: 0,
      pending: 0,
    })),
    PriorityQueue: jest.fn(),
  };
});

// Mock model-scanner and model-manager
jest.mock('../../src/services/model-scanner', () => ({
  ModelScanner: jest.fn().mockImplementation(() => ({
    scanModels: jest.fn().mockResolvedValue([]),
    getModelPath: jest.fn().mockResolvedValue(null),
  })),
  getModelScanner: jest.fn().mockReturnValue({
    scanModels: jest.fn().mockResolvedValue([]),
    getModelPath: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock('../../src/services/model-manager', () => ({
  getModelManager: jest.fn().mockReturnValue({
    listModels: jest.fn().mockResolvedValue([]),
    getCurrentModel: jest.fn().mockResolvedValue(null),
    loadModel: jest.fn().mockResolvedValue({ success: true }),
    unloadModel: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockResolvedValue({ status: 'idle' }),
  }),
}));

// Mock llama-client
jest.mock('../../src/services/llama-client', () => ({
  getLlamaClient: jest.fn().mockReturnValue({
    getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
    getModels: jest.fn().mockResolvedValue({ data: [] }),
    chat: jest.fn().mockResolvedValue({
      content: 'Test response',
      model: 'test-model',
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response',
        },
      }],
    }),
  }),
}));

import { createTestServer } from '../helper';

describe('API Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
    await server.ready();
  });

  test('GET /api/health should return ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok'
    });
  });

  test('GET /api/models should return models', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/models'
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('models');
    expect(Array.isArray(json.models)).toBe(true);
  });

  test('GET /api/tools should return tools', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/tools'
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toHaveProperty('tools');
    expect(json).toHaveProperty('count');
    expect(json.count).toBeGreaterThan(0);
  });

  test('POST /v1/chat/completions should work', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen3.5-9B-Q6_K.gguf',
        messages: [
          { role: 'user', 'content': 'Hello' }
        ],
        max_tokens: 10
      })
    });

    // With mocked llama-client, this should work
    const json = response.json();
    expect(json).toHaveProperty('choices');
    expect(Array.isArray(json.choices)).toBe(true);
  });

  afterAll(async () => {
    await server.close();
  });
});
