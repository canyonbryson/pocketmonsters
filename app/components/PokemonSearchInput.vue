<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label class="search-input">
    <span class="search-input__label">Search Pokemon</span>
    <input
      :value="props.modelValue"
      type="search"
      class="search-input__field"
      placeholder="Try: pikachu"
      autocomplete="off"
      @input="onInput"
    >
  </label>
</template>
