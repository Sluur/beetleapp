from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Value, CharField
from django.db.models.functions import Lower, Coalesce
from .models import Observation, Inference, ModelVersion
from .serializers import ObservationSerializer
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import os

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and getattr(obj, "user_id", None) == request.user.id

def _needs_convert(uploaded):
    ct = (getattr(uploaded, "content_type", "") or "").lower()
    name = (getattr(uploaded, "name", "") or "").lower()
    return not (ct == "image/jpeg" or name.endswith(".jpg") or name.endswith(".jpeg"))

def _as_jpeg(uploaded):
    img = Image.open(uploaded)
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    base, _ = os.path.splitext(uploaded.name or "image")
    return InMemoryUploadedFile(buf, "photo", base + ".jpg", "image/jpeg", buf.getbuffer().nbytes, None)

class ObservationViewSet(viewsets.ModelViewSet):
    serializer_class = ObservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    filter_backends = []

    def get_queryset(self):
        qs = Observation.objects.filter(user=self.request.user).select_related("inference")


        q = (self.request.query_params.get("search") or "").strip()
        if q:
            for term in q.split():
                qs = qs.filter(
                    Q(place_text__icontains=term) |
                    Q(inference__predicted_label__icontains=term)
                )


        order = (self.request.query_params.get("ordering") or "").strip()
        if order in ("predicted_label", "-predicted_label"):
            qs = qs.annotate(
                _pred=Lower(
                    Coalesce("inference__predicted_label", Value(""), output_field=CharField())
                )
            )
            qs = qs.order_by("_pred", "-date") if order == "predicted_label" else qs.order_by("-_pred", "-date")
        else:
            allowed = {"created_at", "-created_at", "date", "-date", "id", "-id"}
            qs = qs.order_by(order) if order in allowed else qs.order_by("-created_at")


        return qs

    def get_permissions(self):
        perms = super().get_permissions()
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            perms.append(IsOwner())
        return perms

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get("photo")
        photo_arg = _as_jpeg(uploaded) if (uploaded and _needs_convert(uploaded)) else uploaded
        obs = serializer.save(user=self.request.user, **({"photo": photo_arg} if photo_arg else {}))

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
        photo_arg = None
        if uploaded:
            photo_arg = _as_jpeg(uploaded) if _needs_convert(uploaded) else uploaded
        if photo_arg is not None:
            serializer.save(photo=photo_arg)
        else:
            serializer.save()
