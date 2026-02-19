import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { usePokemonSearch } from '~~/composables/usePokemonSearch'

describe('usePokemonSearch', () => {
  it('filters by debounced query and keeps case-insensitive matching', async () => {
    vi.useFakeTimers()

    const scope = effectScope()
    const state = scope.run(() => {
      const listRef = ref([
        { name: 'pikachu' },
        { name: 'charizard' },
        { name: 'Charmander' }
      ])

      return {
        listRef,
        ...usePokemonSearch(listRef, 250)
      }
    })

    if (!state) {
      throw new Error('Failed to initialize composable scope')
    }

    expect(state.filtered.value).toHaveLength(3)

    state.query.value = 'CHAR'
    await nextTick()
    vi.advanceTimersByTime(249)
    expect(state.filtered.value).toHaveLength(3)

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(state.filtered.value.map((pokemon) => pokemon.name)).toEqual(['charizard', 'Charmander'])

    scope.stop()
    vi.useRealTimers()
  })

  it('reacts when the source list changes', async () => {
    vi.useFakeTimers()

    const scope = effectScope()
    const state = scope.run(() => {
      const listRef = ref([{ name: 'bulbasaur' }])

      return {
        listRef,
        ...usePokemonSearch(listRef, 250)
      }
    })

    if (!state) {
      throw new Error('Failed to initialize composable scope')
    }

    state.query.value = 'saur'
    await nextTick()
    vi.advanceTimersByTime(250)
    await nextTick()

    expect(state.filtered.value).toEqual([{ name: 'bulbasaur' }])

    state.listRef.value = [{ name: 'ivysaur' }, { name: 'squirtle' }]
    await nextTick()
    expect(state.filtered.value).toEqual([{ name: 'ivysaur' }])

    scope.stop()
    vi.useRealTimers()
  })
})
