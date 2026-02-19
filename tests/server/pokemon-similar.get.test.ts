import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('nitropack/runtime/internal/cache', () => ({
  defineCachedEventHandler: (handler: unknown) => handler
}))

let handlePokemonSimilar: typeof import('~~/server/api/pokemon/[id]/similar.get').handlePokemonSimilar

beforeAll(async () => {
  ;({ handlePokemonSimilar } = await import('~~/server/api/pokemon/[id]/similar.get'))
})

describe('GET /api/pokemon/:id/similar', () => {
  it('returns ranked recommendations with shared types first', async () => {
    const getSource = vi.fn().mockResolvedValue({
      id: 25,
      height: 4,
      weight: 60,
      types: ['electric']
    })
    const getPool = vi.fn().mockResolvedValue([
      {
        id: 172,
        name: 'pichu',
        image: 'pichu.png',
        detailPath: '/pokemon/172',
        height: 3,
        weight: 20,
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
      }
    ])

    const payload = await handlePokemonSimilar(
      'Pikachu',
      {
        limit: '1',
        poolLimit: '60'
      },
      { getSource, getPool }
    )

    expect(getSource).toHaveBeenCalledWith('pikachu')
    expect(getPool).toHaveBeenCalledWith(60)
    expect(payload.results.map((pokemon) => pokemon.id)).toEqual([172])
  })

  it('rejects invalid query values', async () => {
    const getSource = vi.fn()
    const getPool = vi.fn()

    await expect(
      handlePokemonSimilar(
        '25',
        {
          limit: '0'
        },
        { getSource, getPool }
      )
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('skips failed candidates and still returns available results', async () => {
    const getSource = vi.fn().mockResolvedValue({
      id: 25,
      height: 4,
      weight: 60,
      types: ['electric']
    })
    const getPool = vi.fn().mockResolvedValue([
      {
        id: 25,
        name: 'pikachu',
        image: 'pikachu.png',
        detailPath: '/pokemon/25',
        height: 4,
        weight: 60,
        types: ['electric']
      },
      {
        id: 26,
        name: 'raichu',
        image: 'raichu.png',
        detailPath: '/pokemon/26',
        height: 8,
        weight: 300,
        types: ['electric']
      }
    ])

    const payload = await handlePokemonSimilar('25', {}, { getSource, getPool })

    expect(payload.results).toHaveLength(1)
    expect(payload.results[0].id).toBe(26)
  })
})
