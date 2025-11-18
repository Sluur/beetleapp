from rest_framework import serializers
from .models import Observation, Inference
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode


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
    
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data.get("email", "")
        )
        user.set_password(validated_data["password"])
        user.save()
        return user

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        uid = attrs.get("uid"); token = attrs.get("token")
        try:
            uid_int = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_int)
        except Exception:
            raise serializers.ValidationError("UID inválido.")
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError("Token inválido o expirado.")
        attrs["user"] = user
        return attrs