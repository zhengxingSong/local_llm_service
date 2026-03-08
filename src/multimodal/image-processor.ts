/**
 * Image Processor Module
 * Handles image downloading, decoding, validation, and resizing
 */

import axios from 'axios';
import sharp from 'sharp';
import {
  ImageSource,
  ProcessedImage,
  ImageProcessingOptions,
  DEFAULT_IMAGE_OPTIONS,
  SUPPORTED_IMAGE_TYPES,
  ImageValidationError,
  ImageDownloadError,
  ImageDecodingError,
} from '../types/vision.js';

/**
 * Download image from URL
 */
export async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; mediaType: string }> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new ImageDownloadError(`Invalid URL: ${url}`);
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QwenAIService/1.0)',
      },
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] as string;

    // Detect media type from content type or URL
    let mediaType = contentType;
    if (!mediaType || !mediaType.startsWith('image/')) {
      const urlLower = url.toLowerCase();
      if (urlLower.endsWith('.png')) mediaType = 'image/png';
      else if (urlLower.endsWith('.webp')) mediaType = 'image/webp';
      else if (urlLower.endsWith('.gif')) mediaType = 'image/gif';
      else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg'))
        mediaType = 'image/jpeg';
      else mediaType = 'image/jpeg'; // Default
    }

    return { buffer, mediaType };
  } catch (error) {
    if (error instanceof ImageDownloadError) throw error;
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new ImageDownloadError(`Image not found (404): ${url}`);
      }
      throw new ImageDownloadError(
        `Failed to download image: ${error.message}`
      );
    }
    throw new ImageDownloadError(
      `Failed to download image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Decode base64 image data
 */
export function decodeBase64(
  data: string,
  mediaType?: string
): { buffer: Buffer; mediaType: string } {
  if (!data || data.length === 0) {
    throw new ImageDecodingError('Empty base64 data');
  }

  let base64Data = data;
  let detectedMediaType = mediaType;

  // Check for data URL format (OpenAI style)
  const dataUrlMatch = data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    detectedMediaType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  }

  // Default to jpeg if no media type specified
  if (!detectedMediaType) {
    detectedMediaType = 'image/jpeg';
  }

  // Validate media type
  if (!SUPPORTED_IMAGE_TYPES.includes(detectedMediaType as any)) {
    throw new ImageDecodingError(
      `Unsupported media type: ${detectedMediaType}`
    );
  }

  // Validate base64 characters before attempting decode
  // Base64 should only contain A-Z, a-z, 0-9, +, /, =, and whitespace
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(base64Data.trim())) {
    throw new ImageDecodingError('Invalid base64 characters');
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');

    // Verify base64 was valid - check if buffer is suspiciously small
    // compared to input (indicates failed decode)
    if (buffer.length === 0 && base64Data.length > 0) {
      throw new ImageDecodingError('Invalid base64 data');
    }

    return { buffer, mediaType: detectedMediaType };
  } catch (error) {
    if (error instanceof ImageDecodingError) throw error;
    throw new ImageDecodingError(
      `Failed to decode base64: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate image format, size, and dimensions
 * Note: Pass skipDimensionCheck=true if you plan to resize the image
 */
export async function validateImage(
  buffer: Buffer,
  mediaType: string,
  options: ImageProcessingOptions = DEFAULT_IMAGE_OPTIONS,
  skipDimensionCheck: boolean = false
): Promise<{ valid: true; metadata: sharp.Metadata }> {
  const {
    maxFileSize = DEFAULT_IMAGE_OPTIONS.maxFileSize!,
    maxSize = DEFAULT_IMAGE_OPTIONS.maxSize!,
    allowedFormats = DEFAULT_IMAGE_OPTIONS.allowedFormats!,
  } = options;

  // Check file size
  if (buffer.length > maxFileSize) {
    throw new ImageValidationError(
      `Image size ${buffer.length} bytes exceeds maximum ${maxFileSize} bytes`
    );
  }

  // Check format is allowed
  if (!allowedFormats.includes(mediaType)) {
    throw new ImageValidationError(
      `Image format ${mediaType} is not supported. Supported formats: ${allowedFormats.join(', ')}`
    );
  }

  try {
    const metadata = await sharp(buffer).metadata();

    // Check dimensions (unless skipped)
    if (!skipDimensionCheck) {
      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > maxSize || metadata.height > maxSize)
      ) {
        throw new ImageValidationError(
          `Image dimensions ${metadata.width}x${metadata.height} exceed maximum ${maxSize}x${maxSize}`
        );
      }
    }

    return { valid: true, metadata };
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageDecodingError(
      `Failed to validate image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Resize image if dimensions exceed limit
 */
export async function resizeIfNeeded(
  buffer: Buffer,
  maxSize: number = DEFAULT_IMAGE_OPTIONS.maxSize!
): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      return buffer;
    }

    // Check if resize is needed
    if (width <= maxSize && height <= maxSize) {
      return buffer;
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;

    if (width > height) {
      newWidth = maxSize;
      newHeight = Math.round((height * maxSize) / width);
    } else {
      newHeight = maxSize;
      newWidth = Math.round((width * maxSize) / height);
    }

    // Perform resize
    const resized = await sharp(buffer)
      .clone()
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();

    return resized;
  } catch (error) {
    throw new ImageDecodingError(
      `Failed to resize image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Process image from source
 * Main entry point for image processing
 */
export async function processImage(
  source: ImageSource,
  options: ImageProcessingOptions = DEFAULT_IMAGE_OPTIONS
): Promise<ProcessedImage> {
  let buffer: Buffer;
  let mediaType: string;

  // Get image buffer and media type based on source type
  if (source.type === 'url') {
    const downloaded = await downloadImage(source.data);
    buffer = downloaded.buffer;
    mediaType = downloaded.mediaType;
  } else {
    // base64
    const decoded = decodeBase64(source.data, source.mediaType);
    buffer = decoded.buffer;
    mediaType = decoded.mediaType;
  }

  // Merge options with source mediaType if provided
  const processingOptions: ImageProcessingOptions = {
    ...options,
    allowedFormats: options.allowedFormats || DEFAULT_IMAGE_OPTIONS.allowedFormats,
  };

  // Validate image (skip dimension check since we'll resize if needed)
  const { metadata } = await validateImage(
    buffer,
    mediaType,
    processingOptions,
    true // skipDimensionCheck - we'll resize if needed
  );

  // Resize if needed
  const finalBuffer =
    metadata.width && metadata.height &&
    (metadata.width > (processingOptions.maxSize || DEFAULT_IMAGE_OPTIONS.maxSize!) ||
      metadata.height > (processingOptions.maxSize || DEFAULT_IMAGE_OPTIONS.maxSize!))
      ? await resizeIfNeeded(buffer, processingOptions.maxSize)
      : buffer;

  // Get final metadata
  const finalMetadata = await sharp(finalBuffer).metadata();

  return {
    buffer: finalBuffer,
    mediaType,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    size: finalBuffer.length,
  };
}
