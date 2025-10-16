from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from app import views

urlpatterns = [
    path('', views.observation_list, name='observation_list'),    # /observations/
    path('new/', views.observation_create, name='observation_create'),  # /observations/new/
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)