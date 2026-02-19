import type { H3Error } from 'h3'
import { createError, getQuery } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime/internal/cache'
import { fetchPokemonList } from '~~/server/utils/pokeapi'
import { normalizePokemonListResponse } from '~~/server/utils/pokemonTransform'
import type { PokemonListResponse } from '~~/types/pokemon'

const DEFAULT_LIMIT = 60
const DEFAULT_OFFSET = 0
const MAX_LIMIT = 200
const LIST_MAX_AGE_SECONDS = 1800

interface PokemonsDeps {
  fetchList: typeof fetchPokemonList
}

const defaultDeps: PokemonsDeps = {
  fetchList: fetchPokemonList
}

function parseNumberQuery(value: unknown, fallback: number, label: 'limit' | 'offset') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: 'Bad Request',
        message: `Invalid ${label} parameter`
      }
    })
  }

  return parsed
}

function toH3Error(error: unknown): H3Error {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return error as H3Error
  }

  const statusCode =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined

  if (statusCode === 404) {
    return createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: {
        error: 'Not Found',
        message: 'Pokemon not found'
      }
    })
  }

  return createError({
    statusCode: 502,
    statusMessage: 'Upstream Error',
    data: {
      error: 'Upstream Error',
      message: 'Failed to fetch data from PokeAPI'
    }
  })
}

export async function handlePokemonsQuery(
  query: Record<string, unknown>,
  deps: PokemonsDeps = defaultDeps
): Promise<PokemonListResponse> {
  const limit = Math.min(parseNumberQuery(query.limit, DEFAULT_LIMIT, 'limit'), MAX_LIMIT)
  const offset = parseNumberQuery(query.offset, DEFAULT_OFFSET, 'offset')

  const upstreamPayload = await deps.fetchList(limit, offset)

  return normalizePokemonListResponse(upstreamPayload, limit, offset)
}

export function createPokemonsHandler(deps: PokemonsDeps = defaultDeps) {
  return defineCachedEventHandler(
    async (event) => {
      try {
        return await handlePokemonsQuery(getQuery(event), deps)
      }
      catch (error) {
        throw toH3Error(error)
      }
    },
    {
      maxAge: LIST_MAX_AGE_SECONDS,
      swr: true,
      name: 'pokemons-list',
      getKey: (event) => {
        const query = getQuery(event)
        const limit = parseNumberQuery(query.limit, DEFAULT_LIMIT, 'limit')
        const offset = parseNumberQuery(query.offset, DEFAULT_OFFSET, 'offset')

        return `list:${Math.min(limit, MAX_LIMIT)}:${offset}`
      }
    }
  )
}

export default createPokemonsHandler()
