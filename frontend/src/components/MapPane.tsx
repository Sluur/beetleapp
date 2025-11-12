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

type Props = {
  lat: number | null;
  lon: number | null;
  onChange: (lat: number, lon: number) => void;
};

const defaultCenter: [number, number] = [-24.7829, -65.4232]; // Salta

export default function MapPane({ lat, lon, onChange }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const latRef = useRef<number | null>(lat);
  const lonRef = useRef<number | null>(lon);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    latRef.current = lat;
  }, [lat]);
  useEffect(() => {
    lonRef.current = lon;
  }, [lon]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, { zoomControl: false }).setView(defaultCenter, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const attachDragHandler = () => {
      markerRef.current?.on("dragend", () => {
        const p = markerRef.current!.getLatLng();
        const lt = +p.lat.toFixed(6);
        const ln = +p.lng.toFixed(6);
        markerRef.current!.setLatLng([lt, ln]);
        onChangeRef.current(lt, ln);
      });
    };

    if (latRef.current != null && lonRef.current != null) {
      markerRef.current = L.marker([latRef.current, lonRef.current], {
        draggable: true,
        icon: DEFAULT_ICON,
      }).addTo(map);
      attachDragHandler();
      map.setView([latRef.current, lonRef.current], 13);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const lt = +e.latlng.lat.toFixed(6);
      const ln = +e.latlng.lng.toFixed(6);
      onChangeRef.current(lt, ln);
      if (markerRef.current) {
        markerRef.current.setLatLng([lt, ln]);
      } else {
        markerRef.current = L.marker([lt, ln], { draggable: true, icon: DEFAULT_ICON }).addTo(map);
        attachDragHandler();
      }
    });

    map.locate({ setView: false, enableHighAccuracy: true }).on("locationfound", (e) => {
      if (latRef.current == null && lonRef.current == null) {
        const lt = +e.latlng.lat.toFixed(6);
        const ln = +e.latlng.lng.toFixed(6);
        onChangeRef.current(lt, ln);
        markerRef.current = L.marker([lt, ln], { draggable: true, icon: DEFAULT_ICON }).addTo(map);
        attachDragHandler();
        map.setView([lt, ln], 13);
      }
    });

    const invalidate = () => map.invalidateSize();
    const t = setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", invalidate);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    const p = L.latLng(lat, lon);
    if (markerRef.current) {
      markerRef.current.setLatLng(p);
    } else {
      markerRef.current = L.marker(p, { draggable: true, icon: DEFAULT_ICON }).addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const g = markerRef.current!.getLatLng();
        const lt = +g.lat.toFixed(6);
        const ln = +g.lng.toFixed(6);
        markerRef.current!.setLatLng([lt, ln]);
        onChangeRef.current(lt, ln);
      });
    }
  }, [lat, lon]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapDivRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 bottom-4 rounded-xl bg-black/40 text-white text-xs px-3 py-1">
        Click para ubicar — arrastrá para ajustar
      </div>
    </div>
  );
}
