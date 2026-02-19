import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

interface NamedEntity {
  name: string
}

export function usePokemonSearch<T extends NamedEntity>(listRef: Ref<T[]>, debounceMs = 250) {
  const query = ref('')
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  watch(
    query,
    (value) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        debouncedQuery.value = value.trim().toLowerCase()
      }, debounceMs)
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  const filtered = computed(() => {
    const pokemonList = listRef.value ?? []

    if (!debouncedQuery.value) {
      return pokemonList
    }

    return pokemonList.filter((pokemon) => pokemon.name.toLowerCase().includes(debouncedQuery.value))
  })

  return {
    query,
    filtered
  }
}
