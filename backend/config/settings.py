"""
Django settings for the Divine Solutions Healthcare CMS/API project.
"""
import os
from datetime import timedelta
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

_INSECURE_DEFAULT_SECRET = "django-insecure-change-me-in-production-)zx=oi$$71%akm=w9"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _INSECURE_DEFAULT_SECRET)

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

# Hard safety net: refuse to start in production with the placeholder secret
# key. This is deliberately a startup crash, not a warning -- a leaked/
# guessable SECRET_KEY lets an attacker forge session data and password-reset
# tokens, so "it still runs, just less securely" is the wrong failure mode.
if not DEBUG and (SECRET_KEY == _INSECURE_DEFAULT_SECRET or SECRET_KEY.startswith("django-insecure")):
    raise ImproperlyConfigured(
        "Refusing to start with DJANGO_DEBUG=False and the placeholder DJANGO_SECRET_KEY. "
        "Generate a real one first: python3 -c \"import secrets; print(secrets.token_urlsafe(50))\" "
        "and set it as DJANGO_SECRET_KEY in your .env."
    )

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "cms",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "cms.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database (PostgreSQL). Falls back to env vars so it works in docker-compose.
# ---------------------------------------------------------------------------
import dj_database_url

# Platforms like Render, Heroku and Railway provide a single DATABASE_URL
# connection string for their managed Postgres rather than separate
# host/user/password vars. Prefer it when present; fall back to the
# individual POSTGRES_* vars for docker-compose / plain local setups.
_DATABASE_URL = os.environ.get("DATABASE_URL")
if _DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(_DATABASE_URL, conn_max_age=600, ssl_require=True),
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "divine_solutions"),
            "USER": os.environ.get("POSTGRES_USER", "postgres"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
            "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/New_York"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise serves collected static files (Django admin CSS/JS, DRF
# browsable API assets) directly from the app process. Render (and this
# project generally) has no separate nginx/CDN layer in front for that, so
# without this the Django admin at DJANGO_ADMIN_PATH would render unstyled
# in production. Compressed + hashed filenames for cache-busting.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# DRF / JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
        "public_form": "5/minute",
        "login_form": "8/minute",
    },
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
}

SIMPLE_JWT = {
    # Admins should NOT stay logged in indefinitely. The access token is
    # short-lived; the refresh token gives an absolute session cap (it is
    # NOT rotated/renewed on each use, so a session always expires this many
    # hours after login regardless of activity -- combined with the
    # frontend's idle-timeout auto-logout for inactivity).
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=12),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---------------------------------------------------------------------------
# CORS - frontend dev server
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
).split(",")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

# ---------------------------------------------------------------------------
# Email (for admin notifications on new submissions) - console backend by default
# ---------------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "Info@divinesolutions.care")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "website@divinesolutions.care")

# Base URL of the frontend app, used to build links inside emails
# (e.g. the first-login "set your password" invitation link).
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5180")

# Max upload size for media library / resumes (10MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ---------------------------------------------------------------------------
# Security response headers. Split between "always on" (safe in dev too) and
# "production only" (things that would break plain-http local development,
# e.g. forcing HTTPS redirects or secure-only cookies).
# ---------------------------------------------------------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# The production stack terminates TLS at Caddy, which proxies to this app
# over plain HTTP on the internal Docker network. Without this, Django can't
# tell the original request was HTTPS and SECURE_SSL_REDIRECT below would
# redirect-loop. Caddy's reverse_proxy sets X-Forwarded-Proto automatically.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
