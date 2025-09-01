// Utility helpers for timetable loading, normalization and favorites
// LocalStorage keys
export const TIMETABLE_CACHE_KEY = 'festival:timetable'
export const FAVORITES_KEY = 'festival:favorites'

export interface Timeslot {
  id: string
  day: string // "friday" | "saturday"
  stage: string
  artist: string
  start: string // HH:mm
  end: string // HH:mm
  startMinutes: number
  endMinutes: number
  durationMinutes: number
}

export interface DaySchedule {
  stages: string[]
  slots: Timeslot[]
}

export interface Timetable {
  friday: DaySchedule
  saturday: DaySchedule
}

// Times range from 12:00 to 00:45 in 15 minute steps
export const DAY_START_MINUTE = parseTime('12:00')
export const DAY_END_MINUTE = parseTime('24:45')

// --- Time helpers -------------------------------------------------------

// Parse "HH:mm" into minutes since 00:00, treating values <12 as next day
export function parseTime(str: string): number {
  const [hStr, mStr] = str.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  // After midnight is represented as 0:xx, 1:xx etc. Add 24h so ordering works.
  if (h < 12) h += 24
  return h * 60 + m
}

export function formatTime(min: number): string {
  // Wrap around after 24h so 24:15 -> 00:15
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Generate time labels for rows
export function generateTimeLabels(): string[] {
  const times: string[] = []
  for (let m = DAY_START_MINUTE; m <= DAY_END_MINUTE; m += 15) {
    times.push(formatTime(m))
  }
  return times
}

// Slugify for stable ids
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// --- Normalization ------------------------------------------------------

// Convert raw JSON rows for a day into normalized Timeslot entries.
// Empty stage entries extend the previous artist by 15 minutes.
function normalizeDay(
  // biome-ignore lint/suspicious/noExplicitAny: todo
  rows: any[],
  dayKey: string,
  dayName: string,
): DaySchedule {
  const stages = Object.keys(rows[0] || {}).filter(
    (k) => k !== dayKey && k !== 'time',
  )
  const slots: Timeslot[] = []
  const current: Record<string, { artist: string; start: number }> = {}

  for (const row of rows) {
    const timeStr: string = row[dayKey] || row.time // handle different formats
    if (!timeStr) continue
    const minute = parseTime(timeStr)
    for (const stage of stages) {
      const artist = row[stage]
      if (artist && artist.toUpperCase() !== 'END') {
        // New artist begins, close previous if present
        const prev = current[stage]
        if (prev && prev.artist !== artist) {
          slots.push(
            createSlot(dayName, stage, prev.artist, prev.start, minute),
          )
        }
        if (!prev || prev.artist !== artist) {
          current[stage] = { artist: artist.trim(), start: minute }
        }
      } else if (artist && artist.toUpperCase() === 'END') {
        // Stage ends
        const prev = current[stage]
        if (prev) {
          slots.push(
            createSlot(dayName, stage, prev.artist, prev.start, minute),
          )
        }
        delete current[stage]
      }
      // empty string => continue previous artist
    }
  }

  // Close any running artists at day end
  for (const stage of Object.keys(current)) {
    const prev = current[stage]
    slots.push(
      createSlot(dayName, stage, prev.artist, prev.start, DAY_END_MINUTE),
    )
  }

  return { stages, slots }
}

function createSlot(
  day: string,
  stage: string,
  artist: string,
  start: number,
  end: number,
): Timeslot {
  const startStr = formatTime(start)
  const endStr = formatTime(end)
  return {
    id: slugify(`${day}-${stage}-${artist}-${startStr}`),
    day,
    stage,
    artist,
    start: startStr,
    end: endStr,
    startMinutes: start,
    endMinutes: end,
    durationMinutes: end - start,
  }
}

// TODO: add separate json files for friday and saturday and rewrite all this crap :)

// Normalize full timetable structure
// biome-ignore lint/suspicious/noExplicitAny: todo
export function normalizeTimetable(raw: any): Timetable {
  // Expected format: { friday: [...], saturday: [...] }
  // Fallback: raw array containing Friday data only
  const fridayRows = Array.isArray(raw) ? raw : raw.friday || []
  const saturdayRows = Array.isArray(raw) ? raw : raw.saturday || []

  return {
    friday: normalizeDay(fridayRows, 'FRIDAY', 'friday'),
    saturday: normalizeDay(saturdayRows, 'SATURDAY', 'saturday'),
  }
}

// --- Fetch & cache ------------------------------------------------------

export async function fetchTimetable(): Promise<Timetable> {
  const res = await fetch('/api/timetable', { cache: 'no-cache' })
  if (!res.ok) throw new Error('Failed to fetch timetable')
  const json = await res.json()
  return normalizeTimetable(json)
}

export function loadTimetableCache(): Timetable | null {
  try {
    const str = localStorage.getItem(TIMETABLE_CACHE_KEY)
    return str ? (JSON.parse(str) as Timetable) : null
  } catch {
    return null
  }
}

export function saveTimetableCache(data: Timetable) {
  localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify(data))
}

// --- Favorites ----------------------------------------------------------

export function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().includes(id)
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavoriteIds()
  const idx = favs.indexOf(id)
  if (idx >= 0) favs.splice(idx, 1)
  else favs.push(id)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
  // Notify listeners within the same tab
  window.dispatchEvent(new Event('favoritesUpdated'))
  return idx === -1
}

// --- Lookup -------------------------------------------------------------

export function findSlotById(
  timetable: Timetable,
  id: string,
): Timeslot | undefined {
  return timetable.friday.slots
    .concat(timetable.saturday.slots)
    .find((s) => s.id === id)
}
