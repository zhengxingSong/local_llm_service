import { FastifyInstance } from 'fastify';
import { getModelManager } from '../../services/model-manager.js';
import { getModelScanner } from '../../services/model-scanner.js';
import { ModelInfo } from '../../types/common.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getLogger } from '../../utils/logger.js';

const execAsync = promisify(exec);
const logger = getLogger();

export async function modelRoutes(fastify: FastifyInstance) {
  // Get all available models (with current model highlighted)
  fastify.get('/api/models', async () => {
    const manager = getModelManager();
    return {
      models: await manager.listModels(),
      current: await manager.getCurrentModel(),
    };
  });

  // Get current model
  fastify.get('/api/models/current', async (_request, reply) => {
    const manager = getModelManager();
    const current = await manager.getCurrentModel();
    if (!current) {
      return reply.status(404).send({ error: 'No model loaded' });
    }
    return current;
  });

  // Load model
  fastify.post('/api/models/load', async (request, reply) => {
    const { model, options } = request.body as any;
    const manager = getModelManager();

    if (!model) {
      return reply.status(400).send({ error: 'Model name is required' });
    }

    logger.info(`Loading model: ${model}`);
    const result = await manager.loadModel(model, options);
    return result;
  });

  // Unload model
  fastify.post('/api/models/unload', async () => {
    const manager = getModelManager();
    await manager.unloadModel();
    return { success: true };
  });

  // Get model status
  fastify.get('/api/models/status', async () => {
    const manager = getModelManager();
    return await manager.getStatus();
  });

  // Switch to a different model
  fastify.post('/api/models/switch', async (request, reply) => {
    const { model } = request.body as any;

    if (!model) {
      return reply.status(400).send({ error: 'Model name is required' });
    }

    try {
      // Verify model exists
      const scanner = getModelScanner();
      const models = await scanner.scanModels();
      const targetModel = models.find(
        (m: ModelInfo) => m.name === model || m.filename === model
      );

      if (!targetModel) {
        return reply.status(404).send({
          error: `Model not found: ${model}`,
          available: models.map((m: ModelInfo) => m.name)
        });
      }

      logger.info(`Switching to model: ${model}`);

      // Kill existing llama.cpp process
      try {
        if (process.platform === 'win32') {
          await execAsync('taskkill /F /IM llama-server.exe');
        } else {
          await execAsync('pkill -f llama-server');
        }
        logger.info('Stopped existing llama.cpp process');
      } catch (error) {
        logger.warn('No existing llama.cpp process found');
      }

      // Wait for port to be released
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Start llama.cpp with new model
      const llamaPath = process.env.LLAMA_CPP_PATH || 'D:\\dev\\llama.cpp';
      const command = process.platform === 'win32'
        ? `cd "${llamaPath}" && start /B llama-server.exe -m "${targetModel.path}" --host 0.0.0.0 --port 8001 --ctx-size 8192 -ngl 99 --n-gpu-layers 99 --threads 8 --batch-size 512`
        : `cd "${llamaPath}" && ./llama-server -m "${targetModel.path}" --host 0.0.0.0 --port 8001 --ctx-size 8192 -ngl 99 --n-gpu-layers 99`;

      exec(command, (error) => {
        if (error) {
          logger.error('Failed to start llama.cpp', { error });
        } else {
          logger.info(`Started llama.cpp with model: ${model}`);
        }
      });

      // Wait for llama.cpp to start
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Verify the new model is loaded
      const maxRetries = 10;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch('http://localhost:8001/props');
          const props: any = await response.json();
          if (props.model_path && props.model_path.includes(model)) {
            logger.info(`Successfully switched to model: ${model}`);
            return {
              success: true,
              model: targetModel.name,
              message: `Model switched to ${targetModel.name}`
            };
          }
        } catch (error) {
          // Retry
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return reply.status(202).send({
        success: true,
        model: targetModel.name,
        message: `Model switch initiated for ${targetModel.name}. Please wait a few seconds for llama.cpp to fully start.`
      });

    } catch (error: any) {
      logger.error('Model switch failed', { error });
      return reply.status(500).send({
        error: 'Failed to switch model',
        details: error.message
      });
    }
  });
}
