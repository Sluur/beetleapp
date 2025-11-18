from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api import ObservationViewSet
from .api import (
    RegisterView, PasswordResetRequestView, PasswordResetConfirmView, MeView,
    ClassifyObservationView, ValidateInferenceView, PredictPreviewView,
    ObservationSummaryView, ObservationExportCsvView, ObservationExportPdfView,
)

router = DefaultRouter()
router.register("observations", ObservationViewSet, basename="observation")

urlpatterns = [
    path("", include(router.urls)),

    # Auth
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/password/reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password/reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("auth/me/", MeView.as_view(), name="me"),

    # IA helpers
    path("observations/<int:observation_id>/classify/", ClassifyObservationView.as_view(), name="classify_observation"),
    path("inferences/<int:inference_id>/validate/", ValidateInferenceView.as_view(), name="validate_inference"),
    path("predict_preview/", PredictPreviewView.as_view(), name="predict_preview"),

    #Reportes
    path("reports/observations/summary/",ObservationSummaryView.as_view(),name="observations_summary",),
    path("reports/observations/export/",ObservationExportCsvView.as_view(),name="observations_export_csv",),
    path("reports/observations/export_pdf/",ObservationExportPdfView.as_view(),name="observations_export_pdf",
    ),
]
