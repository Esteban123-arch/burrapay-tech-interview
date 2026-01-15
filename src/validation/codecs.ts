import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'

// Custom codec for non-empty string
const NonEmptyString = new t.Type<string, string, unknown>(
  'NonEmptyString',
  (u): u is string => typeof u === 'string' && u.length > 0,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      E.chain((s) =>
        s.length > 0 ? t.success(s) : t.failure(u, c, 'String must not be empty')
      )
    ),
  t.identity
)

// Codec for creating a tournament
export const CreateTournamentCodec = t.type({
  name: NonEmptyString
})

// Codec for creating a player (Pokemon)
export const CreatePlayerCodec = t.type({
  name: NonEmptyString
})

// Type aliases derived from codecs
export type CreateTournamentInput = t.TypeOf<typeof CreateTournamentCodec>
export type CreatePlayerInput = t.TypeOf<typeof CreatePlayerCodec>
