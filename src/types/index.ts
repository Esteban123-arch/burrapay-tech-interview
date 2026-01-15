import * as t from 'fp-ts/lib/struct'

// Tournament interface
export interface Tournament {
  id: string
  name: string
  createdAt: Date
}

// Player interface (Pokemon only!)
export interface Player {
  id: string
  name: string
  tournamentId: string
  pokemonData: {
    id: number
    types: string[]
    height: number
    weight: number
  }
}

// Pokemon API response type (for reference)
export interface PokemonApiResponse {
  id: number
  name: string
  types: Array<{
    type: {
      name: string
    }
  }>
  height: number
  weight: number
}

// Request types for creating tournaments
export interface CreateTournamentRequest {
  name: string
}

// Request types for adding players
export interface CreatePlayerRequest {
  name: string
}

// Response types
export interface TournamentResponse {
  id: string
  name: string
  createdAt: string
}

export interface PlayerResponse {
  id: string
  name: string
  tournamentId: string
}

// Extended player response with Pokemon data
export interface PlayerDetailResponse {
  id: string
  name: string
  tournamentId: string
  pokemonData: {
    id: number
    types: string[]
    height: number
    weight: number
  }
}

// Health check response type
export interface HealthResponse {
  status: 'OK'
  timestamp: string
}

// Server configuration type
export interface ServerConfig {
  host: string
  port: number
}

// Cache configuration type
export interface CacheConfig {
  ttl: number
  maxSize: number
}

// Cached Pokemon entry with metadata
export interface CachedPokemon {
  data: PokemonApiResponse
  cachedAt: number
  lastAccessed: number
}

// Cache statistics
export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
}