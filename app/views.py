from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login as auth_login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.db.models import Q
from django.db.models.functions import Lower, Coalesce
from django.utils.dateparse import parse_date

from .forms import ObservationForm
from .models import Observation, Inference, ModelVersion

import json, requests

# --- Vistas HTML simples ---

def home(request):
    return render(request, 'app/home.html')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def observation_create(request):
    if request.method == 'POST':
        form = ObservationForm(request.POST, request.FILES)
        if form.is_valid():
            obs = form.save(commit=False)
            obs.user = request.user
            obs.save()
            return redirect('observation_list')  # si usás SPA, podés redirigir a tu ruta del front
    else:
        form = ObservationForm()
    return render(request, 'app/observation_form.html', {'form': form})

# --- API JSON para React (usa el nombre observation_list) ---

@login_required
@require_http_methods(["GET"])
def observation_list(request):
    """
    GET /observations/?search=...&ordering=...
    Busca SOLO por place_text (icontains). Orden soporta predicted_label.
    """
    search = (request.GET.get("search") or "").strip()
    ordering = request.GET.get("ordering") or "-date"

    ALLOWED_ORDERING = {
        "-date", "date",
        "-created_at", "created_at",
        "-predicted_label", "predicted_label",
    }
    if ordering not in ALLOWED_ORDERING:
        ordering = "-date"

    qs = Observation.objects.filter(user=request.user)

    if search:

        for term in search.split():
            qs = qs.filter(place_text__icontains=term)


    # --- ORDEN ---
    if ordering in ("predicted_label", "-predicted_label"):
        qs = qs.annotate(_pred=Lower(Coalesce("inference__predicted_label", "")))
        qs = qs.order_by("_pred", "-date") if ordering == "predicted_label" else qs.order_by("-_pred", "-date")
    else:
        qs = qs.order_by(ordering)

    data = []
    for o in qs.select_related():
        photo_url = o.photo.url if o.photo else None
        if photo_url:
            photo_url = request.build_absolute_uri(photo_url)

        inf = None
        if hasattr(o, "inference") and o.inference:
            inf = {
                "predicted_label": o.inference.predicted_label,
                "confidence": float(o.inference.confidence),
            }

        data.append({
            "id": o.id,
            "date": str(o.date),
            "place_text": o.place_text,
            "latitude": float(o.latitude) if o.latitude is not None else None,
            "longitude": float(o.longitude) if o.longitude is not None else None,
            "photo_url": photo_url,
            "inference": inf,
        })

    return JsonResponse(data, safe=False, status=200)

# --- Endpoints auxiliares (crear, clasificar, validar, preview) ---

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_observation_create(request):
    """POST /api/observations/ - crea observación y devuelve id"""
    form = ObservationForm(request.POST, request.FILES)
    if form.is_valid():
        obs = form.save(commit=False)
        obs.user = request.user
        obs.save()
        return JsonResponse({"id": obs.id}, status=201)
    return JsonResponse(form.errors, status=400)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_classify_observation(request, observation_id: int):
    """POST /api/observations/<id>/classify/ -> llama a Flask y crea Inference (1:1)"""
    obs = get_object_or_404(Observation, pk=observation_id, user=request.user)

    # si ya hay inferencia 1:1, devolverla
    if hasattr(obs, "inference"):
        inf = obs.inference
        return JsonResponse({
            "id": inf.id,
            "predicted_label": inf.predicted_label,
            "confidence": inf.confidence,
            "is_correct": inf.is_correct,
            "created_at": inf.created_at.isoformat(),
        }, status=200)

    # reenviar imagen al microservicio Flask
    with obs.photo.open("rb") as f:
        files = {"image": (obs.photo.name.split("/")[-1], f, "image/jpeg")}
        r = requests.post(getattr(settings, "AI_PREDICT_URL", "http://localhost:5001/predict"),
                          files=files, timeout=30)

    if r.status_code != 200:
        return JsonResponse({"detail": "Error del servicio de IA", "raw": r.text}, status=502)

    data = r.json()  # {label, confidence, version}
    mv, _ = ModelVersion.objects.get_or_create(name=data.get("version", "unknown"))

    inf = Inference.objects.create(
        observation=obs,
        predicted_label=data["label"],
        confidence=float(data["confidence"]),
        model_version=mv,
    )

    return JsonResponse({
        "id": inf.id,
        "predicted_label": inf.predicted_label,
        "confidence": inf.confidence,
        "is_correct": inf.is_correct,
        "created_at": inf.created_at.isoformat(),
    }, status=201)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def api_validate_inference(request, inference_id: int):
    """POST /api/inferences/<id>/validate/ -> guarda feedback del usuario"""
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"detail": "JSON inválido"}, status=400)

    is_correct = payload.get("is_correct", None)
    if is_correct is None:
        return JsonResponse({"detail": "Falta 'is_correct'."}, status=400)

    inf = get_object_or_404(Inference, pk=inference_id, observation__user=request.user)
    inf.is_correct = bool(is_correct)
    inf.save()
    return JsonResponse({"ok": True})

@csrf_exempt
@require_http_methods(["POST"])
def api_predict_preview(request):
    """
    POST /api/predict_preview/
    multipart/form-data con 'image'
    → llama a Flask y devuelve {label, confidence, version}
    """
    if "image" not in request.FILES:
        return JsonResponse({"detail": "Falta archivo 'image'."}, status=400)

    f = request.FILES["image"]
    files = {"image": (getattr(f, "name", "image.jpg"), f, "image/jpeg")}
    flask_url = getattr(settings, "AI_PREDICT_URL", "http://localhost:5001/predict")

    try:
        r = requests.post(flask_url, files=files, timeout=30)
    except requests.RequestException as e:
        return JsonResponse({"detail": "No se pudo contactar al servicio de IA.", "error": str(e)}, status=502)

    if r.status_code != 200:
        return JsonResponse({"detail": "Error del servicio de IA", "raw": r.text}, status=502)

    data = r.json()  # {label, confidence, version}
    return JsonResponse(data, status=200)
