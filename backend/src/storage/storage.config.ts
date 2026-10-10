import { env } from "../config/env";

/**
 * All file types allowed in GitHub repositories / digital code solutions:
 * Source code, scripts, agentic workflows, configs, documentation, and project archives.
 */
export const ALLOWED_MIME_TYPES = [
  // Archives & Bundles
  "application/zip",
  "application/x-zip-compressed",
  "application/x-tar",
  "application/gzip",
  "application/x-gzip",

  // Documents
  "application/pdf",

  // Data & Configurations & Workflows
  "application/json",
  "application/yaml",
  "application/x-yaml",
  "text/yaml",
  "text/x-yaml",
  "application/toml",
  "text/x-toml",
  "application/xml",
  "text/xml",
  "text/markdown",
  "text/x-markdown",
  "text/csv",

  // Source Code, Scripts & Agentic Files
  "text/plain",
  "text/javascript",
  "application/javascript",
  "application/typescript",
  "text/x-python",
  "application/x-python-code",
  "text/x-shellscript",
  "application/x-sh",
  "text/x-sql",
  "application/sql",
  "text/x-c",
  "text/x-c++",
  "text/x-csharp",
  "text/x-java-source",
  "text/x-go",
  "text/x-rust",
  "text/x-ruby",
  "text/x-php",
  "text/html",
  "text/css",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Explicitly prohibited dangerous executable / system binary extensions.
 */
export const BLOCKED_EXTENSIONS = [
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".msi",
  ".bat",
  ".cmd",
  ".vbs",
  ".vbe",
  ".scr",
  ".pif",
  ".com",
  ".cpl",
] as const;

export const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;
