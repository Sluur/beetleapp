from rest_framework import serializers, viewsets, permissions, filters
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Observation

class ObservationSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField();

    class Meta:
        model = Observation
        fields = ["id", "date", "latitude", "longitude", "place_text", "photo", "photo_url", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_photo_url(self, obj):
        req = self.context.get("request")
        return req.build_absolute_uri(obj.photo.url) if (req and obj.photo) else None

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class ObservationViewSet(viewsets.ModelViewSet):
    serializer_class = ObservationSerializer
    permission_classes = [permissions.IsAuthenticated & IsOwner]
    parser_classes = [MultiPartParser, FormParser]
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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)    
