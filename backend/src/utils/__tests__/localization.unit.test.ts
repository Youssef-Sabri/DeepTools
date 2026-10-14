import {
  stripArabicTashkeel,
  normalizeArabicText,
  resolveLocalizedField,
  ARABIC_TEXT_REGEX,
  ENGLISH_TEXT_REGEX,
  HAS_ARABIC_LETTER_REGEX,
  HAS_LATIN_LETTER_REGEX,
} from "../localization";

describe("Localization Utilities", () => {
  describe("stripArabicTashkeel", () => {
    it("strips various Harakat (Fatha, Damma, Kasra, Tanween, Shadda, Sukun)", () => {
      const input = "مُؤْتَمَتْ سِينارِيُوهاتُ العَمَلِ الشَّامِلَةُ";
      const expected = "مؤتمت سيناريوهات العمل الشاملة";
      expect(stripArabicTashkeel(input)).toBe(expected);
    });

    it("handles empty or null-like strings safely", () => {
      expect(stripArabicTashkeel("")).toBe("");
    });
  });

  describe("normalizeArabicText", () => {
    it("unifies Alef variants, Taa Marbuta, Alef Maqsura, Tatweel, and zero-width characters", () => {
      const input = "إِنْتَاجُـ أَدَوَاتٍ ذَكِيَّةٍ لِلْمُسْتَشْفَى\u200C";
      // Alef variants normalized to ا
      // Taa Marbuta ة -> ه
      // Alef Maqsura ى -> ي
      // Tatweel stripped
      // Zero width stripped
      const normalized = normalizeArabicText(input);
      expect(normalized).toBe("انتاج ادوات ذكيه للمستشفي");
    });
  });

  describe("resolveLocalizedField", () => {
    it("returns Arabic when lang is ar", () => {
      expect(resolveLocalizedField("Workflows", "مسارات العمل", "ar")).toBe(
        "مسارات العمل",
      );
    });

    it("returns English when lang is en", () => {
      expect(resolveLocalizedField("Workflows", "مسارات العمل", "en")).toBe(
        "Workflows",
      );
    });

    it("falls back to English when Arabic is empty and lang is ar", () => {
      expect(resolveLocalizedField("Workflows", "", "ar")).toBe("Workflows");
      expect(resolveLocalizedField("Workflows", null, "ar")).toBe("Workflows");
    });

    it("falls back to Arabic when English is empty and lang is en", () => {
      expect(resolveLocalizedField("", "مسارات العمل", "en")).toBe(
        "مسارات العمل",
      );
      expect(resolveLocalizedField(null, "مسارات العمل", "en")).toBe(
        "مسارات العمل",
      );
    });
  });

  describe("Regex Validators", () => {
    it("ARABIC_TEXT_REGEX matches valid Arabic text and Arabic punctuation", () => {
      expect(
        ARABIC_TEXT_REGEX.test("مؤتمت الذكاء الاصطناعي، الإصدار 1.0"),
      ).toBe(true);
      expect(ARABIC_TEXT_REGEX.test("نص تجريبي؛ مع علامات استفهام؟")).toBe(
        true,
      );
      expect(ARABIC_TEXT_REGEX.test("Hello World")).toBe(false);
    });

    it("HAS_ARABIC_LETTER_REGEX confirms presence of authentic Arabic characters", () => {
      expect(HAS_ARABIC_LETTER_REGEX.test("12345")).toBe(false);
      expect(HAS_ARABIC_LETTER_REGEX.test("... - !?")).toBe(false);
      expect(HAS_ARABIC_LETTER_REGEX.test("ذكاء 123")).toBe(true);
    });

    it("ENGLISH_TEXT_REGEX matches Latin letters, numbers, and standard punctuation", () => {
      expect(ENGLISH_TEXT_REGEX.test("AI Agent Automator v1.0.0")).toBe(true);
      expect(ENGLISH_TEXT_REGEX.test("نص عربي")).toBe(false);
    });

    it("HAS_LATIN_LETTER_REGEX confirms presence of Latin letters", () => {
      expect(HAS_LATIN_LETTER_REGEX.test("12345")).toBe(false);
      expect(HAS_LATIN_LETTER_REGEX.test("Agent 123")).toBe(true);
    });
  });
});
