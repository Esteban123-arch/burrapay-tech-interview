# Tournament API - Technical Interview

A TypeScript Fastify API for managing tournaments and players, demonstrating functional programming patterns with `fp-ts`.

## 📋 Interview Requirements

You need to complete the implementation of a basic tournament management API with the following features:

### Core Endpoints
1. `POST /tournaments` - Create a new tournament
2. `POST /tournaments/:tournamentId/players` - Add a player to a tournament

### 🎯 Special Requirement: Pokemon-Only Players
As part of this technical assessment, **ONLY Pokemon can be added as players**. Integrate with the [PokeAPI](https://pokeapi.co/) to enforce this:

- When adding a player, the `name` provided MUST be a valid Pokemon name
- Fetch Pokemon data from PokeAPI to validate and enhance the player
- **REJECT any requests where the name is not a valid Pokemon** (return 400 error)
- Store the Pokemon's name, type(s), and other relevant information
- Handle API failures gracefully using `fp-ts` patterns

## 🚀 Getting Started

### Prerequisites
- **Node.js v22+** (Required for Fastify v5 compatibility)
  - Use `nvm use 22` to switch to Node.js 22
  - Verify with `node --version` (should show v22.x.x)
- **PNPM** (Package manager)
  - Install globally: `npm install -g pnpm`
  - Or use `corepack enable` if using Node.js 16.10+

### Installation
```bash
# Install dependencies (already done)
pnpm install

# Development with auto-reload
pnpm dev:watch

# Or run once
pnpm dev

# Build and run production
pnpm build
pnpm start

# Testing
pnpm test              # Run tests once
pnpm test:watch        # Run tests in watch mode
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Run tests with coverage
```

## 📁 Project Structure

```
src/
├── types/index.ts        # TypeScript interfaces and types
├── storage/index.ts      # In-memory storage with fp-ts patterns
├── routes/
│   ├── tournaments.ts    # Tournament endpoints (TODO)
│   └── players.ts        # Player endpoints (TODO)
├── server.ts            # Main server setup (TODO)
└── index.ts             # Entry point (TODO)
```

## ✅ Implementation Tasks

### Task 1: Complete Tournament Routes (`src/routes/tournaments.ts`)

- [ ] Implement `POST /tournaments` endpoint
- [ ] Use the provided `fp-ts Either` pattern example
- [ ] Return appropriate HTTP status codes (201 for success, 400 for errors)
- [ ] Transform response to match `TournamentResponse` interface

### Task 2: Complete Player Routes (`src/routes/players.ts`)

- [ ] Implement `POST /tournaments/:tournamentId/players` endpoint
- [ ] Validate tournament exists before adding player
- [ ] **Pokemon Validation**: Verify player name is a valid Pokemon using PokeAPI
- [ ] **REJECT non-Pokemon names** with 400 Bad Request error
- [ ] Use `fp-ts` patterns for async operations and error handling
- [ ] Return appropriate HTTP status codes (201/400/404)

### Task 3: Complete Server Setup (`src/server.ts`)

- [ ] Create Fastify instance with logging
- [ ] Register tournament and player routes
- [ ] Start server on port 3000
- [ ] Handle startup errors appropriately

### Task 4: Complete Entry Point (`src/index.ts`)

- [ ] Import and call the start function

## 🔧 Pokemon Integration Details

### PokeAPI Integration Requirements:

1. **Endpoint**: `https://pokeapi.co/api/v2/pokemon/{name}`
2. **Validation**: ALL player names MUST be valid Pokemon names
3. **Rejection**: Return 400 Bad Request if name is not a Pokemon
4. **Data Storage**: Store Pokemon information as player data:
   - Pokemon ID
   - Types (fire, water, etc.)
   - Height/Weight
5. **Error Handling**: Use `fp-ts TaskEither` for async API calls
6. **No Fallback**: Unlike regular apps, there's no fallback for non-Pokemon names

### Pokemon Player Object:

```typescript
interface PokemonPlayer extends Player {
  pokemonData: {
    id: number
    types: string[]
    height: number
    weight: number
  }
}
```

## 📖 fp-ts Patterns to Demonstrate

### Either Pattern (Error Handling)

```typescript
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

const result = pipe(
  createTournament(name),
  E.fold(
    (error) => handleError(error),
    (success) => handleSuccess(success)
  )
)
```

### TaskEither Pattern (Async Operations)

```typescript
import * as TE from 'fp-ts/lib/TaskEither'

const fetchPokemon = (name: string): TE.TaskEither<string, Pokemon> =>
  TE.tryCatch(
    () => fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(r => r.json()),
    (error) => `Failed to fetch Pokemon: ${error}`
  )
```

### Option Pattern (Nullable Values)

```typescript
import * as O from 'fp-ts/lib/Option'

const tournament = pipe(
  getTournament(id),
  O.fold(
    () => 'Tournament not found',
    (tournament) => `Found: ${tournament.name}`
  )
)
```

## 🧪 Testing Your Implementation

The project includes comprehensive integration tests using **Vitest**.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (recommended during development)
pnpm test:watch

# Run tests with interactive UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Test Coverage

The integration tests cover:

- ✅ **Health check endpoint**
- ✅ **Tournament creation and management**
- ✅ **Pokemon validation via PokeAPI**
- ✅ **Player creation with Pokemon data**
- ✅ **Error handling** (invalid Pokemon, missing tournaments)
- ✅ **Edge cases** (malformed requests, network issues)
- ✅ **Pokemon API integration** (real API calls)

### Test Structure

```file
src/test/
├── setup.ts           # Test environment setup
├── helpers.ts         # Test utilities
└── integration.test.ts # Main integration tests
```

### Manual Testing Commands:

1. **Create a Tournament:**

```bash
curl -X POST http://localhost:3000/tournaments \
  -H "Content-Type: application/json" \
  -d '{"name": "Pokemon Championship"}'
```

2. **Add a Pokemon Player:**

```bash
curl -X POST http://localhost:3000/tournaments/{tournamentId}/players \
  -H "Content-Type: application/json" \
  -d '{"name": "pikachu"}'
```

3. **Try Adding Invalid Player (should fail):**

```bash
curl -X POST http://localhost:3000/tournaments/{tournamentId}/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Ash Ketchum"}'
# Expected: 400 Bad Request - "Name is not a valid Pokemon"
```

4. **Health Check:**

```bash
curl http://localhost:3000/health
```

## 📊 Evaluation Criteria

You will be evaluated on:

1. **Code Quality**: Clean, readable TypeScript code
2. **fp-ts Usage**: Proper use of Either, Option, and TaskEither patterns
3. **Error Handling**: Graceful handling of various error scenarios
4. **API Design**: RESTful endpoints with appropriate status codes
5. **Pokemon Integration**: Creative and robust integration with PokeAPI
6. **Functional Programming**: Demonstrating FP principles and composition
7. **Testing**: All integration tests should pass (`pnpm test`)

## 🎉 Bonus Points

- Implement GET endpoints to retrieve tournaments and players
- Add input validation using `io-ts` (another fp-ts ecosystem library)
- Implement proper logging with structured data
- Add rate limiting for PokeAPI calls
- Cache Pokemon data to avoid repeated API calls

## 🚨 Important Notes

- **No validation required**: Focus on fp-ts patterns and API integration
- **Keep it simple**: Don't over-engineer, focus on clean implementation
- **Ask questions**: If anything is unclear, please ask for clarification
- **Time management**: Focus on core functionality first, then Pokemon integration

Good luck! 🚀

## 🔧 Troubleshooting

### Node.js Version Issues

If you encounter errors like `diagnostics.tracingChannel is not a function`:

1. **Check Node.js version**: `node --version`
2. **Switch to Node.js 22**: `nvm use 22`
3. **Install Node.js 22** if not available:

   ```bash
   nvm install 22
   nvm use 22
   ```

4. **Reinstall dependencies** after switching:

   ```bash
   pnpm install
   ```

### PNPM Issues

If PNPM commands fail:
- Install PNPM: `npm install -g pnpm`
- Or enable corepack: `corepack enable`
- Clear cache: `pnpm store prune`
