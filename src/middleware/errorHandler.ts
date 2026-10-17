import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../core/AppError.js'
import type { Logger } from '../core/Logger.js'

export function notFoundHandler(): RequestHandler {
  return (req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    })
  }
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    if (error instanceof AppError) {
      res.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details },
      })
      return
    }

    const err = error as Error & { code?: string; detail?: string }
    logger.error('Unhandled request error', {
      method: req.method,
      path: req.path,
      error: err?.message || String(error) || '(empty message)',
      code: err?.code,
      detail: err?.detail,
      stack: err?.stack?.split('\n').slice(0, 4).join(' | '),
    })

    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    })
  }
}
