export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export class Logger {
  private readonly level: LogLevel
  private readonly context?: string

  constructor(level: LogLevel = 'info', context?: string) {
    this.level = level
    this.context = context
  }

  child(context: string): Logger {
    const prefix = this.context ? `${this.context}:${context}` : context
    return new Logger(this.level, prefix)
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return
    const payload = {
      level,
      time: new Date().toISOString(),
      context: this.context,
      message,
      ...meta,
    }
    const line = JSON.stringify(payload)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta)
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta)
  }
}
