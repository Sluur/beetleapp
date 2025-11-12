import { useEffect, useState } from "react";
import { getObservation, updateObservation, deleteObservation } from "../lib/observations";
import { X } from "lucide-react";

type InferenceMini = { predicted_label: string; confidence: number; created_at?: string } | null;

type Observation = {
  id: number;
  date: string;
  place_text?: string;
  latitude: number | string;
  longitude: number | string;
  photo_url?: string | null;
  inference?: InferenceMini;
};

export default function ObservationDetailDrawer({
  id,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: {
  id: number | null; // acepta null para evitar TS2322
  open: boolean;
  onClose: () => void;
  onUpdated?: (o: Observation) => void;
  onDeleted?: (id: number) => void;
}) {
  const [item, setItem] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // campos para editar
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getObservation(id);
        setItem(data);
        setDate(data.date ?? "");
        setPlace(data.place_text ?? "");
        setLat(String(typeof data.latitude === "string" ? data.latitude : Number(data.latitude).toFixed(6)));
        setLon(String(typeof data.longitude === "string" ? data.longitude : Number(data.longitude).toFixed(6)));
        setError("");
      } catch {
        setError("No se pudo cargar el detalle.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, id]);

  function parseMaybeNumber(v: string): number | undefined {
    if (!v || !v.trim()) return undefined;
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }

  async function handleSave() {
    if (!item) return;
    try {
      setSaving(true);

      // Mandamos un objeto (UpdateObsInput). La lib arma FormData si viene photo.
      const payload: Record<string, any> = {};
      if (date) payload.date = date;
      payload.place_text = place || "";
      const nlat = parseMaybeNumber(lat);
      const nlon = parseMaybeNumber(lon);
      if (nlat !== undefined) payload.latitude = nlat;
      if (nlon !== undefined) payload.longitude = nlon;
      if (photo) payload.photo = photo;

      const updated = await updateObservation(item.id, payload);
      setItem(updated);
      setEdit(false);
      onUpdated?.(updated);
      setError("");
    } catch (e: any) {
      const msg = e?.response?.data && (typeof e.response.data === "string" ? e.response.data : JSON.stringify(e.response.data));
      setError(msg || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm("¿Eliminar esta observación? Esta acción no se puede deshacer.")) return;
    try {
      await deleteObservation(item.id);
      onDeleted?.(item.id);
      onClose();
    } catch {
      setError("No se pudo eliminar.");
    }
  }

  if (!open) return null;

  const confPct = item?.inference ? (item.inference.confidence <= 1 ? item.inference.confidence * 100 : item.inference.confidence) : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-full md:w-[520px] bg-white border-l border-neutral-200 shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <h2 className="text-2xl font-bold flex-1 text-blue-500">Detalle de observación</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full
             text-gray-600 hover:bg-blue-500 hover:text-white transition"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading && <div className="text-sm text-neutral-500">Cargando…</div>}
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          {!loading && item && (
            <>
              {!edit ? (
                <>
                  {item.photo_url ? (
                    <img src={item.photo_url} alt="" className="w-full rounded-xl mb-4 object-cover max-h-64" loading="lazy" />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-neutral-100 mb-4 grid place-items-center text-neutral-400">Sin foto</div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-m">
                    <div>
                      <div className="text-neutral-500">Fecha</div>
                      <div className="font-medium">{item.date}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">Lugar</div>
                      <div className="font-medium">{item.place_text || "—"}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">Latitud</div>
                      <div className="font-medium">{item.latitude}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">Longitud</div>
                      <div className="font-medium">{item.longitude}</div>
                    </div>
                  </div>

                  {item.inference && (
                    <div className="mt-6 p-3 rounded-xl bg-blue-50 text-m">
                      <div className="p-2">
                        <b>Predicción:</b> {item.inference.predicted_label}
                      </div>
                      <div className="p-2">
                        <b>Confianza:</b> {confPct!.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="block mb-3">
                    <span className="text-sm text-neutral-700">Foto (opcional)</span>
                    <input type="file" accept="image/*,.tif,.tiff" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-neutral-700">Fecha</span>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-xl border" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-neutral-700">Lugar</span>
                      <input value={place} onChange={(e) => setPlace(e.target.value)} className="px-3 py-2 rounded-xl border" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-neutral-700">Latitud</span>
                      <input value={lat} onChange={(e) => setLat(e.target.value)} className="px-3 py-2 rounded-xl border" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-neutral-700">Longitud</span>
                      <input value={lon} onChange={(e) => setLon(e.target.value)} className="px-3 py-2 rounded-xl border" />
                    </label>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* acciones */}
        {!loading && item && (
          <div className="p-4 border-t flex gap-2 justify-between">
            <div>
              {!edit ? (
                <button className="px-4 py-2 rounded-xl text-white bg-blue-500 transition hover:bg-blue-600" onClick={() => setEdit(true)}>
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-white bg-blue-500 transition hover:bg-blue-600"
                    onClick={handleSave}
                  >
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                  <button type="button" className="px-4 py-2 rounded-xl border ml-2" onClick={() => setEdit(false)}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
            <button type="button" className="px-4 py-2 rounded-xl border border-red-300 text-red-600" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
