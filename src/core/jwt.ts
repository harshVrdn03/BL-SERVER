import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './AppError.js'
import type { Role } from '../types/domain.js'

export interface TokenPayload {
  sub: string
  role: Role
  authorId: string | null
}

interface RawPayload extends jwt.JwtPayload {
  sub?: string
  role?: Role
  authorId?: string | null
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): TokenPayload {
  let decoded: string | RawPayload
  try {
    decoded = jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw AppError.unauthorized('Your session has expired. Please sign in again.')
  }

  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw AppError.unauthorized('Invalid authentication token')
  }

  return {
    sub: decoded.sub,
    role: decoded.role,
    authorId: decoded.authorId ?? null,
  }
}
