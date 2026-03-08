// Vision/Multimodal Types

/**
 * Image source from various inputs
 */
export interface ImageSource {
  type: 'url' | 'base64';
  data: string;
  mediaType?: string;
}

/**
 * Processed image ready for model consumption
 */
export interface ProcessedImage {
  buffer: Buffer;
  mediaType: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Options for image processing
 */
export interface ImageProcessingOptions {
  maxSize?: number; // Maximum dimension in pixels (default: 2048)
  maxFileSize?: number; // Maximum file size in bytes (default: 10MB)
  allowedFormats?: string[]; // Allowed media types (default: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
}

/**
 * Supported image media types
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

/**
 * Default processing options
 */
export const DEFAULT_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxSize: 2048,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: [...SUPPORTED_IMAGE_TYPES],
};

/**
 * Errors
 */
export class ImageProcessingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export class ImageValidationError extends ImageProcessingError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ImageValidationError';
  }
}

export class ImageDownloadError extends ImageProcessingError {
  constructor(message: string) {
    super(message, 'DOWNLOAD_ERROR');
    this.name = 'ImageDownloadError';
  }
}

export class ImageDecodingError extends ImageProcessingError {
  constructor(message: string) {
    super(message, 'DECODING_ERROR');
    this.name = 'ImageDecodingError';
  }
}
