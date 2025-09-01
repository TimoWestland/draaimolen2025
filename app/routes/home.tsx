import { useEffect, useState } from 'react'

import { Star } from 'lucide-react'

import { cn } from '#app/utils/cn'
import { formatText } from '#app/utils/format-text'
import {
  DAY_START_MINUTE,
  fetchTimetable,
  generateTimeLabels,
  getFavoriteIds,
  loadTimetableCache,
  saveTimetableCache,
  type Timetable,
  toggleFavorite,
} from '#app/utils/timetable.ts'

import type { Route } from './+types/home'

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Timetable | Draaimolen 2025' }]
}

// Timetable page for a single day with day tabs
export default function TimetablePage() {
  const [timetable, setTimetable] = useState<Timetable | null>(null)
  const [activeDay, setActiveDay] = useState<'friday' | 'saturday'>('friday')
  const [favorites, setFavorites] = useState<string[]>(getFavoriteIds())
  const [error, setError] = useState<string | null>(null)

  // Load from cache first, then update from server
  useEffect(() => {
    const cached = loadTimetableCache()
    if (cached) setTimetable(cached)

    fetchTimetable()
      .then((data) => {
        setTimetable(data)
        saveTimetableCache(data)
      })
      .catch(() => {
        if (!cached) setError('Failed to load timetable')
      })
  }, [])

  // Listen for favorite changes
  useEffect(() => {
    const handler = () => setFavorites(getFavoriteIds())
    window.addEventListener('favoritesUpdated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('favoritesUpdated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!timetable) return <div className="p-4">Loading...</div>

  const dayData = timetable[activeDay]
  const times = generateTimeLabels()
  const stageIndex = Object.fromEntries(dayData.stages.map((s, i) => [s, i]))

  return (
    <div className="h-screen w-screen overflow-auto">
      <header className="sticky top-0 right-0 left-0 flex w-full items-center justify-between bg-[#888080] px-2">
        <div className="flex items-center gap-x-1">
          <img src="/logo.png" alt="Draaimolen 2025" className="h-12" />
          <h1 className="font-semibold text-foreground">Draaimolen</h1>
        </div>
        <div className="flex items-center gap-x-1 rounded-lg bg-muted/70 p-[3px] text-muted-foreground">
          <button
            className={cn(
              'rounded-md border border-transparent px-2 py-1 font-medium text-sm transition-colors',
              activeDay === 'friday' &&
                'border-input bg-input/50 text-foreground',
            )}
            onClick={() => setActiveDay('friday')}
          >
            Friday
          </button>
          <button
            className={cn(
              'rounded-md border border-transparent p-1 font-medium text-sm transition-colors',
              activeDay === 'saturday' &&
                'border-input bg-input/50 text-foreground',
            )}
            onClick={() => setActiveDay('saturday')}
          >
            Saturday
          </button>
        </div>
      </header>
      <main
        className="inline-grid"
        style={{
          gridTemplateColumns: `4rem repeat(${dayData.stages.length}, minmax(8rem,1fr))`,
          // Row 1: headers, Row 2: spacer, then timetable rows
          gridTemplateRows: `3rem repeat(${times.length - 1}, 1.75rem)`,
        }}
      >
        {/* ── Corner cell ── */}
        <div
          className="sticky top-0 left-0 z-40 flex w-full flex-col justify-center bg-secondary text-center font-bold text-sm shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
          style={{ gridColumn: 1, gridRow: 1 }}
        >
          {activeDay.slice(0, 3).toUpperCase()}
        </div>

        {/* ── Stage headers (row 1) ── */}
        {dayData.stages.map((stage, i) => (
          <div
            key={stage}
            className="sticky top-0 z-10 flex flex-col justify-center border-border border-r bg-secondary text-center font-medium text-foreground text-sm shadow-md"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {formatText(stage)}
          </div>
        ))}

        {/* ── Spacer row: columns 2..end ── */}
        <div
          className="border-muted border-l bg-muted/60"
          style={{ gridColumn: `2 / -1`, gridRow: 2 }}
        />

        {/* ── First-column spacer cell (sticky so the column looks continuous) ── */}
        <div
          aria-hidden="true"
          className="sticky left-0 z-20 bg-accent shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
          style={{ gridColumn: 1, gridRow: 2 }}
        />

        {/* ── Time labels (start at row 3)── */}
        {times.slice(0, -1).map((t, i) => {
          const fullHour = t.endsWith(':00')
          const halfHour = t.endsWith(':30')
          return (
            <div
              key={t}
              className={cn(
                'sticky left-0 z-20 w-full bg-accent text-right text-foreground text-xs shadow-[2px_0_4px_rgba(0,0,0,0.1)]',
                fullHour && 'border-border border-t',
                halfHour &&
                  'before:-top-[2px] border-transparent border-t before:absolute before:right-0 before:h-px before:w-[10px] before:bg-border before:content-[""]',
              )}
              style={{ gridColumn: 1, gridRow: i + 3 }} // +1 due to spacer row
            >
              {fullHour ? (
                <div className="-top-[13px] absolute left-0 bg-accent px-2 py-1">
                  {t}
                </div>
              ) : null}
            </div>
          )
        })}

        {/* ── Timeslot cells (rowStart +1 due to spacer) ── */}
        {dayData.slots.map((slot) => {
          const col = stageIndex[slot.stage] + 2
          const rowStart = (slot.startMinutes - DAY_START_MINUTE) / 15 + 3
          const span = slot.durationMinutes / 15
          const fav = favorites.includes(slot.id)
          return (
            <button
              key={slot.id}
              onClick={() => toggleFavorite(slot.id)}
              className={cn(
                'relative cursor-pointer overflow-hidden border-border border-b border-l p-1 font-medium text-foreground text-sm transition-colors',
                fav ? 'bg-primary/90' : 'bg-background/90',
              )}
              style={{ gridColumn: col, gridRow: `${rowStart} / span ${span}` }}
            >
              {fav ? (
                <Star
                  className="absolute top-2 right-2"
                  fill="currentColor"
                  size={16}
                />
              ) : null}
              {formatText(slot.artist)}
            </button>
          )
        })}
      </main>
    </div>
  )
}
