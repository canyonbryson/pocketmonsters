import { describe, expect, it } from 'vitest'
import { apiKeys, apiPaths } from '~~/utils/apiPaths'

describe('apiPaths and apiKeys', () => {
  it('builds list and detail endpoints', () => {
    expect(apiPaths.pokemons({ limit: 60, offset: 0 })).toBe('/api/pokemons?limit=60&offset=0')
    expect(apiPaths.pokemon('Pikachu')).toBe('/api/pokemon/Pikachu')
  })

  it('builds similar endpoint and key with defaults', () => {
    expect(apiPaths.pokemonSimilar(25)).toBe('/api/pokemon/25/similar?limit=4&poolLimit=60')
    expect(apiKeys.pokemonSimilar(25)).toBe('pokemon-similar:25:4:60')
  })

  it('builds similar endpoint and key with custom values', () => {
    expect(apiPaths.pokemonSimilar('pikachu', { limit: 6, poolLimit: 120 })).toBe(
      '/api/pokemon/pikachu/similar?limit=6&poolLimit=120'
    )
    expect(apiKeys.pokemonSimilar('Pikachu', { limit: 6, poolLimit: 120 })).toBe(
      'pokemon-similar:pikachu:6:120'
    )
  })
})
