// Script validation, Arabic normalization and zero-blank localized fallbacks.

// Arabic, Arabic Supplement, Arabic Extended-A, Arabic-Indic and Eastern
// digits, plus Arabic punctuation.
export const ARABIC_TEXT_REGEX =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s.,!?'"()\-:;/_+؛،؟]+$/;

// Matches Latin / English alphanumeric characters and standard punctuation
export const ENGLISH_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?'"()\-:;/_+]+$/;

// Verifies presence of at least one genuine script letter (guards against pure punctuation or numbers)
export const HAS_ARABIC_LETTER_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
export const HAS_LATIN_LETTER_REGEX = /[a-zA-Z]/;

/** Strips Arabic Tashkeel / harakat (U+064B..U+0652). */
export function stripArabicTashkeel(text: string): string {
  if (!text) return "";
  return text.replace(/[\u064B-\u0652]/g, "");
}

/** Normalizes Arabic for search: alef variants -> ا, taa marbuta -> ه,
 *  alef maqsura -> ي; strips tatweel and zero-width characters. */
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

/** Resolves localized text, falling back to the other language when blank. */
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
