import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { TournamentResponse, Tournament } from '../types/index.ts'
import { createTournament, getAllTournaments, getTournament } from '../storage/index.ts'
import { validateBody, CreateTournamentCodec, CreateTournamentInput } from '../validation/index.ts'

// Pure function to transform Tournament to TournamentResponse
const toTournamentResponse = (tournament: Tournament): TournamentResponse => ({
  id: tournament.id,
  name: tournament.name,
  createdAt: tournament.createdAt.toISOString()
})

export async function tournamentRoutes(fastify: FastifyInstance) {

  // POST /tournaments - Create a new tournament
  fastify.post<{ Body: CreateTournamentInput }>('/tournaments', async (request, reply) => {
    // Validate request body using io-ts codec
    return pipe(
      validateBody(CreateTournamentCodec, request.body),
      E.chain(({ name }) => createTournament(name)),
      E.fold(
        // Left: Validation or creation error
        (error) => reply.status(400).send({ error }),
        // Right: Success - transform to TournamentResponse
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