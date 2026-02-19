import { describe, expect, it } from 'vitest'
import { capitalize, formatAbilities, formatHeight, formatLabel, formatWeight } from '~~/utils/formatters'

describe('formatters', () => {
  it('capitalizes labels and replaces dashes', () => {
    expect(capitalize('pikachu')).toBe('Pikachu')
    expect(formatLabel('mr-mime')).toBe('Mr mime')
  })

  it('formats abilities and physical stats', () => {
    expect(formatAbilities(['static', 'lightning-rod'])).toBe('Static, Lightning rod')
    expect(formatHeight(7)).toBe('0.7 m')
    expect(formatWeight(69)).toBe('6.9 kg')
  })
})
