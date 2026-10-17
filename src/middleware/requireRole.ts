import type { RequestHandler } from 'express'
import { AppError } from '../core/AppError.js'
import type { Role } from '../types/domain.js'

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(AppError.unauthorized())
      return
    }
    if (!roles.includes(req.auth.role)) {
      next(AppError.forbidden())
      return
    }
    next()
  }
}
