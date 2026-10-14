import { t, messages } from "../i18n";
import {
  parseAcceptLanguage,
  resolveRequestLanguage,
} from "../../middleware/locale.middleware";
import { Request } from "express";

describe("Bilingual Architecture & i18n Engine", () => {
  describe("t() translation function", () => {
    it("translates known keys to English correctly", () => {
      expect(t("auth.registered", "en")).toBe("User registered successfully");
      expect(t("auth.loginSuccess", "en")).toBe("Login successful");
      expect(t("categories.created", "en")).toBe(
        "Category created successfully",
      );
    });

    it("translates known keys to Arabic correctly", () => {
      expect(t("auth.registered", "ar")).toBe("تم تسجيل المستخدم بنجاح");
      expect(t("auth.loginSuccess", "ar")).toBe("تم تسجيل الدخول بنجاح");
      expect(t("categories.created", "ar")).toBe("تم إنشاء التصنيف بنجاح");
      expect(t("products.notFound", "ar")).toBe("المنتج المطلوب غير موجود");
    });

    it("falls back to English when language is unsupported or key missing in target language", () => {
      expect(t("auth.registered", "fr")).toBe("User registered successfully");
    });

    it("returns key itself when key does not exist in any catalog", () => {
      expect(t("non.existent.key", "en")).toBe("non.existent.key");
      expect(t("non.existent.key", "ar")).toBe("non.existent.key");
    });

    it("interpolates parameters inside translations", () => {
      const customKey = "test.interpolated";
      (messages.en as any)[customKey] = "Hello, {name}! Your count is {count}.";
      (messages.ar as any)[customKey] = "مرحباً {name}! العدد هو {count}.";

      expect(t(customKey, "en", { name: "Antigravity", count: 42 })).toBe(
        "Hello, Antigravity! Your count is 42.",
      );
      expect(t(customKey, "ar", { name: "يوسف", count: 10 })).toBe(
        "مرحباً يوسف! العدد هو 10.",
      );
    });

    it("translates common standard phrases directly to Arabic", () => {
      expect(t("User registered successfully", "ar")).toBe(
        "تم تسجيل المستخدم بنجاح",
      );
      expect(t("Category not found", "ar")).toBe("التصنيف المطلوب غير موجود");
      expect(t("Internal server error", "ar")).toBe("حدث خطأ داخلي في الخادم");
      expect(t("Validation failed", "ar")).toBe(
        "فشل التحقق من صحة البيانات المدخلة",
      );
    });
  });

  describe("parseAcceptLanguage RFC parser", () => {
    it("correctly identifies primary language from simple header", () => {
      expect(parseAcceptLanguage("ar")).toBe("ar");
      expect(parseAcceptLanguage("en")).toBe("en");
      expect(parseAcceptLanguage("ar-SA")).toBe("ar");
      expect(parseAcceptLanguage("en-US")).toBe("en");
    });

    it("respects quality weights (q-factors)", () => {
      // English has higher weight than Arabic
      expect(parseAcceptLanguage("ar;q=0.6, en;q=0.9")).toBe("en");

      // Arabic has higher weight than English
      expect(parseAcceptLanguage("en-US;q=0.4, ar-EG;q=0.8")).toBe("ar");

      // Multiple weighted languages with unsupported primary
      expect(
        parseAcceptLanguage("fr;q=1.0, es;q=0.9, ar;q=0.8, en;q=0.5"),
      ).toBe("ar");
    });

    it("returns null if neither English nor Arabic is present", () => {
      expect(parseAcceptLanguage("fr-FR, fr;q=0.9, de;q=0.8")).toBeNull();
      expect(parseAcceptLanguage("")).toBeNull();
      expect(parseAcceptLanguage(undefined)).toBeNull();
    });
  });

  describe("resolveRequestLanguage", () => {
    it("prioritizes query parameter ?lang=ar over Accept-Language", () => {
      const mockReq = {
        query: { lang: "ar" },
        headers: { "accept-language": "en-US,en;q=0.9" },
      } as unknown as Request;

      expect(resolveRequestLanguage(mockReq)).toBe("ar");
    });

    it("prioritizes query parameter ?locale=en over Accept-Language", () => {
      const mockReq = {
        query: { locale: "en" },
        headers: { "accept-language": "ar-SA,ar;q=0.9" },
      } as unknown as Request;

      expect(resolveRequestLanguage(mockReq)).toBe("en");
    });

    it("reads custom header X-Locale when query param is absent", () => {
      const mockReq = {
        query: {},
        headers: {
          "x-locale": "ar",
          "accept-language": "en-US,en;q=0.9",
        },
      } as unknown as Request;

      expect(resolveRequestLanguage(mockReq)).toBe("ar");
    });

    it("falls back to Accept-Language header when no query or custom header", () => {
      const mockReq = {
        query: {},
        headers: {
          "accept-language": "ar-EG,ar;q=0.9",
        },
      } as unknown as Request;

      expect(resolveRequestLanguage(mockReq)).toBe("ar");
    });

    it("defaults to 'en' when no headers or queries are provided", () => {
      const mockReq = {
        query: {},
        headers: {},
      } as unknown as Request;

      expect(resolveRequestLanguage(mockReq)).toBe("en");
    });
  });
});
