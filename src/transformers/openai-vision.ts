/**
 * OpenAI Vision Transformer
 * Handles extraction and conversion of OpenAI vision content
 */

import { ImageSource } from '../types/vision.js';
import { OpenAIContentPart } from '../types/openai.js';

/**
 * Type guard for OpenAI image content part
 */
export function isOpenAIImageContentPart(
  part: unknown
): part is OpenAIContentPart & { type: 'image_url'; image_url: { url: string } } {
  return (
    typeof part === 'object' &&
    part !== null &&
    'type' in part &&
    (part as { type: string }).type === 'image_url' &&
    'image_url' in part &&
    typeof (part as { image_url: unknown }).image_url === 'object' &&
    (part as { image_url: any }).image_url !== null &&
    'url' in (part as { image_url: any }).image_url &&
    typeof (part as { image_url: { url: unknown } }).image_url.url === 'string'
  );
}

/**
 * Extract images from OpenAI content
 */
export function extractImagesFromOpenAIContent(
  content: string | OpenAIContentPart[]
): ImageSource[] {
  // If content is a string, there are no images
  if (typeof content === 'string') {
    return [];
  }

  const images: ImageSource[] = [];

  for (const part of content) {
    if (isOpenAIImageContentPart(part)) {
      const url = part.image_url.url;

      // Check if it's a data URL (base64)
      if (url.startsWith('data:')) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          images.push({
            type: 'base64',
            data: url,
            mediaType: match[1],
          });
        }
      } else {
        // Regular URL
        images.push({
          type: 'url',
          data: url,
        });
      }
    }
  }

  return images;
}

/**
 * Convert OpenAI content to Llama format
 */
export function convertOpenAIContentToLlama(
  content: string | OpenAIContentPart[]
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

  for (const part of content) {
    if (part.type === 'text' && part.text) {
      textParts.push(part.text);
    } else if (isOpenAIImageContentPart(part)) {
      const url = part.image_url.url;

      if (url.startsWith('data:')) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          images.push({
            type: 'base64',
            data: url,
            mediaType: match[1],
          });
        }
      } else {
        images.push({
          type: 'url',
          data: url,
        });
      }
    }
  }

  return {
    text: textParts.join(''),
    images,
  };
}
