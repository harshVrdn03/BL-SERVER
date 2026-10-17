import bcrypt from 'bcryptjs'
import { AppError } from '../core/AppError.js'
import { signToken } from '../core/jwt.js'
import { UserRepository, type UserRecord } from '../repositories/UserRepository.js'
import type { LoginInput } from '../schemas/auth.schemas.js'
import type { Role } from '../types/domain.js'

export interface AuthAuthor {
  authorId: string
  name: string
  email: string
  phone: string | null
  city: string | null
  joinedDate: string | null
}

export interface AuthUser {
  id: string
  email: string
  role: Role
  author: AuthAuthor | null
}

export interface LoginResult {
  token: string
  user: AuthUser
}

function toAuthUser(record: UserRecord): AuthUser {
  return {
    id: record.id,
    email: record.email,
    role: record.role,
    author:
      record.authorId && record.authorName
        ? {
            authorId: record.authorId,
            name: record.authorName,
            email: record.authorEmail ?? record.email,
            phone: record.authorPhone,
            city: record.authorCity,
            joinedDate: record.authorJoinedDate,
          }
        : null,
  }
}

export class AuthService {
  private readonly users: UserRepository

  constructor() {
    this.users = new UserRepository()
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.users.findByEmail(input.email)
    if (!user) throw AppError.unauthorized('Invalid email or password')

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatches) throw AppError.unauthorized('Invalid email or password')

    const token = signToken({ sub: user.id, role: user.role, authorId: user.authorId })
    return { token, user: toAuthUser(user) }
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId)
    if (!user) throw AppError.unauthorized('Account no longer exists')
    return toAuthUser(user)
  }
}
