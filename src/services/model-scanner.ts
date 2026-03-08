import fs from 'fs';
import path from 'path';
import { getConfig } from '../config/index.js';
import { ModelInfo } from '../types/common.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class ModelScanner {
  private modelsDir: string;
  private cache: Map<string, ModelInfo[]> = new Map();
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor() {
    const config = getConfig();
    this.modelsDir = path.resolve(process.cwd(), config.models.directory);
  }

  async scanModels(): Promise<ModelInfo[]> {
    const now = Date.now();
    if (now - this.cacheTime < this.CACHE_TTL && this.cache.has('models')) {
      return this.cache.get('models')!;
    }

    logger.info(`Scanning models directory: ${this.modelsDir}`);

    if (!fs.existsSync(this.modelsDir)) {
      logger.warn(`Models directory does not exist: ${this.modelsDir}`);
      return [];
    }

    const models: ModelInfo[] = [];
    const files = fs.readdirSync(this.modelsDir);

    for (const file of files) {
      if (!file.endsWith('.gguf')) {
        continue;
      }

      const filePath = path.join(this.modelsDir, file);
      const stats = fs.statSync(filePath);

      const modelInfo = this.parseModelInfo(file, filePath, stats.size);
      models.push(modelInfo);

      logger.debug(`Found model: ${modelInfo.name}`);
    }

    this.cache.set('models', models);
    this.cacheTime = now;

    logger.info(`Found ${models.length} model(s)`);

    return models;
  }

  private parseModelInfo(filename: string, filePath: string, size: number): ModelInfo {
    // Parse model filename
    // Expected format: Qwen3.5-9B-Q4_K_M.gguf or Qwen3.5-9B-Q6_K.gguf
    const name = filename.replace('.gguf', '');

    // Extract quantization and parameters
    let quantization = 'unknown';
    let parameters = 'unknown';

    const quantMatch = name.match(/-Q(\d+)_K(_\w+)?/i);
    if (quantMatch) {
      const bits = quantMatch[1];
      const type = quantMatch[2] || 'M';
      quantization = `Q${bits}_${type.substring(1)}`;
    }

    const paramMatch = name.match(/(\d+)B/);
    if (paramMatch) {
      parameters = `${paramMatch[1]}B`;
    }

    return {
      name,
      filename,
      path: filePath,
      size,
      quantization,
      parameters,
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTime = 0;
  }

  async getModelPath(name: string): Promise<string | null> {
    const models = await this.scanModels();
    const model = models.find((m) => m.name === name || m.filename === name);
    return model ? model.path : null;
  }
}

let scannerInstance: ModelScanner | null = null;

export function getModelScanner(): ModelScanner {
  if (!scannerInstance) {
    scannerInstance = new ModelScanner();
  }
  return scannerInstance;
}
