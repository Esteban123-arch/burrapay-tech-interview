# Features Documentation

## 1. GET Endpoints

Retrieve tournaments and players data.

### How it works
- `GET /tournaments` - List all tournaments
- `GET /tournaments/:id` - Get single tournament
- `GET /tournaments/:tournamentId/players` - List players in tournament
- `GET /players/:id` - Get single player with Pokemon data

### Example
```bash
curl http://localhost:3000/tournaments
curl http://localhost:3000/players/abc-123
```

---

## 2. Input Validation (io-ts)

Runtime type validation using io-ts codecs.

### How it works
- `NonEmptyString` codec rejects empty strings
- Validates request body before processing
- Returns 400 with error message on invalid input

### Example
```bash
# Invalid - empty name
curl -X POST http://localhost:3000/tournaments -d '{"name":""}'
# Response: 400 {"error": "String must not be empty"}

# Valid
curl -X POST http://localhost:3000/tournaments -d '{"name":"Championship"}'
# Response: 201 {"id":"...","name":"Championship","createdAt":"..."}
```

---

## 3. Pokemon Data Caching

In-memory cache with LRU eviction to avoid repeated PokeAPI calls.

### How it works
- Cache-first strategy: check cache before calling API
- TTL-based expiration (default: 1 hour)
- LRU eviction when cache reaches max size (default: 1000)
- Case-insensitive keys (`pikachu` = `PIKACHU`)
- `X-Pokemon-Cache` header indicates HIT/MISS

### Configuration (.env)
```
CACHE_TTL=3600000
CACHE_MAX_SIZE=1000
```

### Example
```bash
# First request - MISS (calls PokeAPI)
curl -i -X POST http://localhost:3000/tournaments/123/players -d '{"name":"bulbasaur"}'
# Header: x-pokemon-cache: MISS

# Second request - HIT (served from cache)
curl -i -X POST http://localhost:3000/tournaments/123/players -d '{"name":"bulbasaur"}'
# Header: x-pokemon-cache: HIT
```
