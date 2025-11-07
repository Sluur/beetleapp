"""
Django settings for beetleapp project.
Django 5.2.x
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta
# Carga variables del .env (debe estar junto a manage.py)
load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Seguridad / Debug ---
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-not-for-prod")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

# --- Apps ---
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceros / API
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "corsheaders",

    # Tu app
    "app",
]

# --- Middleware (CORS debe ir arriba de CommonMiddleware) ---
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",

    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --- CORS (para frontend en Vite) ---
CORS_ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# --- URLs / WSGI ---
ROOT_URLCONF = "beetleapp.urls"
WSGI_APPLICATION = "beetleapp.wsgi.application"

# --- Templates ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # opcionales útiles:
    "ROTATE_REFRESH_TOKENS": True,   # te da refresh nuevo al refrescar
    "BLACKLIST_AFTER_ROTATION": True,
    # "ALGORITHM": "HS256",
    # "SIGNING_KEY": SECRET_KEY,
}

# --- Base de datos (MySQL) ---
# Asegúrate de tener en beetleapp/__init__.py:
#   import pymysql
#   pymysql.install_as_MySQLdb()
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "beetleapp"),
        "USER": os.getenv("DB_USER", "beetle"),
        "PASSWORD": os.getenv("DB_PASSWORD", "supersegura"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
            "sql_mode": "STRICT_TRANS_TABLES",
        },
    }
}

# --- DRF ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",  # si usas JWT
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",  # cambia a IsAuthenticatedOrReadOnly si querés lectura pública
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"user": "1000/day", "anon": "100/day"},
}

# --- OpenAPI (opcional, para /schema/) ---
SPECTACULAR_SETTINGS = {
    "TITLE": "BeetleApp API",
    "DESCRIPTION": "API de BeetleApp (Django REST Framework)",
    "VERSION": "1.0.0",
}

# --- Auth / Login redirects (si usas vistas con login) ---
LOGIN_URL = "/accounts/login"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"



# --- i18n / tz ---
LANGUAGE_CODE = "es-ar"
TIME_ZONE = "America/Argentina/Salta"
USE_I18N = True
USE_TZ = True

# --- Static / Media ---
STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]  # carpeta opcional para assets del proyecto

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Default PK ---
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AI_PREDICT_URL = "http://localhost:5001/predict"
