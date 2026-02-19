<script setup lang="ts">
import type { PokemonListItem } from '~~/types/pokemon'

const props = withDefaults(
  defineProps<{
    items: PokemonListItem[]
    loading?: boolean
    skeletonCount?: number
  }>(),
  {
    loading: false,
    skeletonCount: 12
  }
)

const emit = defineEmits<{
  prefetch: [pokemonId: number]
}>()
</script>

<template>
  <section class="pokemon-grid" aria-live="polite">
    <template v-if="props.loading">
      <PokemonCardSkeleton
        v-for="index in props.skeletonCount"
        :key="`pokemon-skeleton-${index}`"
      />
    </template>

    <template v-else>
      <PokemonCard
        v-for="pokemon in props.items"
        :key="pokemon.id"
        :pokemon="pokemon"
        @prefetch="emit('prefetch', $event)"
      />
    </template>
  </section>
</template>
