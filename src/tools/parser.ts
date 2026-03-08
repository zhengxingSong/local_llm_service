/**
 * Tool Call Parser
 * Extracts tool calls from model output
 */

import { ToolCall } from '../types/common.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export interface ParsedToolCalls {
  calls: ToolCall[];
  text: string;
  hasTools: boolean;
}

/**
 * Parse tool calls from model output
 * Supports multiple formats:
 * - <tool_name>parameters</tool_name>
 * - ```tool_name
 *   parameters
 *   ```
 * - Function call format
 */
export class ToolCallParser {
  /**
   * Parse tool calls from text
   */
  parse(text: string): ParsedToolCalls {
    const calls: ToolCall[] = [];
    let remainingText = text;

    // Try different parsing strategies
    const strategies = [
      this.parseXMLFormat,
      this.parseCodeBlockFormat,
      this.parseJSONFormat,
    ];

    for (const strategy of strategies) {
      const result = strategy.call(this, remainingText);
      if (result.calls.length > 0) {
        calls.push(...result.calls);
        remainingText = result.text;
      }
    }

    return {
      calls,
      text: remainingText,
      hasTools: calls.length > 0,
    };
  }

  /**
   * Parse XML-like format: <tool_name>parameters</tool_name>
   */
  private parseXMLFormat(text: string): ParsedToolCalls {
    const calls: ToolCall[] = [];
    const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      try {
        const name = match[1];
        const paramsStr = match[2].trim();
        const parameters = JSON.parse(paramsStr);

        calls.push({ name, parameters });
        lastIndex = regex.lastIndex;
      } catch (error) {
        logger.debug(`Failed to parse XML tool call`, { match, error });
      }
    }

    return {
      calls,
      text: text.slice(lastIndex),
      hasTools: calls.length > 0,
    };
  }

  /**
   * Parse code block format: ```tool_name\nparameters\n```
   */
  private parseCodeBlockFormat(text: string): ParsedToolCalls {
    const calls: ToolCall[] = [];
    const regex = /```(\w+)\n([\s\S]*?)\n```/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      try {
        const name = match[1];
        const paramsStr = match[2].trim();
        const parameters = JSON.parse(paramsStr);

        calls.push({ name, parameters });
        lastIndex = regex.lastIndex;
      } catch (error) {
        logger.debug(`Failed to parse code block tool call`, { match, error });
      }
    }

    return {
      calls,
      text: text.slice(lastIndex),
      hasTools: calls.length > 0,
    };
  }

  /**
   * Parse JSON function call format
   */
  private parseJSONFormat(text: string): ParsedToolCalls {
    const calls: ToolCall[] = [];

    // Look for "call": ... or "function": ... patterns
    const regex = /"(?:call|function|tool)":\s*"(\w+)"\s*,\s*"args":\s*({[^}]*})/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      try {
        const name = match[1];
        const parameters = JSON.parse(match[2]);

        calls.push({ name, parameters });
        lastIndex = regex.lastIndex;
      } catch (error) {
        logger.debug(`Failed to parse JSON tool call`, { match, error });
      }
    }

    return {
      calls,
      text: text.slice(lastIndex),
      hasTools: calls.length > 0,
    };
  }

  /**
   * Format tool calls for display in prompt
   */
  formatToolsForPrompt(tools: any[]): string {
    const formatted = tools.map((tool, index) => {
      return `${index + 1}. ${tool.name}: ${tool.description}
   Parameters: ${JSON.stringify(tool.parameters, null, 2)}`;
    });

    return `Available tools:\n${formatted.join('\n\n')}`;
  }

  /**
   * Create tool call result message
   */
  formatToolResult(call: ToolCall, result: any): string {
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return `Tool ${call.name} returned: ${resultStr}`;
  }
}

let parserInstance: ToolCallParser | null = null;

export function getToolCallParser(): ToolCallParser {
  if (!parserInstance) {
    parserInstance = new ToolCallParser();
  }
  return parserInstance;
}
