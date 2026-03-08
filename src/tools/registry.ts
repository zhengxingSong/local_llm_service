/**
 * Tools Registry and Management
 */

import { Tool, ToolExecutionContext, JSONSchema } from '../types/common.js';
import { validate } from 'jsonschema';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool "${tool.name}" is already registered, overwriting`);
    }

    // Validate tool definition
    this.validateTool(tool);

    this.tools.set(tool.name, tool);
    logger.info(`Tool registered: ${tool.name}`);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(name: string, params: any, context: ToolExecutionContext): Promise<any> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.debug(`Executing tool: ${name}`, { params });

    // Validate parameters against schema
    const validationResult = this.validateParameters(tool.parameters, params);
    if (!validationResult.valid) {
      const errors = validationResult.errors?.join(', ') || 'unknown error';
      throw new Error(`Invalid parameters for tool ${name}: ${errors}`);
    }

    // Execute tool handler
    try {
      const result = await tool.handler(params, context);
      logger.debug(`Tool ${name} executed successfully`);
      return result;
    } catch (error: any) {
      logger.error(`Tool ${name} execution failed`, { error });
      throw error;
    }
  }

  private validateTool(tool: Tool): void {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool must have a valid name');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool must have a description');
    }

    if (!tool.parameters || typeof tool.parameters !== 'object') {
      throw new Error('Tool must have parameters schema');
    }

    if (!tool.handler || typeof tool.handler !== 'function') {
      throw new Error('Tool must have a handler function');
    }
  }

  private validateParameters(schema: JSONSchema, params: any): { valid: boolean; errors?: string[] } {
    try {
      const result = validate(params, schema);
      return { valid: result.valid };
    } catch (error: any) {
      return { valid: false, errors: [error.message] };
    }
  }
}

// Global registry instance
let globalRegistry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry();
  }
  return globalRegistry;
}

export function registerTool(tool: Tool): void {
  getToolRegistry().register(tool);
}

export function getTool(name: string): Tool | undefined {
  return getToolRegistry().get(name);
}

export function listTools(): Tool[] {
  return getToolRegistry().list();
}
