import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../config/index.js';
import { LlamaChatRequest, LlamaChatResponse, LlamaModelsResponse, LlamaHealthResponse } from '../types/llama.js';
import logger from '../utils/logger.js';

export class LlamaClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.llama.baseUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.llama.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Llama.cpp request', { method: config.method, url: config.url });
        return config;
      },
      (error) => {
        logger.error('Llama.cpp request error', { error });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Llama.cpp response', { status: response.status });
        return response;
      },
      (error) => {
        logger.error('Llama.cpp response error', {
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async chat(request: LlamaChatRequest): Promise<LlamaChatResponse> {
    const config = getConfig();

    let retries = 0;
    const maxRetries = config.llama.maxRetries;

    while (retries <= maxRetries) {
      try {
        const response = await this.client.post<LlamaChatResponse>(
          '/v1/chat/completions',
          request
        );
        return response.data;
      } catch (error: any) {
        if (retries === maxRetries) {
          throw error;
        }

        const isRetryable =
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          (error.response?.status >= 500);

        if (!isRetryable) {
          throw error;
        }

        retries++;
        const delay = config.llama.retryDelay * retries;
        logger.warn(`Retry ${retries}/${maxRetries} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  async chatStream(request: LlamaChatRequest): Promise<AsyncIterable<any>> {
    const config = getConfig();

    let retries = 0;
    const maxRetries = config.llama.maxRetries;

    while (retries <= maxRetries) {
      try {
        const response = await this.client.post('/v1/chat/completions', request, {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
          },
        });

        // Create an async iterable for the stream
        return this.createStreamIterable(response.data);
      } catch (error: any) {
        if (retries === maxRetries) {
          throw error;
        }

        const isRetryable =
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          (error.response?.status >= 500);

        if (!isRetryable) {
          throw error;
        }

        retries++;
        const delay = config.llama.retryDelay * retries;
        logger.warn(`Retry ${retries}/${maxRetries} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async *createStreamIterable(stream: any): AsyncIterable<any> {
    const buffer = {
      chunks: [] as string[],
      size: 0,
    };

    for await (const chunk of stream) {
      const text = chunk.toString();
      buffer.chunks.push(text);
      buffer.size += text.length;

      // Process complete SSE lines
      const data = buffer.chunks.join('');
      buffer.chunks = [];
      buffer.size = 0;

      const lines = data.split('\n');
      // Keep the last incomplete line if any
      const lastLine = lines.pop();
      if (lastLine !== undefined && lastLine !== '') {
        buffer.chunks.push(lastLine);
        buffer.size = lastLine.length;
      }

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const sseData = trimmedLine.slice(6).trim();
          if (sseData === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(sseData);
            yield parsed;
          } catch (e) {
            logger.warn('Failed to parse SSE data:', sseData);
          }
        }
      }
    }
  }

  async getModels(): Promise<LlamaModelsResponse> {
    const response = await this.client.get<LlamaModelsResponse>('/v1/models');
    return response.data;
  }

  async getHealth(): Promise<LlamaHealthResponse> {
    const response = await this.client.get<LlamaHealthResponse>('/health');
    return response.data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

let clientInstance: LlamaClient | null = null;

export function getLlamaClient(): LlamaClient {
  if (!clientInstance) {
    clientInstance = new LlamaClient();
  }
  return clientInstance;
}
