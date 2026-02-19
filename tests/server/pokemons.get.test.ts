import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('nitropack/runtime/internal/cache', () => ({
  defineCachedEventHandler: (handler: unknown) => handler
}))

let handlePokemonsQuery: typeof import('~~/server/api/pokemons.get').handlePokemonsQuery

beforeAll(async () => {
  ;({ handlePokemonsQuery } = await import('~~/server/api/pokemons.get'))
})

describe('GET /api/pokemons', () => {
  it('normalizes list responses and forwards query values', async () => {
    const fetchList = vi.fn().mockResolvedValue({
      count: 1302,
      results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }]
    })

    const payload = await handlePokemonsQuery(
      {
        limit: '60',
        offset: '0'
      },
      { fetchList }
    )

    expect(fetchList).toHaveBeenCalledWith(60, 0)
    expect(payload.results[0]).toMatchObject({
      id: 1,
      name: 'bulbasaur',
      detailPath: '/pokemon/1'
    })
  })

  it('clamps limit to max and validates bad input', async () => {
    const fetchList = vi.fn().mockResolvedValue({
      count: 1302,
      results: []
    })

    await handlePokemonsQuery({ limit: '999', offset: '0' }, { fetchList })
    expect(fetchList).toHaveBeenCalledWith(200, 0)

    await expect(
      handlePokemonsQuery(
        {
          limit: '-1',
          offset: '0'
        },
        { fetchList }
      )
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
