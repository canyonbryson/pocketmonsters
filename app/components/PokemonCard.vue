<script setup lang="ts">
import type { PokemonListItem } from '~~/types/pokemon'
import { formatLabel } from '~~/utils/formatters'

const props = defineProps<{
  pokemon: PokemonListItem
}>()

const emit = defineEmits<{
  prefetch: [pokemonId: number]
}>()

function emitPrefetch() {
  emit('prefetch', props.pokemon.id)
}
</script>

<template>
  <NuxtLink
    :to="props.pokemon.detailPath"
    class="pokemon-card"
    @mouseenter="emitPrefetch"
    @focus="emitPrefetch"
  >
    <div class="pokemon-card__image-wrap">
      <img
        :src="props.pokemon.image"
        :alt="`${formatLabel(props.pokemon.name)} artwork`"
        class="pokemon-card__image"
        loading="lazy"
        width="180"
        height="180"
      >
    </div>
    <div class="pokemon-card__meta">
      <p class="pokemon-card__id">#{{ props.pokemon.id }}</p>
      <h3 class="pokemon-card__name">{{ formatLabel(props.pokemon.name) }}</h3>
    </div>
  </NuxtLink>
</template>
