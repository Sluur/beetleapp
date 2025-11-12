type InferenceMini = {
  predicted_label: string;
  confidence: number;
} | null;

export default function ObservationCard({
  id,
  date,
  place_text,
  latitude,
  longitude,
  photo_url,
  inference,
  active,
  onHover,
  onClick,
}: {
  id: number;
  date: string;
  place_text?: string;
  latitude: number;
  longitude: number;
  photo_url?: string | null;
  inference?: InferenceMini;
  active?: boolean;
  onHover?: (id: number | null) => void;
  onClick?: (id: number) => void;
}) {
  const latText = Number.isFinite(latitude) ? latitude.toFixed(6) : String(latitude);
  const lonText = Number.isFinite(longitude) ? longitude.toFixed(6) : String(longitude);
  const confPct = inference ? (inference.confidence <= 1 ? inference.confidence * 100 : inference.confidence) : null;

  return (
    <div
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(id)}
      className={[
        "group rounded-2xl border bg-white overflow-hidden cursor-pointer",
        "transition shadow-sm hover:shadow-md",
        active ? "border-blue-500 ring-2 ring-blue-200" : "border-neutral-200",
      ].join(" ")}
    >
      {photo_url ? (
        <img
          src={photo_url}
          alt={place_text || "observación"}
          className="w-full h-40 object-cover transition group-hover:brightness-95"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-40 bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">Sin imagen</div>
      )}

      <div className="p-3">
        <div className="text-[11px] text-neutral-500">{new Date(date).toLocaleDateString()}</div>
        <div className="font-semibold text-neutral-900 truncate">{place_text || "Sin lugar"}</div>
        <div className="text-xs text-neutral-500">
          ({latText}, {lonText})
        </div>

        {inference && (
          <div className="mt-2 text-xs bg-blue-50 border border-blue-100 rounded-lg p-2">
            <p>
              <span className="font-medium text-blue-700">Predicción:</span> {inference.predicted_label}
            </p>
            <p>
              <span className="font-medium text-blue-700">Confianza:</span> {confPct!.toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
