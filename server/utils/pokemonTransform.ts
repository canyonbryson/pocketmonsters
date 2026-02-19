import type {
  PokeApiNamedResource,
  PokeApiPokemonDetailResponse,
  PokeApiPokemonListResponse
} from '~~/server/utils/pokeapi'
import type { PokemonDetail, PokemonListItem, PokemonListResponse } from '~~/types/pokemon'

const DEFAULT_ARTWORK_CDN =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

function extractPokemonIdFromUrl(resourceUrl: string): number {
  const match = resourceUrl.match(/\/pokemon\/(\d+)\/?$/)

  if (!match) {
    throw new Error(`Could not parse Pokemon ID from resource URL: ${resourceUrl}`)
  }

  return Number(match[1])
}

function toListItem(resource: PokeApiNamedResource): PokemonListItem {
  const id = extractPokemonIdFromUrl(resource.url)

  return {
    id,
    name: resource.name,
    image: `${DEFAULT_ARTWORK_CDN}/${id}.png`,
    detailPath: `/pokemon/${id}`
  }
}

export function normalizePokemonListResponse(
  payload: PokeApiPokemonListResponse,
  limit: number,
  offset: number
): PokemonListResponse {
  return {
    count: payload.count,
    limit,
    offset,
    results: payload.results.map(toListItem)
  }
}

export function normalizePokemonDetail(payload: PokeApiPokemonDetailResponse): PokemonDetail {
  return {
    id: payload.id,
    name: payload.name,
    height: payload.height,
    weight: payload.weight,
    types: payload.types.map((entry) => entry.type.name),
    abilities: payload.abilities.map((entry) => entry.ability.name),
    sprites: {
      officialArtwork: payload.sprites.other?.['official-artwork']?.front_default ?? null,
      default: payload.sprites.front_default ?? null
    }
  }
}
