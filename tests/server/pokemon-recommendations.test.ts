import { describe, expect, it } from 'vitest'
import { rankSimilarPokemon, type PokemonRecommendationCandidate } from '~~/server/utils/pokemonRecommendations'

describe('rankSimilarPokemon', () => {
  const source = {
    id: 25,
    height: 4,
    weight: 60,
    types: ['electric']
  }

  const candidates: PokemonRecommendationCandidate[] = [
    {
      id: 26,
      name: 'raichu',
      image: 'raichu.png',
      detailPath: '/pokemon/26',
      height: 8,
      weight: 300,
      types: ['electric']
    },
    {
      id: 100,
      name: 'voltorb',
      image: 'voltorb.png',
      detailPath: '/pokemon/100',
      height: 5,
      weight: 104,
      types: ['electric']
    },
    {
      id: 1,
      name: 'bulbasaur',
      image: 'bulbasaur.png',
      detailPath: '/pokemon/1',
      height: 7,
      weight: 69,
      types: ['grass', 'poison']
    },
    {
      id: 172,
      name: 'pichu',
      image: 'pichu.png',
      detailPath: '/pokemon/172',
      height: 3,
      weight: 20,
      types: ['electric']
    }
  ]

  it('prefers shared types and then closest stats', () => {
    const ranked = rankSimilarPokemon(source, candidates, 3)

    expect(ranked.map((pokemon) => pokemon.id)).toEqual([172, 100, 26])
  })

  it('excludes the source pokemon and applies limit', () => {
    const ranked = rankSimilarPokemon(
      source,
      [
        ...candidates,
        {
          id: 25,
          name: 'pikachu',
          image: 'pikachu.png',
          detailPath: '/pokemon/25',
          height: 4,
          weight: 60,
          types: ['electric']
        }
      ],
      2
    )

    expect(ranked).toHaveLength(2)
    expect(ranked.some((pokemon) => pokemon.id === 25)).toBe(false)
  })

  it('keeps deterministic order when scores tie', () => {
    const tiedCandidates: PokemonRecommendationCandidate[] = [
      {
        id: 12,
        name: 'butterfree',
        image: 'butterfree.png',
        detailPath: '/pokemon/12',
        height: 11,
        weight: 320,
        types: ['bug', 'flying']
      },
      {
        id: 13,
        name: 'weedle',
        image: 'weedle.png',
        detailPath: '/pokemon/13',
        height: 11,
        weight: 320,
        types: ['bug', 'flying']
      }
    ]

    const ranked = rankSimilarPokemon(
      {
        id: 10,
        height: 10,
        weight: 300,
        types: ['bug']
      },
      tiedCandidates,
      2
    )

    expect(ranked.map((pokemon) => pokemon.id)).toEqual([12, 13])
  })
})
