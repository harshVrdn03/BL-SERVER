import { AppError } from '../core/AppError.js'
import { asyncHandler } from '../core/asyncHandler.js'
import { pathParam } from '../core/params.js'
import { type Request, type Response } from 'express'
import { BookService } from '../services/BookService.js'

export class BookController {
  private readonly service: BookService

  constructor() {
    this.service = new BookService()
  }

  listMine = asyncHandler(async (req: Request, res: Response) => {
    const books = await this.service.listForAuthor(req.auth?.authorId ?? null)
    res.status(200).json({ data: books })
  })

  getMine = asyncHandler(async (req: Request, res: Response) => {
    const book = await this.service.getForAuthor(pathParam(req, 'bookId'), req.auth?.authorId ?? null)
    res.status(200).json({ data: book })
  })
}
