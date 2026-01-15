import * as O from 'fp-ts/lib/Option'
import { PokemonApiResponse, CacheConfig, CachedPokemon, CacheStats } from '../types/index.ts'

// Cache configuration from environment variables with defaults
const CACHE_CONFIG: CacheConfig = {
  ttl: parseInt(process.env.CACHE_TTL || '3600000', 10), // 1 hour default
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10) // 1000 entries default
}

// In-memory cache storage
const cache = new Map<string, CachedPokemon>()

// Cache statistics counters
let hits = 0
let misses = 0

// Normalize Pokemon name for cache key (lowercase)
const normalizeKey = (name: string): string => name.toLowerCase()

// Check if cache entry is expired
const isExpired = (entry: CachedPokemon): boolean =>
  Date.now() - entry.cachedAt > CACHE_CONFIG.ttl

// Evict least recently used entry when cache is full
const evictLRU = (): void => {
  if (cache.size < CACHE_CONFIG.maxSize) return

  let oldestKey: string | null = null
  let oldestAccess = Infinity

  for (const [key, entry] of cache.entries()) {
    if (entry.lastAccessed < oldestAccess) {
      oldestAccess = entry.lastAccessed
      oldestKey = key
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey)
  }
}

// Get Pokemon from cache (returns Option)
export const get = (name: string): O.Option<PokemonApiResponse> => {
  const key = normalizeKey(name)
  const entry = cache.get(key)

  if (!entry) {
    misses++
    return O.none
  }

  if (isExpired(entry)) {
    cache.delete(key)
    misses++
    return O.none
  }

  // Update last accessed time (LRU tracking)
  entry.lastAccessed = Date.now()
  hits++
  return O.some(entry.data)
}

// Store Pokemon in cache
export const set = (name: string, data: PokemonApiResponse): void => {
  const key = normalizeKey(name)

  // Evict LRU if cache is full
  evictLRU()

  const now = Date.now()
  cache.set(key, {
    data,
    cachedAt: now,
    lastAccessed: now
  })
}

// Check if Pokemon exists in cache (without updating stats)
export const has = (name: string): boolean => {
  const key = normalizeKey(name)
  const entry = cache.get(key)
  return entry !== undefined && !isExpired(entry)
}

// Invalidate specific cache entry
export const invalidate = (name: string): void => {
  const key = normalizeKey(name)
  cache.delete(key)
}

// Clear entire cache
export const clear = (): void => {
  cache.clear()
  hits = 0
  misses = 0
}

// Get cache statistics
export const getStats = (): CacheStats => {
  const total = hits + misses
  return {
    size: cache.size,
    hits,
    misses,
    hitRate: total > 0 ? (hits / total) * 100 : 0
  }
}

// Export cache instance for testing
export const pokemonCache = {
  get,
  set,
  has,
  invalidate,
  clear,
  getStats
}
