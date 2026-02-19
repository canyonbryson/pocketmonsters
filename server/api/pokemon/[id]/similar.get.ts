import type { H3Error } from 'h3'
import { createError, getQuery, getRouterParam } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime/internal/cache'
import type { PokemonSimilarResponse } from '~~/types/pokemon'
import { handlePokemonDetail } from '~~/server/api/pokemon/[id].get'
import { getRecommendationPool, rankSimilarPokemon } from '~~/server/utils/pokemonRecommendations'

const DEFAULT_LIMIT = 4
const MAX_LIMIT = 12
const DEFAULT_POOL_LIMIT = 60
const MAX_POOL_LIMIT = 200
const SIMILAR_MAX_AGE_SECONDS = 1800

interface SimilarDeps {
  getSource: typeof handlePokemonDetail
  getPool: typeof getRecommendationPool
}

const defaultDeps: SimilarDeps = {
  getSource: handlePokemonDetail,
  getPool: getRecommendationPool
}

function normalizeIdParam(value: string | undefined): string {
  const trimmed = value?.trim()

  if (!trimmed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: {
        error: 'Bad Request',
        message: 'Invalid pokemon identifier'
      }
    })
  }

  return trimmed.toLowerCase()
}

function parseNumberQuery(value: unknown, fallback: number, label: 'limit' | 'poolLimit') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
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

export async function handlePokemonSimilar(
  idOrName: string,
  query: Record<string, unknown>,
  deps: SimilarDeps = defaultDeps
): Promise<PokemonSimilarResponse> {
  const sourceId = normalizeIdParam(idOrName)
  const limit = Math.min(parseNumberQuery(query.limit, DEFAULT_LIMIT, 'limit'), MAX_LIMIT)
  const poolLimit = Math.min(
    parseNumberQuery(query.poolLimit, DEFAULT_POOL_LIMIT, 'poolLimit'),
    MAX_POOL_LIMIT
  )
  const source = await deps.getSource(sourceId)
  const pool = await deps.getPool(poolLimit)
  const results = rankSimilarPokemon(source, pool, limit)

  return {
    sourceId: source.id,
    limit,
    results
  }
}

export function createPokemonSimilarHandler(deps: SimilarDeps = defaultDeps) {
  return defineCachedEventHandler(
    async (event) => {
      try {
        const id = normalizeIdParam(getRouterParam(event, 'id'))
        return await handlePokemonSimilar(id, getQuery(event), deps)
      }
      catch (error) {
        throw toH3Error(error)
      }
    },
    {
      maxAge: SIMILAR_MAX_AGE_SECONDS,
      swr: true,
      name: 'pokemon-similar',
      getKey: (event) => {
        const id = normalizeIdParam(getRouterParam(event, 'id'))
        const query = getQuery(event)
        const limit = Math.min(parseNumberQuery(query.limit, DEFAULT_LIMIT, 'limit'), MAX_LIMIT)
        const poolLimit = Math.min(
          parseNumberQuery(query.poolLimit, DEFAULT_POOL_LIMIT, 'poolLimit'),
          MAX_POOL_LIMIT
        )

        return `similar:${id}:${limit}:${poolLimit}`
      }
    }
  )
}

export default createPokemonSimilarHandler()
