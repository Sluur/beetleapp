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

from django.db.models import Count
from django.utils.dateparse import parse_date
from django.http import HttpResponse
import csv

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

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

def _needs_convert(uploaded):
    ct = (getattr(uploaded, "content_type", "") or "").lower()
    name = (getattr(uploaded, "name", "") or "").lower()
    return not (ct == "image/jpeg" or name.endswith(".jpg") or name.endswith(".jpeg"))

def _as_jpeg(uploaded):
    img = Image.open(uploaded)
    if img.mode != "RGB": img = img.convert("RGB")
    buf = BytesIO(); img.save(buf, format="JPEG", quality=90); buf.seek(0)
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
        if not uploaded:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"photo": "La foto es obligatoria."})

        photo_arg = _as_jpeg(uploaded) if _needs_convert(uploaded) else uploaded
        obs = serializer.save(user=self.request.user, photo=photo_arg)

        # Si además mandaste preview, se persiste igual:
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


class ObservationSummaryView(APIView):
    """
    GET /api/reports/observations/summary/?from=YYYY-MM-DD&to=YYYY-MM-DD

    Devuelve estadísticas de observaciones del usuario:
    - total_observations
    - distinct_species_count
    - species_counts (top especies)
    - observations_by_date (serie temporal)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # --- Filtros de fecha ---
        date_from_str = request.query_params.get("from")
        date_to_str = request.query_params.get("to")

        date_from = parse_date(date_from_str) if date_from_str else None
        date_to = parse_date(date_to_str) if date_to_str else None

        qs = Observation.objects.filter(user=user).select_related("inference")

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # --- Total de observaciones ---
        total_observations = qs.count()

        # --- Especies: usamos species.name si existe, si no predicted_label ---
        # Solo observaciones con inferencia
        qs_inf = qs.filter(inference__isnull=False).select_related(
            "inference__species"
        )

        # Anotamos una etiqueta "label" = species.name COALESCE predicted_label
        from django.db.models import Value, CharField
        from django.db.models.functions import Coalesce

        qs_inf = qs_inf.annotate(
            label=Coalesce(
                "inference__species__name",
                "inference__predicted_label",
                output_field=CharField(),
            )
        ).exclude(label__isnull=True).exclude(label__exact="")

        # distinct species
        distinct_species_count = qs_inf.values("label").distinct().count()

        # conteo por especie (top)
        species_counts_qs = (
            qs_inf.values("label")
            .annotate(count=Count("id"))
            .order_by("-count", "label")
        )

        species_counts = [
            {"label": row["label"], "count": row["count"]}
            for row in species_counts_qs
        ]

        # --- Serie temporal por fecha ---
        dates_qs = (
            qs.values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        observations_by_date = [
            {"date": row["date"].isoformat(), "count": row["count"]}
            for row in dates_qs
        ]

        return Response(
            {
                "filters": {
                    "from": date_from.isoformat() if date_from else None,
                    "to": date_to.isoformat() if date_to else None,
                },
                "total_observations": total_observations,
                "distinct_species_count": distinct_species_count,
                "species_counts": species_counts,
                "observations_by_date": observations_by_date,
            }
        )
    

class ObservationExportCsvView(APIView):
    """
    GET /api/reports/observations/export/?from=YYYY-MM-DD&to=YYYY-MM-DD

    Exporta las observaciones del usuario en CSV con columnas:
    id, date, latitude, longitude, place_text, species_label, confidence, model_version, created_at
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        date_from_str = request.query_params.get("from")
        date_to_str = request.query_params.get("to")

        date_from = parse_date(date_from_str) if date_from_str else None
        date_to = parse_date(date_to_str) if date_to_str else None

        qs = (
            Observation.objects.filter(user=user)
            .select_related("inference__species", "inference__model_version")
        )

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Preparamos respuesta HTTP como CSV
        response = HttpResponse(content_type="text/csv")
        filename = "observations_export.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        # Cabeceras
        writer.writerow(
            [
                "id",
                "date",
                "latitude",
                "longitude",
                "place_text",
                "species_label",
                "confidence",
                "model_version",
                "created_at",
            ]
        )

        for obs in qs:
            inf = getattr(obs, "inference", None)
            if inf:
                species_label = (
                    inf.species.name if inf.species else inf.predicted_label
                )
                confidence = inf.confidence
                model_version = inf.model_version.name if inf.model_version else ""
            else:
                species_label = ""
                confidence = ""
                model_version = ""

            writer.writerow(
                [
                    obs.id,
                    obs.date.isoformat(),
                    str(obs.latitude),
                    str(obs.longitude),
                    obs.place_text,
                    species_label,
                    confidence,
                    model_version,
                    obs.created_at.isoformat() if obs.created_at else "",
                ]
            )

        return response

class ObservationExportPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        date_from_str = request.query_params.get("from")
        date_to_str = request.query_params.get("to")

        date_from = parse_date(date_from_str) if date_from_str else None
        date_to = parse_date(date_to_str) if date_to_str else None

        qs = Observation.objects.filter(user=user).select_related(
            "inference__species", "inference__model_version"
        )
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        total_observations = qs.count()

        # --- especies (igual que antes) ---
        from django.db.models import Value, CharField
        from django.db.models.functions import Coalesce

        qs_inf = (
            qs.filter(inference__isnull=False)
            .annotate(
                label=Coalesce(
                    "inference__species__name",
                    "inference__predicted_label",
                    output_field=CharField(),
                )
            )
            .exclude(label__isnull=True)
            .exclude(label__exact="")
        )

        distinct_species_count = qs_inf.values("label").distinct().count()

        species_counts_qs = (
            qs_inf.values("label")
            .annotate(count=Count("id"))
            .order_by("-count", "label")
        )
        species_counts = list(species_counts_qs)

        # --- armamos PDF ---
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="observations_report.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4
        y = height - 50

        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y, "Informe de observaciones — BeetleApp")
        y -= 30

        p.setFont("Helvetica", 10)
        rango_txt = "Todo el historial"
        if date_from or date_to:
            d1 = date_from.isoformat() if date_from else "inicio"
            d2 = date_to.isoformat() if date_to else "hoy"
            rango_txt = f"Rango: {d1} a {d2}"
        p.drawString(50, y, rango_txt)
        y -= 20

        p.drawString(50, y, f"Usuario: {user.username}")
        y -= 30

        # --- resumen general ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Resumen general")
        y -= 20

        p.setFont("Helvetica", 10)
        p.drawString(60, y, f"Total de observaciones: {total_observations}")
        y -= 15
        p.drawString(60, y, f"Especies distintas observadas: {distinct_species_count}")
        y -= 30

        # --- especies (conteo) ---
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Especies (conteo)")
        y -= 18

        p.setFont("Helvetica", 10)
        if not species_counts:
            p.drawString(60, y, "No hay especies en este rango.")
            y -= 15
        else:
            p.drawString(60, y, "Especie")
            p.drawString(320, y, "Observaciones")
            y -= 15
            p.line(60, y, width - 60, y)
            y -= 10

            for row in species_counts:
                label = row["label"]
                count = row["count"]
                if y < 80:
                    p.showPage()
                    y = height - 50
                    p.setFont("Helvetica", 10)

                p.drawString(60, y, str(label))
                p.drawRightString(width - 60, y, str(count))
                y -= 14

        # --- detalle de observaciones ---
        y -= 30
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Detalle de observaciones")
        y -= 18

        p.setFont("Helvetica", 10)

        obs_list = qs.order_by("date", "id")

        if not obs_list:
            p.drawString(60, y, "No hay observaciones en este rango.")
            y -= 15
        else:
            for obs in obs_list:
                if y < 80:
                    p.showPage()
                    y = height - 50
                    p.setFont("Helvetica-Bold", 12)
                    p.drawString(50, y, "Detalle de observaciones (cont.)")
                    y -= 18
                    p.setFont("Helvetica", 10)

                # una observación
                p.drawString(50, y, f"Fecha: {obs.date.isoformat()}")
                y -= 12
                p.drawString(50, y, f"Lugar: {obs.place_text or '-'}")
                y -= 12
                p.drawString(
                    50,
                    y,
                    f"Coordenadas: ({obs.latitude}, {obs.longitude})",
                )
                y -= 12

                inf = getattr(obs, "inference", None)
                if inf:
                    species_label = inf.species.name if inf.species else inf.predicted_label
                    p.drawString(
                        50,
                        y,
                        f"Especie: {species_label}  ·  Confianza: {inf.confidence:.1f}",
                    )
                    y -= 12
                    if inf.model_version:
                        p.drawString(50, y, f"Modelo: {inf.model_version.name}")
                        y -= 12
                else:
                    p.drawString(
                        50,
                        y,
                        "Inferencia: (sin inferencia asociada aún)",
                    )
                    y -= 12

                y -= 8  # espacio entre observaciones

        p.showPage()
        p.save()
        return response

