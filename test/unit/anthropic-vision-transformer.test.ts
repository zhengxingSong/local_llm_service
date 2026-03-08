/**
 * Unit tests for Anthropic Vision Transformer
 * TDD: Tests written first (RED phase)
 */

import type { AnthropicContentBlock } from '../../src/types/anthropic';
import {
  extractImagesFromAnthropicContent,
  convertAnthropicContentToLlama,
  isAnthropicImageContentBlock,
} from '../../src/transformers/anthropic-vision';

describe('anthropic-vision-transformer', () => {
  describe('isAnthropicImageContentBlock', () => {
    it('should return true for valid image content block', () => {
      const block = {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg',
          data: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
        },
      };

      expect(isAnthropicImageContentBlock(block)).toBe(true);
    });

    it('should return false for text content block', () => {
      const block = {
        type: 'text' as const,
        text: 'Hello world',
      };

      expect(isAnthropicImageContentBlock(block)).toBe(false);
    });

    it('should return false for tool_use content block', () => {
      const block = {
        type: 'tool_use' as const,
        id: 'tool_123',
        name: 'search',
        input: { query: 'test' },
      };

      expect(isAnthropicImageContentBlock(block)).toBe(false);
    });

    it('should return false for object without type', () => {
      const block = { foo: 'bar' };

      expect(isAnthropicImageContentBlock(block)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAnthropicImageContentBlock(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAnthropicImageContentBlock(undefined)).toBe(false);
    });

    it('should return false for image block without source', () => {
      const block = {
        type: 'image' as const,
        // Missing source
      };

      expect(isAnthropicImageContentBlock(block)).toBe(false);
    });
  });

  describe('extractImagesFromAnthropicContent', () => {
    it('should extract single image from content array', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
          },
        },
      ];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(1);
      expect(images[0]).toEqual({
        type: 'base64',
        data: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
        mediaType: 'image/jpeg',
      });
    });

    it('should extract multiple images from content array', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Compare these images:' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'jpeg-data-here',
          },
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'png-data-here',
          },
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/webp',
            data: 'webp-data-here',
          },
        },
      ];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(3);
      expect(images[0].mediaType).toBe('image/jpeg');
      expect(images[1].mediaType).toBe('image/png');
      expect(images[2].mediaType).toBe('image/webp');
    });

    it('should return empty array when no images present', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Just text here' },
        { type: 'text', text: 'More text' },
      ];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(0);
    });

    it('should return empty array for string content', () => {
      const images = extractImagesFromAnthropicContent('just a string' as any);

      expect(images).toHaveLength(0);
    });

    it('should handle empty content array', () => {
      const images = extractImagesFromAnthropicContent([]);

      expect(images).toHaveLength(0);
    });

    it('should ignore malformed image blocks', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Text' },
      ] as AnthropicContentBlock[];

      // Add malformed blocks
      content.push({ type: 'image' } as any);
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: 'valid-data',
        },
      });

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(1);
      expect(images[0].data).toBe('valid-data');
    });

    it('should ignore image blocks with invalid source type', () => {
      const content = [
        {
          type: 'image',
          source: {
            type: 'url', // Anthropic only supports base64
            url: 'https://example.com/image.jpg',
          },
        },
      ] as unknown as AnthropicContentBlock[];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(0);
    });

    it('should ignore image blocks without media_type', () => {
      const content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            data: 'some-data',
          },
        },
      ] as unknown as AnthropicContentBlock[];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(0);
    });

    it('should handle GIF format', () => {
      const content: AnthropicContentBlock[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/gif',
            data: 'gif-data',
          },
        },
      ];

      const images = extractImagesFromAnthropicContent(content);

      expect(images).toHaveLength(1);
      expect(images[0].mediaType).toBe('image/gif');
    });
  });

  describe('convertAnthropicContentToLlama', () => {
    it('should convert text-only string content', () => {
      const result = convertAnthropicContentToLlama('Hello world');

      expect(result).toEqual({
        text: 'Hello world',
        images: [],
      });
    });

    it('should convert text-only array content', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' world' },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('Hello world');
      expect(result.images).toHaveLength(0);
    });

    it('should convert mixed content with text and images', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Describe this image: ' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'base64-data',
          },
        },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('Describe this image: ');
      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toEqual({
        type: 'base64',
        data: 'base64-data',
        mediaType: 'image/jpeg',
      });
    });

    it('should concatenate text from multiple text parts', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'First text. ' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'img1-data',
          },
        },
        { type: 'text', text: 'Middle text. ' },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'img2-data',
          },
        },
        { type: 'text', text: 'Last text.' },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('First text. Middle text. Last text.');
      expect(result.images).toHaveLength(2);
    });

    it('should handle content with only images (no text)', () => {
      const content: AnthropicContentBlock[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'base64-data',
          },
        },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('');
      expect(result.images).toHaveLength(1);
    });

    it('should handle multiple consecutive images without text', () => {
      const content: AnthropicContentBlock[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'img1-data',
          },
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'img2-data',
          },
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/webp',
            data: 'img3-data',
          },
        },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('');
      expect(result.images).toHaveLength(3);
    });

    it('should filter out non-text non-image content blocks', () => {
      const content: AnthropicContentBlock[] = [
        { type: 'text', text: 'Use the tool:' },
        {
          type: 'tool_use',
          id: 'tool_123',
          name: 'search',
          input: { query: 'test' },
        },
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: 'image-data',
          },
        },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.text).toBe('Use the tool:');
      expect(result.images).toHaveLength(1);
      // tool_use should be filtered out
    });

    it('should handle all supported image formats', () => {
      const content: AnthropicContentBlock[] = [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: 'jpeg' },
        },
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: 'png' },
        },
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/webp', data: 'webp' },
        },
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/gif', data: 'gif' },
        },
      ];

      const result = convertAnthropicContentToLlama(content);

      expect(result.images).toHaveLength(4);
      expect(result.images.map((img) => img.mediaType)).toEqual([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ] as const);
    });
  });
});
