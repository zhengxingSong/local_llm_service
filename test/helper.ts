// Test helper for creating a fully configured server
import { createServer } from '../src/server';
import { healthRoutes } from '../src/routes/admin/health';
import { modelRoutes } from '../src/routes/admin/models';
import { toolRoutes } from '../src/routes/admin/tools';
import { chatRoutes as openaiChatRoutes } from '../src/routes/openai/chat';

export async function createTestServer() {
  const server = await createServer();

  // Register all routes
  await server.register(healthRoutes);
  await server.register(modelRoutes);
  await server.register(toolRoutes);
  await server.register(openaiChatRoutes);

  // Note: We skip anthropicMessageRoutes in tests because /v1/models conflicts
  // In production, the server handles this by using different route strategies

  return server;
}
