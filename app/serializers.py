# app/serializers.py
from rest_framework import serializers
from .models import Observation  # <-- usa el/los modelos que tengas

class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = "__all__"
        read_only_fields = ("id", "user", "created_at", "updated_at")
