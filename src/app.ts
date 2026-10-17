import './types/express.js'
import express, { type Express, Router } from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { Logger } from './core/Logger.js'
import { AuthController } from './controllers/AuthController.js'
import { BookController } from './controllers/BookController.js'
import { TicketController } from './controllers/TicketController.js'
import { AdminController } from './controllers/AdminController.js'
import { AIService } from './services/AIService.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { createBookRouter } from './routes/book.routes.js'
import { createTicketRouter } from './routes/ticket.routes.js'
import { createAdminRouter } from './routes/admin.routes.js'

export class App {
  readonly express: Express

  private readonly logger: Logger
  private readonly ai: AIService
  private readonly authController = new AuthController()
  private readonly bookController = new BookController()
  private readonly ticketController = new TicketController()
  private readonly adminController = new AdminController()

  constructor() {
    this.logger = new Logger(env.LOG_LEVEL)
    this.ai = new AIService()
    this.express = express()

    this.logEnvironment()
    this.logAiStatus()
    this.registerMiddleware()
    this.registerRoutes()
    this.registerErrorHandling()
  }

  private logEnvironment(): void {
    this.logger.info('Environment configuration', {
      NODE_ENV: env.NODE_ENV,
      PORT: env.PORT,
      CORS_ORIGIN: env.CORS_ORIGIN,
      LOG_LEVEL: env.LOG_LEVEL,
      AI_ENABLED: env.AI_ENABLED,
      AI_MODEL: env.AI_MODEL,
      hasNvidiaKey: !!env.NVIDIA_API_KEY,
    })
  }

  private logAiStatus(): void {
    if (this.ai.isEnabled) {
      this.logger.info('AI model connected', {
        provider: 'nvidia',
        model: env.AI_MODEL,
      })
      return
    }

    const reason = !env.AI_ENABLED ? 'AI_DISABLED' : !env.NVIDIA_API_KEY ? 'Missing NVIDIA_API_KEY' : 'Unknown'

    this.logger.warn('AI model not connected', { reason })
  }

  private registerMiddleware(): void {
    this.express.disable('x-powered-by')
    this.express.use(
      cors({
        origin(origin, callback) {
          if (!origin || env.CORS_ORIGIN.includes(origin)) {
            callback(null, true)
            return
          }
          callback(null, false)
        },
        credentials: true,
      }),
    )
    this.express.use(express.json({ limit: '1mb' }))
  }

  private registerRoutes(): void {
    const apiRouter = Router()
    apiRouter.use('/auth', createAuthRouter(this.authController))
    apiRouter.use('/books', createBookRouter(this.bookController))
    apiRouter.use('/tickets', createTicketRouter(this.ticketController))
    apiRouter.use('/admin', createAdminRouter(this.adminController))
    this.express.use('/api', apiRouter)

    this.express.get('/api/health', (_req, res) => {
      res.json({ data: { status: 'ok', aiEnabled: this.ai.isEnabled } })
    })


  }

  private registerErrorHandling(): void {
    this.express.use(notFoundHandler())
    this.express.use(createErrorHandler(this.logger))
  }
}

/** Default export required for Vercel Express detection (`src/app.ts`). */
const application = new App()
export const app = application.express
export default app
