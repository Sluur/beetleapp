import type { FormEvent } from "react";
import { useState } from "react";
import MapPane from "../components/MapPane";
import ObservationForm from "../components/ObservationForm";
import { api } from "../lib/api";

export default function NewObservation() {
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (lat == null || lon == null) {
      setError("Seleccioná un punto en el mapa (o completá lat/lon).");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("date", date);
      fd.append("place_text", place);
      fd.append("latitude", String(lat));
      fd.append("longitude", String(lon));
      if (photo) fd.append("photo", photo);

      await api.post("/observations/", fd);
      window.location.href = "/observations";
    } catch (err: any) {
      const detail = err?.response?.data && (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data));
      setError(detail || "No se pudo guardar la observación.");
    }
  }

  return (
    <div className="h-full">
      <div className="h-full grid grid-cols-1 md:grid-cols-2">
        <div className="h-full p-4 bg-white">
          <div className="h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
            <MapPane
              lat={lat}
              lon={lon}
              onChange={(a, b) => {
                setLat(a);
                setLon(b);
              }}
            />
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
