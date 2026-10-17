import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../core/AppError.js'

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_'
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(AppError.validation('Please correct the highlighted fields', {
        fieldErrors: collectFieldErrors(result.error.issues),
      }))
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      next(AppError.validation('Invalid query parameters', {
        fieldErrors: collectFieldErrors(result.error.issues),
      }))
      return
    }
    req.validatedQuery = result.data
    next()
  }
}
