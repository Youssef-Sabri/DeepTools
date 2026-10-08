import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { env } from '../config/env';
import {
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from './storage.config';
import { NotFoundError, ValidationError } from '../utils/apiError';

export interface StorageService {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  stream(key: string, res: Response): Promise<void>;
  stat(key: string): Promise<{ size: number; mimeType: string }>;
}

export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor(uploadDir: string = env.UPLOAD_DIR) {
    this.uploadDir = path.resolve(process.cwd(), uploadDir);
  }

  /**
   * Detect and validate file MIME type inspecting buffer magic bytes and structure.
   * Does NOT trust the client-provided Content-Type header.
   */
  public detectMimeType(buffer: Buffer, originalName?: string): string | null {
    if (!buffer || buffer.length === 0) {
      return null;
    }

    const extFromOriginal = originalName
      ? path.extname(originalName).toLowerCase()
      : '';

    // 1. Explicitly reject dangerous executable extensions
    if (
      extFromOriginal &&
      (BLOCKED_EXTENSIONS as readonly string[]).includes(extFromOriginal)
    ) {
      return null;
    }

    // 2. Reject executable binaries by magic bytes inspection
    // Windows PE / MZ header (MZ = 0x4D, 0x5A)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return null;
    }
    // Linux ELF header (0x7F, 'E', 'L', 'F')
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      return null;
    }
    // Mach-O binaries (macOS executables)
    if (
      buffer.length >= 4 &&
      ((buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa) ||
        (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed) ||
        (buffer[0] === 0xce && buffer[1] === 0xfa && buffer[2] === 0xed))
    ) {
      return null;
    }
    // Java class magic bytes (0xCA, 0xFE, 0xBA, 0xBE)
    if (
      buffer.length >= 4 &&
      buffer[0] === 0xca &&
      buffer[1] === 0xfe &&
      buffer[2] === 0xba &&
      buffer[3] === 0xbe
    ) {
      return null;
    }

    // 3. Document formats: PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    if (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))
    ) {
      return 'application/pdf';
    }

    // 4. Archive formats:
    // ZIP magic bytes: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
        (buffer[2] === 0x05 && buffer[3] === 0x06) ||
        (buffer[2] === 0x07 && buffer[3] === 0x08))
    ) {
      return 'application/zip';
    }

    // GZIP magic bytes: 0x1F, 0x8B
    if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
      return 'application/gzip';
    }

    // TAR magic bytes (check 'ustar' signature at byte 257)
    if (
      buffer.length >= 262 &&
      buffer.subarray(257, 262).equals(Buffer.from('ustar'))
    ) {
      return 'application/x-tar';
    }

    // 5. Text & Source Code & Workflow formats (GitHub solution files)
    // Inspect up to first 8KB for null bytes (0x00 is non-text binary)
    const scanLimit = Math.min(buffer.length, 8192);
    let isBinary = false;
    for (let i = 0; i < scanLimit; i++) {
      if (buffer[i] === 0x00) {
        isBinary = true;
        break;
      }
    }

    if (!isBinary) {
      try {
        const textContent = buffer.toString('utf-8');
        const trimmed = textContent.trim();

        // Check if JSON / Jupyter notebook
        if (
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
          try {
            JSON.parse(trimmed);
            return 'application/json';
          } catch {
            // Not valid JSON, continue to other text/code checks
          }
        }

        // Map source code and script extensions
        switch (extFromOriginal) {
          case '.py':
            return 'text/x-python';
          case '.ts':
          case '.tsx':
            return 'application/typescript';
          case '.js':
          case '.jsx':
          case '.mjs':
          case '.cjs':
            return 'text/javascript';
          case '.sh':
          case '.bash':
          case '.zsh':
            return 'text/x-shellscript';
          case '.yaml':
          case '.yml':
            return 'text/yaml';
          case '.toml':
            return 'text/x-toml';
          case '.xml':
            return 'text/xml';
          case '.sql':
            return 'text/x-sql';
          case '.c':
          case '.h':
            return 'text/x-c';
          case '.cpp':
          case '.hpp':
          case '.cc':
          case '.cxx':
            return 'text/x-c++';
          case '.cs':
            return 'text/x-csharp';
          case '.java':
            return 'text/x-java-source';
          case '.go':
            return 'text/x-go';
          case '.rs':
            return 'text/x-rust';
          case '.rb':
            return 'text/x-ruby';
          case '.php':
            return 'text/x-php';
          case '.html':
          case '.htm':
            return 'text/html';
          case '.css':
          case '.scss':
          case '.sass':
          case '.less':
            return 'text/css';
          case '.md':
          case '.markdown':
            return 'text/markdown';
          case '.csv':
            return 'text/csv';
          default:
            return 'text/plain';
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Determine safe file extension based on MIME type and original filename.
   */
  private getSafeExtension(mimeType: string, originalName?: string): string {
    const extFromOriginal = originalName
      ? path.extname(originalName).toLowerCase()
      : '';

    // If original extension is safe (not blocked), preserve it
    if (
      extFromOriginal &&
      !(BLOCKED_EXTENSIONS as readonly string[]).includes(extFromOriginal)
    ) {
      return extFromOriginal;
    }

    switch (mimeType) {
      case 'application/pdf':
        return '.pdf';
      case 'application/zip':
      case 'application/x-zip-compressed':
        return '.zip';
      case 'application/x-tar':
        return '.tar';
      case 'application/gzip':
      case 'application/x-gzip':
        return '.gz';
      case 'application/json':
        return '.json';
      case 'application/typescript':
        return '.ts';
      case 'text/javascript':
      case 'application/javascript':
        return '.js';
      case 'text/x-python':
      case 'application/x-python-code':
        return '.py';
      case 'text/x-shellscript':
      case 'application/x-sh':
        return '.sh';
      case 'text/yaml':
      case 'application/yaml':
      case 'application/x-yaml':
      case 'text/x-yaml':
        return '.yml';
      case 'text/x-toml':
      case 'application/toml':
        return '.toml';
      case 'text/xml':
      case 'application/xml':
        return '.xml';
      case 'text/x-sql':
      case 'application/sql':
        return '.sql';
      case 'text/markdown':
      case 'text/x-markdown':
        return '.md';
      case 'text/html':
        return '.html';
      case 'text/css':
        return '.css';
      case 'text/csv':
        return '.csv';
      case 'text/x-go':
        return '.go';
      case 'text/x-rust':
        return '.rs';
      case 'text/x-java-source':
        return '.java';
      case 'text/x-c':
        return '.c';
      case 'text/x-c++':
        return '.cpp';
      case 'text/x-csharp':
        return '.cs';
      case 'text/x-ruby':
        return '.rb';
      case 'text/x-php':
        return '.php';
      default:
        return '.txt';
    }
  }

  /**
   * Resolve and sanitize file key path to prevent directory traversal.
   */
  public resolveKeyPath(key: string): string {
    const sanitizedKey = path.basename(key);
    const resolvedPath = path.resolve(this.uploadDir, sanitizedKey);

    // Guard against directory traversal
    if (
      !resolvedPath.startsWith(this.uploadDir + path.sep) &&
      resolvedPath !== this.uploadDir
    ) {
      throw new ValidationError('Invalid file key path');
    }

    return resolvedPath;
  }

  /**
   * Save a file buffer to private disk storage under a generated UUID filename.
   * Enforces max file size, buffer magic byte validation, and partial write cleanup.
   */
  async save(
    buffer: Buffer,
    originalName: string,
    claimedMimeType?: string,
  ): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new ValidationError('Uploaded file is empty');
    }

    // 1. File size validation
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds maximum allowed limit of ${env.MAX_FILE_SIZE_MB}MB`,
      );
    }

    // 2. MIME type inspection from buffer magic bytes
    const detectedMime = this.detectMimeType(buffer, originalName);
    if (!detectedMime) {
      throw new ValidationError(
        'Invalid file type: file content magic bytes could not be validated or file type is prohibited',
      );
    }

    const isAllowed = (ALLOWED_MIME_TYPES as readonly string[]).includes(
      detectedMime,
    );
    if (!isAllowed) {
      throw new ValidationError(
        `File type '${detectedMime}' is not permitted. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // If client claimed a MIME type, ensure it doesn't conflict with detected type
    if (claimedMimeType) {
      const isZipMatch =
        (detectedMime === 'application/zip' ||
          detectedMime === 'application/x-zip-compressed') &&
        (claimedMimeType === 'application/zip' ||
          claimedMimeType === 'application/x-zip-compressed');

      const isTarMatch =
        (detectedMime === 'application/x-tar' ||
          detectedMime === 'application/gzip' ||
          detectedMime === 'application/x-gzip') &&
        (claimedMimeType === 'application/x-tar' ||
          claimedMimeType === 'application/gzip' ||
          claimedMimeType === 'application/x-gzip');

      const isTextMatch =
        detectedMime.startsWith('text/') ||
        detectedMime.includes('script') ||
        detectedMime === 'application/json' ||
        detectedMime.includes('yaml') ||
        detectedMime.includes('toml') ||
        detectedMime.includes('xml') ||
        detectedMime.includes('sql');

      if (!isZipMatch && !isTarMatch && detectedMime !== claimedMimeType) {
        // Disallow spoofing attempts where declared binary type contradicts inspected buffer
        if (
          claimedMimeType === 'application/pdf' ||
          claimedMimeType === 'application/zip' ||
          claimedMimeType === 'application/gzip'
        ) {
          throw new ValidationError(
            `Declared MIME type '${claimedMimeType}' does not match detected content type '${detectedMime}'`,
          );
        }

        // If client claimed text/plain or another generic text type on valid code, allow it
        if (!isTextMatch) {
          throw new ValidationError(
            `Declared MIME type '${claimedMimeType}' does not match detected content type '${detectedMime}'`,
          );
        }
      }
    }

    // 3. Generate secure name uploads/<UUID>.<ext>
    const fileId = randomUUID();
    const ext = this.getSafeExtension(detectedMime, originalName);
    const fileName = `${fileId}${ext}`;
    const targetPath = path.resolve(this.uploadDir, fileName);
    const tempPath = `${targetPath}.${randomUUID()}.tmp`;

    // 4. Atomic write with cleanup on failure
    try {
      await fs.promises.mkdir(this.uploadDir, { recursive: true });
      await fs.promises.writeFile(tempPath, buffer);
      await fs.promises.rename(tempPath, targetPath);
    } catch (error) {
      // Clean up any partially written temp or target file
      await fs.promises.unlink(tempPath).catch(() => {});
      await fs.promises.unlink(targetPath).catch(() => {});
      throw error;
    }

    return `uploads/${fileName}`;
  }

  /**
   * Delete a file from disk storage.
   */
  async delete(key: string): Promise<void> {
    const filePath = this.resolveKeyPath(key);
    try {
      await fs.promises.unlink(filePath);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        return; // Idempotent deletion
      }
      throw error;
    }
  }

  /**
   * Stream a private file directly to the HTTP response.
   */
  async stream(key: string, res: Response): Promise<void> {
    const filePath = this.resolveKeyPath(key);

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      throw new NotFoundError('File not found');
    }

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);

      readStream.on('error', (err) => {
        if (!res.headersSent) {
          reject(err);
        } else {
          res.end();
          resolve();
        }
      });

      res.on('finish', () => resolve());
      res.on('close', () => resolve());

      readStream.pipe(res);
    });
  }

  /**
   * Get file metadata (size and detected MIME type) from disk storage.
   */
  async stat(key: string): Promise<{ size: number; mimeType: string }> {
    const filePath = this.resolveKeyPath(key);

    let fileStats: fs.Stats;
    try {
      fileStats = await fs.promises.stat(filePath);
    } catch {
      throw new NotFoundError('File not found');
    }

    // Inspect first chunk to verify MIME
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(Math.min(8192, fileStats.size));
    try {
      await fd.read(buffer, 0, buffer.length, 0);
    } finally {
      await fd.close();
    }

    const detectedMime =
      this.detectMimeType(buffer, key) || 'application/octet-stream';

    return {
      size: fileStats.size,
      mimeType: detectedMime,
    };
  }
}

export const storageService = new LocalStorageService();
export default storageService;
