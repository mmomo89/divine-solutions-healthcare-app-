from django.contrib.auth.models import User
from rest_framework import serializers

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


class MediaItemSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = ["id", "file", "url", "alt_text", "title", "uploaded_by", "created_at"]
        read_only_fields = ["uploaded_by", "created_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return None
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class NavigationItemSerializer(serializers.ModelSerializer):
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = NavigationItem
        fields = "__all__"

    def get_icon_url(self, obj):
        request = self.context.get("request")
        if not obj.icon or not obj.icon.file:
            return None
        return request.build_absolute_uri(obj.icon.file.url) if request else obj.icon.file.url


class PageSectionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    slide_image_urls = serializers.SerializerMethodField()

    class Meta:
        model = PageSection
        fields = [
            "id", "page", "section_type", "heading", "subheading", "body",
            "image", "image_url", "slide_image_urls", "cta_text", "cta_link", "anchor_id", "data",
            "is_visible", "sort_order", "created_at", "updated_at",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image or not obj.image.file:
            return None
        return request.build_absolute_uri(obj.image.file.url) if request else obj.image.file.url

    def get_slide_image_urls(self, obj):
        """For section_type='hero_slider': resolves the MediaItem ids stored
        under data['images'] into absolute URLs, preserving order."""
        ids = (obj.data or {}).get("images") or []
        if not ids:
            return []
        request = self.context.get("request")
        items = {m.id: m for m in MediaItem.objects.filter(id__in=ids)}
        urls = []
        for i in ids:
            item = items.get(i)
            if item and item.file:
                urls.append(request.build_absolute_uri(item.file.url) if request else item.file.url)
        return urls


class PageSerializer(serializers.ModelSerializer):
    sections = PageSectionSerializer(many=True, read_only=True)
    hero_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id", "slug", "title", "breadcrumb_label", "seo_title",
            "meta_description", "og_image", "hero_image", "hero_image_url",
            "hero_heading", "hero_subheading", "status", "sections",
            "created_at", "updated_at",
        ]

    def get_hero_image_url(self, obj):
        request = self.context.get("request")
        if not obj.hero_image or not obj.hero_image.file:
            return None
        return request.build_absolute_uri(obj.hero_image.file.url) if request else obj.hero_image.file.url


class ServiceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id", "title", "slug", "description", "image", "image_url",
            "link_url", "region", "status", "sort_order",
            "created_at", "updated_at",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image or not obj.image.file:
            return None
        return request.build_absolute_uri(obj.image.file.url) if request else obj.image.file.url


class ResourceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id", "title", "description", "image", "image_url",
            "external_url", "document", "document_url", "status",
            "sort_order", "created_at", "updated_at",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image or not obj.image.file:
            return None
        return request.build_absolute_uri(obj.image.file.url) if request else obj.image.file.url

    def get_document_url(self, obj):
        request = self.context.get("request")
        if not obj.document or not obj.document.file:
            return None
        return request.build_absolute_uri(obj.document.file.url) if request else obj.document.file.url


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo_light_url = serializers.SerializerMethodField()
    logo_dark_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    display_copyright = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = "__all__"

    def _file_url(self, media_item):
        request = self.context.get("request")
        if not media_item or not media_item.file:
            return None
        return request.build_absolute_uri(media_item.file.url) if request else media_item.file.url

    def get_logo_light_url(self, obj):
        return self._file_url(obj.logo_light)

    def get_logo_dark_url(self, obj):
        return self._file_url(obj.logo_dark)

    def get_favicon_url(self, obj):
        return self._file_url(obj.favicon)

    def get_display_copyright(self, obj):
        if obj.auto_update_copyright_year:
            import datetime
            year = datetime.date.today().year
            return f"\u00a9 Copyright 2024 - {year}"
        return obj.copyright_text


class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = [
            "id", "form_type", "full_name", "email", "phone", "message",
            "extra_data", "resume", "privacy_accepted", "source_page",
            "ip_address", "status", "admin_notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "ip_address", "created_at", "updated_at"]

    def validate_privacy_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Privacy Policy to submit this form.")
        return value

    def validate_full_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Full name is required.")
        return value.strip()


class SubmissionReplySerializer(serializers.ModelSerializer):
    sent_by_display = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionReply
        fields = ["id", "submission", "subject", "body", "to_email", "sent_by", "sent_by_display", "status", "error_message", "created_at"]
        read_only_fields = ["id", "sent_by", "status", "error_message", "created_at"]

    def get_sent_by_display(self, obj):
        return obj.sent_by.get_username() if obj.sent_by else "System"


class FormSubmissionAdminSerializer(serializers.ModelSerializer):
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = FormSubmission
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_resume_url(self, obj):
        request = self.context.get("request")
        if not obj.resume or not obj.resume.file:
            return None
        return request.build_absolute_uri(obj.resume.file.url) if request else obj.resume.file.url


class ActivityLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ["id", "user", "user_display", "action", "description", "created_at"]

    def get_user_display(self, obj):
        return obj.user.get_username() if obj.user else "System"


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=[("super_admin", "Super Admin"), ("content_admin", "Content Admin")], required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    needs_setup = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "role", "password", "needs_setup", "must_change_password", "is_locked", "date_joined", "last_login"]
        read_only_fields = ["date_joined", "last_login"]

    def get_needs_setup(self, obj):
        profile = getattr(obj, "profile", None)
        return bool(profile and not profile.password_set)

    def get_must_change_password(self, obj):
        profile = getattr(obj, "profile", None)
        return bool(profile and profile.must_change_password)

    def get_is_locked(self, obj):
        profile = getattr(obj, "profile", None)
        return bool(profile and profile.is_locked)

    def to_representation(self, instance):
        # Compute a display-only `role` attribute (derived from is_superuser +
        # AdminProfile.role) before the default ModelSerializer field lookup
        # runs, so it reflects real state rather than requiring a DB column.
        profile = getattr(instance, "profile", None)
        instance.role = "super_admin" if instance.is_superuser else (profile.role if profile else "content_admin")
        return super().to_representation(instance)

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def create(self, validated_data):
        from .models import AdminProfile as _AdminProfile

        role = validated_data.pop("role", "content_admin")
        # Creation never accepts a Super-Admin-typed password: new users
        # always set their own password via the emailed first-login link.
        validated_data.pop("password", None)
        user = User(**validated_data)
        user.is_staff = True
        user.is_superuser = role == "super_admin"
        user.set_unusable_password()
        user.save()
        _AdminProfile.objects.update_or_create(user=user, defaults={"role": role, "password_set": False})
        return user

    def update(self, instance, validated_data):
        from .models import AdminProfile as _AdminProfile

        role = validated_data.pop("role", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if role:
            instance.is_superuser = role == "super_admin"
            _AdminProfile.objects.update_or_create(user=instance, defaults={"role": role})
        instance.save()
        return instance
