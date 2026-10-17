import type { Server as HttpServer } from 'node:http'
import app from './app.js'
import { env } from './config/env.js'
import { pool } from './db/db.js'
import { socketIOService } from './core/SocketIO.js'

const isVercel = Boolean(process.env.VERCEL)

export class Server {
  private httpServer: HttpServer | null = null

  async start(): Promise<void> {
    this.httpServer = app.listen(env.PORT, () => {
      console.log(`API listening on port ${env.PORT}`)
    })
    socketIOService.init(this.httpServer)
    this.registerSignalHandlers()
  }

  private registerSignalHandlers(): void {
    process.on('SIGINT', () => void this.shutdown('SIGINT'))
    process.on('SIGTERM', () => void this.shutdown('SIGTERM'))
  }

  private async shutdown(signal: string): Promise<void> {
    console.log(`Shutting down due to ${signal}`)
    this.httpServer?.close()
    await pool.end()
    process.exit(0)
  }
}

if (!isVercel) {
  new Server().start().catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
}

export default app
