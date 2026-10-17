import type { RequestHandler } from 'express'
import { AppError } from '../core/AppError.js'
import { verifyToken } from '../core/jwt.js'

function extractToken(header: string | undefined, queryToken: unknown): string | null {
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim()
  if (typeof queryToken === 'string' && queryToken.length > 0) return queryToken
  return null
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization, req.query.token)
  if (!token) {
    next(AppError.unauthorized('Authentication required'))
    return
  }

  try {
    const payload = verifyToken(token)
    req.auth = { userId: payload.sub, role: payload.role, authorId: payload.authorId }
    next()
  } catch (error) {
    next(error)
  }
}
