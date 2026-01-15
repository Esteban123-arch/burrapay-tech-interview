import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import { CreateTournamentRequest, TournamentResponse } from '../types/index.ts'
import { createTournament } from '../storage/index.ts'

export async function tournamentRoutes(fastify: FastifyInstance) {

  // POST /tournaments - Create a new tournament
  fastify.post<{ Body: CreateTournamentRequest }>('/tournaments', async (request, reply) => {
    // Validate request body exists
    if (!request.body || request.body.name === undefined) {
      return reply.status(400).send({ error: 'Name is required' })
    }

    const { name } = request.body

    // Use fp-ts Either pattern to handle tournament creation
    return pipe(
      createTournament(name),
      E.fold(
        // Left: Error case
        (error) => reply.status(400).send({ error }),
        // Right: Success case - transform to TournamentResponse
        (tournament): TournamentResponse => {
          reply.status(201)
          return {
            id: tournament.id,
            name: tournament.name,
            createdAt: tournament.createdAt.toISOString()
          }
        }
      )
    )
  })

}