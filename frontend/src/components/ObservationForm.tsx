import type { FormEvent } from "react";
import { useRef, useState } from "react";

type Preview = { label: string; confidence: number; version?: string };

type Props = {
  date: string;
  place: string;
  lat: number | null;
  lon: number | null;
  error: string;
  onChangeDate: (v: string) => void;
  onChangePlace: (v: string) => void;
  onChangeLat: (v: number | null) => void;
  onChangeLon: (v: number | null) => void;
  onChangePhoto: (f: File | null) => void;
  onSubmit: (e: FormEvent) => void;
  preview: Preview | null;
  pvLoading: boolean;
  saving?: boolean;
  variant?: "default" | "bare";
};

export default function ObservationForm({
  date,
  place,
  lat,
  lon,
  error,
  onChangeDate,
  onChangePlace,
  onChangeLat,
  onChangeLon,
  onChangePhoto,
  onSubmit,
  preview,
  pvLoading,
  saving = false,
  variant = "default",
}: Props) {
  const wrapperCls =
    variant === "bare"
      ? "h-full overflow-y-auto"
      : "h-fit overflow-y-auto bg-white md:border-l md:border-neutral-200 p-6 space-y-5 rounded-2xl shadow-2xl";

  // habilitar guardar solo si hay datos mínimos + preview lista
  const canSave = !!date && lat != null && lon != null && !!preview && !pvLoading && !saving;

  // ---- Drag & Drop state/logic ----
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pickedName, setPickedName] = useState<string>("");

  function pickFile(f: File | null) {
    if (!f) {
      setPickedName("");
      onChangePhoto(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setPickedName("");
      onChangePhoto(null);
      return;
    }
    setPickedName(f.name);
    onChangePhoto(f);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    pickFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    pickFile(f);
  }

  // normalizamos % por si la API devuelve 0..1
  const previewPct = preview ? (preview.confidence <= 1 ? preview.confidence * 100 : preview.confidence) : null;

  return (
    <form onSubmit={onSubmit} className={wrapperCls}>
      <div className="top-0 z-10 px-2 bg-transparent">
        <h1 className="text-4xl font-bold tracking-tight text-blue-500">Nueva observación</h1>
        <p className="text-lg text-neutral-500">Seleccioná un punto en el mapa y completá los datos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Fecha</span>
          <input
            type="date"
            className="px-3 py-2 rounded-xl border border-neutral-300 outline-none 
                       focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Lugar (opcional)</span>
          <input
            className="px-3 py-2 rounded-xl border border-neutral-300 outline-none 
                       focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
            value={place}
            onChange={(e) => onChangePlace(e.target.value)}
            placeholder="Ej: Parque"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Latitud</span>
          <input
            className="px-3 py-2 rounded-xl border border-neutral-300 outline-none 
                       focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
            value={lat ?? ""}
            onChange={(e) => onChangeLat(e.target.value ? +Number(e.target.value).toFixed(6) : null)}
            inputMode="decimal"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Longitud</span>
          <input
            className="px-3 py-2 rounded-xl border border-neutral-300 outline-none 
                       focus:ring-4 focus:ring-blue-200 focus:border-blue-400"
            value={lon ?? ""}
            onChange={(e) => onChangeLon(e.target.value ? +Number(e.target.value).toFixed(6) : null)}
            inputMode="decimal"
            required
          />
        </label>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">Foto</span>

          <div
            className={[
              "relative rounded-2xl border-2 border-dashed p-6 transition-colors cursor-pointer",
              dragActive ? "border-blue-400 bg-blue-50/40" : "border-neutral-300 hover:border-neutral-400",
            ].join(" ")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input ref={inputRef} type="file" accept="image/*,.tif,.tiff" onChange={onFileChange} className="sr-only" />

            <div className="flex items-center justify-center gap-3 text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04a7.49 7.49 0 00-14-2A5.994 5.994 0 006 20h13a4.5 4.5 0 00.35-9.96zM14 13h-2v3h-2l3-4 3 4h-2v-3z" />
              </svg>
              <div className="text-sm">
                <b>Arrastrá y soltá</b> la imagen aquí, o <span className="underline">hacé click para elegir</span>.
                <div className="text-xs text-neutral-500 mt-1">Formatos aceptados: TIF/TIFF/JPEG/PNG</div>
              </div>
            </div>

            {pickedName && (
              <div className="mt-3 text-sm text-neutral-700 text-center">
                Seleccionado: <span className="font-medium">{pickedName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-2xl border border-neutral-200 shadow-sm p-4 bg-linear-to-br from-white to-neutral-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">Predicción del modelo</h3>
          {pvLoading && <span className="text-sm text-neutral-500">Analizando…</span>}
        </div>

        {!preview && !pvLoading && (
          <p className="text-sm text-neutral-500 mt-2">
            Elegí una <strong>Foto</strong> para ver la predicción acá. <span className="italic">(Necesaria para habilitar Guardar)</span>
          </p>
        )}

        {preview && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs text-neutral-500">Etiqueta</div>
              <div className="text-base font-medium">{preview.label}</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs text-neutral-500">Confianza</div>
              <div className="text-base font-medium">{previewPct!.toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs text-neutral-500">Modelo</div>
              <div className="text-base font-medium">{preview.version ?? "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-6 pt-4 bg-linear-to-t from-white/90 to-transparent">
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          {!canSave && <span className="text-sm text-neutral-500">Completá fecha, lat/lon, foto y esperá la predicción.</span>}
          <button
            type="submit"
            className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium
                       hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300
                       disabled:opacity-50 disabled:hover:bg-blue-600"
            disabled={!canSave}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
