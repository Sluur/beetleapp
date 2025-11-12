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

  // medir altura real de la toolbar para el offset de los headers sticky
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
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-neutral-50">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0">
        {/* MAPA IZQUIERDA */}
        <div className="h-full p-4 min-h-0">
          <div className="h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-white">
            <MapAllObservations points={points} activeId={activeId ?? undefined} onSelect={handleSelectOnMap} />
          </div>
        </div>

        {/* LISTA DERECHA */}
        <div className="h-full bg-white border-l border-neutral-200 flex flex-col min-h-0">
          {/* Toolbar sticky */}
          <div
            ref={toolbarRef}
            className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/70 border-b border-neutral-200"
          >
            <div className="px-5 py-3 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-blue-500 flex-1">Observaciones</h1>

              {/* Buscador */}
              <div className="relative w-64">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
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
                <option value="predicted_label">Tipo (A→Z)</option>
                <option value="-predicted_label">Tipo (Z→A)</option>
                <option value="-date">Fecha ↓</option>
                <option value="date">Fecha ↑</option>
              </select>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ ["--toolbar-h" as any]: `${toolbarH}px` }}>
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

            {/* Render: agrupado por tipo o lista plana */}
            {showGrouped ? (
              <div className="space-y-8">
                {groups.map((g, i) => (
                  <section key={g.label}>
                    {/* separador superior suave */}
                    <div className={i === 0 ? "hidden" : "block"}>
                      <hr className="border-neutral-200" />
                    </div>

                    {/* header de grupo */}
                    <div
                      className=" z-10 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/70
                                 px-2 py-2 -mx-2 border-b border-neutral-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-700">{g.label}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600">{g.count}</span>
                      </div>
                    </div>

                    {/* grid de cards */}
                    <div className="mt-3 grid gap-4 xl:grid-cols-2">
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

            <div className="h-6" />
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
