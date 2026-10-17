import { Router } from 'express'
import type { AuthController } from '../controllers/AuthController.js'
import { loginSchema } from '../schemas/auth.schemas.js'
import { authenticate } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

export function createAuthRouter(controller: AuthController): Router {
  const router = Router()

  router.post('/login', validateBody(loginSchema), controller.login)
  router.get('/me', authenticate, controller.me)

  return router
}
