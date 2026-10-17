import { Router } from 'express'
import type { TicketController } from '../controllers/TicketController.js'
import { createTicketSchema, postMessageSchema } from '../schemas/ticket.schemas.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validateBody } from '../middleware/validate.js'

export function createTicketRouter(controller: TicketController): Router {
  const router = Router()

  router.use(authenticate, requireRole('author'))
  router.get('/', controller.listMine)
  router.post('/', validateBody(createTicketSchema), controller.create)
  router.get('/:ticketId', controller.getMine)
  router.post('/:ticketId/messages', validateBody(postMessageSchema), controller.postMessage)

  return router
}
