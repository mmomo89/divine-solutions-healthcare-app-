from django.contrib import admin
from .models import (
    AdminProfile, ActivityLog, FormSubmission, MediaItem, NavigationItem,
    Page, PageSection, Resource, Service, SiteSettings, SubmissionReply,
)

admin.site.register(AdminProfile)
admin.site.register(ActivityLog)
admin.site.register(MediaItem)
admin.site.register(NavigationItem)
admin.site.register(Service)
admin.site.register(Resource)
admin.site.register(SiteSettings)
admin.site.register(SubmissionReply)


class PageSectionInline(admin.TabularInline):
    model = PageSection
    extra = 0


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "status", "updated_at")
    inlines = [PageSectionInline]


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "form_type", "status", "created_at")
    list_filter = ("form_type", "status")
    search_fields = ("full_name", "email")
