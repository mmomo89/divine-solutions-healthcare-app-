from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as serve_static
import os

# Configurable via env var so the Django built-in admin (superuser tooling,
# separate from the CMS's own React admin) doesn't sit at the very
# predictable default "/admin/" path either.
DJANGO_ADMIN_PATH = os.environ.get("DJANGO_ADMIN_PATH", "admin/django/")

urlpatterns = [
    path(DJANGO_ADMIN_PATH, admin.site.urls),
    path("api/", include("cms.urls")),
]

# Media (user uploads: hero images, media library, resumes) is served by
# Django in every environment, not just DEBUG. This project has no separate
# file-serving layer (CDN/nginx/Caddy) in front of it on platforms like
# Render, so gating this behind DEBUG would 404 every uploaded image and
# resume in production. Traffic here is modest enough that Django serving
# these directly is a fine trade-off; a CDN/object-storage backend (e.g.
# django-storages + S3) is the natural upgrade path if that changes.
#
# Deliberately NOT using django.conf.urls.static.static() here: that
# helper has an internal `if not settings.DEBUG: return []` check of its
# own, so wrapping (or not wrapping) the call in an external DEBUG check
# has no effect either way -- it silently no-ops in production regardless.
# Registering the view directly bypasses that.
urlpatterns += [
    re_path(
        r"^%s(?P<path>.*)$" % settings.MEDIA_URL.lstrip("/"),
        serve_static,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
