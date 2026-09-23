from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AdminProfile


@receiver(post_save, sender=User)
def create_admin_profile(sender, instance, created, **kwargs):
    if created and instance.is_staff:
        AdminProfile.objects.get_or_create(
            user=instance,
            defaults={"role": "super_admin" if instance.is_superuser else "content_admin"},
        )
