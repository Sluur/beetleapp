from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # HTML (server-rendered)
    path("observations/", views.observation_list, name="observation_list"),

    # API (JSON)
    path("api/observations/", views.observation_list, name="observations_list"),
    path("api/observations/create/", views.observation_create, name="observation_create"),
    path("api/observations/<int:observation_id>/classify/", views.api_classify_observation, name="api_classify_observation"),
    path("api/inferences/<int:inference_id>/validate/", views.api_validate_inference, name="api_validate_inference"),
    path("api/predict_preview/", views.api_predict_preview, name="api_predict_preview"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)