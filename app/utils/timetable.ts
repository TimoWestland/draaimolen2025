// Utility helpers for timetable loading, normalization and favorites
// LocalStorage keys
export const TIMETABLE_CACHE_KEY = 'festival:timetable'
export const FAVORITES_KEY = 'festival:favorites'

import fridayJson from '#app/data/friday.json'
import saturdayJson from '#app/data/saturday.json'

export enum Stages {
  STROBE = 'STROBE',
  MOON = 'MOON',
  AURA = 'AURA',
  'FOREST RAVE' = 'FOREST RAVE',
  PIT = 'PIT',
  TUNNEL = 'TUNNEL',
}

interface TimeSlotRaw {
  TIME: string
  [stage: string]: string
}

export interface Timeslot {
  id: string
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

export const DAY_START_MINUTE = parseTime('12:00')
export const DAY_END_MINUTE = parseTime('24:45')

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

export function generateTimeLabels(): string[] {
  const times: string[] = []
  for (let m = DAY_START_MINUTE; m <= DAY_END_MINUTE; m += 15) {
    times.push(formatTime(m))
  }
  return times
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeRows(rows: TimeSlotRaw[]): DaySchedule {
  const stages = Object.keys(Stages)
  const slots: Timeslot[] = []
  const current: Record<string, { artist: string; start: number }> = {}

  for (const row of rows) {
    const timeStr: string = row.TIME
    if (!timeStr) continue
    const minute = parseTime(timeStr)
    for (const stage of stages) {
      const artist = row[stage]
      if (artist && artist.toUpperCase() !== 'END') {
        // New artist begins, close previous if present
        const prev = current[stage]
        if (prev && prev.artist !== artist) {
          slots.push(createSlot(stage, prev.artist, prev.start, minute))
        }
        if (!prev || prev.artist !== artist) {
          current[stage] = { artist: artist.trim(), start: minute }
        }
      } else if (artist && artist.toUpperCase() === 'END') {
        // Stage ends
        const prev = current[stage]
        if (prev) {
          slots.push(createSlot(stage, prev.artist, prev.start, minute))
        }
        delete current[stage]
      }
    }
  }

  // Close any running artists at day end
  for (const stage of Object.keys(current)) {
    const prev = current[stage]
    slots.push(createSlot(stage, prev.artist, prev.start, DAY_END_MINUTE))
  }

  return { stages, slots }
}

function createSlot(
  stage: string,
  artist: string,
  start: number,
  end: number,
): Timeslot {
  const startStr = formatTime(start)
  const endStr = formatTime(end)
  return {
    id: slugify(`${stage}-${artist}-${startStr}`),
    stage,
    artist,
    start: startStr,
    end: endStr,
    startMinutes: start,
    endMinutes: end,
    durationMinutes: end - start,
  }
}

export function loadTimetable(): Timetable {
  const cached = loadTimetableCache()
  if (cached) return cached

  const timetable = {
    friday: normalizeRows(fridayJson),
    saturday: normalizeRows(saturdayJson),
  }

  saveTimetableCache(timetable)

  return timetable
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

export function findSlotById(
  timetable: Timetable,
  id: string,
): Timeslot | undefined {
  return timetable.friday.slots
    .concat(timetable.saturday.slots)
    .find((s) => s.id === id)
}
