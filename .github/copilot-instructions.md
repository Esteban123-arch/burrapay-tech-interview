# Copilot Instructions - Pokemon Tournament API Interview

## Your Tasks

Implement endpoints in [src/routes/tournaments.ts](src/routes/tournaments.ts) and [src/routes/players.ts](src/routes/players.ts) using fp-ts patterns. Run `pnpm test:watch` to validate your work against the integration tests.

## Required fp-ts Pattern

Use `pipe` and `fold` for all storage operations:
```typescript
pipe(
  createTournament(request.body.name),
  E.fold(
    (error) => reply.status(400).send({ error }),
    (tournament) => reply.status(201).send({ id: tournament.id, name: tournament.name, createdAt: tournament.createdAt.toISOString() })
  )
)
```

For PokeAPI validation, use `TaskEither`:
```typescript
const validatePokemon = (name: string): TE.TaskEither<string, PokemonApiResponse> =>
  TE.tryCatch(
    () => fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`).then(r => {
      if (!r.ok) throw new Error()
      return r.json()
    }),
    () => 'Name is not a valid Pokemon'
  )
```

## Key Requirements

- **PokeAPI:** `https://pokeapi.co/api/v2/pokemon/{name}` - reject non-Pokemon with `{ error: 'Name is not a valid Pokemon' }`
- **Storage functions:** `createTournament(name)`, `createPlayer(name, tournamentId, pokemonData)`, `getTournament(id)`
- **Pokemon data:** Extract `{ id, types: apiResponse.types.map(t => t.type.name), height, weight }`

## Status Codes

| Scenario | Status |
|----------|--------|
| Created | 201 |
| Invalid Pokemon / Missing body | 400 |
| Tournament not found | 404 |

## Commands

```bash
pnpm test:watch   # TDD - run this while implementing
pnpm dev:watch    # Manual testing on http://localhost:3000
```
