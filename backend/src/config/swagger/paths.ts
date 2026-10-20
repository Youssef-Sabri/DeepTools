import { z } from "zod";
import { registry, ApiErrorSchema } from "./registry";
import {
  envelope,
  RegisterInputDocs,
  LoginInputDocs,
  ForgotPasswordInputDocs,
  ResetPasswordInputDocs,
  UpdateProfileInputDocs,
  ChangePasswordInputDocs,
  AuthResponseSchema,
  UserSchema,
  ProductSchema,
  PaginatedProductsSchema,
  CreateProductInputDocs,
  UpdateProductInputDocs,
  PaginatedUsersSchema,
  PurchaseResponseSchema,
  UserLicenseSchema,
  CreateUploadInputDocs,
  UpdateUploadInputDocs,
  SellerProductSchema,
  PaginatedSellerProductsSchema,
  RejectUploadInputDocs,
  AdminUploadDetailSchema,
  PaginatedAdminUploadsSchema,
  CommissionResponseSchema,
  UpdateCommissionInputDocs,
  BuyerOrdersResponseSchema,
  SellerSalesResponseSchema,
  MarketplaceInsightsSchema,
  CategoriesListResponseSchema,
  CategoryDetailsResponseSchema,
  CreateCategoryInputSchema,
  UpdateCategoryInputSchema,
} from "./schemas";

const LangQueryParam = z
  .enum(["en", "ar"])
  .optional()
  .openapi({
    param: {
      name: "lang",
      in: "query",
      required: false,
      description: "Language localization code for returned content (en or ar)",
    },
    example: "ar",
  });
// 1. Auth Endpoints
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User successfully registered",
      content: { "application/json": { schema: envelope(AuthResponseSchema) } },
    },
    422: {
      description: "Validation failed",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Email already registered",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Log into an existing account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "Logged in successfully; sets HttpOnly dt_auth and readable dt_csrf cookies",
      content: { "application/json": { schema: envelope(AuthResponseSchema) } },
    },
    401: {
      description: "Invalid email or password",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary:
    "Clear the current browser session (send X-CSRF-Token when a session cookie exists)",
  responses: {
    204: {
      description: "Session cookies cleared",
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/forgot-password",
  tags: ["Auth"],
  summary: "Initiate password reset process",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ForgotPasswordInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reset email sent message",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "If this email exists, a reset link was sent.",
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/reset-password",
  tags: ["Auth"],
  summary: "Complete password reset with token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset successful message",
      content: {
        "application/json": {
          schema: z.object({
            message: z
              .string()
              .openapi({ example: "Password reset successful." }),
          }),
        },
      },
    },
    400: {
      description: "Invalid token",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current authenticated user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Authenticated user profile",
      content: { "application/json": { schema: envelope(UserSchema) } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 2. Product Endpoints
registry.registerPath({
  method: "get",
  path: "/products",
  tags: ["Products"],
  summary:
    "List approved digital products (paginated, with search and category filtering)",
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).max(200).optional().openapi({
        example: 1,
        description: "Offset cannot exceed 10,000 records",
      }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .openapi({ example: 20 }),
      category: z
        .enum(["workflow", "script", "code", "agentic"])
        .optional()
        .openapi({ example: "code" }),
      search: z.string().max(100).optional().openapi({ example: "ai" }),
      lang: LangQueryParam,
    }),
  },
  responses: {
    200: {
      description: "Paginated list of approved products with localized fields",
      content: {
        "application/json": { schema: envelope(PaginatedProductsSchema) },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/{id}",
  tags: ["Products"],
  summary: "Retrieve a single product by ID",
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ example: "175e0e43-bd01-4f05-8b0d-85a15af96810" }),
    }),
    query: z.object({ lang: LangQueryParam }),
  },
  responses: {
    200: {
      description: "Product found with localized fields",
      content: { "application/json": { schema: envelope(ProductSchema) } },
    },
    404: {
      description: "Product not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/products",
  tags: ["Products"],
  summary: "Create a new product (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProductInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Product created successfully",
      content: { "application/json": { schema: envelope(ProductSchema) } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden - Admin only",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/products/{id}",
  tags: ["Products"],
  summary: "Update an existing product (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: UpdateProductInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Product updated successfully",
      content: { "application/json": { schema: envelope(ProductSchema) } },
    },
    404: {
      description: "Product not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/products/{id}",
  tags: ["Products"],
  summary: "Delete a product (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Product deleted successfully",
      content: {
        "application/json": {
          schema: envelope(
            z.object({
              message: z
                .string()
                .openapi({ example: "Product deleted successfully" }),
            }),
          ),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/my/licenses",
  tags: ["Products"],
  summary: "Get licenses owned by the current authenticated user",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of user licenses",
      content: {
        "application/json": { schema: envelope(z.array(UserLicenseSchema)) },
      },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/products/{id}/purchase",
  tags: ["Products"],
  summary: "Purchase a digital product (records order snapshot and license)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Purchase completed successfully",
      content: {
        "application/json": { schema: envelope(PurchaseResponseSchema) },
      },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admins or seller cannot purchase this product",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Product not found or not approved",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description:
        "Conflict: User already owns an active license for this product",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    429: {
      description: "Rate limit exceeded",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/products/{id}/download",
  tags: ["Products"],
  summary: "Stream private product file for buyers with active license",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description:
        "Binary solution file stream with Content-Disposition attachment",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
            description: "Direct binary stream of purchased file",
          }),
        },
      },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: No active license or license revoked",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Product or file not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    500: {
      description: "Internal server error: File missing on disk",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 3. Admin Endpoints
registry.registerPath({
  method: "get",
  path: "/admin/users",
  tags: ["Admin"],
  summary: "List all registered users with pagination and search (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .openapi({ example: 1 }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .openapi({ example: 10 }),
      search: z.string().max(100).optional().openapi({ example: "john" }),
      role: z.enum(["USER", "ADMIN"]).optional().openapi({ example: "USER" }),
    }),
  },
  responses: {
    200: {
      description: "List of system users paginated",
      content: {
        "application/json": { schema: envelope(PaginatedUsersSchema) },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/users/{id}",
  tags: ["Admin"],
  summary: "Get user details by ID (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "User details retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(UserSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/uploads",
  tags: ["Admin"],
  summary: "List all uploads with status filter and pagination (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).max(200).optional().openapi({
        example: 1,
        description: "Offset cannot exceed 10,000 records",
      }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .openapi({ example: 20 }),
      status: z
        .enum(["PENDING", "APPROVED", "REJECTED"])
        .optional()
        .openapi({ example: "PENDING" }),
    }),
  },
  responses: {
    200: {
      description: "Uploads queue retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(PaginatedAdminUploadsSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/uploads/{id}",
  tags: ["Admin"],
  summary:
    "View upload detail with file metadata and seller details (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Upload detail retrieved",
      content: {
        "application/json": {
          schema: envelope(AdminUploadDetailSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/uploads/{id}/download",
  tags: ["Admin"],
  summary:
    "Stream any active product file for admin review, regardless of status",
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      disposition: z.enum(["inline", "attachment"]).optional(),
    }),
  },
  responses: {
    200: {
      description:
        "Attachment by default; inline preview for safe browser-rendered types. HEAD is supported for access checks.",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "File is missing or unavailable",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Invalid product ID or disposition",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/uploads/{id}/approve",
  tags: ["Admin"],
  summary: "Approve a pending or rejected product (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description:
        "Product approved successfully (status = approved, reviewedAt set)",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            message: z
              .string()
              .openapi({ example: "Product approved successfully" }),
            data: AdminUploadDetailSchema,
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Conflict: Product is already approved",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/uploads/{id}/reject",
  tags: ["Admin"],
  summary: "Reject a pending or approved product with reason (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: RejectUploadInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        "Product rejected successfully (status = rejected, rejectionNote saved)",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            message: z
              .string()
              .openapi({ example: "Product rejected successfully" }),
            data: AdminUploadDetailSchema,
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Conflict: Product is already rejected",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description:
        "Validation failed (rejectionNote missing or outside 10-500 chars)",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 7. Seller Uploads Endpoints
registry.registerPath({
  method: "post",
  path: "/uploads",
  tags: ["Uploads"],
  summary:
    "Upload a solution file and create a marketplace product (Pending approval)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateUploadInputDocs,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Upload created successfully with status = pending",
      content: {
        "application/json": {
          schema: envelope(SellerProductSchema),
        },
      },
    },
    400: {
      description: "Bad request or invalid file",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed or float price provided",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    429: {
      description: "Too many requests (rate limited)",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/uploads/mine",
  tags: ["Uploads"],
  summary: "List own uploads with pagination and status filter",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).max(200).optional().openapi({
        example: 1,
        description: "Offset cannot exceed 10,000 records",
      }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .openapi({ example: 20 }),
      status: z
        .enum(["PENDING", "APPROVED", "REJECTED"])
        .optional()
        .openapi({ example: "PENDING" }),
    }),
  },
  responses: {
    200: {
      description: "Seller uploads retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(PaginatedSellerProductsSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/uploads/mine/{id}",
  tags: ["Uploads"],
  summary: "Get details of an upload owned by the current seller",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Upload details retrieved",
      content: {
        "application/json": {
          schema: envelope(SellerProductSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found or not owned by seller",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/uploads/mine/{id}",
  tags: ["Uploads"],
  summary: "Edit and resubmit an upload (resets status to pending)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "multipart/form-data": {
          schema: UpdateUploadInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upload updated and status reset to pending",
      content: {
        "application/json": {
          schema: envelope(SellerProductSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/uploads/mine/{id}",
  tags: ["Uploads"],
  summary: "Delete a pending or rejected upload (removes disk file)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Upload and associated disk file deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            message: z
              .string()
              .openapi({ example: "Upload deleted successfully" }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Cannot delete an approved product",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Upload not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 8. Settings Endpoints
registry.registerPath({
  method: "get",
  path: "/settings/commission",
  tags: ["Settings"],
  summary: "Get the current platform commission percentage",
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  responses: {
    200: {
      description: "Current commission settings retrieved",
      content: {
        "application/json": {
          schema: envelope(CommissionResponseSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/settings/commission",
  tags: ["Admin"],
  summary:
    "Get current marketplace platform commission percentage (Admin only)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current commission settings retrieved",
      content: {
        "application/json": {
          schema: envelope(CommissionResponseSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/settings/commission",
  tags: ["Admin"],
  summary: "Update marketplace platform commission percentage (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateCommissionInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Commission percentage updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            message: z.string().openapi({
              example: "Commission percentage updated successfully",
            }),
            data: CommissionResponseSchema,
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description:
        "Validation failed (commissionPercent not an integer between 0 and 100)",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 9. Orders & Sales Endpoints
registry.registerPath({
  method: "get",
  path: "/orders/mine",
  tags: ["Orders"],
  summary: "List own order purchase history (as buyer)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Buyer purchases retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(BuyerOrdersResponseSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/orders/sales",
  tags: ["Orders"],
  summary: "List own product sales history and net earnings (as seller)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Seller sales history and net earnings retrieved",
      content: {
        "application/json": {
          schema: envelope(SellerSalesResponseSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 10. Admin Insights Endpoints
registry.registerPath({
  method: "get",
  path: "/admin/insights/marketplace",
  tags: ["Admin"],
  summary: "Platform-wide marketplace metrics and insights (Admin only)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Marketplace dashboard metrics retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(MarketplaceInsightsSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 11. User Profile Endpoints (Engineer A)
registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Retrieve authenticated user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile retrieved successfully",
      content: { "application/json": { schema: envelope(UserSchema) } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/users/profile",
  tags: ["Users"],
  summary: "Update authenticated user profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateProfileInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Profile updated successfully",
      content: { "application/json": { schema: envelope(UserSchema) } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/users/change-password",
  tags: ["Users"],
  summary: "Change password for authenticated user",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangePasswordInputDocs,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: envelope(
            z.object({
              message: z
                .string()
                .openapi({ example: "Password changed successfully" }),
            }),
          ),
        },
      },
    },
    400: {
      description: "Incorrect password or validation error",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/insights/users",
  tags: ["Admin"],
  summary: "Total and new registered users metrics (Admin only)",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User insights retrieved successfully",
      content: {
        "application/json": {
          schema: envelope(
            z.object({
              totalUsers: z.number().int().openapi({ example: 150 }),
              newUsers: z.number().int().openapi({ example: 35 }),
              period: z.string().openapi({ example: "last_30_days" }),
            }),
          ),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden: Admin access required",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
// 12. Dynamic Categories Endpoints (Public & Admin)
registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Categories"],
  summary: "List all active categories with product counts (Public)",
  request: {
    query: z.object({
      lang: LangQueryParam,
    }),
  },
  responses: {
    200: {
      description: "List of active categories",
      content: { "application/json": { schema: CategoriesListResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "Get category details by ID (Public)",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Category UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Category details",
      content: {
        "application/json": { schema: CategoryDetailsResponseSchema },
      },
    },
    404: {
      description: "Category not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/categories",
  tags: ["Admin"],
  summary: "Create a new bilingual category (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategoryInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Category created successfully",
      content: {
        "application/json": { schema: CategoryDetailsResponseSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Category slug already exists",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed (e.g. missing authentic Arabic script)",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/admin/categories/{id}",
  tags: ["Admin"],
  summary: "Update an existing category (Admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Category UUID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateCategoryInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Category updated successfully",
      content: {
        "application/json": { schema: CategoryDetailsResponseSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Category not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Slug already exists",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    422: {
      description: "Validation failed",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/categories/{id}",
  tags: ["Admin"],
  summary:
    "Delete a category (Admin only - returns 409 if active products exist)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Category UUID" }),
    }),
  },
  responses: {
    200: {
      description: "Category deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            message: z
              .string()
              .openapi({ example: "Category deleted successfully" }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    404: {
      description: "Category not found",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
    409: {
      description: "Conflict: Cannot delete category with active products",
      content: { "application/json": { schema: ApiErrorSchema } },
    },
  },
});
