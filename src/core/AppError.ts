export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, 'BAD_REQUEST', message, details)
  }

  static validation(message = 'Request validation failed', details?: unknown): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details)
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have permission to do this'): AppError {
    return new AppError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message)
  }
}
