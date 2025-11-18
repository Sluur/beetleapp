// src/api/observations.ts
import { api } from "./api";

/* ========= Tipos (basados en tu frontend web) ========= */

export type InferenceMini = {
  predicted_label: string;
  confidence: number;
  created_at?: string;
} | null;

export type Observation = {
  id: number;
  date: string; // "YYYY-MM-DD"
  place_text?: string;
  latitude: number | string;
  longitude: number | string;
  photo?: string | null;
  photo_url?: string | null;
  created_at?: string;
  inference?: InferenceMini;
};

export type CreateObsInput = {
  date: string;
  place_text?: string;
  latitude: number | string;
  longitude: number | string;

  // En web es File, en mobile usamos { uri, name, type }
  photo?: {
    uri: string;
    name: string;
    type: string;
  } | null;

  // Campos opcionales para guardar la predicción del preview
  predicted_label?: string;
  predicted_confidence?: number | string;
  predicted_version?: string;
};

export type UpdateObsInput = Partial<CreateObsInput>;

/* ========= Helper: arma FormData (mobile) ========= */

export function buildObservationFormData(input: CreateObsInput | UpdateObsInput) {
  const fd = new FormData();

  if ("date" in input && input.date != null) fd.append("date", String(input.date));
  if ("place_text" in input && input.place_text != null) fd.append("place_text", input.place_text);
  if ("latitude" in input && input.latitude != null) fd.append("latitude", String(input.latitude));
  if ("longitude" in input && input.longitude != null) fd.append("longitude", String(input.longitude));

  if ("photo" in input && input.photo) {
    // React Native: objeto con uri/name/type
    fd.append("photo", {
      uri: input.photo.uri,
      name: input.photo.name,
      type: input.photo.type,
    } as any);
  }

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

/* ========= API ========= */

// GET /api/observations/
export async function listObservations(
  accessToken: string,
  params?: { search?: string; ordering?: string; page?: number }
): Promise<Observation[]> {
  const { data } = await api.get("/observations/", {
    params,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return Array.isArray(data) ? (data as Observation[]) : (data.results as Observation[]);
}

// GET /api/observations/:id/
export async function getObservation(accessToken: string, id: number): Promise<Observation> {
  const { data } = await api.get<Observation>(`/observations/${id}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

// POST /api/observations/  (multipart)
export async function createObservation(accessToken: string, input: CreateObsInput): Promise<Observation> {
  const fd = buildObservationFormData(input);
  const { data } = await api.post<Observation>("/observations/", fd, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

// PATCH /api/observations/:id/  (multipart si hay foto; JSON si no)
export async function updateObservation(accessToken: string, id: number, input: UpdateObsInput): Promise<Observation> {
  const hasFile = !!input.photo;
  const body = hasFile ? buildObservationFormData(input) : input;

  const { data } = await api.patch<Observation>(`/observations/${id}/`, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(hasFile ? { "Content-Type": "multipart/form-data" } : {}),
    },
  });

  return data;
}

// DELETE /api/observations/:id/
export async function deleteObservation(accessToken: string, id: number): Promise<void> {
  await api.delete(`/observations/${id}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// POST /api/observations/:id/classify/
export async function classifyObservationApi(accessToken: string, observationId: number) {
  const { data } = await api.post(
    `/observations/${observationId}/classify/`,
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return data as {
    id: number;
    predicted_label: string;
    confidence: number;
    is_correct: boolean | null;
    created_at: string;
  };
}

// POST /api/predict_preview/
export async function predictPreview(accessToken: string, file: { uri: string; name: string; type: string }) {
  const fd = new FormData();
  fd.append("image", file as any);
  const res = await api.post("predict_preview/", fd, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data as { label: string; confidence: number; version: string };
}
