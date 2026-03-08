/**
 * Anthropic Streaming Response Utilities
 * Creates SSE events compatible with Claude Code / Anthropic API
 */

import type {
  AnthropicMessageStartEvent,
  AnthropicContentBlockStartEvent,
  AnthropicContentBlockDeltaEvent,
  AnthropicContentBlockStopEvent,
  AnthropicMessageDeltaEvent,
  AnthropicMessageStopEvent,
  AnthropicServerSentEvent,
} from '../types/anthropic.js';

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique content block ID for tool_use
 */
export function generateContentBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a message_start event
 */
export function createMessageStartEvent(
  messageId: string,
  model: string,
  inputTokens: number
): AnthropicMessageStartEvent {
  const id = messageId || generateMessageId();

  return {
    type: 'message_start',
    message: {
      id,
      type: 'message',
      role: 'assistant',
      content: [],
      model,
      usage: {
        input_tokens: inputTokens,
        output_tokens: 0,
      },
    },
  };
}

/**
 * Create a content_block_start event
 */
export function createContentBlockStartEvent(
  index: number,
  blockType: 'text' | 'tool_use',
  toolName?: string
): AnthropicContentBlockStartEvent {
  const contentBlock: AnthropicContentBlockStartEvent['content_block'] = {
    type: blockType,
  };

  if (blockType === 'text') {
    contentBlock.text = '';
  } else if (blockType === 'tool_use') {
    contentBlock.id = generateContentBlockId();
    contentBlock.name = toolName || 'unknown_tool';
    contentBlock.input = {};
  }

  return {
    type: 'content_block_start',
    index,
    content_block: contentBlock,
  };
}

/**
 * Create a content_block_delta event with text chunk
 */
export function createContentBlockDeltaEvent(
  index: number,
  text: string
): AnthropicContentBlockDeltaEvent {
  return {
    type: 'content_block_delta',
    index,
    delta: {
      type: 'text_delta',
      text,
    },
  };
}

/**
 * Create a content_block_stop event
 */
export function createContentBlockStopEvent(
  index: number
): AnthropicContentBlockStopEvent {
  return {
    type: 'content_block_stop',
    index,
  };
}

/**
 * Create a message_delta event
 */
export function createMessageDeltaEvent(
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use',
  outputTokens: number
): AnthropicMessageDeltaEvent {
  return {
    type: 'message_delta',
    delta: {
      stop_reason: stopReason,
    },
    usage: {
      output_tokens: outputTokens,
    },
  };
}

/**
 * Create a message_stop event
 */
export function createMessageStopEvent(): AnthropicMessageStopEvent {
  return {
    type: 'message_stop',
  };
}

/**
 * Format an event as SSE (Server-Sent Events) string
 */
export function formatSSEEvent(
  eventType: string,
  data: AnthropicServerSentEvent
): string {
  const json = JSON.stringify(data);
  return `event: ${eventType}\ndata: ${json}\n\n`;
}

/**
 * Stream Anthropic response from llama.cpp stream
 * Converts llama.cpp chunks to Anthropic SSE format
 */
export async function* streamAnthropicResponse(
  llamaStream: AsyncIterable<any>,
  model: string,
  inputTokens: number
): AsyncGenerator<string, void, unknown> {
  let messageId = generateMessageId();
  let hasStartedContent = false;
  let totalOutputTokens = 0;
  let stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' = 'end_turn';
  let chunks: string[] = [];

  // Send message_start event
  const messageStart = createMessageStartEvent(messageId, model, inputTokens);
  yield formatSSEEvent('message_start', messageStart);

  // Process llama.cpp stream chunks
  for await (const chunk of llamaStream) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;

    // Check for finish_reason
    if (choice.finish_reason) {
      stopReason = mapFinishReason(choice.finish_reason);
      if (chunk.usage?.completion_tokens) {
        totalOutputTokens = chunk.usage.completion_tokens;
      }
      break;
    }

    // Get delta content
    const delta = choice.delta;
    if (delta?.content) {
      chunks.push(delta.content);

      // Send content_block_start if first content
      if (!hasStartedContent) {
        const blockStart = createContentBlockStartEvent(0, 'text');
        yield formatSSEEvent('content_block_start', blockStart);
        hasStartedContent = true;
      }

      // Send content_block_delta with the text chunk
      const blockDelta = createContentBlockDeltaEvent(0, delta.content);
      yield formatSSEEvent('content_block_delta', blockDelta);
      totalOutputTokens++;
    }
  }

  // Send content_block_stop if we had content
  if (hasStartedContent) {
    const blockStop = createContentBlockStopEvent(0);
    yield formatSSEEvent('content_block_stop', blockStop);
  } else {
    // Still send block events even for empty response
    const blockStart = createContentBlockStartEvent(0, 'text');
    yield formatSSEEvent('content_block_start', blockStart);
    const blockStop = createContentBlockStopEvent(0);
    yield formatSSEEvent('content_block_stop', blockStop);
  }

  // Send message_delta event
  const messageDelta = createMessageDeltaEvent(stopReason, totalOutputTokens);
  yield formatSSEEvent('message_delta', messageDelta);

  // Send message_stop event
  const messageStop = createMessageStopEvent();
  yield formatSSEEvent('message_stop', messageStop);
}

/**
 * Map llama.cpp finish_reason to Anthropic stop_reason
 */
function mapFinishReason(
  finishReason: string
): 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' {
  switch (finishReason) {
    case 'length':
    case 'max_tokens':
      return 'max_tokens';
    case 'stop_sequence':
    case 'stop':
      return 'end_turn';
    case 'tool_calls':
      return 'tool_use';
    default:
      return 'end_turn';
  }
}
