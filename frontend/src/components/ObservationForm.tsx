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
      : "h-fit overflow-y-auto bg-white/80 backdrop-blur-sm md:border-l-2 md:border-slate-200 p-6 space-y-6 rounded-3xl shadow-2xl";

  const canSave = !!date && lat != null && lon != null && !!preview && !pvLoading && !saving;

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

  const previewPct = preview ? (preview.confidence <= 1 ? preview.confidence * 100 : preview.confidence) : null;

  return (
    <form onSubmit={onSubmit} className={wrapperCls}>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Nueva observación
        </h1>
        <p className="text-base text-slate-600">Seleccioná un punto en el mapa y completá los datos</p>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>
          <input
            type="date"
            className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none 
                       focus:ring-4 focus:ring-blue-100 focus:border-blue-500
                       transition-all duration-300 font-medium"
            value={date}
            onChange={(e) => onChangeDate(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Lugar (opcional)</span>
          <input
            className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none 
                       focus:ring-4 focus:ring-blue-100 focus:border-blue-500
                       transition-all duration-300 font-medium"
            value={place}
            onChange={(e) => onChangePlace(e.target.value)}
            placeholder="Ej: Parque Nacional"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Latitud</span>
          <input
            className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none 
                       focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500
                       transition-all duration-300 font-mono font-medium"
            value={lat ?? ""}
            onChange={(e) => onChangeLat(e.target.value ? +Number(e.target.value).toFixed(6) : null)}
            inputMode="decimal"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Longitud</span>
          <input
            className="px-4 py-3 rounded-xl border-2 border-slate-200 outline-none 
                       focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500
                       transition-all duration-300 font-mono font-medium"
            value={lon ?? ""}
            onChange={(e) => onChangeLon(e.target.value ? +Number(e.target.value).toFixed(6) : null)}
            inputMode="decimal"
            required
          />
        </label>


        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Foto</span>

          <div
            className={[
              "relative rounded-2xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
              dragActive ? "border-blue-500 bg-blue-50 shadow-lg" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
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

            <div className="flex flex-col items-center justify-center gap-4 text-slate-600">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04a7.49 7.49 0 00-14-2A5.994 5.994 0 006 20h13a4.5 4.5 0 00.35-9.96zM14 13h-2v3h-2l3-4 3 4h-2v-3z" />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  <span className="text-blue-600">Arrastrá y soltá</span> la imagen aquí, o{" "}
                  <span className="text-blue-600 underline">hacé click para elegir</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">Formatos: TIF, TIFF, JPEG, PNG</p>
              </div>
            </div>

            {pickedName && (
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border-2 border-blue-200">
                <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-blue-700">{pickedName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 shadow-lg p-5 bg-linear-to-br from-white to-slate-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            Predicción del modelo
          </h3>
          {pvLoading && (
            <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold animate-pulse">Analizando…</span>
          )}
        </div>

        {!preview && !pvLoading && (
          <div className="p-6 text-center rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
            <div className="text-slate-400 text-3xl mb-2">📸</div>
            <p className="text-sm text-slate-600">
              Elegí una <strong className="text-slate-900">Foto</strong> para ver la predicción aquí
            </p>
            <p className="text-xs text-slate-500 mt-1 italic">(Necesaria para habilitar el botón Guardar)</p>
          </div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Etiqueta</div>
                <div className="text-base font-bold text-slate-900">{preview.label}</div>
              </div>
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Confianza</div>
                <div className="text-base font-bold text-slate-900">{previewPct!.toFixed(1)}%</div>
              </div>
              <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Modelo</div>
                <div className="text-base font-bold text-slate-900">{preview.version ?? "—"}</div>
              </div>
            </div>


            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Nivel de confianza</span>
                <span className="font-bold text-slate-900">{previewPct!.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-300">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${previewPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>


      <div className="sticky bottom-0 pt-5 border-t-2 border-slate-200 bg-white/95 backdrop-blur-sm">
        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-medium">{error}</div>}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {!canSave && <span className="text-xs text-slate-600 font-medium">⚠️ Completá fecha, lat/lon, foto y esperá la predicción</span>}
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-linear-to-r from-blue-500 to-indigo-500 text-white 
                     px-8 py-3 font-bold hover:from-blue-600 hover:to-indigo-600 
                     focus:outline-none focus:ring-4 focus:ring-blue-300
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-indigo-500
                     shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!canSave}
          >
            {saving ? "Guardando..." : "Guardar observación"}
          </button>
        </div>
      </div>
    </form>
  );
}
