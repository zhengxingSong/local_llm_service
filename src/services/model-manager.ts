import PQueue from 'p-queue';
import { ModelScanner } from './model-scanner.js';
import { ModelInfo, ModelStatus, ModelLoadRequest } from '../types/common.js';
import { getConfig } from '../config/index.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

export class ModelManager {
  private scanner: ModelScanner;
  private currentModel: ModelInfo | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;
  private queue: PQueue;

  constructor() {
    this.scanner = new ModelScanner();

    this.queue = new PQueue({
      concurrency: 1, // Model operations must be sequential
    });
  }

  async listModels(): Promise<ModelInfo[]> {
    return await this.scanner.scanModels();
  }

  async getCurrentModel(): Promise<ModelInfo | null> {
    return this.currentModel;
  }

  async loadModel(modelName: string, _options?: Partial<ModelLoadRequest>): Promise<ModelInfo> {
    return this.queue.add(async () => {
      if (this.isLoading) {
        throw new Error('Model loading is already in progress');
      }

      try {
        this.isLoading = true;
        this.error = null;

        logger.info(`Loading model: ${modelName}`);

        // Find model
        const models = await this.listModels();
        const model = models.find(
          (m) => m.name === modelName || m.filename === modelName
        );

        if (!model) {
          throw new Error(`Model not found: ${modelName}`);
        }

        // Unload current model if needed
        const config = getConfig();
        if (this.currentModel && config.models.autoUnload) {
          logger.info('Unloading current model before loading new one');
          await this.unloadModelInternal();
        }

        // Load new model via llama.cpp
        // Note: llama.cpp needs to be restarted to load a new model
        // For now, we'll just update our state
        // In a production system, you'd need to restart the llama-server

        this.currentModel = model;
        logger.info(`Model loaded successfully: ${model.name}`);

        return model;
      } catch (err: any) {
        this.error = err.message;
        logger.error(`Failed to load model: ${err.message}`);
        throw err;
      } finally {
        this.isLoading = false;
      }
    }) as Promise<ModelInfo>;
  }

  async unloadModel(): Promise<void> {
    return this.queue.add(async () => {
      await this.unloadModelInternal();
    });
  }

  private async unloadModelInternal(): Promise<void> {
    if (!this.currentModel) {
      return;
    }

    logger.info(`Unloading model: ${this.currentModel.name}`);
    this.currentModel = null;
    this.error = null;
  }

  async getStatus(): Promise<ModelStatus> {
    const available = await this.listModels();
    return {
      current: this.currentModel,
      available,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  clearCache(): void {
    this.scanner.clearCache();
  }
}

let managerInstance: ModelManager | null = null;

export function getModelManager(): ModelManager {
  if (!managerInstance) {
    managerInstance = new ModelManager();
  }
  return managerInstance;
}
