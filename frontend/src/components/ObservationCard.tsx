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
        "group rounded-2xl border-2 bg-white overflow-hidden cursor-pointer",
        "transition-all duration-300 shadow-md hover:shadow-xl",
        active ? "border-blue-500 ring-4 ring-blue-100 scale-[1.02]" : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      {photo_url ? (
        <div className="relative overflow-hidden">
          <img
            src={photo_url}
            alt={place_text || "observación"}
            className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl text-slate-300 mb-2">📷</div>
            <div className="text-xs text-slate-400 font-medium">Sin imagen</div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <span>📅</span>
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="font-bold text-slate-900 text-base truncate">{place_text || "Sin lugar"}</div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
          <span>📍</span>
          <span className="truncate">
            {latText}, {lonText}
          </span>
        </div>

        {inference && (
          <div className="mt-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 p-3 space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-blue-700">Predicción:</span>
              <span className="text-xs font-semibold text-slate-900 flex-1">{inference.predicted_label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700">Confianza:</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-indigo-200">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${confPct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700">{confPct!.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
