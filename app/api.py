from rest_framework import serializers, viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Observation

# ----------------------------
# Serializer
# ----------------------------
class ObservationSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Observation
        fields = ["id", "date", "latitude", "longitude", "place_text", "photo", "photo_url", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_photo_url(self, obj):
        req = self.context.get("request")
        try:
            url = obj.photo.url
        except Exception:
            url = None
        return req.build_absolute_uri(url) if (req and url) else url


# ----------------------------
# Permiso: dueño del objeto
# ----------------------------
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and getattr(obj, "user_id", None) == request.user.id

# ----------------------------
# ViewSet
# ----------------------------
class ObservationViewSet(viewsets.ModelViewSet):
    serializer_class = ObservationSerializer
    parser_classes = [MultiPartParser, FormParser]

    permission_classes = [IsAuthenticated]

    filterset_fields = {
        "date": ["exact", "gte", "lte"],
        "latitude": ["gte", "lte"],
        "longitude": ["gte", "lte"],
    }
    search_fields = ["place_text"]
    ordering_fields = ["created_at", "date"]
    ordering = ["-created_at"]

    def get_queryset(self):

        return Observation.objects.filter(user=self.request.user).order_by("-created_at")

    def get_permissions(self):
        perms = super().get_permissions()
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            perms.append(IsOwner())
        return perms

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
