import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('nitropack/runtime/internal/cache', () => ({
  defineCachedEventHandler: (handler: unknown) => handler
}))

let handlePokemonDetail: typeof import('~~/server/api/pokemon/[id].get').handlePokemonDetail

beforeAll(async () => {
  ;({ handlePokemonDetail } = await import('~~/server/api/pokemon/[id].get'))
})

describe('GET /api/pokemon/:id', () => {
  it('normalizes detail response with lowercased identifier', async () => {
    const fetchDetail = vi.fn().mockResolvedValue({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      types: [{ type: { name: 'electric' } }],
      abilities: [{ ability: { name: 'static' } }],
      sprites: {
        front_default: 'default.png',
        other: {
          'official-artwork': {
            front_default: 'official.png'
          }
        }
      }
    })

    const payload = await handlePokemonDetail('Pikachu', { fetchDetail })

    expect(fetchDetail).toHaveBeenCalledWith('pikachu')
    expect(payload).toMatchObject({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      sprites: {
        officialArtwork: 'official.png',
        default: 'default.png'
      }
    })
  })

  it('rejects empty identifiers', async () => {
    const fetchDetail = vi.fn()

    await expect(handlePokemonDetail('   ', { fetchDetail })).rejects.toMatchObject({
      statusCode: 400
    })
  })
})
