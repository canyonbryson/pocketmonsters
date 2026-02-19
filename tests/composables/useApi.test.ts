import { describe, expect, it, vi } from 'vitest'
import { ApiRequestError, createApiClient, type ApiCacheMap } from '~~/composables/useApi'

describe('createApiClient', () => {
  it('returns cached data before expiration', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const cache: ApiCacheMap = {}
    let now = 1_000

    const api = createApiClient({
      cache,
      fetcher,
      now: () => now,
      inFlight: new Map()
    })

    const first = await api.query('list', () => '/api/pokemons', { ttlMs: 5_000 })
    now = 2_000
    const second = await api.query('list', () => '/api/pokemons', { ttlMs: 5_000 })

    expect(first).toEqual({ ok: true })
    expect(second).toEqual({ ok: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('dedupes in-flight requests by key', async () => {
    const fetcher = vi
      .fn<() => Promise<{ value: number }>>()
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ value: 42 }), 15)
          })
      )

    const api = createApiClient({
      cache: {},
      fetcher,
      inFlight: new Map()
    })

    const [first, second] = await Promise.all([
      api.query('detail:25', () => '/api/pokemon/25'),
      api.query('detail:25', () => '/api/pokemon/25')
    ])

    expect(first).toEqual({ value: 42 })
    expect(second).toEqual({ value: 42 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('maps failures to ApiRequestError and prefetch suppresses exceptions', async () => {
    const fetcher = vi.fn().mockRejectedValue({
      status: 404,
      statusMessage: 'Not Found',
      data: {
        message: 'Pokemon not found'
      }
    })

    const api = createApiClient({
      cache: {},
      fetcher,
      inFlight: new Map()
    })

    await expect(api.query('missing', () => '/api/pokemon/missing')).rejects.toBeInstanceOf(ApiRequestError)

    const prefetched = await api.prefetch('missing', () => '/api/pokemon/missing')
    expect(prefetched).toBeUndefined()
  })
})
