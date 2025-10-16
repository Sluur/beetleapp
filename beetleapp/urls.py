from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),

    # Auth built-in de Django
    path('accounts/', include('django.contrib.auth.urls')),
    path('register/', views.register, name='register'),

    path('observations/', include('app.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)