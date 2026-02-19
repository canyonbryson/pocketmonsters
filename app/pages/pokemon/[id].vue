<script setup lang="ts">
import type { PokemonDetail, PokemonSimilarResponse } from '~~/types/pokemon'
import { useApi } from '~~/composables/useApi'
import { apiKeys, apiPaths } from '~~/utils/apiPaths'
import { formatAbilities, formatHeight, formatLabel, formatWeight } from '~~/utils/formatters'

const api = useApi()
const route = useRoute()

const pokemonId = computed(() => String(route.params.id ?? ''))
const detailKey = computed(() => apiKeys.pokemon(pokemonId.value))
const similarParams = {
  limit: 4,
  poolLimit: 60
}
const similarKey = computed(() => apiKeys.pokemonSimilar(pokemonId.value, similarParams))

const {
  data: pokemon,
  pending,
  error,
  refresh
} = await useAsyncData(
  () => detailKey.value,
  () =>
    api.query<PokemonDetail>(detailKey.value, () => apiPaths.pokemon(pokemonId.value), {
      ttlMs: 12 * 60 * 60 * 1000
    }),
  {
    watch: [pokemonId]
  }
)

const {
  data: similarData,
  pending: similarPending,
  error: similarError
} = await useAsyncData(
  () => similarKey.value,
  () =>
    api.query<PokemonSimilarResponse>(
      similarKey.value,
      () => apiPaths.pokemonSimilar(pokemonId.value, similarParams),
      {
        ttlMs: 30 * 60 * 1000
      }
    ),
  {
    watch: [pokemonId]
  }
)

const displayName = computed(() => formatLabel(pokemon.value?.name ?? 'Unknown Pokemon'))
const artworkSrc = computed(
  () => pokemon.value?.sprites.officialArtwork ?? pokemon.value?.sprites.default ?? '/favicon.ico'
)

const formattedAbilities = computed(() => formatAbilities(pokemon.value?.abilities ?? []))
const notFound = computed(() => {
  const statusCode = (error.value as { statusCode?: number } | null)?.statusCode
  return statusCode === 404
})
const similarItems = computed(() => {
  if (similarError.value) {
    return []
  }

  return similarData.value?.results ?? []
})

async function prefetchPokemon(targetId: number) {
  const key = apiKeys.pokemon(targetId)

  await api.prefetch<PokemonDetail>(key, () => apiPaths.pokemon(targetId), {
    ttlMs: 12 * 60 * 60 * 1000
  })
}

useHead(() => ({
  title: `${displayName.value} | PocketMonsters`
}))
</script>

<template>
  <div class="page page--detail">
    <NuxtLink to="/" class="back-link">Back to list</NuxtLink>

    <PokemonDetailSkeleton v-if="pending" />

    <section v-else-if="error" class="status-panel status-panel--error" role="alert">
      <h1>{{ notFound ? 'Pokemon not found' : 'Unable to load this Pokemon' }}</h1>
      <p v-if="notFound">The requested profile does not exist. Check the URL and try again.</p>
      <p v-else>We could not fetch this profile from the API. Please retry.</p>
      <button type="button" class="button" @click="refresh()">Retry</button>
    </section>

    <article v-else-if="pokemon" class="pokemon-detail">
      <div class="pokemon-detail__artwork-wrap">
        <img
          :src="artworkSrc"
          :alt="`${displayName} official artwork`"
          class="pokemon-detail__artwork"
          width="360"
          height="360"
        >
      </div>

      <div class="pokemon-detail__content">
        <p class="pokemon-detail__id">#{{ pokemon.id }}</p>
        <h1 class="pokemon-detail__name">{{ displayName }}</h1>

        <dl class="pokemon-detail__stats">
          <div class="pokemon-detail__stat">
            <dt>Height</dt>
            <dd>{{ formatHeight(pokemon.height) }}</dd>
          </div>
          <div class="pokemon-detail__stat">
            <dt>Weight</dt>
            <dd>{{ formatWeight(pokemon.weight) }}</dd>
          </div>
        </dl>

        <p class="pokemon-detail__abilities">
          <strong>Abilities:</strong>
          {{ formattedAbilities }}
        </p>
      </div>
    </article>

    <SimilarPokemonSection
      v-if="pokemon && (similarPending || similarItems.length > 0)"
      :items="similarItems"
      :loading="similarPending && similarItems.length === 0"
      @prefetch="prefetchPokemon"
    />
  </div>
</template>
