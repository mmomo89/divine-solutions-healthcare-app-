from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAuthenticatedAdmin(BasePermission):
    """Any authenticated staff user (Super Admin or Content Admin)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsSuperAdmin(BasePermission):
    """Only Super Admins may manage administrator accounts."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        return bool(profile and profile.role == "super_admin")


class ReadOnlyOrAdmin(BasePermission):
    """Public GET access; write access requires authenticated staff."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
