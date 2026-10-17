import { AppError } from '../core/AppError.js'
import { BookRepository } from '../repositories/BookRepository.js'

export class BookService {
  private readonly books: BookRepository

  constructor() {
    this.books = new BookRepository()
  }

  async listForAuthor(authorId: string | null) {
    if (!authorId) throw AppError.forbidden('No author account is linked to this login')
    return this.books.listByAuthor(authorId)
  }

  async getForAuthor(id: string, authorId: string | null) {
    if (!authorId) throw AppError.forbidden('No author account is linked to this login')
    const book = await this.books.findByIdForAuthor(id, authorId)
    if (!book) throw AppError.notFound('Book not found')
    return book
  }
}
