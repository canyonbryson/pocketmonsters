<script setup lang="ts">
import type { PokemonSimilarItem } from '~~/types/pokemon'
import { formatLabel } from '~~/utils/formatters'

const props = withDefaults(
  defineProps<{
    items?: PokemonSimilarItem[]
    loading?: boolean
  }>(),
  {
    items: () => [],
    loading: false
  }
)

const emit = defineEmits<{
  prefetch: [pokemonId: number]
}>()

function parsePokemonId(detailPath: string) {
  const match = detailPath.match(/\/pokemon\/(\d+)$/)
  return match ? Number(match[1]) : null
}

function emitPrefetchByPath(detailPath: string) {
  const pokemonId = parsePokemonId(detailPath)

  if (pokemonId) {
    emit('prefetch', pokemonId)
  }
}
</script>

<template>
  <section class="similar-section">
    <header class="similar-section__header">
      <h2 class="similar-section__title">Similar Pokémon</h2>
      <p class="similar-section__subtitle">Matched by types and nearby physical stats</p>
    </header>

    <div v-if="props.loading" class="similar-section__grid" aria-hidden="true">
      <article v-for="index in 4" :key="`similar-skeleton-${index}`" class="similar-card similar-card--skeleton">
        <div class="similar-card__image-wrap skeleton-block" />
        <div class="similar-card__line skeleton-block" />
        <div class="similar-card__line similar-card__line--short skeleton-block" />
      </article>
    </div>

    <div v-else class="similar-section__grid">
      <NuxtLink
        v-for="pokemon in props.items"
        :key="pokemon.id"
        :to="pokemon.detailPath"
        class="similar-card"
        @mouseenter="emitPrefetchByPath(pokemon.detailPath)"
        @focus="emitPrefetchByPath(pokemon.detailPath)"
      >
        <div class="similar-card__image-wrap">
          <img
            :src="pokemon.image"
            :alt="`${formatLabel(pokemon.name)} artwork`"
            class="similar-card__image"
            loading="lazy"
            width="120"
            height="120"
          >
        </div>
        <div class="similar-card__meta">
          <p class="similar-card__id">#{{ pokemon.id }}</p>
          <h3 class="similar-card__name">{{ formatLabel(pokemon.name) }}</h3>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
