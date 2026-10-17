import type { Request, Response } from 'express'
import { AppError } from '../core/AppError.js'
import { asyncHandler } from '../core/asyncHandler.js'
import { AuthService } from '../services/AuthService.js'

export class AuthController {
  private readonly service: AuthService

  constructor() {
    this.service = new AuthService()
  }

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.login(req.body)
    res.status(200).json({ data: result })
  })

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw AppError.unauthorized()
    const user = await this.service.me(req.auth.userId)
    res.status(200).json({ data: user })
  })
}
