import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AdminProfile(models.Model):
    ROLE_CHOICES = [
        ("super_admin", "Super Admin"),
        ("content_admin", "Content Admin"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="content_admin")

    # First-login password setup (invitation flow): a new user created by a
    # Super Admin has no usable password until they follow their one-time
    # setup link and choose their own password.
    password_set = models.BooleanField(default=True)
    invitation_token = models.CharField(max_length=64, blank=True, null=True, unique=True)
    invitation_sent_at = models.DateTimeField(null=True, blank=True)

    # Account lockout: brute-force protection independent of (and in addition
    # to) the login endpoint's rate limit. Tracked per-account rather than
    # per-IP so a distributed attack against one username still gets caught.
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    # True immediately after a Super Admin resets this user's password (the
    # user didn't choose it themselves) -- surfaced in the admin UI as a
    # "change your password" nudge, cleared automatically once they do.
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def is_super_admin(self):
        return self.role == "super_admin" or self.user.is_superuser

    @property
    def is_locked(self):
        return bool(self.locked_until and self.locked_until > timezone.now())


class MediaItem(TimeStampedModel):
    file = models.FileField(upload_to="media_library/")
    alt_text = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.title or self.file.name


class SiteSettings(TimeStampedModel):
    """Singleton table for global site settings."""
    company_name = models.CharField(max_length=255, default="Divine Solutions Healthcare LLC")
    phone = models.CharField(max_length=50, default="614-571-2711")
    email_primary = models.EmailField(default="Info@divinesolutions.care")
    email_secondary = models.EmailField(default="alexfallah@divinesolutions.care")
    address = models.CharField(
        max_length=500,
        default="2242 S. Hamilton Road, Suite 208, Columbus Ohio 43232",
    )
    map_embed_url = models.URLField(
        max_length=1000,
        blank=True,
        default="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3059.5710802923595!2d-82.87773729999999"
                "!3d39.928613899999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x883862ccfccdfc75"
                "%3A0x949505a676e6f524!2s2242%20S%20Hamilton%20Rd%20%23208%2C%20Columbus%2C%20OH%2043232%2C"
                "%20USA!5e0!3m2!1sen!2sph!4v1747174671756!5m2!1sen!2sph",
    )

    logo_light = models.ForeignKey(
        MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    logo_dark = models.ForeignKey(
        MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    favicon = models.ForeignKey(
        MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    primary_color = models.CharField(max_length=20, default="#1f2a24")
    secondary_color = models.CharField(max_length=20, default="#9ad176")
    tertiary_color = models.CharField(max_length=20, default="#409aff")

    facebook_url = models.URLField(blank=True, default="https://www.facebook.com/divinesolutionshealthcarellc")
    instagram_url = models.URLField(blank=True, default="https://www.instagram.com/divinesolutionshealthcarellc")

    footer_tagline = models.TextField(
        default="Contact us for more information, to schedule a consultation, or to learn more about how we can assist you."
    )
    copyright_text = models.CharField(max_length=255, default="\u00a9 Copyright 2024 - 2026")
    designer_credit = models.CharField(max_length=100, default="Designed by Proweaver")
    auto_update_copyright_year = models.BooleanField(default=True)

    seo_site_title = models.CharField(max_length=255, default="Divine Solutions Healthcare LLC")
    seo_meta_description = models.TextField(
        default="Home Health Care in Columbus, Ohio \u2014 Divine Solutions Healthcare LLC provides compassionate residential care services."
    )
    seo_social_image = models.ForeignKey(
        MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Site Settings"


class NavigationItem(TimeStampedModel):
    LOCATION_CHOICES = [("header", "Header"), ("footer", "Footer")]
    label = models.CharField(max_length=100)
    url = models.CharField(max_length=255)
    icon = models.ForeignKey("MediaItem", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    location = models.CharField(max_length=10, choices=LOCATION_CHOICES, default="header")
    sort_order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    opens_new_tab = models.BooleanField(default=False)

    class Meta:
        ordering = ["location", "sort_order"]

    def __str__(self):
        return f"[{self.location}] {self.label}"


class Page(TimeStampedModel):
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published"), ("archived", "Archived")]

    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    breadcrumb_label = models.CharField(max_length=255, blank=True)

    seo_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    og_image = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    hero_image = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_pages")
    hero_heading = models.CharField(max_length=255, blank=True)
    hero_subheading = models.TextField(blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="draft")

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class PageSection(TimeStampedModel):
    SECTION_TYPES = [
        ("hero", "Hero"),
        ("hero_slider", "Hero Slider"),
        ("breadcrumb", "Breadcrumb"),
        ("intro", "Intro"),
        ("text", "Text Section"),
        ("mission", "Mission"),
        ("vision", "Vision"),
        ("values", "Values"),
        ("service_grid", "Service Grid"),
        ("card_grid", "Card Grid"),
        ("cta", "CTA"),
        ("contact_form", "Contact Form"),
        ("resource_list", "Resource List"),
        ("office_info", "Office Info"),
        ("custom", "Custom"),
    ]

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="sections")
    section_type = models.CharField(max_length=30, choices=SECTION_TYPES)
    heading = models.CharField(max_length=255, blank=True)
    subheading = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    image = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    cta_text = models.CharField(max_length=100, blank=True)
    cta_link = models.CharField(max_length=255, blank=True)
    # Optional slug used to deep-link a nav item or CTA to this exact section,
    # e.g. anchor_id="mission" -> /home-health-care-about-us#mission
    anchor_id = models.SlugField(max_length=100, blank=True)
    # Free-form structured payload for section types that need lists (e.g. values, offices)
    data = models.JSONField(default=dict, blank=True)
    is_visible = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["page", "sort_order"]

    def __str__(self):
        return f"{self.page.slug} / {self.section_type} #{self.sort_order}"


class Service(TimeStampedModel):
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published"), ("archived", "Archived")]
    REGION_CHOICES = [("ohio", "Ohio"), ("north_dakota", "North Dakota"), ("home", "Home Highlight")]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    image = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    link_url = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=20, choices=REGION_CHOICES, default="ohio")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="published")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["region", "sort_order"]

    def __str__(self):
        return self.title


class Resource(TimeStampedModel):
    STATUS_CHOICES = [("draft", "Draft"), ("published", "Published"), ("archived", "Archived")]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    external_url = models.URLField(blank=True)
    document = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="published")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return self.title


class FormSubmission(TimeStampedModel):
    FORM_TYPES = [("contact", "Contact"), ("careers", "Careers Application")]
    STATUS_CHOICES = [
        ("new", "New"),
        ("read", "Read"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("archived", "Archived"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_type = models.CharField(max_length=20, choices=FORM_TYPES, default="contact")
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict, blank=True)  # e.g. position applied for, resume file id
    resume = models.ForeignKey(MediaItem, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    privacy_accepted = models.BooleanField(default=False)
    source_page = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    admin_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_form_type_display()} - {self.full_name} ({self.created_at:%Y-%m-%d})"


class SubmissionReply(TimeStampedModel):
    """An email reply sent by an admin back to the person who submitted a
    contact/careers form. Kept as a record so the full correspondence
    thread is visible on the submission (audit trail + "did we already
    reply?" at a glance)."""
    STATUS_CHOICES = [("sent", "Sent"), ("failed", "Failed")]

    submission = models.ForeignKey(FormSubmission, on_delete=models.CASCADE, related_name="replies")
    subject = models.CharField(max_length=255)
    body = models.TextField()
    to_email = models.EmailField()
    sent_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="sent")
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reply to {self.to_email}: {self.subject}"


class ActivityLog(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)
    description = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.created_at:%Y-%m-%d %H:%M}"
