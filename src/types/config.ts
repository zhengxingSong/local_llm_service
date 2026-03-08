// Configuration Types

export interface ServerConfig {
  host: string;
  port: number;
  cors: {
    origin: string;
    credentials: boolean;
  };
}

export interface LlamaConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface ModelsConfig {
  directory: string;
  default: string;
  autoUnload: boolean;
  preload: string[];
}

export interface ToolsConfig {
  enabled: boolean;
  builtin: string[];
  custom: any[];
}

export interface MCPConfig {
  enabled: boolean;
  servers: MCPServerConfig[];
}

export interface MCPServerConfig {
  name: string;
  url: string;
  enabled: boolean;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  file: string;
  console: boolean;
  maxSize: string;
  maxFiles: number;
  datePattern: string;
}

export interface SecurityConfig {
  apiKey: {
    enabled: boolean;
    header: string;
    keys: string[];
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burst: number;
  };
}

export interface PerformanceConfig {
  concurrentLimit: number;
  queueSize: number;
  timeout: number;
}

export interface Config {
  server: ServerConfig;
  llama: LlamaConfig;
  models: ModelsConfig;
  tools: ToolsConfig;
  mcp: MCPConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
}
