from django.contrib import admin

from .models import Partner


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
	list_display = ['id', 'business_name', 'poi', 'opening_hours', 'status']
	list_filter = ['status']
	search_fields = ['business_name', 'poi__name']
	list_select_related = ['poi']
	actions = ['mark_pending_approval', 'approve_selected', 'reject_selected']

	@admin.action(description='Đánh dấu chờ phê duyệt')
	def mark_pending_approval(self, request, queryset):
		queryset.update(status=Partner.Status.PENDING_APPROVAL)

	@admin.action(description='Duyệt đối tác đã chọn')
	def approve_selected(self, request, queryset):
		queryset.update(status=Partner.Status.ACTIVE)

	@admin.action(description='Từ chối đối tác đã chọn')
	def reject_selected(self, request, queryset):
		queryset.update(status=Partner.Status.INACTIVE)
