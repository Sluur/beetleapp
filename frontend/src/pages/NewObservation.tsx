import type { FormEvent } from "react";
import { useState, useEffect, useCallback } from "react"; 
import MapPane from "../components/MapPane";
import ObservationForm from "../components/ObservationForm";
import { predictPreview, createObservation } from "../lib/observations";

type Preview = { label: string; confidence: number; version?: string };

export default function NewObservation() {
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [pvLoading, setPvLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setPreview(null);
      if (!photo) return;
      try {
        setPvLoading(true);
        const data = await predictPreview(photo);
        if (!canceled) setPreview(data);
      } catch {
        if (!canceled) setPreview(null);
      } finally {
        if (!canceled) setPvLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [photo]);

  const handleMapChange = useCallback((a: number, b: number) => {
    setLat(a);
    setLon(b);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!date || lat == null || lon == null) {
      setError("Completá fecha y coordenadas.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        date,
        place_text: place || undefined,
        latitude: lat,
        longitude: lon,
        photo: photo ?? undefined,
        predicted_label: preview?.label,
        predicted_confidence: preview?.confidence,
        predicted_version: preview?.version,
      };

      await createObservation(payload);
      window.location.href = "/observations";
    } catch (err: any) {
      const detail = err?.response?.data && (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data));
      setError(detail || "No se pudo guardar la observación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-full p-4 bg-white">
          <div className="h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
            <MapPane lat={lat} lon={lon} onChange={handleMapChange} />
          </div>
        </div>

        <div className="h-full overflow-hidden bg-white">
          <div className="h-[calc(100%-76px)] overflow-y-auto px-6 py-6 bg-white">
            {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

            <ObservationForm
              date={date}
              place={place}
              lat={lat}
              lon={lon}
              error={""}
              onChangeDate={setDate}
              onChangePlace={setPlace}
              onChangeLat={setLat}
              onChangeLon={setLon}
              onChangePhoto={setPhoto}
              onSubmit={submit}
              preview={preview}
              pvLoading={pvLoading}
              saving={saving}
              variant="default"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
