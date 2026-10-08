export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors?: unknown) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors?: unknown) {
    super(422, message, errors);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too Many Requests') {
    super(429, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error', errors?: unknown) {
    super(500, message, errors);
  }
}
