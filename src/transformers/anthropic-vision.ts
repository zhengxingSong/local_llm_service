/**
 * Anthropic Vision Transformer
 * Handles extraction and conversion of Anthropic vision content
 */

import { ImageSource } from '../types/vision.js';
import { AnthropicContentBlock } from '../types/anthropic.js';

/**
 * Type guard for Anthropic image content block
 */
export function isAnthropicImageContentBlock(
  block: unknown
): block is AnthropicContentBlock & {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
} {
  return (
    typeof block === 'object' &&
    block !== null &&
    'type' in block &&
    (block as { type: string }).type === 'image' &&
    'source' in block &&
    typeof (block as { source: unknown }).source === 'object' &&
    (block as { source: any }).source !== null &&
    'type' in (block as { source: any }).source &&
    (block as { source: { type: string } }).source.type === 'base64' &&
    'media_type' in (block as { source: any }).source &&
    typeof (block as { source: { media_type: unknown } }).source.media_type ===
      'string' &&
    'data' in (block as { source: any }).source &&
    typeof (block as { source: { data: unknown } }).source.data === 'string'
  );
}

/**
 * Extract images from Anthropic content
 */
export function extractImagesFromAnthropicContent(
  content: string | AnthropicContentBlock[]
): ImageSource[] {
  // If content is a string, there are no images
  if (typeof content === 'string') {
    return [];
  }

  const images: ImageSource[] = [];

  for (const block of content) {
    if (isAnthropicImageContentBlock(block)) {
      images.push({
        type: 'base64',
        data: block.source.data,
        mediaType: block.source.media_type,
      });
    }
  }

  return images;
}

/**
 * Convert Anthropic content to Llama format
 */
export function convertAnthropicContentToLlama(
  content: string | AnthropicContentBlock[]
): { text: string; images: ImageSource[] } {
  // If content is a string, return it as-is with no images
  if (typeof content === 'string') {
    return {
      text: content,
      images: [],
    };
  }

  const textParts: string[] = [];
  const images: ImageSource[] = [];

  for (const block of content) {
    if (block.type === 'text' && block.text) {
      textParts.push(block.text);
    } else if (isAnthropicImageContentBlock(block)) {
      images.push({
        type: 'base64',
        data: block.source.data,
        mediaType: block.source.media_type,
      });
    }
    // Ignore other block types like tool_use, tool_result
  }

  return {
    text: textParts.join(''),
    images,
  };
}
