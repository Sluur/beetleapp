// frontend/src/lib/observations.ts
import { api } from "./api";

/** ---------- Tipos ---------- */

export type InferenceMini = {
  predicted_label: string;
  confidence: number;
  created_at?: string;
} | null;

export type Observation = {
  id: number;
  date: string; // "YYYY-MM-DD"
  place_text?: string;
  latitude: number | string; // puede venir string por DecimalField
  longitude: number | string;
  photo?: string | null; // path relativo
  photo_url?: string | null; // URL absoluta (serializer)
  created_at?: string;
  inference?: InferenceMini;
};

export type Paged<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CreateObsInput = {
  date: string; // yyyy-MM-dd
  place_text?: string;
  latitude: number | string;
  longitude: number | string;
  photo?: File | null;

  // opcionales: si querés persistir el preview de IA cuando creás
  predicted_label?: string;
  predicted_confidence?: number | string;
  predicted_version?: string;
};

export type UpdateObsInput = Partial<CreateObsInput>;

/** ---------- Helpers ---------- */

export function buildObservationFormData(input: CreateObsInput | UpdateObsInput) {
  const fd = new FormData();
  if ("date" in input && input.date != null) fd.append("date", String(input.date));
  if ("place_text" in input && input.place_text != null) fd.append("place_text", input.place_text);
  if ("latitude" in input && input.latitude != null) fd.append("latitude", String(input.latitude));
  if ("longitude" in input && input.longitude != null) fd.append("longitude", String(input.longitude));
  if ("photo" in input && input.photo) fd.append("photo", input.photo);

  if ("predicted_label" in input && input.predicted_label != null) {
    fd.append("predicted_label", String(input.predicted_label));
  }
  if ("predicted_confidence" in input && input.predicted_confidence != null) {
    fd.append("predicted_confidence", String(input.predicted_confidence));
  }
  if ("predicted_version" in input && input.predicted_version != null) {
    fd.append("predicted_version", String(input.predicted_version));
  }
  return fd;
}

/** ---------- API ---------- */

// GET /api/observations/?search&ordering&page
export async function listObservations(params?: { search?: string; ordering?: string; page?: number }) {
  const { data } = await api.get("/observations/", { params });
  return Array.isArray(data) ? (data as Observation[]) : (data.results as Observation[]);
}

// GET /api/observations/:id/
export async function getObservation(id: number) {
  const { data } = await api.get<Observation>(`/observations/${id}/`);
  return data;
}

// POST /api/observations/  (multipart)
export async function createObservation(input: CreateObsInput) {
  const fd = buildObservationFormData(input);
  const { data } = await api.post<Observation>("/observations/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// PATCH /api/observations/:id/  (multipart si hay foto; JSON si no)
export async function updateObservation(id: number, input: UpdateObsInput) {
  const hasFile = "photo" in input && !!input.photo;
  const body = hasFile ? buildObservationFormData(input) : input;
  const { data } = await api.patch<Observation>(`/observations/${id}/`, body, {
    headers: hasFile ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return data;
}

// DELETE /api/observations/:id/
export async function deleteObservation(id: number) {
  await api.delete(`/observations/${id}/`);
}

// POST /api/observations/:id/classify/
export async function classifyObservation(observationId: number) {
  const { data } = await api.post(`/observations/${observationId}/classify/`);
  return data as {
    id: number;
    predicted_label: string;
    confidence: number;
    is_correct: boolean | null;
    created_at: string;
  };
}

// POST /api/inferences/:id/validate/
export async function validateInference(inferenceId: number, isCorrect: boolean) {
  const { data } = await api.post(`/inferences/${inferenceId}/validate/`, { is_correct: isCorrect });
  return data as { ok: true };
}

// POST /api/predict_preview/
export async function predictPreview(file: File) {
  const fd = new FormData();
  fd.append("image", file, file.name); // <-- 'image' exacto
  const res = await api.post("predict_preview/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as { label: string; confidence: number; version: string };
}
