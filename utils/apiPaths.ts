export interface PokemonListPathParams {
  limit?: number
  offset?: number
}

export interface PokemonSimilarPathParams {
  limit?: number
  poolLimit?: number
}

export const apiPaths = {
  pokemons: ({ limit = 60, offset = 0 }: PokemonListPathParams = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    })

    return `/api/pokemons?${params.toString()}`
  },
  pokemon: (idOrName: string | number) => `/api/pokemon/${encodeURIComponent(String(idOrName))}`,
  pokemonSimilar: (
    idOrName: string | number,
    { limit = 4, poolLimit = 60 }: PokemonSimilarPathParams = {}
  ) => {
    const params = new URLSearchParams({
      limit: String(limit),
      poolLimit: String(poolLimit)
    })

    return `/api/pokemon/${encodeURIComponent(String(idOrName))}/similar?${params.toString()}`
  }
} as const

export const apiKeys = {
  pokemons: ({ limit = 60, offset = 0 }: PokemonListPathParams = {}) =>
    `pokemons:${limit}:${offset}`,
  pokemon: (idOrName: string | number) => `pokemon:${String(idOrName).toLowerCase()}`,
  pokemonSimilar: (
    idOrName: string | number,
    { limit = 4, poolLimit = 60 }: PokemonSimilarPathParams = {}
  ) => `pokemon-similar:${String(idOrName).toLowerCase()}:${limit}:${poolLimit}`
} as const
