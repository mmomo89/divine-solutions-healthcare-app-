from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r"pages", views.PageViewSet, basename="page")
router.register(r"page-sections", views.PageSectionViewSet, basename="pagesection")
router.register(r"services", views.ServiceViewSet, basename="service")
router.register(r"resources", views.ResourceViewSet, basename="resource")
router.register(r"navigation", views.NavigationViewSet, basename="navigation")
router.register(r"media", views.MediaItemViewSet, basename="media")
router.register(r"submissions", views.FormSubmissionViewSet, basename="submission")
router.register(r"users", views.AdminUserViewSet, basename="adminuser")

urlpatterns = [
    path("", include(router.urls)),

    # auth
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.me, name="me"),
    path("auth/change-password/", views.change_own_password, name="change_own_password"),

    # public form submission
    path("forms/submit/", views.SubmitFormView.as_view(), name="submit_form"),

    path("health/", views.health_check, name="health_check"),

    # first-login account setup (invitation flow)
    path("auth/invitation/<str:token>/", views.check_invitation, name="check_invitation"),
    path("auth/invitation/<str:token>/accept/", views.accept_invitation, name="accept_invitation"),

    # site settings (singleton)
    path("settings/", views.SiteSettingsView.as_view(), name="site_settings"),

    # admin dashboard + tools
    path("admin/dashboard/", views.dashboard_stats, name="dashboard_stats"),
    path("admin/search/", views.global_search, name="global_search"),
    path("admin/activity-log/", views.ActivityLogListView.as_view(), name="activity_log"),
    path("admin/submissions/<uuid:pk>/pdf/", views.download_submission_pdf, name="submission_pdf"),
    path("admin/submissions/export/csv/", views.export_submissions_csv, name="submissions_csv"),
    path("admin/submissions/export/pdf-bulk/", views.bulk_download_submissions_pdf, name="submissions_bulk_pdf"),
]
