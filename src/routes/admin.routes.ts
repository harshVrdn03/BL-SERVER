import { Router } from 'express'
import type { AdminController } from '../controllers/AdminController.js'
import {
  adminPostMessageSchema,
  adminTicketQuerySchema,
  adminUpdateTicketSchema,
} from '../schemas/ticket.schemas.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { validateBody, validateQuery } from '../middleware/validate.js'

export function createAdminRouter(controller: AdminController): Router {
  const router = Router()

  router.use(authenticate, requireRole('admin'))

  router.get('/tickets', validateQuery(adminTicketQuerySchema), controller.listTickets)
  router.get('/tickets/:ticketId', controller.getTicket)
  router.patch('/tickets/:ticketId', validateBody(adminUpdateTicketSchema), controller.updateTicket)
  router.post('/tickets/:ticketId/assign', controller.assignToMe)
  router.post(
    '/tickets/:ticketId/messages',
    validateBody(adminPostMessageSchema),
    controller.postMessage,
  )
  router.post('/tickets/:ticketId/ai/draft', controller.generateDraft)
  router.get('/stats', controller.stats)

  return router
}
