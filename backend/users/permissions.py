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


class IsPartnerOwner(BasePermission):
    """
    Chỉ cho phép Partner chính chủ sở hữu được sửa/xóa hồ sơ của mình.
    Dùng cho object-level permission khi kiểm tra Partner ownership.
    """

    def has_object_permission(self, request, view, obj):
        """obj là instance của Partner model."""
        return obj.user == request.user


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


class IsAdmin(BasePermission):
    """
    Chỉ cho phép Admin (is_staff) truy cập.
    Dùng cho các endpoint quản trị như duyệt nội dung Partner, xem analytics toàn hệ thống.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_staff
