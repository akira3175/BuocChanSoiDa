from django.contrib import admin

from .models import BreadcrumbLog, NarrationLog


@admin.register(BreadcrumbLog)
class BreadcrumbLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'lat', 'long', 'timestamp', 'status']
    list_filter = ['status', 'timestamp']
    search_fields = ['user__email', 'user__username']
    ordering = ['-timestamp']
    readonly_fields = ['user', 'lat', 'long', 'timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        # Dữ liệu chỉ được tạo qua API, không tạo thủ công từ Admin
        return False


@admin.register(NarrationLog)
class NarrationLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'poi', 'trigger_type',
        'start_time', 'duration', 'status',
    ]
    list_filter = ['trigger_type', 'status', 'start_time']
    search_fields = ['user__email', 'user__username', 'poi__name']
    ordering = ['-start_time']
    readonly_fields = ['user', 'poi', 'trigger_type', 'start_time']
    date_hierarchy = 'start_time'
    list_select_related = ['user', 'poi']

    def has_add_permission(self, request):
        return False
