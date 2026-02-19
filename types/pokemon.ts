export interface ApiErrorPayload {
  error: string
  message: string
  statusCode?: number
}

export interface PokemonListItem {
  id: number
  name: string
  image: string
  detailPath: string
}

export interface PokemonListResponse {
  count: number
  limit: number
  offset: number
  results: PokemonListItem[]
}

export interface PokemonSprites {
  officialArtwork: string | null
  default: string | null
}

export interface PokemonDetail {
  id: number
  name: string
  height: number
  weight: number
  types: string[]
  abilities: string[]
  sprites: PokemonSprites
}

export interface PokemonSimilarItem {
  id: number
  name: string
  image: string
  detailPath: string
}

export interface PokemonSimilarResponse {
  sourceId: number
  limit: number
  results: PokemonSimilarItem[]
}
