import type { Request, Response } from 'express'
import { asyncHandler } from '../core/asyncHandler.js'
import { pathParam } from '../core/params.js'
import { TicketService } from '../services/TicketService.js'

export class TicketController {
  private readonly service: TicketService

  constructor() {
    this.service = new TicketService()
  }

  create = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.createTicket(req.auth, req.body)
    res.status(201).json({ data: ticket })
  })

  listMine = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await this.service.listMine(req.auth)
    res.status(200).json({ data: tickets })
  })

  getMine = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.getMine(req.auth, pathParam(req, 'ticketId'))
    res.status(200).json({ data: ticket })
  })

  postMessage = asyncHandler(async (req: Request, res: Response) => {
    const message = await this.service.addAuthorMessage(
      req.auth,
      pathParam(req, 'ticketId'),
      req.body.body,
    )
    res.status(201).json({ data: message })
  })


}
