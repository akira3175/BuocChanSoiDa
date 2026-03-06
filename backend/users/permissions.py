from rest_framework.permissions import BasePermission


class IsPartner(BasePermission):
    """
    Chỉ cho phép user thuộc group 'Partner' truy cập.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name='Partner').exists()
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Admin (is_staff) có toàn quyền.
    User thường chỉ được đọc (GET, HEAD, OPTIONS).
    """
    SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')

    def has_permission(self, request, view):
        if request.method in self.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
