import { AnthropicMessageRequest, LlamaChatRequest } from '../types/index.js';
import { convertAnthropicContentToLlama } from './anthropic-vision.js';

export function anthropicToLlama(request: AnthropicMessageRequest): LlamaChatRequest {
  const messages: any[] = [];

  if (request.system) {
    messages.push({
      role: 'system',
      content: request.system,
    });
  }

  for (const msg of request.messages) {
    if (typeof msg.content !== 'string') {
      const { text, images } = convertAnthropicContentToLlama(msg.content);
      const contentWithImages =
        images.length > 0
          ? text + "\n[Images: " + images.length + " image(s)]"
          : text;
      messages.push({
        role: msg.role,
        content: contentWithImages,
      });
    } else {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  const llamaRequest: LlamaChatRequest = {
    model: request.model,
    messages,
    max_tokens: request.max_tokens,
    temperature: request.temperature,
    top_p: request.top_p,
  };

  return llamaRequest;
}

export function llamaToAnthropic(response: any, model: string): any {
  const choice = response.choices[0];
  return {
    id: "msg_" + Date.now(),
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: choice.message.content,
      },
    ],
    model,
    stop_reason: choice.finish_reason === "stop" ? "end_turn" : choice.finish_reason,
    usage: {
      input_tokens: response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
    },
  };
}
