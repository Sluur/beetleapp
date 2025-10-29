import { useEffect, useRef } from "react";
import L from "leaflet";

const MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 0C5.873 0 0.5 5.373 0.5 12c0 9.5 12 29 12 29s12-19.5 12-29C24.5 5.373 19.127 0 12.5 0z" fill="#3b82f6"/>
  <circle cx="12.5" cy="12.5" r="5" fill="white"/>
</svg>`;
const ICON_SVG_URL = "data:image/svg+xml;utf8," + encodeURIComponent(MARKER_SVG);

const DEFAULT_ICON = L.icon({
  iconUrl: ICON_SVG_URL,
  iconRetinaUrl: ICON_SVG_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export type ObsPoint = {
  id: number;
  latitude: number;
  longitude: number;
  date: string;
  place_text?: string;
  photo_url?: string;
};

type Props = {
  points: ObsPoint[];
  activeId?: number | null;
  onSelect?: (id: number) => void;
};

export default function MapAllObservations({ points, activeId, onSelect }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerIndex = useRef<Record<number, L.Marker>>({});

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);

    const invalidate = () => map.invalidateSize();
    const t = setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", invalidate);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerIndex.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerIndex.current = {};

    const bounds = L.latLngBounds([]);

    points.forEach((p) => {
      const ll = L.latLng(p.latitude, p.longitude);
      bounds.extend(ll);

      const m = L.marker(ll, { icon: DEFAULT_ICON }).addTo(layer);
      markerIndex.current[p.id] = m;

      const html = `
        <div style="min-width:180px">
          <div style="font-weight:600">${p.place_text ?? "Sin lugar"}</div>
          <div style="font-size:12px;color:#555">${new Date(p.date).toLocaleDateString()}</div>
          ${
            p.photo_url
              ? `<img src="${p.photo_url}" style="margin-top:6px;width:100%;height:100px;object-fit:cover;border-radius:8px" />`
              : ""
          }
        </div>`;
      m.bindPopup(html, { className: "rounded-xl" });

      m.on("click", () => {
        onSelect?.(p.id);
      });
    });

    if (points.length === 1) {
      map.setView(bounds.getCenter(), 14);
    } else if (points.length > 1) {
      map.fitBounds(bounds.pad(0.15));
    } else {
      map.setView([-24.7829, -65.4232], 12); // default Salta
    }
  }, [points, onSelect]);

  useEffect(() => {
    const m = activeId ? markerIndex.current[activeId] : null;
    const map = mapRef.current;
    if (!map) return;

    Object.values(markerIndex.current).forEach((mk) => mk.setOpacity(1));
    if (m) {
      m.setOpacity(1);
      m.openPopup();
      map.panTo(m.getLatLng());

      if (map.getZoom() < 13) map.setZoom(13);
      // atenuar otros
      Object.entries(markerIndex.current).forEach(([id, mk]) => {
        if (Number(id) !== activeId) mk.setOpacity(0.5);
      });
    }
  }, [activeId]);

  return <div ref={divRef} className="h-full w-full" />;
}
