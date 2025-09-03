import { useEffect, useState } from 'react'

import { useSearchParams } from 'react-router'

import { Star } from 'lucide-react'

import { WelcomeDialog } from '#app/components/welcome-dialog'
import { cn } from '#app/utils/cn'
import { formatText } from '#app/utils/format-text'
import {
  DAY_START_MINUTE,
  generateTimeLabels,
  getFavoriteIds,
  loadTimetable,
  type Timetable,
  toggleFavorite,
} from '#app/utils/timetable.ts'

import type { Route } from './+types/home'

type Day = 'friday' | 'saturday'

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Draaimolen' }]
}

export default function TimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [showDialog, setShowDialog] = useState(false)
  const [timetable, setTimetable] = useState<Timetable | null>(null)
  const [favorites, setFavorites] = useState<string[]>(getFavoriteIds())
  const [activeDay, setActiveDay] = useState<Day>(
    (searchParams.get('day') as Day) ?? 'friday',
  )

  useEffect(() => {
    const timetable = loadTimetable()
    setTimetable(timetable)

    const firstVisit = !localStorage.getItem('visited-before')
    if (firstVisit) {
      setShowDialog(true)
      localStorage.setItem('visited-before', 'true')
    }
  }, [])

  useEffect(() => {
    const handler = () => setFavorites(getFavoriteIds())
    window.addEventListener('favoritesUpdated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('favoritesUpdated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  if (!timetable) return <div className="p-4">Loading...</div>

  const dayData = timetable[activeDay]
  const times = generateTimeLabels()
  const stageIndex = Object.fromEntries(dayData.stages.map((s, i) => [s, i]))

  return (
    <div className="h-svh w-svw overflow-auto overscroll-none bg-background">
      <WelcomeDialog open={showDialog} onOpenChange={setShowDialog} />

      <header className="sticky top-0 right-0 left-0 z-50 flex h-12 w-full items-center justify-between bg-primary-light px-2">
        <div className="flex items-center gap-x-1.5">
          <img src="/logo.png" alt="Draaimolen 2025" className="h-10" />
          <h1 className="font-display font-medium text-foreground text-shadow-lg text-sm uppercase leading-none tracking-wider">
            Draaimolen
          </h1>
        </div>
        <div className="flex items-center gap-x-1 rounded-lg bg-muted/80 p-1 text-muted-foreground">
          <button
            className={cn(
              'rounded-md border border-transparent px-2 py-1 font-semibold text-xs transition-colors',
              activeDay === 'friday' &&
                'border-input bg-input/60 text-foreground',
            )}
            onClick={() => {
              setActiveDay('friday')
              setSearchParams((prev) => {
                prev.set('day', 'friday')
                return prev
              })
            }}
          >
            FRI
          </button>
          <button
            className={cn(
              'rounded-md border border-transparent px-2 py-1 font-semibold text-xs transition-colors',
              activeDay === 'saturday' &&
                'border-input bg-input/60 text-foreground',
            )}
            onClick={() => {
              setActiveDay('saturday')
              setSearchParams((prev) => {
                prev.set('day', 'saturday')
                return prev
              })
            }}
          >
            SAT
          </button>
        </div>
      </header>
      <main
        className="inline-grid"
        style={{
          gridTemplateColumns: `3.5rem repeat(${dayData.stages.length}, minmax(8rem,1fr))`,
          gridTemplateRows: `2.75rem repeat(${times.length - 1}, 1.9rem)`,
        }}
      >
        {/* ── Corner cell ── */}
        <div
          className="sticky top-12 left-0 z-50 flex w-full flex-col justify-center bg-secondary text-center font-display font-medium text-xs tracking-wider shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
          style={{ gridColumn: 1, gridRow: 1 }}
        >
          {activeDay.slice(0, 3).toUpperCase()}
        </div>

        {/* ── Stage headers (row 1) ── */}
        {dayData.stages.map((stage, i) => (
          <div
            key={stage}
            className={cn(
              'sticky top-12 z-10 flex flex-col justify-center border-l bg-secondary text-center font-display font-medium text-[10px] text-foreground tracking-wider shadow-md',
              i === 0 && 'border-l-transparent',
            )}
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {stage}
          </div>
        ))}

        {/* ── Spacer row ── */}
        <div
          className="border-muted border-l bg-background"
          style={{ gridColumn: '2 / -1', gridRow: 2 }}
        />

        {/* ── First-column spacer cell ── */}
        <div
          aria-hidden="true"
          className="sticky left-0 z-10 bg-accent shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
          style={{ gridColumn: 1, gridRow: 2 }}
        />

        {/* ── Time labels (start at row 3)── */}
        {times.slice(0, times.length - 2).map((t, i) => {
          const fullHour = t.endsWith(':00')
          const halfHour = t.endsWith(':30')
          return (
            <div
              key={t}
              className={cn(
                'sticky left-0 z-20 w-full bg-accent text-right text-foreground shadow-[2px_2px_4px_rgba(0,0,0,0.1)]',
                fullHour && 'border-t',
                halfHour &&
                  'before:-top-[2px] border-transparent border-t before:absolute before:right-0 before:h-px before:w-[9px] before:bg-border before:content-[""]',
              )}
              style={{ gridColumn: 1, gridRow: i + 3 }} // +1 due to spacer row
            >
              {fullHour ? (
                <div className="-top-[16px] absolute left-0 bg-accent py-2 pr-[6px] pl-2 font-semibold text-[10px]">
                  {t}
                </div>
              ) : null}
            </div>
          )
        })}

        {/* ── Timeslot cells ── */}
        {dayData.slots.map((slot) => {
          const col = stageIndex[slot.stage] + 2
          const rowStart = (slot.startMinutes - DAY_START_MINUTE) / 15 + 3
          const span = slot.durationMinutes / 15
          const fav = favorites.includes(slot.id)
          const isFirstSlotInStage =
            slot.startMinutes ===
            Math.min(
              ...dayData.slots
                .filter((s) => s.stage === slot.stage)
                .map((s) => s.startMinutes),
            )

          return (
            <button
              key={slot.id}
              onClick={() => toggleFavorite(slot.id)}
              className={cn(
                'relative cursor-pointer overflow-hidden border-b border-l p-1 font-medium text-foreground text-sm transition-colors',
                fav ? 'bg-primary/95' : 'bg-card text-card-foreground',
                isFirstSlotInStage && 'border-t',
              )}
              style={{ gridColumn: col, gridRow: `${rowStart} / span ${span}` }}
            >
              {fav ? (
                <Star
                  size={14}
                  fill="currentColor"
                  className="absolute top-1 right-1"
                />
              ) : null}
              <span className="text-pretty font-semibold">
                {formatText(slot.artist)}
              </span>
              <div className="mt-1 font-medium text-[9px] text-foreground/70">
                ({slot.start} - {slot.end})
              </div>
            </button>
          )
        })}
      </main>
    </div>
  )
}
