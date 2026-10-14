/**
 * DeepTools Localization & Bilingual Architecture Utilities
 * Provides authentic Unicode script validation, Arabic text normalization,
 * and zero-blank localized response fallbacks.
 */

// Matches Arabic Unicode blocks: Arabic (\u0600-\u06FF), Arabic Supplement (\u0750-\u077F),
// Arabic Extended-A (\u08A0-\u08FF), Arabic-Indic digits (٠-٩), Eastern Arabic-Indic digits (۰-۹),
// and Arabic punctuation (، ؛ ؟)
export const ARABIC_TEXT_REGEX =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s.,!?'"()\-:;/_+؛،؟]+$/;

// Matches Latin / English alphanumeric characters and standard punctuation
export const ENGLISH_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?'"()\-:;/_+]+$/;

// Verifies presence of at least one genuine script letter (guards against pure punctuation or numbers)
export const HAS_ARABIC_LETTER_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
export const HAS_LATIN_LETTER_REGEX = /[a-zA-Z]/;

/**
 * Strips Arabic Tashkeel (diacritics/harakat)
 * (Fatha, Damma, Kasra, Tanween, Sukun, Shadda: U+064B to U+0652)
 */
export function stripArabicTashkeel(text: string): string {
  if (!text) return "";
  return text.replace(/[\u064B-\u0652]/g, "");
}

/**
 * Normalizes Arabic letters for resilient search matching:
 * - Unifies Alef variants (أ, إ, آ, ٱ) -> ا
 * - Normalizes Taa Marbuta (ة) -> ه
 * - Normalizes Alef Maqsura (ى) -> ي
 * - Strips Tatweel/Kashida (ـ: U+0640)
 * - Strips zero-width characters (U+200B to U+200D, U+FEFF)
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return stripArabicTashkeel(text)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/**
 * Resolves localized text with guaranteed zero-blank fallback.
 * If the requested language string is missing or empty, gracefully falls back to the other.
 */
export function resolveLocalizedField(
  en: string | null | undefined,
  ar: string | null | undefined,
  lang: string = "en",
): string {
  const cleanEn = (en || "").trim();
  const cleanAr = (ar || "").trim();

  if (lang && lang.toLowerCase().startsWith("ar")) {
    return cleanAr || cleanEn;
  }
  return cleanEn || cleanAr;
}
