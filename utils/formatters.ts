export function capitalize(value: string): string {
  if (!value) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatLabel(value: string): string {
  return capitalize(value.replace(/-/g, ' '))
}

export function formatAbilities(abilities: string[]): string {
  return abilities.map(formatLabel).join(', ')
}

export function formatHeight(decimeters: number): string {
  return `${(decimeters / 10).toFixed(1)} m`
}

export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}
