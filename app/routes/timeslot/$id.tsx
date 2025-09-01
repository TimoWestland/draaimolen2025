import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import {
  fetchTimetable,
  loadTimetableCache,
  saveTimetableCache,
  findSlotById,
  isFavorite,
  toggleFavorite,
  Timeslot,
} from "../../lib/timetable";

// Detail page for a single timeslot
export default function TimeslotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<Timeslot | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load slot from cache or fetch if missing
  useEffect(() => {
    async function load() {
      if (!id) return;
      const cached = loadTimetableCache();
      let s = cached ? findSlotById(cached, id) : undefined;
      if (!s) {
        try {
          const fresh = await fetchTimetable();
          saveTimetableCache(fresh);
          s = findSlotById(fresh, id);
        } catch {
          setError("Failed to load timeslot");
        }
      }
      if (s) {
        setSlot(s);
        setFavorite(isFavorite(s.id));
      } else {
        setError("Timeslot not found");
      }
    }
    load();
  }, [id]);

  const toggle = () => {
    if (!id) return;
    const fav = toggleFavorite(id);
    setFavorite(fav);
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!slot) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Favorite">
          <Star
            className={favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-500"}
          />
        </Button>
      </div>
      <h1 className="text-xl font-bold">{slot.artist}</h1>
      <div className="text-sm text-gray-600">{slot.stage}</div>
      <div className="text-sm">
        {slot.start} — {slot.end}
      </div>
    </div>
  );
}

