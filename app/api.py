from typing import Any, Dict
from io import BytesIO
import os

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models import Q, Value, CharField, QuerySet
from django.db.models.functions import Lower, Coalesce
from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from PIL import Image
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from rest_framework import permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import requests, json

from .serializers import (
    ObservationSerializer,
    RegisterSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .models import Observation, Inference, ModelVersion
User = get_user_model()

# ---------- Usuarios ----------
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response({"id": user.id, "username": user.username, "email": user.email}, status=201)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = PasswordResetRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Si el email existe, se enviará un enlace."})
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend}/reset?uid={uid}&token={token}"
        subject = "BeetleApp — Restablecer contraseña"
        message = (
            f"Hola {user.username},\n\n"
            f"Usá este enlace para restablecer tu contraseña:\n{reset_url}\n\n"
            f"Si no fuiste vos, ignorá este mensaje."
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        return Response({"detail": "Si el email existe, se enviará un enlace."})

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response({"detail": "Contraseña actualizada."})

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({"id": u.id, "username": u.username, "email": u.email})

# ---------- IA / classify / preview / validate ----------
class ClassifyObservationView(APIView):
    """POST /api/observations/<id>/classify/ -> llama a Flask y crea Inference (1:1)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, observation_id: int):
        obs = get_object_or_404(Observation, pk=observation_id, user=request.user)

        if getattr(obs, "inference", None):
            inf = obs.inference
            return Response({
                "id": inf.id,
                "predicted_label": inf.predicted_label,
                "confidence": float(inf.confidence),
                "is_correct": inf.is_correct,
                "created_at": inf.created_at.isoformat(),
            })

        if not obs.photo:
            return Response({"detail": "La observación no tiene foto."}, status=400)

        with obs.photo.open("rb") as f:
            files = {"image": (obs.photo.name.split("/")[-1], f, "image/jpeg")}
            url = getattr(settings, "AI_PREDICT_URL", "http://localhost:5001/predict")
            try:
                r = requests.post(url, files=files, timeout=30)
            except requests.RequestException as e:
                return Response({"detail": "No se pudo contactar al servicio de IA.", "error": str(e)}, status=502)

        if r.status_code != 200:
            return Response({"detail": "Error del servicio de IA", "raw": r.text}, status=502)

        data = r.json()  # {label, confidence, version}
        mv, _ = ModelVersion.objects.get_or_create(name=data.get("version", "unknown"))

        inf = Inference.objects.create(
            observation=obs,
            predicted_label=data["label"],
            confidence=float(data["confidence"]),
            model_version=mv,
        )

        return Response({
            "id": inf.id,
            "predicted_label": inf.predicted_label,
            "confidence": float(inf.confidence),
            "is_correct": inf.is_correct,
            "created_at": inf.created_at.isoformat(),
        }, status=201)

class ValidateInferenceView(APIView):
    """POST /api/inferences/<id>/validate/ -> guarda feedback del usuario."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, inference_id: int):
        try:
            payload = request.data if isinstance(request.data, dict) else json.loads(request.body.decode("utf-8"))
        except Exception:
            return Response({"detail": "JSON inválido"}, status=400)

        is_correct = payload.get("is_correct", None)
        if is_correct is None:
            return Response({"detail": "Falta 'is_correct'."}, status=400)

        inf = get_object_or_404(Inference, pk=inference_id, observation__user=request.user)
        inf.is_correct = bool(is_correct)
        inf.save()
        return Response({"ok": True})

class PredictPreviewView(APIView):
    """
    POST /api/predict_preview/
    multipart/form-data con 'image' → llama a Flask y devuelve {label, confidence, version}.
    """
    permission_classes = [permissions.AllowAny]  # o IsAuthenticated si preferís
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        if "image" not in request.FILES:
            return Response({"detail": "Falta archivo 'image'."}, status=400)

        f = request.FILES["image"]
        files = {"image": (getattr(f, "name", "image.jpg"), f, "image/jpeg")}
        url = getattr(settings, "AI_PREDICT_URL", "http://127.0.0.1:5001/predict")

        try:
            r = requests.post(url, files=files, timeout=30)
        except requests.RequestException as e:
            return Response({"detail": "No se pudo contactar al servicio de IA.", "error": str(e)}, status=502)

        if r.status_code != 200:
            return Response({"detail": "Error del servicio de IA", "raw": r.text}, status=502)

        return Response(r.json(), status=200)

class IsOwner(permissions.BasePermission):
    """Permite operar sobre un objeto sólo si pertenece al usuario autenticado."""
    def has_object_permission(self, request, view, obj) -> bool:
        return request.user.is_authenticated and getattr(obj, "user_id", None) == request.user.id


# --- utilidades de imagen -----------------------------------------------------

def _needs_convert(uploaded) -> bool:
    """¿El archivo NO es JPEG (por content-type o extensión)?"""
    ct = (getattr(uploaded, "content_type", "") or "").lower()
    name = (getattr(uploaded, "name", "") or "").lower()
    return not (ct == "image/jpeg" or name.endswith(".jpg") or name.endswith(".jpeg"))


def _as_jpeg(uploaded) -> InMemoryUploadedFile:
    """Convierte PIL → JPEG (RGB, calidad 90) y devuelve un InMemoryUploadedFile."""
    img = Image.open(uploaded)
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    base, _ = os.path.splitext(getattr(uploaded, "name", "image"))
    return InMemoryUploadedFile(buf, "photo", base + ".jpg", "image/jpeg", buf.getbuffer().nbytes, None)


# --- ViewSet ------------------------------------------------------------------

class ObservationViewSet(viewsets.ModelViewSet):
    """
    CRUD de Observations del usuario.
    - Filtro `?search=` por place_text y predicted_label (split por términos).
    - Orden `?ordering=` admite: predicted_label/-predicted_label, date/-date, created_at/-created_at, id/-id.
    - En create/update convierte imágenes no-JPEG a JPEG.
    """
    serializer_class = ObservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self) -> QuerySet[Observation]:
        qs = (
            Observation.objects
            .filter(user=self.request.user)
            .select_related("inference")
        )

        # --- SEARCH ---
        q = (self.request.query_params.get("search") or "").strip()
        if q:
            for term in q.split():
                qs = qs.filter(
                    Q(place_text__icontains=term) |
                    Q(inference__predicted_label__icontains=term)
                )

        # --- ORDERING ---
        order = (self.request.query_params.get("ordering") or "").strip()
        if order in ("predicted_label", "-predicted_label"):
            qs = qs.annotate(
                _pred=Lower(Coalesce("inference__predicted_label", Value(""), output_field=CharField()))
            )
            qs = qs.order_by("_pred", "-date") if order == "predicted_label" else qs.order_by("-_pred", "-date")
        else:
            allowed = {"created_at", "-created_at", "date", "-date", "id", "-id"}
            qs = qs.order_by(order) if order in allowed else qs.order_by("-created_at")

        return qs

    def get_permissions(self):
        perms = super().get_permissions()
        # En operaciones por objeto reforzamos owner
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            perms.append(IsOwner())
        return perms

    def get_serializer_context(self) -> Dict[str, Any]:
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get("photo")
        photo_arg = _as_jpeg(uploaded) if (uploaded and _needs_convert(uploaded)) else uploaded
        obs = serializer.save(user=self.request.user, **({"photo": photo_arg} if photo_arg else {}))

        # Carga de inferencia opcional pasada por el cliente (preview)
        pl = self.request.data.get("predicted_label")
        pc = self.request.data.get("predicted_confidence")
        pv = self.request.data.get("predicted_version")
        if pl and pc not in (None, "", "null"):
            mv, _ = ModelVersion.objects.get_or_create(name=pv or "unknown")
            Inference.objects.create(
                observation=obs,
                predicted_label=str(pl),
                confidence=float(pc),
                model_version=mv,
            )

    def perform_update(self, serializer):
        uploaded = self.request.FILES.get("photo")
        if uploaded:
            photo_arg = _as_jpeg(uploaded) if _needs_convert(uploaded) else uploaded
            serializer.save(photo=photo_arg)
        else:
            serializer.save()
