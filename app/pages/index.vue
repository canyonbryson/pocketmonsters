<script setup lang="ts">
import type { PokemonDetail, PokemonListResponse } from '~~/types/pokemon'
import { useApi } from '~~/composables/useApi'
import { usePokemonSearch } from '~~/composables/usePokemonSearch'
import { apiKeys, apiPaths } from '~~/utils/apiPaths'

const api = useApi()
const listParams = {
  limit: 60,
  offset: 0
}

const listCacheKey = apiKeys.pokemons(listParams)

const {
  data: listData,
  pending,
  error,
  refresh
} = await useAsyncData(listCacheKey, () =>
  api.query<PokemonListResponse>(listCacheKey, () => apiPaths.pokemons(listParams), {
    ttlMs: 30 * 60 * 1000
  })
)

const pokemons = computed(() => listData.value?.results ?? [])
const { query, filtered } = usePokemonSearch(pokemons)

const resultLabel = computed(() => {
  if (!query.value.trim()) {
    return `${filtered.value.length} Pokemon loaded`
  }

  return `${filtered.value.length} results for "${query.value}"`
})

function prefetchPokemon(pokemonId: number) {
  const key = apiKeys.pokemon(pokemonId)

  return api.prefetch<PokemonDetail>(key, () => apiPaths.pokemon(pokemonId), {
    ttlMs: 12 * 60 * 60 * 1000
  })
}

useHead({
  title: 'PocketMonsters | Home',
  meta: [
    {
      name: 'description',
      content: 'Browse Pokemon with fast search, prefetching, and detailed profile pages.'
    }
  ]
})
</script>

<template>
  <div class="page page--home">
    <section class="hero-panel">
      <p class="hero-panel__eyebrow">Pokédex Explorer</p>
      <h1 class="hero-panel__title">Browse Pokémon instantly.</h1>
      <p class="hero-panel__subtitle">
        Search the first 60 Pokémon, view profiles, and see similar Pokémon.
      </p>

      <PokemonSearchInput v-model="query" />

      <p class="result-meta">{{ resultLabel }}</p>
    </section>

    <section v-if="error" class="status-panel status-panel--error" role="alert">
      <h2>Unable to load Pokémon</h2>
      <p>Try again in a moment. The API may be temporarily unavailable.</p>
      <button type="button" class="button" @click="refresh()">Retry</button>
    </section>

    <section v-else-if="!pending && filtered.length === 0" class="status-panel" role="status">
      <h2>No results</h2>
      <p>Adjust your search and try again.</p>
    </section>


    <PokemonGrid
      :items="filtered"
      :loading="pending && pokemons.length === 0"
      :skeleton-count="12"
      @prefetch="prefetchPokemon"
    />
  </div>
</template>
