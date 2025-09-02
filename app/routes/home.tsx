import { useEffect, useState } from 'react'

import { useSearchParams } from 'react-router'

import { Star } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#app/components/ui/alert-dialog'
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

function WelcomeDialog() {
  return (
    <AlertDialog open={false}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-pretty text-left">
          <AlertDialogTitle>Welcome to Draaimolen 2025</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mb-4">
              Welcome to my custom Draaimolen timetable app. I built this app
              for fun based on the spreadsheet provided by Draaimolen to create
              a nicer timetable experience (also, Excel is for work!)
            </p>
            <ul className="mb-4 ml-4 list-disc">
              <li>
                Save this website to your phone's home screen so you can open it
                as a regular app!
              </li>
              <li>
                None of your data is stored, everything is saved locally on your
                phone
              </li>
              <li>
                The app should work offline due to bad connectivity in the
                forest
              </li>
              <li>Switch between fri/sat with the toggle in the top right</li>
              <li>Save your favorite acts by tapping on the time slot</li>
              <li>Tapping a saved slot will remove it from your favorites</li>
            </ul>
            <p className="mb-4">
              <b>Disclaimer:</b> This app is not affiliated with the Draaimolen
              festival. I built this for fun in a few spare hours. A working app
              and correct data is therefore not guaranteed.
            </p>
            <p className="mb-1">Have a splendid rave in the forest!</p>
            <i>x Timo</i>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction>Add to home screen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Timetable page for a single day with day tabs
export default function TimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [timetable, setTimetable] = useState<Timetable | null>(null)
  const [favorites, setFavorites] = useState<string[]>(getFavoriteIds())
  const [activeDay, setActiveDay] = useState<Day>(
    (searchParams.get('day') as Day) ?? 'friday',
  )

  // Load from cache first, then update from server
  useEffect(() => {
    const timetable = loadTimetable()
    setTimetable(timetable)
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

  if (!timetable) return <div className="p-4">Loading...</div>

  const dayData = timetable[activeDay]
  const times = generateTimeLabels()
  const stageIndex = Object.fromEntries(dayData.stages.map((s, i) => [s, i]))

  return (
    <div className="h-svh w-svw overflow-auto bg-background">
      <WelcomeDialog />
      <header className="sticky top-0 right-0 left-0 z-50 flex h-12 w-full items-center justify-between bg-primary-light px-2">
        <div className="flex items-center gap-x-1.5">
          <img src="/logo.png" alt="Draaimolen 2025" className="h-10" />
          <h1 className="font-display font-medium text-primary-foreground text-shadow-lg text-sm uppercase leading-none tracking-wider">
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

        {/* ── Spacer row: columns 2..end ── */}
        <div
          className="border-muted border-l bg-background"
          style={{ gridColumn: '2 / -1', gridRow: 2 }}
        />

        {/* ── First-column spacer cell (sticky so the column looks continuous) ── */}
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

        {/* ── Timeslot cells (rowStart +1 due to spacer) ── */}
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
                fav ? 'bg-primary/90' : 'bg-card text-card-foreground',
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
              <div className="mt-1.5 font-medium text-[9px] text-foreground/60">
                ({slot.start} - {slot.end})
              </div>
            </button>
          )
        })}
      </main>
    </div>
  )
}
