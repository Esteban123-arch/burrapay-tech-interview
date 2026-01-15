import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as TE from 'fp-ts/lib/TaskEither'
import { PokemonApiResponse, Player, PlayerResponse, PlayerDetailResponse } from '../types/index.ts'
import { createPlayer, getTournament, getPlayer, getPlayersByTournament } from '../storage/index.ts'
import { validateBody, CreatePlayerCodec, CreatePlayerInput } from '../validation/index.ts'
import { pokemonCache } from '../cache/pokemonCache.ts'

// Pure function to transform Player to PlayerResponse
const toPlayerResponse = (player: Player): PlayerResponse => ({
  id: player.id,
  name: player.name,
  tournamentId: player.tournamentId
})

// Pure function to transform Player to PlayerDetailResponse (includes Pokemon data)
const toPlayerDetailResponse = (player: Player): PlayerDetailResponse => ({
  id: player.id,
  name: player.name,
  tournamentId: player.tournamentId,
  pokemonData: player.pokemonData
})

// Cache lookup result type
interface CacheLookupResult {
  data: PokemonApiResponse
  fromCache: boolean
}

// Fetch Pokemon from API and cache the result
const fetchFromApi = (name: string): TE.TaskEither<string, CacheLookupResult> =>
  TE.tryCatch(
    async () => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`)
      if (!response.ok) {
        throw new Error('Not a valid Pokemon')
      }
      const data = await response.json() as PokemonApiResponse
      const pokemonData: PokemonApiResponse = {
        id: data.id,
        name: data.name,
        types: data.types,
        height: data.height,
        weight: data.weight
      }
      // Store in cache for future requests
      pokemonCache.set(name, pokemonData)
      return { data: pokemonData, fromCache: false }
    },
    () => 'Name is not a valid Pokemon'
  )

// Pokemon API validation function using TaskEither with cache-first strategy
const validatePokemon = (name: string): TE.TaskEither<string, CacheLookupResult> =>
  pipe(
    pokemonCache.get(name),
    O.fold(
      // Cache miss: fetch from API
      () => fetchFromApi(name),
      // Cache hit: return cached data
      (cachedData) => TE.right({ data: cachedData, fromCache: true })
    )
  )

export async function playerRoutes(fastify: FastifyInstance) {

  // POST /tournaments/:tournamentId/players - Add a Pokemon player
  fastify.post<{
    Params: { tournamentId: string },
    Body: CreatePlayerInput
  }>('/tournaments/:tournamentId/players', async (request, reply) => {
    const { tournamentId } = request.params

    // Validate request body using io-ts codec
    const validationResult = validateBody(CreatePlayerCodec, request.body)

    if (E.isLeft(validationResult)) {
      return reply.status(400).send({ error: validationResult.left })
    }

    const { name } = validationResult.right

    // Check if tournament exists using Option pattern
    const tournamentOption = getTournament(tournamentId)
    if (O.isNone(tournamentOption)) {
      return reply.status(404).send({ error: 'Tournament not found' })
    }

    // Validate Pokemon name using TaskEither pattern
    const pokemonResult = await validatePokemon(name)()

    return pipe(
      pokemonResult,
      E.fold(
        // Left: Pokemon validation failed
        (error) => reply.status(400).send({ error }),
        // Right: Valid Pokemon - create player
        (result) => {
          const { data: pokemonData, fromCache } = result
          // Extract types from nested structure
          const types = pokemonData.types.map((t: { type: { name: string } }) => t.type.name)

          // Create player with Pokemon data
          const playerResult = createPlayer(name, tournamentId, {
            id: pokemonData.id,
            types,
            height: pokemonData.height,
            weight: pokemonData.weight
          })

          return pipe(
            playerResult,
            E.fold(
              // Left: Player creation failed (tournament not found)
              (error) => reply.status(404).send({ error }),
              // Right: Success - return PlayerResponse with cache header
              (player) => {
                reply.header('X-Pokemon-Cache', fromCache ? 'HIT' : 'MISS')
                reply.status(201)
                return reply.send(toPlayerResponse(player))
              }
            )
          )
        }
      )
    )
  })

  // GET /tournaments/:tournamentId/players - List players in a tournament
  fastify.get<{ Params: { tournamentId: string } }>(
    '/tournaments/:tournamentId/players',
    async (request, reply) => {
      const { tournamentId } = request.params

      // Check if tournament exists using Option pattern
      return pipe(
        getTournament(tournamentId),
        O.fold(
          // None: Tournament not found
          () => reply.status(404).send({ error: 'Tournament not found' }),
          // Some: Return players for this tournament
          () => {
            const players = getPlayersByTournament(tournamentId)
            return reply.send(players.map(toPlayerDetailResponse))
          }
        )
      )
    }
  )

  // GET /players/:id - Get single player by ID
  fastify.get<{ Params: { id: string } }>('/players/:id', async (request, reply) => {
    const { id } = request.params

    return pipe(
      getPlayer(id),
      O.fold(
        // None: Player not found
        () => reply.status(404).send({ error: 'Player not found' }),
        // Some: Return player detail response
        (player) => reply.send(toPlayerDetailResponse(player))
      )
    )
  })

}