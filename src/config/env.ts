import 'dotenv/config'
import { z } from 'zod'

const booleanFromString = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1')

const corsOriginSchema = z
  .string()
  .default('http://localhost:5173')
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  )

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: corsOriginSchema,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  AI_ENABLED: booleanFromString.default(true),
  AI_MODEL: z.string().default('nvidia/nemotron-3-super-120b-a12b'),
  EMBEDDING_MODEL: z.string().default('nvidia/nemotron-3-embed-1b'),
  NVIDIA_API_KEY: z.string().optional().transform((v) => (v?.trim() ? v.trim() : undefined)),
  NVIDIA_BASE_URL: z.string().default('https://integrate.api.nvidia.com/v1'),
  AI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(2000),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  return parsed.data
}

export const env = loadEnv()
