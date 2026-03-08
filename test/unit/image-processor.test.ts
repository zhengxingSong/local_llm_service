/**
 * Unit tests for Image Processor
 * TDD: Tests written first (RED phase)
 */

import {
  downloadImage,
  decodeBase64,
  validateImage,
  processImage,
  resizeIfNeeded,
} from '../../src/multimodal/image-processor';
import {
  ImageValidationError,
  ImageDownloadError,
  ImageDecodingError,
  DEFAULT_IMAGE_OPTIONS,
} from '../../src/types/vision';

// Mock sharp module
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => mockSharpInstance);
  const mockSharpInstance: any = {
    metadata: jest.fn().mockResolvedValue({
      format: 'jpeg',
      width: 800,
      height: 600,
    }),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image-data')),
    clone: jest.fn().mockReturnThis(),
  };
  (mockSharp as any).format = jest.fn();
  return mockSharp;
});

import sharp from 'sharp';

// Mock axios for image download
jest.mock('axios');

import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('image-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadImage', () => {
    it('should download image from valid URL', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageData,
        headers: { 'content-type': 'image/jpeg' },
      });

      const result = await downloadImage('https://example.com/image.jpg');

      expect(result).toEqual({
        buffer: mockImageData,
        mediaType: 'image/jpeg',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          responseType: 'arraybuffer',
        })
      );
    });

    it('should handle URLs without extension by detecting content type', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageData,
        headers: { 'content-type': 'image/png' },
      });

      const result = await downloadImage('https://example.com/image');

      expect(result.mediaType).toBe('image/png');
    });

    it('should throw ImageDownloadError on network failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        downloadImage('https://example.com/image.jpg')
      ).rejects.toThrow(ImageDownloadError);
    });

    it('should throw ImageDownloadError on 404', async () => {
      const error = new Error('Not Found') as any;
      error.response = { status: 404 };
      mockedAxios.get.mockRejectedValue(error);

      await expect(
        downloadImage('https://example.com/missing.jpg')
      ).rejects.toThrow(ImageDownloadError);
    });

    it('should throw ImageDownloadError for invalid URL', async () => {
      await expect(
        downloadImage('not-a-url')
      ).rejects.toThrow(ImageDownloadError);
    });

    it('should follow redirects', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      mockedAxios.get.mockResolvedValue({
        data: mockImageData,
        headers: { 'content-type': 'image/jpeg' },
      });

      await downloadImage('https://example.com/redirect');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/redirect',
        expect.objectContaining({
          maxRedirects: 5,
        })
      );
    });
  });

  describe('decodeBase64', () => {
    it('should decode OpenAI format base64 with data URL prefix', () => {
      const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const result = decodeBase64(base64Data);

      expect(result).toEqual({
        buffer: expect.any(Buffer),
        mediaType: 'image/jpeg',
      });
    });

    it('should decode Anthropic format base64 (raw)', () => {
      const base64Data = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const mediaType = 'image/jpeg';
      const result = decodeBase64(base64Data, mediaType);

      expect(result).toEqual({
        buffer: expect.any(Buffer),
        mediaType: 'image/jpeg',
      });
    });

    it('should decode base64 without media type and default to jpeg', () => {
      const base64Data = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD';
      const result = decodeBase64(base64Data);

      expect(result).toEqual({
        buffer: expect.any(Buffer),
        mediaType: 'image/jpeg',
      });
    });

    it('should handle PNG base64 data URLs', () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
      const result = decodeBase64(base64Data);

      expect(result.mediaType).toBe('image/png');
    });

    it('should handle WebP base64 data URLs', () => {
      const base64Data = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoB';
      const result = decodeBase64(base64Data);

      expect(result.mediaType).toBe('image/webp');
    });

    it('should throw ImageDecodingError for invalid base64', () => {
      expect(() => decodeBase64('not-valid-base64!@#')).toThrow(
        ImageDecodingError
      );
    });

    it('should throw ImageDecodingError for empty string', () => {
      expect(() => decodeBase64('')).toThrow(ImageDecodingError);
    });
  });

  describe('validateImage', () => {
    it('should pass validation for valid JPEG', async () => {
      const mockBuffer = Buffer.from('valid-jpeg');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 800,
          height: 600,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/jpeg', DEFAULT_IMAGE_OPTIONS)
      ).resolves.not.toThrow();
    });

    it('should pass validation for valid PNG', async () => {
      const mockBuffer = Buffer.from('valid-png');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'png',
          width: 1024,
          height: 768,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/png', DEFAULT_IMAGE_OPTIONS)
      ).resolves.not.toThrow();
    });

    it('should throw ImageValidationError for unsupported format', async () => {
      const mockBuffer = Buffer.from('invalid-format');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'bmp',
          width: 800,
          height: 600,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/bmp', DEFAULT_IMAGE_OPTIONS)
      ).rejects.toThrow(ImageValidationError);
    });

    it('should throw ImageValidationError for file size exceeding limit', async () => {
      const mockBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const options = { ...DEFAULT_IMAGE_OPTIONS, maxFileSize: 10 * 1024 * 1024 };

      await expect(
        validateImage(mockBuffer, 'image/jpeg', options)
      ).rejects.toThrow(ImageValidationError);
    });

    it('should throw ImageValidationError for dimensions exceeding limit', async () => {
      const mockBuffer = Buffer.from('huge-image');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 3000,
          height: 2000,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/jpeg', DEFAULT_IMAGE_OPTIONS)
      ).rejects.toThrow(ImageValidationError);
    });

    it('should throw ImageValidationError for corrupted image data', async () => {
      const mockBuffer = Buffer.from('corrupted-data');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockRejectedValue(new Error('Invalid image')),
      }));

      await expect(
        validateImage(mockBuffer, 'image/jpeg', DEFAULT_IMAGE_OPTIONS)
      ).rejects.toThrow(ImageDecodingError);
    });

    it('should accept image exactly at size limit', async () => {
      const mockBuffer = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      const options = { ...DEFAULT_IMAGE_OPTIONS, maxFileSize: 10 * 1024 * 1024 };
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 800,
          height: 600,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/jpeg', options)
      ).resolves.not.toThrow();
    });

    it('should accept image exactly at dimension limit', async () => {
      const mockBuffer = Buffer.from('max-dimensions');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 2048,
          height: 2048,
        }),
      }));

      await expect(
        validateImage(mockBuffer, 'image/jpeg', DEFAULT_IMAGE_OPTIONS)
      ).resolves.not.toThrow();
    });
  });

  describe('resizeIfNeeded', () => {
    it('should return original buffer when dimensions are within limit', async () => {
      const mockBuffer = Buffer.from('small-image');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 800,
          height: 600,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      }));

      const result = await resizeIfNeeded(mockBuffer, 2048);

      expect(sharp).toHaveBeenCalledWith(mockBuffer);
      expect(result).toEqual(expect.any(Buffer));
    });

    it('should resize image when width exceeds limit', async () => {
      const mockBuffer = Buffer.from('wide-image');
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 3000,
          height: 1000,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      await resizeIfNeeded(mockBuffer, 2048);

      expect(sharpInstance.resize).toHaveBeenCalledWith(2048, expect.any(Number), {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should resize image when height exceeds limit', async () => {
      const mockBuffer = Buffer.from('tall-image');
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 1000,
          height: 3000,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      await resizeIfNeeded(mockBuffer, 2048);

      expect(sharpInstance.resize).toHaveBeenCalledWith(expect.any(Number), 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should maintain aspect ratio when resizing', async () => {
      const mockBuffer = Buffer.from('aspect-image');
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 4000,
          height: 3000,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      await resizeIfNeeded(mockBuffer, 2048);

      // 4000:3000 = 2048:1536 (maintaining aspect ratio)
      expect(sharpInstance.resize).toHaveBeenCalledWith(2048, 1536, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should handle resize errors gracefully', async () => {
      const mockBuffer = Buffer.from('error-image');
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockRejectedValue(new Error('Sharp error')),
      }));

      await expect(resizeIfNeeded(mockBuffer, 2048)).rejects.toThrow(
        ImageDecodingError
      );
    });
  });

  describe('processImage', () => {
    it('should process image from URL source', async () => {
      const mockImageData = Buffer.from('url-image');
      mockedAxios.get.mockResolvedValue({
        data: mockImageData,
        headers: { 'content-type': 'image/jpeg' },
      });
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 800,
          height: 600,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockImageData),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      const result = await processImage({
        type: 'url',
        data: 'https://example.com/image.jpg',
      });

      expect(result).toEqual({
        buffer: mockImageData,
        mediaType: 'image/jpeg',
        width: 800,
        height: 600,
        size: mockImageData.length,
      });
    });

    it('should process image from base64 source (OpenAI format)', async () => {
      const mockImageData = Buffer.from('base64-image');
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 1024,
          height: 768,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockImageData),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      const result = await processImage({
        type: 'base64',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg',
      });

      expect(result.mediaType).toBe('image/jpeg');
      expect(result.width).toBe(1024);
    });

    it('should process image from base64 source (Anthropic format)', async () => {
      const mockImageData = Buffer.from('anthropic-image');
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'png',
          width: 512,
          height: 512,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockImageData),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      const result = await processImage({
        type: 'base64',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbybl',
        mediaType: 'image/png',
      });

      expect(result.mediaType).toBe('image/png');
      expect(result.width).toBe(512);
    });

    it('should resize image when dimensions exceed limit', async () => {
      const mockOriginal = Buffer.from('large-image');
      const mockResized = Buffer.from('resized-image');
      mockedAxios.get.mockResolvedValue({
        data: mockOriginal,
        headers: { 'content-type': 'image/jpeg' },
      });
      const sharpInstance = {
        metadata: jest.fn().mockResolvedValue({
          format: 'jpeg',
          width: 3000,
          height: 2000,
        }),
        clone: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockResized),
      };
      (sharp as unknown as jest.Mock).mockImplementation(() => sharpInstance);

      const result = await processImage(
        {
          type: 'url',
          data: 'https://example.com/large.jpg',
        },
        { maxSize: 2048 }
      );

      expect(sharpInstance.resize).toHaveBeenCalled();
      expect(result.buffer).toEqual(mockResized);
    });

    it('should throw error for unsupported image type', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('bmp-image'),
        headers: { 'content-type': 'image/bmp' },
      });
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({
          format: 'bmp',
        }),
      }));

      await expect(
        processImage({
          type: 'url',
          data: 'https://example.com/image.bmp',
        })
      ).rejects.toThrow(ImageValidationError);
    });

    it('should throw error for file size exceeding limit', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      mockedAxios.get.mockResolvedValue({
        data: largeBuffer,
        headers: { 'content-type': 'image/jpeg' },
      });

      await expect(
        processImage({
          type: 'url',
          data: 'https://example.com/huge.jpg',
        })
      ).rejects.toThrow(ImageValidationError);
    });
  });
});
