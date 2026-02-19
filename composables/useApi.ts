import type { FetchOptions } from 'ofetch'

const DEFAULT_TTL_MS = 60_000
const REQUEST_TIMEOUT_MS = 8000

export interface ApiCacheEntry<T = unknown> {
  data: T
  expiresAt: number
}

export type ApiCacheMap = Record<string, ApiCacheEntry>

export interface ApiRequestOptions {
  ttlMs?: number
  force?: boolean
  fetchOptions?: FetchOptions
}

export class ApiRequestError extends Error {
  statusCode: number
  path: string
  data?: unknown

  constructor(message: string, statusCode: number, path: string, data?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.path = path
    this.data = data
  }
}

interface ApiClientDeps {
  cache: ApiCacheMap
  fetcher: <T>(path: string, options?: FetchOptions) => Promise<T>
  now?: () => number
  inFlight?: Map<string, Promise<unknown>>
}

const sharedInFlight = new Map<string, Promise<unknown>>()

function normalizeError(error: unknown, path: string): ApiRequestError {
  const errorRecord = (typeof error === 'object' && error !== null ? error : {}) as Record<string, unknown>

  const statusCode =
    (typeof errorRecord.statusCode === 'number' && errorRecord.statusCode) ||
    (typeof errorRecord.status === 'number' && errorRecord.status) ||
    500

  const message =
    (typeof errorRecord.statusMessage === 'string' && errorRecord.statusMessage) ||
    (typeof errorRecord.message === 'string' && errorRecord.message) ||
    'Request failed'

  return new ApiRequestError(message, statusCode, path, errorRecord.data)
}

export function createApiClient({
  cache,
  fetcher,
  now = Date.now,
  inFlight = sharedInFlight
}: ApiClientDeps) {
  async function query<T>(key: string, pathBuilder: () => string, options: ApiRequestOptions = {}) {
    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
    const requestPath = pathBuilder()
    const currentTime = now()
    const cached = cache[key]

    if (!options.force && cached && cached.expiresAt > currentTime) {
      return cached.data as T
    }

    const pending = inFlight.get(key)

    if (!options.force && pending) {
      return pending as Promise<T>
    }

    const request = fetcher<T>(requestPath, {
      retry: 1,
      timeout: REQUEST_TIMEOUT_MS,
      ...options.fetchOptions
    })
      .then((payload) => {
        cache[key] = {
          data: payload,
          expiresAt: currentTime + ttlMs
        }

        return payload
      })
      .catch((error) => {
        throw normalizeError(error, requestPath)
      })
      .finally(() => {
        inFlight.delete(key)
      })

    inFlight.set(key, request)

    return request
  }

  async function prefetch<T>(key: string, pathBuilder: () => string, options: ApiRequestOptions = {}) {
    try {
      return await query<T>(key, pathBuilder, options)
    }
    catch {
      return undefined
    }
  }

  function invalidate(keyPrefix?: string) {
    if (!keyPrefix) {
      Object.keys(cache).forEach((key) => {
        delete cache[key]
      })
      return
    }

    Object.keys(cache).forEach((key) => {
      if (key.startsWith(keyPrefix)) {
        delete cache[key]
      }
    })
  }

  function getPath(pathBuilder: () => string) {
    return pathBuilder()
  }

  return {
    query,
    prefetch,
    invalidate,
    getPath
  }
}

export function useApi() {
  const cacheState = useState<ApiCacheMap>('api-cache', () => ({}))

  return createApiClient({
    cache: cacheState.value,
    fetcher: $fetch
  })
}
