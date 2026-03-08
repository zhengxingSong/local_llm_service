/**
 * Built-in Tools: Weather, Search, Calculator, Filesystem, DateTime
 */

import { Tool, ToolExecutionContext } from '../types/common.js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Weather Tool - Get weather information
 */
export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get current weather information for a specific city',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'Name of the city (e.g., Beijing, Shanghai, New York)',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
        default: 'celsius',
      },
    },
    required: ['city'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { city, unit = 'celsius' } = params;

    try {
      // Using wttr.in service (no API key required)
      const response = await axios.get(`https://wttr.in/${city}?format=j1`, {
        timeout: 5000,
      });

      const weather = response.data;
      const temp = unit === 'celsius' ? weather.current_temp[0].C : weather.current_temp[0].F;

      return {
        city: weather.area[0],
        temperature: temp,
        condition: weather.current_condition[0],
        description: weather.current_condition[0].toLowerCase(),
        humidity: weather.current_condition[1].humidity,
        wind: weather.current_condition[3].wind,
      };
    } catch (error: any) {
      throw new Error(`Failed to get weather for ${city}: ${error.message}`);
    }
  },
};

/**
 * Web Search Tool - Search the web
 */
export const searchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information about a specific topic',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      num_results: {
        type: 'number',
        description: 'Number of results to return (1-10)',
        default: 5,
        minimum: 1,
        maximum: 10,
      },
    },
    required: ['query'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { query, num_results = 5 } = params;

    try {
      // Using DuckDuckGo Instant Answer API (no API key required)
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
        },
        timeout: 5000,
      });

      const results = response.data.RelatedTopics || [];
      const limitedResults = results.slice(0, num_results);

      return {
        query,
        results: limitedResults.map((r: any) => ({
          title: r.Text,
          url: r.FirstURL,
          description: r.Text,
        })),
        count: limitedResults.length,
      };
    } catch (error: any) {
      throw new Error(`Search failed for "${query}": ${error.message}`);
    }
  },
};

/**
 * Calculator Tool - Perform mathematical calculations
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
      },
    },
    required: ['expression'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { expression } = params;

    try {
      // Safe evaluation of mathematical expressions
      // Only allow numbers, operators, and parentheses
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');

      // eslint-disable-next-line no-eval
      const result = eval(sanitized);

      return {
        expression,
        result,
        type: typeof result,
      };
    } catch (error: any) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  },
};

/**
 * DateTime Tool - Get current date/time or perform date calculations
 */
export const dateTimeTool: Tool = {
  name: 'get_datetime',
  description: 'Get current date/time or perform date calculations',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['current', 'add', 'subtract'],
        description: 'Operation to perform',
        default: 'current',
      },
      value: {
        type: 'number',
        description: 'Value to add/subtract (for add/subtract operations)',
      },
      unit: {
        type: 'string',
        enum: ['days', 'hours', 'minutes', 'seconds'],
        description: 'Unit for add/subtract operations',
        default: 'days',
      },
    },
    required: [],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { operation = 'current', value, unit = 'days' } = params;
    const now = new Date();
    let result: Date;

    const timeMultipliers: Record<string, number> = {
      days: 24 * 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      minutes: 60 * 1000,
      seconds: 1000,
    };

    switch (operation) {
      case 'current':
        result = now;
        break;
      case 'add':
        result = new Date(now);
        const multiplier = timeMultipliers[unit];
        result.setTime(result.getTime() + value * multiplier);
        break;
      case 'subtract':
        result = new Date(now);
        const subMultiplier = timeMultipliers[unit];
        result.setTime(result.getTime() - value * subMultiplier);
        break;
      default:
        result = now;
    }

    return {
      operation,
      result: result.toISOString(),
      local: result.toLocaleString(),
      timestamp: Math.floor(result.getTime() / 1000),
    };
  },
};

/**
 * Filesystem Tool - Read file contents
 */
export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read contents of a text file',
  parameters: {
    type: 'object',
    properties: {
      filepath: {
        type: 'string',
        description: 'Path to the file to read',
      },
      encoding: {
        type: 'string',
        description: 'File encoding',
        default: 'utf-8',
      },
    },
    required: ['filepath'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { filepath, encoding = 'utf-8' } = params;

    try {
      const content = await fs.promises.readFile(filepath, encoding);
      return {
        filepath,
        content,
        size: content.length,
        encoding,
      };
    } catch (error: any) {
      throw new Error(`Failed to read file ${filepath}: ${error.message}`);
    }
  },
};

/**
 * Filesystem Tool - List directory contents
 */
export const listDirectoryTool: Tool = {
  name: 'list_directory',
  description: 'List contents of a directory',
  parameters: {
    type: 'object',
    properties: {
      dirpath: {
        type: 'string',
        description: 'Path to the directory',
      },
    },
    required: ['dirpath'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { dirpath } = params;

    try {
      const entries = await fs.promises.readdir(dirpath, { withFileTypes: true });
      const contents = entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));

      return {
        dirpath,
        contents,
        count: contents.length,
      };
    } catch (error: any) {
      throw new Error(`Failed to list directory ${dirpath}: ${error.message}`);
    }
  },
};

/**
 * Filesystem Tool - Write to a file
 */
export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: {
    type: 'object',
    properties: {
      filepath: {
        type: 'string',
        description: 'Path to the file',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
      encoding: {
        type: 'string',
        description: 'File encoding',
        default: 'utf-8',
      },
    },
    required: ['filepath', 'content'],
  },
  handler: async (params: any, _context?: ToolExecutionContext) => {
    const { filepath, content, encoding = 'utf-8' } = params;

    try {
      // Ensure directory exists
      const dir = path.dirname(filepath);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(filepath, content, encoding);

      return {
        filepath,
        bytesWritten: Buffer.byteLength(content, encoding),
        encoding,
        success: true,
      };
    } catch (error: any) {
      throw new Error(`Failed to write file ${filepath}: ${error.message}`);
    }
  },
};

/**
 * Get all built-in tools
 */
export function getBuiltinTools(): Tool[] {
  return [
    weatherTool,
    searchTool,
    calculatorTool,
    dateTimeTool,
    readFileTool,
    listDirectoryTool,
    writeFileTool,
  ];
}
