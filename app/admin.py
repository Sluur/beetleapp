from django.contrib import admin
from .models import Observation

# Register your models here.
class ObservationAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'latitude', 'longitude', 'created_at')
    list_filter = ('date', 'user')
    search_fields = ('place_text',)