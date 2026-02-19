import type { H3Error } from 'h3'
import { createError, getRouterParam } from 'h3'
import { defineCachedEventHandler } from 'nitropack/runtime/internal/cache'
import { fetchPokemonDetail } from '~~/server/utils/pokeapi'
import { normalizePokemonDetail } from '~~/server/utils/pokemonTransform'
import type { PokemonDetail } from '~~/types/pokemon'

const DETAIL_MAX_AGE_SECONDS = 43200

interface PokemonDetailDeps {
  fetchDetail: typeof fetchPokemonDetail
}

const defaultDeps: PokemonDetailDeps = {
  fetchDetail: fetchPokemonDetail
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

export async function handlePokemonDetail(
  idOrName: string,
  deps: PokemonDetailDeps = defaultDeps
): Promise<PokemonDetail> {
  const pokemonIdentifier = normalizeIdParam(idOrName)
  const upstreamPayload = await deps.fetchDetail(pokemonIdentifier)

  return normalizePokemonDetail(upstreamPayload)
}

export function createPokemonDetailHandler(deps: PokemonDetailDeps = defaultDeps) {
  return defineCachedEventHandler(
    async (event) => {
      try {
        const id = normalizeIdParam(getRouterParam(event, 'id'))

        return await handlePokemonDetail(id, deps)
      }
      catch (error) {
        throw toH3Error(error)
      }
    },
    {
      maxAge: DETAIL_MAX_AGE_SECONDS,
      swr: true,
      name: 'pokemon-detail',
      getKey: (event) => `detail:${normalizeIdParam(getRouterParam(event, 'id'))}`
    }
  )
}

export default createPokemonDetailHandler()
