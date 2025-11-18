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
  id: number | null;
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-full md:w-[540px] bg-white border-l-2 border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
          <h2 className="text-2xl font-bold flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Detalle de observación
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                     text-slate-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 
                     hover:text-white transition-all duration-300 border-2 border-slate-200 hover:border-transparent"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-sm text-slate-500 font-medium">Cargando detalle...</div>
            </div>
          )}

          {error && <div className="mb-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 font-medium text-sm">{error}</div>}

          {!loading && item && (
            <div className="space-y-5">
              {!edit ? (
                <>
                  {/* Imagen */}
                  {item.photo_url ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
                      <img src={item.photo_url} alt="Observación" className="w-full object-cover max-h-72" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-52 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 grid place-items-center">
                      <div className="text-center">
                        <div className="text-4xl text-slate-300 mb-2">📷</div>
                        <div className="text-sm text-slate-400 font-medium">Sin foto disponible</div>
                      </div>
                    </div>
                  )}

                  {/* Datos principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Fecha</div>
                      <div className="font-bold text-slate-900">{item.date}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Lugar</div>
                      <div className="font-bold text-slate-900 truncate">{item.place_text || "—"}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Latitud</div>
                      <div className="font-bold text-slate-900 font-mono text-sm">{item.latitude}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border-2 border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Longitud</div>
                      <div className="font-bold text-slate-900 font-mono text-sm">{item.longitude}</div>
                    </div>
                  </div>

                  {/* Predicción */}
                  {item.inference && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Predicción:</span>
                        <span className="text-sm font-bold text-slate-900 flex-1">{item.inference.predicted_label}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Confianza:</span>
                          <span className="text-sm font-bold text-slate-900">{confPct!.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-indigo-200">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${confPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Foto */}
                  <label className="block">
                    <span className="block text-sm font-semibold text-slate-700 mb-2">Foto (opcional)</span>
                    <input
                      type="file"
                      accept="image/*,.tif,.tiff"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl 
                               file:border-2 file:border-slate-200 file:text-sm file:font-semibold
                               file:bg-white file:text-slate-700 hover:file:bg-slate-50 file:cursor-pointer"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Fecha</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none 
                                 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Lugar</span>
                      <input
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none 
                                 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Latitud</span>
                      <input
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none 
                                 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-mono"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-slate-700">Longitud</span>
                      <input
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 outline-none 
                                 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-mono"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        {!loading && item && (
          <div className="p-5 border-t-2 border-slate-200 bg-white flex gap-3 justify-between">
            <div className="flex gap-2">
              {!edit ? (
                <button
                  className="px-6 py-2.5 rounded-xl text-white font-semibold
                           bg-gradient-to-r from-blue-500 to-indigo-500
                           hover:from-blue-600 hover:to-indigo-600
                           shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => setEdit(true)}
                >
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-white font-semibold
                             bg-gradient-to-r from-blue-500 to-indigo-500
                             hover:from-blue-600 hover:to-indigo-600
                             disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={handleSave}
                  >
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl border-2 border-slate-200 font-semibold text-slate-700
                             hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                    onClick={() => setEdit(false)}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold
                       hover:bg-red-50 hover:border-red-300 transition-all duration-300"
              onClick={handleDelete}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
