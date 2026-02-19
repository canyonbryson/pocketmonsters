import type { PokemonDetail } from '~~/types/pokemon'
import type { PokeApiPokemonDetailResponse } from '~~/server/utils/pokeapi'
import { fetchPokemonDetail, fetchPokemonList } from '~~/server/utils/pokeapi'
import { normalizePokemonDetail } from '~~/server/utils/pokemonTransform'

const RECOMMENDATION_POOL_TTL_MS = 30 * 60 * 1000
const RECOMMENDATION_FETCH_CONCURRENCY = 8
const DEFAULT_POOL_LIMIT = 60
const DEFAULT_RESULT_LIMIT = 4

const DEFAULT_ARTWORK_CDN =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

export interface PokemonRecommendationCandidate {
  id: number
  name: string
  image: string
  detailPath: string
  height: number
  weight: number
  types: string[]
}

interface RecommendationPoolCache {
  data: PokemonRecommendationCandidate[]
  expiresAt: number
}

interface RecommendationBuilderDeps {
  fetchList?: typeof fetchPokemonList
  fetchDetail?: typeof fetchPokemonDetail
  now?: () => number
}

const poolCache = new Map<number, RecommendationPoolCache>()
const poolInFlight = new Map<number, Promise<PokemonRecommendationCandidate[]>>()

function extractPokemonIdFromUrl(resourceUrl: string): number {
  const match = resourceUrl.match(/\/pokemon\/(\d+)\/?$/)

  if (!match) {
    throw new Error(`Could not parse Pokemon ID from resource URL: ${resourceUrl}`)
  }

  return Number(match[1])
}

function toCandidate(detail: PokemonDetail): PokemonRecommendationCandidate {
  return {
    id: detail.id,
    name: detail.name,
    image: detail.sprites.officialArtwork ?? detail.sprites.default ?? `${DEFAULT_ARTWORK_CDN}/${detail.id}.png`,
    detailPath: `/pokemon/${detail.id}`,
    height: detail.height,
    weight: detail.weight,
    types: detail.types
  }
}

async function runBoundedMap<TInput, TOutput>(
  entries: TInput[],
  concurrency: number,
  mapper: (entry: TInput) => Promise<TOutput | null>
) {
  const outputs: TOutput[] = []
  let cursor = 0

  async function worker() {
    while (cursor < entries.length) {
      const currentIndex = cursor
      cursor += 1
      const mapped = await mapper(entries[currentIndex])

      if (mapped) {
        outputs.push(mapped)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(entries.length, 1)) }, () => worker())
  )

  return outputs
}

export async function getRecommendationPool(
  poolLimit = DEFAULT_POOL_LIMIT,
  deps: RecommendationBuilderDeps = {}
) {
  const now = deps.now ?? Date.now
  const cached = poolCache.get(poolLimit)
  const currentTime = now()

  if (cached && cached.expiresAt > currentTime) {
    return cached.data
  }

  const pending = poolInFlight.get(poolLimit)

  if (pending) {
    return pending
  }

  const fetchList = deps.fetchList ?? fetchPokemonList
  const fetchDetail = deps.fetchDetail ?? fetchPokemonDetail

  const request = (async () => {
    const listPayload = await fetchList(poolLimit, 0)
    const ids = listPayload.results
      .map((entry) => {
        try {
          return extractPokemonIdFromUrl(entry.url)
        }
        catch {
          return null
        }
      })
      .filter((value): value is number => value !== null)

    const candidates = await runBoundedMap(ids, RECOMMENDATION_FETCH_CONCURRENCY, async (id) => {
      try {
        const detailPayload = await fetchDetail(String(id))
        return toCandidate(normalizePokemonDetail(detailPayload as PokeApiPokemonDetailResponse))
      }
      catch {
        return null
      }
    })

    poolCache.set(poolLimit, {
      data: candidates,
      expiresAt: now() + RECOMMENDATION_POOL_TTL_MS
    })

    return candidates
  })().finally(() => {
    poolInFlight.delete(poolLimit)
  })

  poolInFlight.set(poolLimit, request)

  return request
}

export function rankSimilarPokemon(
  source: Pick<PokemonDetail, 'id' | 'height' | 'weight' | 'types'>,
  candidates: PokemonRecommendationCandidate[],
  limit = DEFAULT_RESULT_LIMIT
) {
  const sourceTypeSet = new Set(source.types)

  return candidates
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => {
      const sharedTypeCount = candidate.types.filter((type) => sourceTypeSet.has(type)).length
      const heightDelta = Math.abs(candidate.height - source.height)
      const weightDelta = Math.abs(candidate.weight - source.weight)
      const distance = heightDelta + weightDelta

      return {
        candidate,
        sharedTypeCount,
        heightDelta,
        weightDelta,
        distance
      }
    })
    .sort((left, right) => {
      if (left.sharedTypeCount !== right.sharedTypeCount) {
        return right.sharedTypeCount - left.sharedTypeCount
      }

      if (left.distance !== right.distance) {
        return left.distance - right.distance
      }

      if (left.heightDelta !== right.heightDelta) {
        return left.heightDelta - right.heightDelta
      }

      if (left.weightDelta !== right.weightDelta) {
        return left.weightDelta - right.weightDelta
      }

      return left.candidate.id - right.candidate.id
    })
    .slice(0, limit)
    .map((entry) => ({
      id: entry.candidate.id,
      name: entry.candidate.name,
      image: entry.candidate.image,
      detailPath: entry.candidate.detailPath
    }))
}

