import { useEffect, useMemo, useRef, useLayoutEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import MapAllObservations, { type ObsPoint } from "../components/MapAllObservations";
import ObservationCard from "../components/ObservationCard";
import useDebounce from "../hooks/useDebounce";
import ObservationDetailDrawer from "../components/ObservationDetailDrawer";

type InferenceMini = { predicted_label: string; confidence: number } | null;

type Observation = {
  id: number;
  date: string;
  place_text?: string;
  latitude: number | string;
  longitude: number | string;
  photo_url?: string | null;
  photo?: string;
  inference?: InferenceMini;
};

export default function ObservationsPage() {
  const [items, setItems] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const debouncedQuery = useDebounce(query, 400);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarH, setToolbarH] = useState(0);

  const handleSelectOnMap = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  useLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const setH = () => setToolbarH(el.getBoundingClientRect().height);
    setH();
    const ro = new ResizeObserver(setH);
    ro.observe(el);
    window.addEventListener("resize", setH);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setH);
    };
  }, []);

  function openDetail(id: number) {
    setDetailId(id);
    setDetailOpen(true);
  }

  async function load(params: Record<string, string> = {}) {
    setLoading(true);
    try {
      const { data } = await api.get("/observations/", { params });
      const rows: Observation[] = Array.isArray(data) ? data : data.results ?? [];
      setItems(rows);
      setError("");
    } catch {
      setError("No se pudo cargar la lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    const params: Record<string, string> = {};
    if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
    if (ordering) params.ordering = ordering;

    api
      .get("/observations/", { params, signal: ctrl.signal })
      .then(({ data }) => {
        const rows: Observation[] = Array.isArray(data) ? data : data.results ?? [];
        setItems(rows);
        setError("");
      })
      .catch((err) => {
        if (err.name !== "CanceledError") setError("No se pudo cargar la lista.");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [debouncedQuery, ordering]);

  const points: ObsPoint[] = useMemo(
    () =>
      items
        .map(
          (o) =>
            ({
              id: o.id,
              date: o.date,
              place_text: o.place_text,
              latitude: typeof o.latitude === "string" ? parseFloat(o.latitude) : o.latitude,
              longitude: typeof o.longitude === "string" ? parseFloat(o.longitude) : o.longitude,
              photo_url: (o as any).photo_url || (o as any).photo || undefined,
            } as ObsPoint)
        )
        .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [items]
  );

  const currentParams: Record<string, string> = {};
  if (debouncedQuery.trim()) currentParams.search = debouncedQuery.trim();
  if (ordering) currentParams.ordering = ordering;

  const showGrouped = ordering === "predicted_label" || ordering === "-predicted_label";
  const groups = useMemo(() => {
    if (!showGrouped) return [];
    const map = new Map<string, Observation[]>();
    for (const o of items) {
      const label = o.inference?.predicted_label ?? "Sin clasificar";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(o);
    }
    return Array.from(map.entries()).map(([label, list]) => ({ label, count: list.length, list }));
  }, [items, showGrouped]);

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0">
        {/* MAPA IZQUIERDA */}
        <div className="h-full p-4 min-h-0">
          <div className="h-full rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl bg-white">
            <MapAllObservations points={points} activeId={activeId ?? undefined} onSelect={handleSelectOnMap} />
          </div>
        </div>

        {/* LISTA DERECHA */}
        <div className="h-full bg-white/80 backdrop-blur-sm border-l-2 border-slate-200 flex flex-col min-h-0">
          {/* Toolbar sticky */}
          <div ref={toolbarRef} className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b-2 border-slate-200">
            <div className="px-6 py-4 flex items-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex-1">
                Observaciones
              </h1>

              {/* Buscador */}
              <div className="relative w-64">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm outline-none 
                           focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                           placeholder:text-slate-400 bg-white"
                />
              </div>

              {/* Orden */}
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm outline-none 
                         focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white font-medium text-slate-700"
                title="Ordenar"
              >
                <option value="-created_at">Más recientes</option>
                <option value="created_at">Más antiguas</option>
                <option value="predicted_label">Tipo (A→Z)</option>
                <option value="-predicted_label">Tipo (Z→A)</option>
                <option value="-date">Fecha ↓</option>
                <option value="date">Fecha ↑</option>
              </select>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0" style={{ ["--toolbar-h" as any]: `${toolbarH}px` }}>
            {loading && (
              <div className="flex items-center justify-center p-12">
                <div className="text-sm text-slate-500 font-medium">Cargando observaciones...</div>
              </div>
            )}

            {error && <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 font-medium">{error}</div>}

            {!loading && !error && items.length === 0 && (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50">
                <div className="text-slate-400 text-4xl mb-3">🔍</div>
                <div className="text-slate-600 font-medium">
                  Sin resultados
                  {debouncedQuery && <span className="text-slate-900"> para "{debouncedQuery}"</span>}
                </div>
              </div>
            )}

            {/* Render: agrupado por tipo o lista plana */}
            {showGrouped ? (
              <div className="space-y-10">
                {groups.map((g, i) => (
                  <section key={g.label}>
                    {i > 0 && <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />}

                    {/* header de grupo */}
                    <div
                      className="z-10 bg-white/95 backdrop-blur-md px-3 py-3 -mx-3 rounded-xl border-2 border-slate-200 shadow-sm"
                      style={{ top: `${toolbarH + 8}px` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">{g.label}</span>
                        <span className="px-3 py-1 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold">
                          {g.count}
                        </span>
                      </div>
                    </div>

                    {/* grid de cards */}
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {g.list.map((o) => {
                        const lat = typeof o.latitude === "string" ? parseFloat(o.latitude) : o.latitude;
                        const lon = typeof o.longitude === "string" ? parseFloat(o.longitude) : o.longitude;
                        const photo = (o as any).photo_url || (o as any).photo;

                        return (
                          <ObservationCard
                            key={o.id}
                            id={o.id}
                            date={o.date}
                            place_text={o.place_text}
                            latitude={lat as number}
                            longitude={lon as number}
                            photo_url={photo}
                            inference={o.inference ?? null}
                            active={activeId === o.id}
                            onHover={(id) => setActiveId(id)}
                            onClick={(id) => {
                              setActiveId(id);
                              openDetail(id);
                            }}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
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
                      latitude={lat as number}
                      longitude={lon as number}
                      photo_url={photo}
                      inference={o.inference ?? null}
                      active={activeId === o.id}
                      onHover={(id) => setActiveId(id)}
                      onClick={(id) => {
                        setActiveId(id);
                        openDetail(id);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* Drawer */}
      <ObservationDetailDrawer
        id={detailId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => load(currentParams)}
        onDeleted={() => load(currentParams)}
      />
    </div>
  );
}
