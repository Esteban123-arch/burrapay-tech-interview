import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'

export * from './codecs.ts'

// Generic validation helper that transforms io-ts validation to Either<string, A>
export const decodeWith = <A>(
  codec: t.Type<A, unknown, unknown>,
  data: unknown
): E.Either<string, A> =>
  pipe(
    codec.decode(data),
    E.mapLeft((errors) => {
      const messages = PathReporter.report(E.left(errors))
      return messages.join(', ')
    })
  )

// Validate request body exists before decoding
export const validateBody = <A>(
  codec: t.Type<A, unknown, unknown>,
  body: unknown
): E.Either<string, A> => {
  if (body === undefined || body === null) {
    return E.left('Request body is required')
  }
  return decodeWith(codec, body)
}
