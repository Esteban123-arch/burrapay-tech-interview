import Fastify, { FastifyInstance } from 'fastify'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/function'
import { tournamentRoutes } from './routes/tournaments.ts'
import { playerRoutes } from './routes/players.ts'
import { HealthResponse, ServerConfig } from './types/index.ts'

// Load server configuration from environment
const getServerConfig = (): ServerConfig => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3000', 10)
  
})

// Create health check handler (pure function)
const createHealthResponse = (): HealthResponse => ({
  status: 'OK',
  timestamp: new Date().toISOString()
})

// Register all routes (composition of route registrations)
const registerRoutes = async (fastify: FastifyInstance): Promise<FastifyInstance> => {
  await fastify.register(tournamentRoutes)
  await fastify.register(playerRoutes)

  fastify.get<{ Reply: HealthResponse }>('/health', async () => createHealthResponse())

  return fastify
}

// Build server
const buildServer = (): TE.TaskEither<Error, FastifyInstance> =>
  pipe(
    TE.tryCatch(
      async () => {
        const fastify = Fastify({
          logger: {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
              }
            }
          }
        })
        return registerRoutes(fastify)
      },
      (error) => new Error(`Failed to build server: ${error}`)
    )
  )

// Start listening on configured port
const listen = (fastify: FastifyInstance): TE.TaskEither<Error, FastifyInstance> => {
  const config = getServerConfig()
  return TE.tryCatch(
    async () => {
      await fastify.listen(config)
      return fastify
    },
    (error) => new Error(`Failed to start server: ${error}`)
  )
}

// Log successful startup (side effect isolated)
const logStartup = (fastify: FastifyInstance): T.Task<FastifyInstance> => () => {
  const config = getServerConfig()
  fastify.log.info('Pokemon Tournament API Server started successfully!')
  fastify.log.info(`Server running on http://${config.host}:${config.port}`)
  fastify.log.info('Ready to accept Pokemon players only!')
  return Promise.resolve(fastify)
}

// Handle startup failure (side effect isolated)
const handleStartupError = (error: Error): never => {
  console.error('Server startup failed:', error.message)
  return process.exit(1)
}

// Main startup pipeline using fp-ts composition
const start = (): Promise<void> =>
  pipe(
    buildServer(),
    TE.chain(listen),
    TE.fold(
      (error) => T.of(handleStartupError(error)),
      (fastify) => logStartup(fastify)
    )
  )().then(() => undefined)

// Auto-start when running directly
start()

export { buildServer, start }
