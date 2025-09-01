export function formatText(str: string) {
  const exceptions = ['DJ', 'B2B']

  return str
    .split(/\s+/) // split on spaces
    .map((word) => {
      const upper = word.toUpperCase()
      if (exceptions.includes(upper)) {
        return upper
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
