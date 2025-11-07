from rest_framework import serializers
from .models import Observation, Inference

class InferenceMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inference
        fields = ["predicted_label", "confidence", "created_at"]

class ObservationSerializer(serializers.ModelSerializer):
    inference = InferenceMiniSerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Observation
        fields = [
            "id", "date", "latitude", "longitude", "place_text",
            "photo", "photo_url", "created_at", "inference"
        ]
        read_only_fields = ["id", "created_at", "inference"]

    def get_photo_url(self, obj):
        req = self.context.get("request")
        try:
            url = obj.photo.url
        except Exception:
            return None
        return req.build_absolute_uri(url) if req else url
