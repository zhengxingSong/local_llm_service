/**
 * Unit tests for OpenAI Vision Transformer
 * TDD: Tests written first (RED phase)
 */

import type { OpenAIContentPart } from '../../src/types/openai';
import {
  extractImagesFromOpenAIContent,
  convertOpenAIContentToLlama,
  isOpenAIImageContentPart,
} from '../../src/transformers/openai-vision';

describe('openai-vision-transformer', () => {
  describe('isOpenAIImageContentPart', () => {
    it('should return true for valid image_url content part', () => {
      const part = {
        type: 'image_url' as const,
        image_url: { url: 'https://example.com/image.jpg' },
      };

      expect(isOpenAIImageContentPart(part)).toBe(true);
    });

    it('should return false for text content part', () => {
      const part = {
        type: 'text' as const,
        text: 'Hello world',
      };

      expect(isOpenAIImageContentPart(part)).toBe(false);
    });

    it('should return false for object without type', () => {
      const part = { foo: 'bar' };

      expect(isOpenAIImageContentPart(part)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isOpenAIImageContentPart(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isOpenAIImageContentPart(undefined)).toBe(false);
    });
  });

  describe('extractImagesFromOpenAIContent', () => {
    it('should extract single image from content array', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.jpg' },
        },
      ];

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(1);
      expect(images[0]).toEqual({
        type: 'url',
        data: 'https://example.com/image.jpg',
      });
    });

    it('should extract multiple images from content array', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Compare these images:' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image1.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image2.png' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image3.webp' },
        },
      ];

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(3);
      expect(images[0].data).toBe('https://example.com/image1.jpg');
      expect(images[1].data).toBe('https://example.com/image2.png');
      expect(images[2].data).toBe('https://example.com/image3.webp');
    });

    it('should extract image with base64 data URL', () => {
      const content: OpenAIContentPart[] = [
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
          },
        },
      ];

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(1);
      expect(images[0]).toEqual({
        type: 'base64',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
        mediaType: 'image/jpeg',
      });
    });

    it('should return empty array when no images present', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Just text here' },
        { type: 'text', text: 'More text' },
      ];

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(0);
    });

    it('should return empty array for string content', () => {
      const images = extractImagesFromOpenAIContent('just a string');

      expect(images).toHaveLength(0);
    });

    it('should handle empty content array', () => {
      const images = extractImagesFromOpenAIContent([]);

      expect(images).toHaveLength(0);
    });

    it('should ignore malformed image_url objects', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Text' },
        { type: 'text', text: 'Malformed' }, // Using text instead of image_url without url
      ] as OpenAIContentPart[];

      // Manually add malformed part
      content.push({ type: 'image_url' } as any);
      content.push({
        type: 'image_url',
        image_url: { url: 'https://example.com/valid.jpg' },
      });

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(1);
      expect(images[0].data).toBe('https://example.com/valid.jpg');
    });

    it('should ignore image_url with missing url property', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { something: 'else' },
        },
      ] as unknown as OpenAIContentPart[];

      const images = extractImagesFromOpenAIContent(content);

      expect(images).toHaveLength(0);
    });
  });

  describe('convertOpenAIContentToLlama', () => {
    it('should convert text-only string content', () => {
      const result = convertOpenAIContentToLlama('Hello world');

      expect(result).toEqual({
        text: 'Hello world',
        images: [],
      });
    });

    it('should convert text-only array content', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' world' },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.text).toBe('Hello world');
      expect(result.images).toHaveLength(0);
    });

    it('should convert mixed content with text and images', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Describe this image: ' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.jpg' },
        },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.text).toBe('Describe this image: ');
      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toEqual({
        type: 'url',
        data: 'https://example.com/image.jpg',
      });
    });

    it('should concatenate text from multiple text parts', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'First text. ' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image1.jpg' },
        },
        { type: 'text', text: 'Middle text. ' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image2.jpg' },
        },
        { type: 'text', text: 'Last text.' },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.text).toBe('First text. Middle text. Last text.');
      expect(result.images).toHaveLength(2);
    });

    it('should handle content with only images (no text)', () => {
      const content: OpenAIContentPart[] = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.jpg' },
        },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.text).toBe('');
      expect(result.images).toHaveLength(1);
    });

    it('should extract base64 images with media type', () => {
      const content: OpenAIContentPart[] = [
        { type: 'text', text: 'Analyze this:' },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAF',
          },
        },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toEqual({
        type: 'base64',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAF',
        mediaType: 'image/png',
      });
    });

    it('should handle multiple consecutive images without text', () => {
      const content: OpenAIContentPart[] = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/img1.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/img2.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/img3.jpg' },
        },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.text).toBe('');
      expect(result.images).toHaveLength(3);
    });

    it('should handle mixed URL and base64 images', () => {
      const content: OpenAIContentPart[] = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/remote.jpg' },
        },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg',
          },
        },
      ];

      const result = convertOpenAIContentToLlama(content);

      expect(result.images).toHaveLength(2);
      expect(result.images[0].type).toBe('url');
      expect(result.images[1].type).toBe('base64');
    });
  });
});
