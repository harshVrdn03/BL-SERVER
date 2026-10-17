import { Router } from 'express'
import type { BookController } from '../controllers/BookController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'

export function createBookRouter(controller: BookController): Router {
  const router = Router()

  router.use(authenticate, requireRole('author'))
  router.get('/', controller.listMine)
  router.get('/:bookId', controller.getMine)

  return router
}
