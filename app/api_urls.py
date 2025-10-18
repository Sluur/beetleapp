from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import ObservationViewSet

router = DefaultRouter()
router.register("observations", ObservationViewSet, basename="observation")

urlpatterns = [
    path("",  include(router.urls)),
]