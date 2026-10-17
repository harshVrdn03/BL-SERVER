import { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { verifyToken } from './jwt.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { env } from '../config/env.js'

export class SocketIOService {
  private io: Server | null = null
  private users: UserRepository

  constructor() {
    this.users = new UserRepository()
  }

  init(server: HttpServer): void {
    this.io = new Server(server, {
      path: '/api/socket.io',
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      transports: ['polling', 'websocket'],
    })

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization?.toString().replace('Bearer ', '') ?? '')
        if (!token) return next(new Error('Unauthorized'))

        const payload = verifyToken(token)
        if (!payload || typeof payload.sub !== 'string') return next(new Error('Unauthorized'))

        const user = await this.users.findById(payload.sub)
        if (!user) return next(new Error('Unauthorized'))

        socket.data.auth = {
          userId: user.id,
          role: user.role,
          authorId: user.authorId,
        }
        next()
      } catch (err) {
        next(err instanceof Error ? err : new Error('Unauthorized'))
      }
    })

    this.io.on('connection', (socket: Socket) => {
      const auth = socket.data.auth
      if (auth?.role === 'admin') {
        socket.join('admins')
      }
      if (auth?.role === 'author' && auth.authorId) {
        socket.join(`author:${auth.authorId}`)
      }
    })
  }

  emit(event: 'created' | 'updated' | 'message', payload: {
    ticketId: string
    authorId: string
    status: string
    at: string
  }): void {
    if (!this.io) return
    this.io.to('admins').emit(event, payload)
    if (payload.authorId) {
      this.io.to(`author:${payload.authorId}`).emit(event, payload)
    }
  }
}

export const socketIOService = new SocketIOService()
