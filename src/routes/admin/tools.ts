import { FastifyInstance } from 'fastify';
import { registerTool, listTools, getTool } from '../../tools/registry.js';
import { getBuiltinTools } from '../../tools/builtin.js';
import { getToolCallParser } from '../../tools/parser.js';
import { getToolExecutionEngine } from '../../tools/engine.js';
import { getLogger } from '../../utils/logger.js';

const logger = getLogger();

export async function toolRoutes(fastify: FastifyInstance) {
  // Initialize built-in tools
  const builtinTools = getBuiltinTools();
  for (const tool of builtinTools) {
    registerTool(tool);
  }
  logger.info(`Registered ${builtinTools.length} built-in tools`);

  // List all tools
  fastify.get('/api/tools', async () => {
    const tools = listTools();
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
      count: tools.length,
    };
  });

  // Get specific tool
  fastify.get<{ Params: { name: string } }>('/api/tools/:name', async (request, reply) => {
    const { name } = request.params;
    const tool = getTool(name);

    if (!tool) {
      return reply.status(404).send({ error: `Tool not found: ${name}` });
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };
  });

  // Register custom tool
  fastify.post('/api/tools/register', async (request, reply) => {
    const toolDefinition = request.body as any;

    // Validate tool definition
    if (!toolDefinition.name || !toolDefinition.handler) {
      return reply.status(400).send({ error: 'Invalid tool definition' });
    }

    // Create handler from string (if needed)
    let handler = toolDefinition.handler;
    if (typeof handler === 'string') {
      handler = eval(`(${handler})`);
    }

    const tool = {
      name: toolDefinition.name,
      description: toolDefinition.description,
      parameters: toolDefinition.parameters,
      handler,
    };

    registerTool(tool);

    logger.info(`Custom tool registered: ${tool.name}`);

    return {
      success: true,
      tool: {
        name: tool.name,
        description: tool.description,
      },
    };
  });

  // Execute tool
  fastify.post('/api/tools/execute', async (request, reply) => {
    const { name, parameters } = request.body as any;

    if (!name) {
      return reply.status(400).send({ error: 'Tool name is required' });
    }

    const engine = getToolExecutionEngine();
    const context = {
      requestId: request.id,
      timestamp: new Date(),
    };

    const result = await engine.execute(
      {
        name,
        parameters: parameters || {},
      },
      context
    );

    return result;
  });

  // Parse tool calls from text
  fastify.post('/api/tools/parse', async (request, reply) => {
    const { text } = request.body as any;

    if (!text) {
      return reply.status(400).send({ error: 'Text is required' });
    }

    const parser = getToolCallParser();
    const parsed = parser.parse(text);

    return {
      ...parsed,
      count: parsed.calls.length,
    };
  });

  // Format tools for prompt
  fastify.get('/api/tools/format', async () => {
    const tools = listTools();
    const parser = getToolCallParser();

    return {
      formatted: parser.formatToolsForPrompt(tools),
      count: tools.length,
    };
  });
}
