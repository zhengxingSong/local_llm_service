// Unit Tests for ToolRegistry
import { describe, test, expect, beforeEach } from '@jest/globals';
import { ToolRegistry } from '../../src/tools/registry';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  test('should register a tool', () => {
    const mockTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      },
      handler: async (params: any) => ({ result: params.input })
    };

    registry.register(mockTool);

    expect(registry.has('test_tool')).toBe(true);
    expect(registry.get('test_tool')).toEqual(mockTool);
  });

  test('should list all tools', () => {
    const mockTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: { type: 'object' as const, properties: {} },
      handler: async () => ({}),
    };

    registry.register(mockTool);

    const tools = registry.list();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('test_tool');
  });

  test('should execute a tool', async () => {
    const mockTool = {
      name: 'calculator',
      description: 'A calculator',
      parameters: {
        type: 'object' as const,
        properties: {
          expression: { type: 'string' }
        },
        required: ['expression']
      },
      handler: async (params: any) => ({
        result: eval(params.expression)
      })
    };

    registry.register(mockTool);

    const context = {
      requestId: 'test-123',
      timestamp: new Date()
    };

    const result = await registry.execute('calculator', { expression: '2 + 2' }, context);

    expect(result.result).toBe(4);
  });

  test('should validate parameters', async () => {
    const mockTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        type: 'object' as const,
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      },
      handler: async () => ({}),
    };

    registry.register(mockTool);

    const context = {
      requestId: 'test-123',
      timestamp: new Date()
    };

    await expect(
      registry.execute('test_tool', {}, context)
    ).rejects.toThrow('Invalid parameters');
  });
});
