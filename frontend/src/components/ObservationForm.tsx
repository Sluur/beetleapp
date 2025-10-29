import type { FormEvent } from "react";

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

  /** NUEVO: “default” (card blanca) | “bare” (se funde con el panel) */
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
  variant = "default",
}: Props) {
  const wrapperCls =
    variant === "bare"
      ? "h-full overflow-y-auto"
      : "h-fit overflow-y-auto bg-white md:border-l md:border-neutral-200 p-6 space-y-5 rounded-2xl shadow-2xl";

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
          />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">Foto</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onChangePhoto(e.target.files?.[0] ?? null)}
            className="block text-sm text-neutral-700 file:mr-3 file:px-3 file:py-2 
                       file:rounded-lg file:border file:border-neutral-300 
                       file:bg-white file:text-neutral-700 hover:file:bg-neutral-50"
          />
        </label>
      </div>

      {/* barra de acciones sticky al final */}
      <div className="sticky bottom-0 mt-6 pt-4 bg-linear-to-t from-white/90 to-transparent">
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end">
          <button
            className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium
                       hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Guardar
          </button>
        </div>
      </div>
    </form>
  );
}
