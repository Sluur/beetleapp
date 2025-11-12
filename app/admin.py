from django.contrib import admin
from .models import Observation, Inference, ModelVersion, Species

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'latitude', 'longitude', 'created_at')
    list_filter = ('date', 'user')
    search_fields = ('place_text',)

@admin.register(Inference)
class InferenceAdmin(admin.ModelAdmin):
    list_display = ('observation', 'predicted_label', 'confidence', 'is_correct', 'model_version', 'created_at')
    list_filter = ('predicted_label', 'is_correct', 'model_version')
    search_fields = ('predicted_label',)

@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Species)
class SpeciesAdmin(admin.ModelAdmin):
    search_fields = ('name',)
