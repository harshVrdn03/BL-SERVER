import type { Request, Response } from 'express'
import { asyncHandler } from '../core/asyncHandler.js'
import { pathParam } from '../core/params.js'
import type { AdminTicketQuery } from '../schemas/ticket.schemas.js'
import { AdminService } from '../services/AdminService.js'

export class AdminController {
  private readonly service: AdminService

  constructor() {
    this.service = new AdminService()
  }

  listTickets = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await this.service.listTickets(
      req.validatedQuery as AdminTicketQuery,
      req.auth,
    )
    res.status(200).json({ data: tickets })
  })

  getTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.getTicket(pathParam(req, 'ticketId'))
    res.status(200).json({ data: ticket })
  })

  updateTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.updateTicket(pathParam(req, 'ticketId'), req.body, req.auth)
    res.status(200).json({ data: ticket })
  })

  assignToMe = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.assignToSelf(pathParam(req, 'ticketId'), req.auth)
    res.status(200).json({ data: ticket })
  })

  postMessage = asyncHandler(async (req: Request, res: Response) => {
    const message = await this.service.addMessage(pathParam(req, 'ticketId'), req.body, req.auth)
    res.status(201).json({ data: message })
  })

  generateDraft = asyncHandler(async (req: Request, res: Response) => {
    const draft = await this.service.generateDraft(pathParam(req, 'ticketId'))
    res.status(200).json({ data: draft })
  })

  stats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.service.stats()
    res.status(200).json({ data: stats })
  })
}
