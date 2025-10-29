export default function ObservationCard({
  id,
  date,
  place_text,
  latitude,
  longitude,
  photo_url,
  active,
  onHover,
  onClick,
}: {
  id: number;
  date: string;
  place_text?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  active?: boolean;
  onHover?: (id: number | null) => void;
  onClick?: (id: number) => void;
}) {
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
      {photo_url && <img src={photo_url} alt="" className="w-full h-40 object-cover transition group-hover:brightness-95" />}
      <div className="p-3">
        <div className="text-[11px] text-neutral-500">{new Date(date).toLocaleDateString()}</div>
        <div className="font-semibold text-neutral-900 truncate">{place_text || "Sin lugar"}</div>
        <div className="text-xs text-neutral-500">
          ({latitude.toFixed(6)}, {longitude.toFixed(6)})
        </div>
      </div>
    </div>
  );
}
