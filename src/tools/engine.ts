/**
 * Tool Execution Engine
 */

import PQueue from 'p-queue';
import { getToolRegistry } from './registry.js';
import { ToolCall, ToolResult, ToolExecutionContext } from '../types/common.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export interface ToolExecutionOptions {
  parallel?: boolean;
  maxConcurrent?: number;
  timeout?: number;
}

export class ToolExecutionEngine {
  private queue: PQueue;

  constructor(options: ToolExecutionOptions = {}) {
    this.queue = new PQueue({
      concurrency: options.maxConcurrent || 3,
      timeout: options.timeout || 30000,
    });
  }

  /**
   * Execute a single tool call
   */
  async execute(
    call: ToolCall,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      logger.info(`Executing tool: ${call.name}`, {
        params: call.parameters,
        requestId: context.requestId,
      });

      const registry = getToolRegistry();
      const result = await registry.execute(call.name, call.parameters, context);

      const duration = Date.now() - startTime;
      logger.info(`Tool ${call.name} executed successfully`, { duration });

      return {
        name: call.name,
        result,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`Tool ${call.name} execution failed`, {
        error: error.message,
        duration,
      });

      return {
        name: call.name,
        result: null,
        error: error.message,
      };
    }
  }

  /**
   * Execute multiple tool calls (in parallel if enabled)
   */
  async executeAll(
    calls: ToolCall[],
    context: ToolExecutionContext,
    options: ToolExecutionOptions = {}
  ): Promise<ToolResult[]> {
    if (calls.length === 0) {
      return [];
    }

    logger.info(`Executing ${calls.length} tool(s)`, {
      parallel: options.parallel,
    });

    if (options.parallel) {
      // Execute in parallel
      const promises = calls.map((call) =>
        this.queue.add(() => this.execute(call, context)) as Promise<ToolResult>
      );
      return await Promise.all(promises);
    } else {
      // Execute sequentially
      const results: ToolResult[] = [];
      for (const call of calls) {
        const result = await this.queue.add(() =>
          this.execute(call, context)
        ) as ToolResult;
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.queue.pause();
    logger.info('Tool execution queue paused');
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.queue.start();
    logger.info('Tool execution queue resumed');
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
    logger.info('Tool execution queue cleared');
  }
}

let engineInstance: ToolExecutionEngine | null = null;

export function getToolExecutionEngine(
  options?: ToolExecutionOptions
): ToolExecutionEngine {
  if (!engineInstance) {
    engineInstance = new ToolExecutionEngine(options);
  }
  return engineInstance;
}
