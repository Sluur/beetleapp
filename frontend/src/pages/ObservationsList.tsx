import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import MapAllObservations, { type ObsPoint } from "../components/MapAllObservations";
import ObservationCard from "../components/ObservationCard";
import useDebounce from "../hooks/useDebounce";

type Observation = {
  id: number;
  date: string;
  place_text?: string;
  latitude: number | string;
  longitude: number | string;
  photo_url?: string;
  photo?: string;
};

export default function ObservationsPage() {
  const [items, setItems] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const debouncedQuery = useDebounce(query, 400);

  const [activeId, setActiveId] = useState<number | null>(null);

  async function load(params: Record<string, string> = {}) {
    try {
      setLoading(true);
      const { data } = await api.get("/observations/", { params });
      const rows = Array.isArray(data) ? data : data.results ?? [];
      setItems(rows);
    } catch {
      setError("No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ search: debouncedQuery, ordering });
  }, [debouncedQuery, ordering]);

  const points: ObsPoint[] = useMemo(
    () =>
      items.map((o) => ({
        id: o.id,
        date: o.date,
        place_text: o.place_text,
        latitude: typeof o.latitude === "string" ? parseFloat(o.latitude) : o.latitude,
        longitude: typeof o.longitude === "string" ? parseFloat(o.longitude) : o.longitude,
        photo_url: (o as any).photo_url || (o as any).photo || undefined,
      })),
    [items]
  );

  // Altura total: ajustá 64px a la altura real de tu navbar
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-neutral-50">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* MAPA IZQUIERDA */}
        <div className="h-full p-4">
          <div className="h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <MapAllObservations points={points} activeId={activeId ?? undefined} onSelect={(id) => setActiveId(id)} />
          </div>
        </div>

        {/* LISTA DERECHA (único scroll) */}
        <div className="h-full bg-white border-l border-neutral-200">
          {/* Toolbar sticky */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/70 border-b border-neutral-200">
            <div className="px-5 py-3 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-blue-500 flex-1">Observaciones</h1>

              {/* Buscador con ícono */}
              <div className="relative w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387-1.414 1.414-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por lugar…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-sm outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 placeholder:text-neutral-400"
                />
              </div>

              {/* Orden */}
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-300 text-sm outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
                title="Ordenar"
              >
                <option value="-created_at">Más recientes</option>
                <option value="created_at">Más antiguas</option>
                <option value="-date">Fecha ↓</option>
                <option value="date">Fecha ↑</option>
              </select>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="h-[calc(100%-49px)] overflow-y-auto px-4 py-4">
            {loading && <div className="text-sm text-neutral-500 p-4">Cargando…</div>}
            {error && <div className="text-red-600 p-4">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="p-10 text-center text-neutral-500 rounded-xl border border-dashed">
                Sin resultados{" "}
                {debouncedQuery ? (
                  <>
                    para “<b>{debouncedQuery}</b>”
                  </>
                ) : (
                  ""
                )}
                .
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              {items.map((o) => {
                const lat = typeof o.latitude === "string" ? parseFloat(o.latitude) : o.latitude;
                const lon = typeof o.longitude === "string" ? parseFloat(o.longitude) : o.longitude;
                const photo = (o as any).photo_url || (o as any).photo;

                return (
                  <ObservationCard
                    key={o.id}
                    id={o.id}
                    date={o.date}
                    place_text={o.place_text}
                    latitude={lat}
                    longitude={lon}
                    photo_url={photo}
                    active={activeId === o.id}
                    onHover={(id) => setActiveId(id)}
                    onClick={(id) => setActiveId(id)}
                  />
                );
              })}
            </div>
            {/* fondo de respiro al final */}
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
