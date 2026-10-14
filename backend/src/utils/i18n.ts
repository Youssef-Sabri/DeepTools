/**
 * DeepTools Backend Internationalization & Bilingual Message Catalog
 * Provides authentic English and Arabic translations for API responses,
 * error messages, and operational events.
 */

export type SupportedLanguage = "en" | "ar";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "ar"];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const messages = {
  en: {
    // Auth & Accounts
    "auth.registered": "User registered successfully",
    "auth.loginSuccess": "Login successful",
    "auth.logoutSuccess": "Logged out successfully",
    "auth.forgotPasswordSent":
      "If the email exists, a password reset token has been generated",
    "auth.passwordResetSuccess": "Password has been reset successfully",
    "auth.invalidCredentials": "Invalid credentials",
    "auth.unauthorized": "Not authenticated",
    "auth.forbidden": "Authenticated but not allowed",
    "auth.emailInUse": "Email already in use",
    "auth.accountConverted": "Guest orders successfully linked to user account",

    // User Profile
    "users.profileRetrieved": "User profile retrieved successfully",
    "users.profileUpdated": "Profile updated successfully",
    "users.passwordChanged": "Password changed successfully",
    "users.invalidCurrentPassword": "Current password is incorrect",
    "users.passwordMismatch": "New passwords do not match",

    // Categories
    "categories.created": "Category created successfully",
    "categories.updated": "Category updated successfully",
    "categories.deleted": "Category deleted successfully",
    "categories.notFound": "Category not found",
    "categories.conflictInUse":
      "Cannot delete category with active products. Reassign or delete products first.",
    "categories.slugExists": "Category with this slug already exists",

    // Products & Marketplace
    "products.created": "Product created successfully",
    "products.updated": "Product updated successfully",
    "products.deleted": "Product deleted successfully",
    "products.notFound": "Product not found",
    "products.cannotBuyOwn": "You cannot purchase your own product",
    "products.alreadyPurchased": "You have already purchased this product",
    "products.downloadUnauthorized":
      "You do not have permission to download this asset",
    "products.orderPending": "Order pending payment verification",

    // Orders & Guest Checkout
    "orders.guestPurchaseSuccess": "Guest purchase completed successfully",
    "orders.guestSessionUnlocked":
      "Guest session unlocked successfully for 7 days",
    "orders.magicLinkSent":
      "If there are purchases associated with this email, we have sent a secure access link to your inbox.",
    "orders.magicLinkInvalid": "Invalid or expired guest access token",
    "orders.sessionRetrieved": "Guest session retrieved successfully",
    "orders.orderNotFound": "Order not found",
    "orders.licenseNotFound": "License not found",

    // Uploads & Moderation
    "uploads.created": "Upload created successfully",
    "uploads.deleted": "Upload deleted successfully",
    "uploads.approved": "Product approved successfully",
    "uploads.rejected": "Product rejected successfully",
    "uploads.fileRequired": "A solution file is required for upload",
    "uploads.fileSizeMismatch": "Stored file size mismatch",

    // Settings
    "settings.commissionUpdated": "Commission percentage updated successfully",

    // General & Common
    "common.success": "Operation completed successfully",
    "common.validationFailed": "Validation failed",
    "common.notFound": "Resource not found",
    "common.internalError": "Internal server error",
    "common.tooManyRequests": "Too many requests, please try again later",
    "common.badRequest": "Bad request",

    // Common standard phrases mapped to themselves for symmetry
    "User registered successfully": "User registered successfully",
    "Login successful": "Login successful",
    "Invalid credentials": "Invalid credentials",
    "Invalid email or password": "Invalid email or password",
    "Not authenticated": "Not authenticated",
    "Authenticated but not allowed": "Authenticated but not allowed",
    "Category created successfully": "Category created successfully",
    "Category updated successfully": "Category updated successfully",
    "Category deleted successfully": "Category deleted successfully",
    "Category not found": "Category not found",
    "Product created successfully": "Product created successfully",
    "Product updated successfully": "Product updated successfully",
    "Product deleted successfully": "Product deleted successfully",
    "Product not found": "Product not found",
    "Internal server error": "Internal server error",
    "Validation failed": "Validation failed",
    "Resource not found": "Resource not found",
    "Route not found": "Route not found",
  },
  ar: {
    // Auth & Accounts
    "auth.registered": "تم تسجيل المستخدم بنجاح",
    "auth.loginSuccess": "تم تسجيل الدخول بنجاح",
    "auth.logoutSuccess": "تم تسجيل الخروج بنجاح",
    "auth.forgotPasswordSent":
      "إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال رمز استعادة كلمة المرور",
    "auth.passwordResetSuccess": "تمت إعادة تعيين كلمة المرور بنجاح",
    "auth.invalidCredentials": "بيانات الاعتماد غير صالحة",
    "auth.unauthorized": "غير مصرح، يرجى تسجيل الدخول أولاً",
    "auth.forbidden": "ليس لديك صلاحية كافية لتنفيذ هذا الإجراء",
    "auth.emailInUse": "البريد الإلكتروني مسجل بالفعل",
    "auth.accountConverted": "تم ربط مشتريات الزائر بحسابك الجديد بنجاح",

    // User Profile
    "users.profileRetrieved": "تم جلب الملف الشخصي بنجاح",
    "users.profileUpdated": "تم تحديث الملف الشخصي بنجاح",
    "users.passwordChanged": "تم تغيير كلمة المرور بنجاح",
    "users.invalidCurrentPassword": "كلمة المرور الحالية غير صحيحة",
    "users.passwordMismatch": "كلمتا المرور غير متطابقتين",

    // Categories
    "categories.created": "تم إنشاء التصنيف بنجاح",
    "categories.updated": "تم تحديث التصنيف بنجاح",
    "categories.deleted": "تم حذف التصنيف بنجاح",
    "categories.notFound": "التصنيف المطلوب غير موجود",
    "categories.conflictInUse":
      "لا يمكن حذف التصنيف لوجود منتجات نشطة مرتبطة به. يرجى نقلها أو حذفها أولاً.",
    "categories.slugExists": "يوجد تصنيف آخر بنفس الاسم اللطيف (slug)",

    // Products & Marketplace
    "products.created": "تم إنشاء المنتج بنجاح",
    "products.updated": "تم تحديث المنتج بنجاح",
    "products.deleted": "تم حذف المنتج بنجاح",
    "products.notFound": "المنتج المطلوب غير موجود",
    "products.cannotBuyOwn": "لا يمكنك شراء منتجك الخاص",
    "products.alreadyPurchased": "لقد قمت بشراء هذا المنتج مسبقاً",
    "products.downloadUnauthorized": "ليس لديك ترخيص معتمد لتنزيل هذا الملف",
    "products.orderPending": "الطلب قيد التحقق من الدفع",

    // Orders & Guest Checkout
    "orders.guestPurchaseSuccess": "تم إتمام شراء الزائر بنجاح",
    "orders.guestSessionUnlocked": "تم فتح جلسة الزائر بنجاح لمدة 7 أيام",
    "orders.magicLinkSent":
      "إذا كانت هناك مشتريات مرتبطة بهذا البريد، فقد تم إرسال رابط الوصول الآمن",
    "orders.magicLinkInvalid": "رمز الوصول للزائر غير صالح أو منتهي الصلاحية",
    "orders.sessionRetrieved": "تم استرجاع جلسة الزائر بنجاح",
    "orders.orderNotFound": "الطلب غير موجود",
    "orders.licenseNotFound": "الترخيص غير موجود",

    // Uploads & Moderation
    "uploads.created": "تم رفع الأداة بنجاح",
    "uploads.deleted": "تم حذف الملف المرفوع بنجاح",
    "uploads.approved": "تمت الموافقة على المنتج بنجاح",
    "uploads.rejected": "تم رفض المنتج بنجاح",
    "uploads.fileRequired": "يجب إرفاق ملف الأداة الرقمية لإتمام الرفع",
    "uploads.fileSizeMismatch": "حجم الملف المخزن غير مطابق للملف الأصلي",

    // Settings
    "settings.commissionUpdated": "تم تحديث نسبة العمولة بنجاح",

    // General & Common
    "common.success": "تمت العملية بنجاح",
    "common.validationFailed": "فشل التحقق من صحة البيانات المدخلة",
    "common.notFound": "المورد المطلوب غير موجود",
    "common.internalError": "حدث خطأ داخلي في الخادم",
    "common.tooManyRequests": "عدد الطلبات كبير جداً، يرجى المحاولة بعد قليل",
    "common.badRequest": "طلب غير صالح",

    // Common standard phrases mapped to Arabic
    "User registered successfully": "تم تسجيل المستخدم بنجاح",
    "Login successful": "تم تسجيل الدخول بنجاح",
    "Invalid credentials": "بيانات الاعتماد غير صالحة",
    "Invalid email or password": "بيانات الاعتماد غير صالحة",
    "Not authenticated": "غير مصرح، يرجى تسجيل الدخول أولاً",
    "Authenticated but not allowed": "ليس لديك صلاحية كافية لتنفيذ هذا الإجراء",
    "Category created successfully": "تم إنشاء التصنيف بنجاح",
    "Category updated successfully": "تم تحديث التصنيف بنجاح",
    "Category deleted successfully": "تم حذف التصنيف بنجاح",
    "Category not found": "التصنيف المطلوب غير موجود",
    "Product created successfully": "تم إنشاء المنتج بنجاح",
    "Product updated successfully": "تم تحديث المنتج بنجاح",
    "Product deleted successfully": "تم حذف المنتج بنجاح",
    "Product not found": "المنتج المطلوب غير موجود",
    "Internal server error": "حدث خطأ داخلي في الخادم",
    "Validation failed": "فشل التحقق من صحة البيانات المدخلة",
    "Resource not found": "المورد المطلوب غير موجود",
    "Route not found": "المسار المطلوب غير موجود",
  },
} as const;

export type TranslationKey = keyof typeof messages.en;

/**
 * Translates a key or phrase into the specified language with optional parameter interpolation.
 * If translation is missing or language is unsupported, gracefully falls back to English.
 */
export function t(
  key: string,
  lang: string = DEFAULT_LANGUAGE,
  params?: Record<string, string | number>,
): string {
  const normalizedLang: SupportedLanguage = lang?.toLowerCase().startsWith("ar")
    ? "ar"
    : "en";

  const langCatalog = messages[normalizedLang] as Record<string, string>;
  const fallbackCatalog = messages.en as Record<string, string>;

  let text = langCatalog[key] || fallbackCatalog[key] || key;

  if (params && typeof params === "object") {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${paramKey}}`, "g"), String(value));
    }
  }

  return text;
}
