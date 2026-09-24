import csv
import datetime
import io
import json
import secrets
import zipfile

from .extra_data_utils import format_extra_value, humanize_key

from django.conf import settings as django_settings
from django.contrib.auth.models import User
from django.core.mail import EmailMessage, send_mail
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    AdminProfile,
    ActivityLog,
    FormSubmission,
    MediaItem,
    NavigationItem,
    Page,
    PageSection,
    Resource,
    Service,
    SiteSettings,
    SubmissionReply,
)
from .pdf_utils import generate_submission_pdf
from .permissions import IsAuthenticatedAdmin, IsSuperAdmin, ReadOnlyOrAdmin
from .serializers import (
    AdminUserSerializer,
    ActivityLogSerializer,
    FormSubmissionAdminSerializer,
    FormSubmissionSerializer,
    MediaItemSerializer,
    NavigationItemSerializer,
    PageSectionSerializer,
    PageSerializer,
    ResourceSerializer,
    ServiceSerializer,
    SiteSettingsSerializer,
    SubmissionReplySerializer,
)


def log_activity(request, action, description=""):
    user = request.user if request.user.is_authenticated else None
    ActivityLog.objects.create(user=user, action=action, description=description)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Public, unauthenticated endpoint for platform health checks (Render,
    Docker healthcheck, uptime monitors). Verifies the database connection
    actually works, not just that the process is alive -- a process that's
    up but can't reach Postgres should be reported unhealthy so the
    platform can restart/reroute rather than serving broken responses."""
    from django.db import connection

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as exc:
        return Response({"status": "error", "detail": str(exc)}, status=503)
    return Response({"status": "ok"})


class LoginThrottle(AnonRateThrottle):
    """Stricter than the default anon rate -- login is a brute-force target,
    so it gets its own tighter limit regardless of how obscure the frontend
    URL that reaches it is."""
    scope = "login_form"


LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION = datetime.timedelta(minutes=30)


class LoginView(TokenObtainPairView):
    """POST username/password -> access/refresh tokens.

    Adds account-lockout brute-force protection (per-account, independent of
    the endpoint's per-IP rate limit -- catches distributed attacks against
    one username), and logs both successful and failed attempts.
    """
    throttle_classes = [LoginThrottle]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "")

        user = User.objects.filter(username=username).first()
        profile = getattr(user, "profile", None) if user else None

        if profile and profile.is_locked:
            remaining_minutes = max(1, int((profile.locked_until - timezone.now()).total_seconds() // 60) + 1)
            ActivityLog.objects.create(
                user=user, action="login_blocked",
                description=f"Login blocked for '{username}' -- account locked ({remaining_minutes} min remaining)",
            )
            return Response(
                {"detail": f"This account is temporarily locked after repeated failed login attempts. "
                           f"Try again in {remaining_minutes} minute(s)."},
                status=status.HTTP_423_LOCKED,
            )

        try:
            response = super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            if profile:
                profile.failed_login_attempts += 1
                locked_now = profile.failed_login_attempts >= LOCKOUT_THRESHOLD
                if locked_now:
                    profile.locked_until = timezone.now() + LOCKOUT_DURATION
                profile.save(update_fields=["failed_login_attempts", "locked_until"])
                if locked_now:
                    ActivityLog.objects.create(
                        user=user, action="account_locked",
                        description=f"'{username}' locked for {LOCKOUT_DURATION.seconds // 60} minutes "
                                    f"after {profile.failed_login_attempts} failed login attempts",
                    )
            ActivityLog.objects.create(
                user=None, action="login_failed",
                description=f"Failed login attempt for username '{username}'",
            )
            raise

        if response.status_code == 200:
            if profile and (profile.failed_login_attempts or profile.locked_until):
                profile.failed_login_attempts = 0
                profile.locked_until = None
                profile.save(update_fields=["failed_login_attempts", "locked_until"])
            ActivityLog.objects.create(user=user, action="login", description="Admin logged in")
        return response


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "GET":
        return Response(AdminUserSerializer(request.user).data)

    # Self-service profile update: username/email/name only. Deliberately
    # excludes role/is_active/password -- role changes go through the
    # Super-Admin-only AdminUserViewSet, and password changes go through
    # change_password (which requires the current password).
    allowed_fields = {"username", "email", "first_name", "last_name"}
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    serializer = AdminUserSerializer(request.user, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    log_activity(request, "profile_updated", f"{request.user.username} updated their profile")
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_own_password(request):
    """Any authenticated admin (Super Admin or Content Admin) can change
    their own password, provided they supply their current password."""
    current = request.data.get("current_password", "")
    new = request.data.get("new_password", "")
    if not request.user.check_password(current):
        return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
    if not new or len(new) < 8:
        return Response({"detail": "New password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(new)
    request.user.save()
    profile = getattr(request.user, "profile", None)
    if profile and profile.must_change_password:
        profile.must_change_password = False
        profile.save(update_fields=["must_change_password"])
    log_activity(request, "password_changed", f"{request.user.username} changed their own password")
    return Response({"detail": "Password updated successfully."})


# ---------------------------------------------------------------------------
# Public read-only content endpoints (also used, with auth, for admin CRUD)
# ---------------------------------------------------------------------------
class PageViewSet(viewsets.ModelViewSet):
    serializer_class = PageSerializer
    lookup_field = "slug"
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = Page.objects.all().prefetch_related("sections")
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(status="published")
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "page_created", f"Created page '{instance.title}'")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "page_updated", f"Updated page '{instance.title}' (status={instance.status})")

    def perform_destroy(self, instance):
        log_activity(self.request, "page_deleted", f"Deleted page '{instance.title}'")
        instance.delete()


class PageSectionViewSet(viewsets.ModelViewSet):
    serializer_class = PageSectionSerializer
    permission_classes = [IsAuthenticatedAdmin]
    queryset = PageSection.objects.all()
    filterset_fields = ["page", "section_type"]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "section_created", f"Added a '{instance.section_type}' section to {instance.page.slug}")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "section_updated", f"Updated section '{instance.section_type}' on {instance.page.slug}")

    def perform_destroy(self, instance):
        log_activity(self.request, "section_deleted", f"Deleted a '{instance.section_type}' section from {instance.page.slug}")
        instance.delete()

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """Bulk-update sort_order after a drag-and-drop reorder in the CMS.
        Body: {"items": [{"id": 1, "sort_order": 0}, {"id": 2, "sort_order": 1}, ...]}
        """
        items = request.data.get("items", [])
        ids = [item["id"] for item in items]
        sections = {s.id: s for s in PageSection.objects.filter(id__in=ids)}
        updated = []
        for item in items:
            section = sections.get(item["id"])
            if section:
                section.sort_order = item["sort_order"]
                updated.append(section)
        PageSection.objects.bulk_update(updated, ["sort_order"])
        if updated:
            log_activity(request, "sections_reordered", f"Reordered {len(updated)} section(s) on {updated[0].page.slug}")
        return Response({"status": "ok", "updated": len(updated)})


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [ReadOnlyOrAdmin]
    filterset_fields = ["region", "status"]

    def get_queryset(self):
        qs = Service.objects.all()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(status="published")
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "service_created", f"Created service '{instance.title}'")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "service_updated", f"Updated service '{instance.title}'")

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticatedAdmin])
    def reorder(self, request):
        """Bulk-update sort_order after a drag-and-drop reorder in the CMS.
        Body: {"items": [{"id": 1, "sort_order": 0}, ...]}
        """
        items = request.data.get("items", [])
        ids = [item["id"] for item in items]
        services = {s.id: s for s in Service.objects.filter(id__in=ids)}
        updated = []
        for item in items:
            service = services.get(item["id"])
            if service:
                service.sort_order = item["sort_order"]
                updated.append(service)
        Service.objects.bulk_update(updated, ["sort_order"])
        if updated:
            log_activity(request, "services_reordered", f"Reordered {len(updated)} service(s)")
        return Response({"status": "ok", "updated": len(updated)})


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = Resource.objects.all()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(status="published")
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "resource_created", f"Created resource '{instance.title}'")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "resource_updated", f"Updated resource '{instance.title}'")

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticatedAdmin])
    def reorder(self, request):
        items = request.data.get("items", [])
        ids = [item["id"] for item in items]
        resources = {r.id: r for r in Resource.objects.filter(id__in=ids)}
        updated = []
        for item in items:
            resource = resources.get(item["id"])
            if resource:
                resource.sort_order = item["sort_order"]
                updated.append(resource)
        Resource.objects.bulk_update(updated, ["sort_order"])
        if updated:
            log_activity(request, "resources_reordered", f"Reordered {len(updated)} resource(s)")
        return Response({"status": "ok", "updated": len(updated)})


class NavigationViewSet(viewsets.ModelViewSet):
    serializer_class = NavigationItemSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = NavigationItem.objects.all()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_visible=True)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "nav_item_created", f"Added menu item '{instance.label}' ({instance.location})")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(self.request, "nav_item_updated", f"Updated menu item '{instance.label}'")

    def perform_destroy(self, instance):
        log_activity(self.request, "nav_item_deleted", f"Deleted menu item '{instance.label}'")
        instance.delete()


class MediaItemViewSet(viewsets.ModelViewSet):
    serializer_class = MediaItemSerializer
    permission_classes = [IsAuthenticatedAdmin]
    queryset = MediaItem.objects.all().order_by("-created_at")
    search_fields = ["title", "alt_text"]

    def perform_create(self, serializer):
        instance = serializer.save(uploaded_by=self.request.user)
        log_activity(self.request, "media_uploaded", f"Uploaded media '{instance.title or instance.file.name}'")

    def perform_destroy(self, instance):
        log_activity(self.request, "media_deleted", f"Deleted media '{instance.title or instance.file.name}'")
        instance.delete()


class SiteSettingsView(APIView):
    permission_classes = [ReadOnlyOrAdmin]

    def get(self, request):
        obj, _ = SiteSettings.objects.get_or_create(pk=1)
        return Response(SiteSettingsSerializer(obj, context={"request": request}).data)

    def patch(self, request):
        obj, _ = SiteSettings.objects.get_or_create(pk=1)
        serializer = SiteSettingsSerializer(obj, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_activity(request, "settings_updated", "Updated site settings")
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Public form submission (contact + careers) with rate limiting
# ---------------------------------------------------------------------------
class PublicFormThrottle(AnonRateThrottle):
    scope = "public_form"


class SubmitFormView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PublicFormThrottle]

    ALLOWED_RESUME_EXTENSIONS = (".pdf", ".doc", ".docx", ".txt")
    MAX_RESUME_SIZE = 10 * 1024 * 1024  # 10MB

    def post(self, request):
        raw = request.data

        # extra_data arrives as a JSON string when the request is
        # multipart/form-data (careers applications with a resume file);
        # it arrives as a native dict when the request is plain JSON
        # (the simpler contact form).
        extra_data_raw = raw.get("extra_data", {})
        if isinstance(extra_data_raw, str):
            try:
                extra_data = json.loads(extra_data_raw) if extra_data_raw else {}
            except ValueError:
                extra_data = {}
        elif isinstance(extra_data_raw, dict):
            extra_data = extra_data_raw
        else:
            extra_data = {}

        privacy_raw = raw.get("privacy_accepted", False)
        privacy_accepted = privacy_raw in (True, "true", "True", "1", 1)

        payload = {
            "form_type": raw.get("form_type", "contact"),
            "full_name": raw.get("full_name", ""),
            "email": raw.get("email", ""),
            "phone": raw.get("phone", ""),
            "message": raw.get("message", ""),
            "privacy_accepted": privacy_accepted,
            "source_page": raw.get("source_page", ""),
            "extra_data": extra_data,
        }

        serializer = FormSubmissionSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR"))
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()
        submission = serializer.save(status="new", ip_address=ip)

        resume_file = request.FILES.get("resume")
        if resume_file:
            ext = "." + resume_file.name.rsplit(".", 1)[-1].lower() if "." in resume_file.name else ""
            if ext not in self.ALLOWED_RESUME_EXTENSIONS:
                submission.delete()
                return Response(
                    {"detail": f"Resume must be one of: {', '.join(self.ALLOWED_RESUME_EXTENSIONS)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if resume_file.size > self.MAX_RESUME_SIZE:
                submission.delete()
                return Response({"detail": "Resume file is too large (10MB max)."}, status=status.HTTP_400_BAD_REQUEST)
            media_item = MediaItem.objects.create(
                file=resume_file,
                title=f"Resume \u2014 {submission.full_name}",
                alt_text=f"Resume submitted by {submission.full_name}",
            )
            submission.resume = media_item
            submission.save(update_fields=["resume"])

        log_activity(request, "form_submitted", f"New {submission.form_type} submission from {submission.full_name}")
        _notify_admin_of_submission(submission)
        return Response(
            {"message": "Thank you \u2014 your message has been received. Our team will be in touch soon.",
             "id": str(submission.id)},
            status=status.HTTP_201_CREATED,
        )


def _notify_admin_of_submission(submission):
    """Send a real email notification to the admin inbox on new submissions.
    Uses whatever EMAIL_BACKEND is configured (console backend by default in dev;
    configure EMAIL_HOST/EMAIL_HOST_USER/etc. via env vars for real SMTP delivery)."""
    subject = f"New {submission.get_form_type_display()} submission \u2014 {submission.full_name}"
    lines = [
        f"A new {submission.get_form_type_display().lower()} submission was received on the website.",
        "",
        f"Name: {submission.full_name}",
        f"Email: {submission.email}",
        f"Phone: {submission.phone or '\u2014'}",
        f"Source page: {submission.source_page or '\u2014'}",
        f"Submitted: {submission.created_at.strftime('%B %d, %Y %I:%M %p') if submission.created_at else ''}",
    ]
    for key, val in (submission.extra_data or {}).items():
        lines.append(f"{humanize_key(key)}: {format_extra_value(val, multiline=True)}")
    if submission.message:
        lines += ["", "Message:", submission.message]
    lines += ["", f"View in the admin CMS: Form Submissions \u2192 {submission.id}"]
    try:
        send_mail(
            subject=subject,
            message="\n".join(lines),
            from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", django_settings.ADMIN_NOTIFICATION_EMAIL),
            recipient_list=[django_settings.ADMIN_NOTIFICATION_EMAIL],
            fail_silently=True,
        )
    except Exception:
        # Never let a notification failure block the actual form submission.
        pass


# ---------------------------------------------------------------------------
# Admin: Form submissions management
# ---------------------------------------------------------------------------
class FormSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = FormSubmissionAdminSerializer
    permission_classes = [IsAuthenticatedAdmin]
    queryset = FormSubmission.objects.all()
    filterset_fields = ["status", "form_type"]
    search_fields = ["full_name", "email", "message"]

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            log_activity(
                self.request, "submission_status_changed",
                f"Submission {instance.id} status: {old_status} -> {instance.status}",
            )

    @action(detail=True, methods=["get", "post"])
    def replies(self, request, pk=None):
        """GET: reply history for this submission.
        POST {"subject": ..., "body": ...}: send a real email reply to the
        submitter, record it, and auto-advance status out of New/Read."""
        submission = self.get_object()

        if request.method == "GET":
            qs = submission.replies.all()
            return Response(SubmissionReplySerializer(qs, many=True).data)

        subject = (request.data.get("subject") or "").strip()
        body = (request.data.get("body") or "").strip()
        if not subject or not body:
            return Response({"detail": "Subject and body are both required."}, status=400)

        reply = SubmissionReply.objects.create(
            submission=submission,
            subject=subject,
            body=body,
            to_email=submission.email,
            sent_by=request.user if request.user.is_authenticated else None,
        )

        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", django_settings.ADMIN_NOTIFICATION_EMAIL),
                to=[submission.email],
                reply_to=[django_settings.ADMIN_NOTIFICATION_EMAIL],
            )
            email.send(fail_silently=False)
            reply.status = "sent"
        except Exception as exc:  # noqa: BLE001 - surface any SMTP error to the admin
            reply.status = "failed"
            reply.error_message = str(exc)
        reply.save(update_fields=["status", "error_message"])

        if reply.status == "sent" and submission.status in ("new", "read"):
            submission.status = "in_progress"
            submission.save(update_fields=["status"])

        log_activity(
            request,
            "submission_reply_sent" if reply.status == "sent" else "submission_reply_failed",
            f"Reply to {submission.email} re: \"{subject}\"" + ("" if reply.status == "sent" else f" (FAILED: {reply.error_message})"),
        )

        status_code = status.HTTP_201_CREATED if reply.status == "sent" else status.HTTP_502_BAD_GATEWAY
        return Response(SubmissionReplySerializer(reply).data, status=status_code)


@api_view(["GET"])
@permission_classes([IsAuthenticatedAdmin])
def download_submission_pdf(request, pk):
    try:
        submission = FormSubmission.objects.get(pk=pk)
    except FormSubmission.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)
    pdf_bytes = generate_submission_pdf(submission)
    log_activity(request, "pdf_generated", f"Generated PDF for submission {submission.id}")
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="submission-{submission.id}.pdf"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticatedAdmin])
def bulk_download_submissions_pdf(request):
    """Bundle several submission PDFs into a single ZIP file.

    Accepts either an explicit ?ids=uuid1,uuid2,... list, or falls back to the
    same ?status=&form_type= filters used by the CSV export (capped at 200
    submissions per request to keep response times reasonable).
    """
    ids_param = request.GET.get("ids")
    qs = FormSubmission.objects.all()
    if ids_param:
        id_list = [i.strip() for i in ids_param.split(",") if i.strip()]
        qs = qs.filter(id__in=id_list)
    else:
        status_filter = request.GET.get("status")
        form_type_filter = request.GET.get("form_type")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if form_type_filter:
            qs = qs.filter(form_type=form_type_filter)
        qs = qs[:200]

    submissions = list(qs)
    if not submissions:
        return Response({"detail": "No matching submissions found."}, status=404)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for submission in submissions:
            pdf_bytes = generate_submission_pdf(submission)
            safe_name = "".join(c for c in submission.full_name if c.isalnum() or c in " -_").strip() or "submission"
            filename = f"{submission.created_at.strftime('%Y-%m-%d')}_{safe_name}_{submission.id}.pdf"
            zf.writestr(filename, pdf_bytes)

    log_activity(request, "bulk_pdf_generated", f"Generated bulk PDF export of {len(submissions)} submission(s)")
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type="application/zip")
    response["Content-Disposition"] = 'attachment; filename="submissions-pdf-export.zip"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticatedAdmin])
def export_submissions_csv(request):
    qs = FormSubmission.objects.all()
    status_filter = request.GET.get("status")
    form_type_filter = request.GET.get("form_type")
    if status_filter:
        qs = qs.filter(status=status_filter)
    if form_type_filter:
        qs = qs.filter(form_type=form_type_filter)

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="submissions.csv"'
    writer = csv.writer(response)
    writer.writerow(["ID", "Form Type", "Full Name", "Email", "Phone", "Message", "Status", "Source Page", "Submitted At"])
    for s in qs:
        writer.writerow([s.id, s.form_type, s.full_name, s.email, s.phone, s.message, s.status, s.source_page, s.created_at])
    log_activity(request, "csv_export", "Exported submissions CSV")
    return response


# ---------------------------------------------------------------------------
# Admin dashboard
# ---------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticatedAdmin])
def dashboard_stats(request):
    subs = FormSubmission.objects.all()
    data = {
        "total_pages": Page.objects.count(),
        "published_pages": Page.objects.filter(status="published").count(),
        "draft_pages": Page.objects.filter(status="draft").count(),
        "total_submissions": subs.count(),
        "new_submissions": subs.filter(status="new").count(),
        "read_submissions": subs.filter(status="read").count(),
        "in_progress_submissions": subs.filter(status="in_progress").count(),
        "completed_submissions": subs.filter(status="completed").count(),
        "archived_submissions": subs.filter(status="archived").count(),
        "total_resources": Resource.objects.count(),
        "total_services": Service.objects.count(),
        "recent_submissions": FormSubmissionAdminSerializer(subs[:8], many=True, context={"request": request}).data,
        "recent_activity": ActivityLogSerializer(ActivityLog.objects.all()[:12], many=True).data,
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticatedAdmin])
def global_search(request):
    q = request.GET.get("q", "").strip()
    if not q:
        return Response({"pages": [], "services": [], "resources": [], "submissions": [], "media": []})
    pages = Page.objects.filter(title__icontains=q)[:10]
    services = Service.objects.filter(title__icontains=q)[:10]
    resources = Resource.objects.filter(title__icontains=q)[:10]
    submissions = FormSubmission.objects.filter(full_name__icontains=q)[:10]
    media = MediaItem.objects.filter(title__icontains=q)[:10]
    return Response({
        "pages": PageSerializer(pages, many=True, context={"request": request}).data,
        "services": ServiceSerializer(services, many=True, context={"request": request}).data,
        "resources": ResourceSerializer(resources, many=True, context={"request": request}).data,
        "submissions": FormSubmissionAdminSerializer(submissions, many=True, context={"request": request}).data,
        "media": MediaItemSerializer(media, many=True, context={"request": request}).data,
    })


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticatedAdmin]
    queryset = ActivityLog.objects.all()


# ---------------------------------------------------------------------------
# Admin: user management (Super Admin only)
# ---------------------------------------------------------------------------
def _create_invitation(user):
    """Generate a fresh one-time setup token for a new/reset admin account,
    email it (best-effort), and return the setup link so the Super Admin
    can also copy/share it directly (handy when EMAIL_BACKEND is the
    console backend, as in local dev)."""
    profile, _ = AdminProfile.objects.get_or_create(user=user, defaults={"role": "content_admin"})
    token = secrets.token_urlsafe(32)
    profile.invitation_token = token
    profile.invitation_sent_at = timezone.now()
    profile.password_set = False
    profile.save(update_fields=["invitation_token", "invitation_sent_at", "password_set"])

    link = f"{django_settings.FRONTEND_URL}/admin/set-password/{token}"
    try:
        send_mail(
            subject="Set up your Divine Solutions Healthcare admin account",
            message=(
                f"Hi {user.username},\n\n"
                "An administrator account has been created for you on the Divine Solutions "
                "Healthcare LLC content management system.\n\n"
                f"Set your password to activate your account:\n{link}\n\n"
                "This link expires in 7 days. If you weren't expecting this, you can ignore this email."
            ),
            from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", django_settings.ADMIN_NOTIFICATION_EMAIL),
            recipient_list=[user.email] if user.email else [],
            fail_silently=True,
        )
    except Exception:
        pass
    return link


INVITATION_LIFETIME = datetime.timedelta(days=7)


@api_view(["GET"])
@permission_classes([AllowAny])
def check_invitation(request, token):
    """Public: validates a first-login setup token before showing the
    'set your password' form."""
    try:
        profile = AdminProfile.objects.select_related("user").get(invitation_token=token)
    except AdminProfile.DoesNotExist:
        return Response({"detail": "This setup link is invalid or has already been used."}, status=404)
    if profile.password_set:
        return Response({"detail": "This setup link has already been used."}, status=410)
    if not profile.invitation_sent_at or timezone.now() - profile.invitation_sent_at > INVITATION_LIFETIME:
        return Response({"detail": "This setup link has expired. Ask a Super Admin to resend your invitation."}, status=410)
    return Response({"username": profile.user.username, "email": profile.user.email})


class InvitationThrottle(AnonRateThrottle):
    scope = "public_form"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([InvitationThrottle])
def accept_invitation(request, token):
    """Public: the new user sets their own password via their one-time link."""
    try:
        profile = AdminProfile.objects.select_related("user").get(invitation_token=token)
    except AdminProfile.DoesNotExist:
        return Response({"detail": "This setup link is invalid or has already been used."}, status=404)
    if profile.password_set:
        return Response({"detail": "This setup link has already been used."}, status=410)
    if not profile.invitation_sent_at or timezone.now() - profile.invitation_sent_at > INVITATION_LIFETIME:
        return Response({"detail": "This setup link has expired. Ask a Super Admin to resend your invitation."}, status=410)

    password = request.data.get("password", "")
    if not password or len(password) < 8:
        return Response({"detail": "Password must be at least 8 characters."}, status=400)

    user = profile.user
    user.set_password(password)
    user.save(update_fields=["password"])
    profile.password_set = True
    profile.invitation_token = None
    profile.invitation_sent_at = None
    profile.save(update_fields=["password_set", "invitation_token", "invitation_sent_at"])

    log_activity(request, "account_setup_completed", f"{user.username} completed first-login account setup")
    return Response({"detail": "Password set successfully. You can now sign in."})


class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.filter(is_staff=True)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        invite_link = _create_invitation(user)
        log_activity(request, "user_created", f"Created admin user '{user.username}' and sent a setup invitation")
        data = dict(serializer.data)
        data["invite_link"] = invite_link
        return Response(data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        instance = self.get_object()
        new_role = self.request.data.get("role")
        if instance.id == self.request.user.id and new_role and new_role != "super_admin":
            raise serializers.ValidationError({"detail": "You cannot remove your own Super Admin role."})
        updated = serializer.save()
        log_activity(self.request, "user_updated", f"Updated admin user '{updated.username}'")

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise serializers.ValidationError({"detail": "You cannot delete your own account."})
        log_activity(self.request, "user_deleted", f"Deleted admin user '{instance.username}'")
        instance.delete()

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        """Super Admin resets another user's password directly (no need to
        know their current password)."""
        user = self.get_object()
        new_password = request.data.get("new_password", "")
        if not new_password or len(new_password) < 8:
            return Response({"detail": "New password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        profile = getattr(user, "profile", None)
        if profile:
            profile.must_change_password = True
            profile.failed_login_attempts = 0
            profile.locked_until = None
            profile.save(update_fields=["must_change_password", "failed_login_attempts", "locked_until"])
        log_activity(request, "password_reset_by_admin", f"{request.user.username} reset the password for '{user.username}'")
        return Response({"detail": f"Password reset for {user.username}."})

    @action(detail=True, methods=["post"])
    def resend_invite(self, request, pk=None):
        """Re-issue a first-login setup link for a user who hasn't completed
        account setup yet (or whose original link expired)."""
        user = self.get_object()
        invite_link = _create_invitation(user)
        log_activity(request, "invite_resent", f"{request.user.username} resent the setup invitation to '{user.username}'")
        return Response({"invite_link": invite_link, "detail": f"Setup invitation resent to {user.username}."})
