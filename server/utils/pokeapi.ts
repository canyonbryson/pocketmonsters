import { $fetch } from 'ofetch'

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2'

export interface PokeApiNamedResource {
  name: string
  url: string
}

export interface PokeApiPokemonListResponse {
  count: number
  results: PokeApiNamedResource[]
}

export interface PokeApiPokemonDetailResponse {
  id: number
  name: string
  height: number
  weight: number
  types: Array<{
    type: {
      name: string
    }
  }>
  abilities: Array<{
    ability: {
      name: string
    }
  }>
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: {
        front_default: string | null
      }
    }
  }
}

const pokeApiFetch = $fetch.create({
  baseURL: POKE_API_BASE_URL,
  timeout: 8000,
  retry: 1
})

export async function fetchPokemonList(limit: number, offset: number) {
  return pokeApiFetch<PokeApiPokemonListResponse>('/pokemon', {
    query: {
      limit,
      offset
    }
  })
}

export async function fetchPokemonDetail(idOrName: string) {
  return pokeApiFetch<PokeApiPokemonDetailResponse>(`/pokemon/${idOrName}`)
}
