/**
 * Capitalizes text following Brazilian naming conventions.
 * - First letter of each word is uppercase
 * - Prepositions and articles are lowercase (da, de, do, das, dos, e, etc.)
 * - Handles accented characters correctly
 */
const LOWERCASE_WORDS = new Set([
  'da',
  'de',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'a',
  'o',
  'as',
  'os',
  'para',
  'por',
  'com',
  'sem',
  'sob',
])

export function capitalizeNameBR(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }

      // Keep prepositions lowercase
      if (LOWERCASE_WORDS.has(word)) {
        return word
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Formats text on blur by capitalizing names properly.
 * Use this as an onBlur handler for name fields.
 */
export function formatNameOnBlur(
  e: React.FocusEvent<HTMLInputElement>,
  onChange: (value: string) => void
) {
  const formatted = capitalizeNameBR(e.target.value)
  if (formatted !== e.target.value) {
    onChange(formatted)
  }
}

/**
 * Mask for birth date DD/MM/YYYY
 */
export function maskBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Parse birth date from DD/MM/YYYY to ISO format YYYY-MM-DD
 */
export function parseBirthDateToISO(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 8) return null

  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)

  return `${year}-${month}-${day}`
}

/**
 * Format ISO date YYYY-MM-DD to DD/MM/YYYY
 */
export function formatISOToBirthDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''

  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}
