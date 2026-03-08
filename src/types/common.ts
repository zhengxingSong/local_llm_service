// Tool Types

export interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: ToolHandler;
}

export type ToolHandler = (params: any, context?: ToolExecutionContext) => Promise<any>;

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  enum?: any[];
  default?: any;
  minimum?: number;
  maximum?: number;
}

export interface ToolCall {
  name: string;
  parameters: any;
}

export interface ToolResult {
  name: string;
  result: any;
  error?: string;
}

export interface ToolExecutionContext {
  requestId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Model Types
export interface ModelInfo {
  name: string;
  filename: string;
  path: string;
  size: number;
  quantization: string;
  parameters: string;
}

export interface ModelLoadRequest {
  model: string;
  ngpu?: number;
  ctx_size?: number;
}

export interface ModelStatus {
  current: ModelInfo | null;
  available: ModelInfo[];
  isLoading: boolean;
  error: string | null;
}

// MCP Types
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: object;
}
