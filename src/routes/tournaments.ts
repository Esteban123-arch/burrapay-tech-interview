import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { CreateTournamentRequest, TournamentResponse, Tournament } from '../types/index.ts'
import { createTournament, getAllTournaments, getTournament } from '../storage/index.ts'

// Pure function to transform Tournament to TournamentResponse
const toTournamentResponse = (tournament: Tournament): TournamentResponse => ({
  id: tournament.id,
  name: tournament.name,
  createdAt: tournament.createdAt.toISOString()
})

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
        (tournament) => {
          reply.status(201)
          return toTournamentResponse(tournament)
        }
      )
    )
  })

  // GET /tournaments - List all tournaments
  fastify.get('/tournaments', async (request, reply) => {
    const tournaments = getAllTournaments()
    return tournaments.map(toTournamentResponse)
  })

  // GET /tournaments/:id - Get single tournament by ID
  fastify.get<{ Params: { id: string } }>('/tournaments/:id', async (request, reply) => {
    const { id } = request.params

    return pipe(
      getTournament(id),
      O.fold(
        // None: Tournament not found
        () => reply.status(404).send({ error: 'Tournament not found' }),
        // Some: Return tournament response
        (tournament) => toTournamentResponse(tournament)
      )
    )
  })

}