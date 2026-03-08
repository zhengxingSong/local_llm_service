/**
 * Test helper for Anthropic API tests
 * Creates a test server with only Anthropic routes to avoid conflicts
 */

import { createServer } from '../../src/server';
import { messageRoutes as anthropicMessageRoutes } from '../../src/routes/anthropic/messages';

export async function createAnthropicTestServer() {
  const server = await createServer();

  // Register only Anthropic routes for isolated testing
  await server.register(anthropicMessageRoutes);

  return server;
}
