import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // shadcn button
import {
  DAY_START_MINUTE,
  generateTimeLabels,
  fetchTimetable,
  loadTimetableCache,
  saveTimetableCache,
  getFavoriteIds,
  Timetable,
} from "../lib/timetable";

// Timetable page for a single day with day tabs
export default function TimetablePage() {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [day, setDay] = useState<"friday" | "saturday">("friday");
  const [favorites, setFavorites] = useState<string[]>(getFavoriteIds());
  const [error, setError] = useState<string | null>(null);

  // Load from cache first, then update from server
  useEffect(() => {
    const cached = loadTimetableCache();
    if (cached) setTimetable(cached);
    fetchTimetable()
      .then((data) => {
        setTimetable(data);
        saveTimetableCache(data);
      })
      .catch(() => {
        if (!cached) setError("Failed to load timetable");
      });
  }, []);

  // Listen for favorite changes
  useEffect(() => {
    const handler = () => setFavorites(getFavoriteIds());
    window.addEventListener("favoritesUpdated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("favoritesUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!timetable) return <div className="p-4">Loading...</div>;

  const dayData = timetable[day];
  const times = generateTimeLabels();
  const stageIndex = useMemo(
    () => Object.fromEntries(dayData.stages.map((s, i) => [s, i])),
    [dayData.stages]
  );

  return (
    <div className="p-4 space-y-4">
      {/* Day tabs */}
      <div className="flex gap-2">
        <Button
          variant={day === "friday" ? "default" : "outline"}
          onClick={() => setDay("friday")}
        >
          Friday
        </Button>
        <Button
          variant={day === "saturday" ? "default" : "outline"}
          onClick={() => setDay("saturday")}
        >
          Saturday
        </Button>
      </div>

      {/* Timetable grid */}
      <div className="overflow-x-auto">
        <div
          className="grid text-xs"
          style={{
            gridTemplateColumns: `4rem repeat(${dayData.stages.length}, minmax(8rem,1fr))`,
            gridTemplateRows: `2rem repeat(${times.length - 1}, 3rem)`,
          }}
        >
          {/* Stage headers */}
          <div style={{ gridColumn: "1 / 2", gridRow: "1 / 2" }} />
          {dayData.stages.map((stage, i) => (
            <div
              key={stage}
              className="text-center font-medium border-l"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {stage}
            </div>
          ))}

          {/* Time labels */}
          {times.slice(0, -1).map((t, i) => (
            <div
              key={t}
              className="border-t pr-1 text-right"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {t}
            </div>
          ))}

          {/* Timeslot cells */}
          {dayData.slots.map((slot) => {
            const col = stageIndex[slot.stage] + 2; // +1 for time column
            const rowStart =
              (slot.startMinutes - DAY_START_MINUTE) / 15 + 2; // +1 header row
            const span = slot.durationMinutes / 15;
            const fav = favorites.includes(slot.id);
            return (
              <div
                key={slot.id}
                onClick={() => navigate(`/timeslot/${slot.id}`)}
                className={`border p-1 overflow-hidden cursor-pointer ${
                  fav ? "bg-yellow-200" : "bg-gray-100"
                }`}
                style={{
                  gridColumn: col,
                  gridRow: `${rowStart} / span ${span}`,
                }}
              >
                {slot.artist}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

