import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const extendedTheme = {
  colors: {},
  borderRadius: {},
  fontSize: {},
}

function formatColors() {
  const colors = []
  for (const [key, color] of Object.entries(extendedTheme.colors)) {
    if (typeof color === 'string') {
      colors.push(key)
    } else {
      const colorGroup = Object.keys(color as object).map((subKey) =>
        subKey === 'DEFAULT' ? '' : subKey,
      )
      colors.push({ [key]: colorGroup })
    }
  }
  return colors
}

const customTwMerge = extendTailwindMerge<string, string>({
  extend: {
    theme: {
      colors: formatColors(),
      borderRadius: Object.keys(extendedTheme.borderRadius),
    },
    classGroups: {
      'font-size': [
        {
          text: Object.keys(extendedTheme.fontSize),
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
