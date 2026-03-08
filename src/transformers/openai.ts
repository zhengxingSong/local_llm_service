import { OpenAIChatRequest, LlamaChatRequest } from '../types/index.js';
import { convertOpenAIContentToLlama } from './openai-vision.js';

export function openaiToLlama(request: OpenAIChatRequest): LlamaChatRequest {
  const llamaRequest: LlamaChatRequest = {
    model: request.model,
    messages: request.messages.map((msg) => {
      if (typeof msg.content !== 'string') {
        const { text, images } = convertOpenAIContentToLlama(msg.content);
        const contentWithImages =
          images.length > 0
            ? text + "\n[Images: " + images.length + " image(s)]"
            : text;
        return {
          role: msg.role === 'tool' ? 'user' : msg.role,
          content: contentWithImages,
        };
      }
      return {
        role: msg.role === 'tool' ? 'user' : msg.role,
        content: msg.content,
      };
    }),
    temperature: request.temperature,
    top_p: request.top_p,
    max_tokens: request.max_tokens,
    stream: request.stream,
  };
  return llamaRequest;
}

export function llamaToOpenai(response: any, model: string): any {
  return {
    id: "chatcmpl-" + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: response.choices.map((choice: any) => ({
      index: choice.index,
      message: {
        role: choice.message.role,
        content: choice.message.content,
      },
      finish_reason: choice.finish_reason,
    })),
    usage: response.usage,
  };
}

export function llamaChunkToOpenai(chunk: any, model: string, index: number): any {
  const delta: any = {};

  // Only include content if it's not empty
  if (chunk.content && chunk.content !== '') {
    delta.content = chunk.content;
  }

  const choice: any = {
    index: index,
    delta: delta,
    finish_reason: chunk.stop ? 'stop' : null,
  };

  const result: any = {
    id: "chatcmpl-" + Date.now(),
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [choice],
  };

  // Include usage in the final chunk
  if (chunk.usage) {
    result.usage = chunk.usage;
  }

  return result;
}
