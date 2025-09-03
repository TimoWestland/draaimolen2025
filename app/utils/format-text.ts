const upperExceptions = [
  'DJ',
  'CCL',
  'LSDXOXO',
  'FM',
  'UFO',
  'ADAB',
  '33EMYBW',
  'SSG',
  'SHERELLE',
  'OKO',
  'XIAOLIN',
  'PLO',
  'CARISTA',
  'JASSS',
  'ORBE',
  'I-SHA',
  'SCRATCHCLART',
  'L.B.',
  'II',
  'INVT',
  'HVL',
]

const lowerExceptions = [
  'B2B',
  'SMOTHER',
  'UPSAMMY',
  'X',
  'U.R.TRAX',
  'GYROFIELD',
  'OPHÉLIE',
  'OMA',
  'TOTEM',
  'DIRTYDMS',
]

export function formatText(str: string) {
  return str
    .split(/\s+/) // split on spaces
    .map((word) => {
      const upper = word.toUpperCase()
      if (upperExceptions.includes(upper)) {
        return upper
      }
      if (lowerExceptions.includes(upper)) {
        return word.toLocaleLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
