from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.permissions import IsAdmin, IsAdminOrReadOnly, IsPartner
from pois.models import Partner

from .serializers import (
    PartnerCRUDSerializer,
    PartnerChangePasswordSerializer,
    PartnerProfileSerializer,
    PartnerRegisterSerializer,
    PartnerTokenObtainPairSerializer,
)


class PartnerListCreateView(generics.ListCreateAPIView):
    """
    GET /api/partners/?poi_id=<id>&status=<0|1|2>&search=<keyword>
    POST /api/partners/

    Danh sach partner voi filter tuy chon:
    - Khong truyen status -> tra toan bo (ca active lan inactive).
    - status=1            -> chi lay dang hoat dong.
    - status=0            -> chi lay da tat.
    - status=2            -> chi lay dang cho phe duyet.
    - poi_id              -> loc theo POI.
    - search              -> tim kiem theo ten co so (khong phan biet hoa/thuong).
    """

    serializer_class = PartnerCRUDSerializer
    permission_classes = [IsAdminOrReadOnly]

    _VALID_STATUS = {'0', '1', '2'}

    def get_queryset(self):
        qs = Partner.objects.all().select_related('poi', 'user')

        poi_id = self.request.query_params.get('poi_id')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search', '').strip()

        if poi_id:
            qs = qs.filter(poi_id=poi_id)

        if status_param not in (None, ''):
            if status_param not in self._VALID_STATUS:
                raise ValidationError(
                    {'status': 'Gia tri khong hop le. Chi chap nhan: 0 (inactive), 1 (active), 2 (pending).'}
                )
            qs = qs.filter(status=int(status_param))

        if search:
            qs = qs.filter(business_name__icontains=search)

        return qs.order_by('business_name')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsPartner()]
        return [IsAdminOrReadOnly()]

    def perform_create(self, serializer):
        if Partner.objects.filter(user=self.request.user).exists():
            raise ValidationError({'error': 'Mỗi tài khoản Partner chỉ được tạo 1 hồ sơ đối tác.'})
        serializer.save(user=self.request.user)


class PartnerDetailCRUDView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/partners/<id>/
    PUT/PATCH /api/partners/<id>/
    DELETE /api/partners/<id>/
    """

    queryset = Partner.objects.all().select_related('poi')
    serializer_class = PartnerCRUDSerializer
    permission_classes = [IsAdminOrReadOnly]


class PartnerRegisterView(generics.CreateAPIView):
    """
    POST /api/partners/account/register/
    Đăng ký tài khoản Partner actor. Trả về JWT tokens + thông tin user.
    """

    serializer_class = PartnerRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Đăng ký tài khoản Partner thành công!',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': user.get_full_name(),
                'roles': list(user.groups.values_list('name', flat=True)),
            }
        }, status=status.HTTP_201_CREATED)


class PartnerTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/partners/account/login/
    Đăng nhập bằng email + password cho tài khoản thuộc nhóm Partner.
    """

    serializer_class = PartnerTokenObtainPairSerializer


class PartnerProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/partners/account/profile/
    PUT /api/partners/account/profile/
    PATCH /api/partners/account/profile/
    """

    serializer_class = PartnerProfileSerializer
    permission_classes = [IsAuthenticated, IsPartner]

    def get_object(self):
        # Partner model is linked via OneToOneField: User -> Partner (related_name='partner_profile')
        user = self.request.user
        try:
            return user.partner_profile
        except Partner.DoesNotExist:
            # For PUT we allow "upsert" style: if partner business profile does not exist yet,
            # create it from request.data. PATCH requires fields (especially business_name).
            if self.request.method in ('PUT', 'PATCH'):
                business_name = self.request.data.get('business_name')
                if not business_name:
                    from rest_framework.exceptions import NotFound

                    raise NotFound('No Partner profile found (missing business_name).')

                return Partner.objects.create(
                    user=user,
                    business_name=business_name,
                    intro_text=self.request.data.get('intro_text', '') or '',
                    opening_hours=self.request.data.get('opening_hours', '') or '',
                    qr_url=self.request.data.get('qr_url', '') or '',
                    menu_details=self.request.data.get('menu_details', {}) or {},
                    status=self.request.data.get('status', Partner.Status.PENDING_APPROVAL),
                )

            from rest_framework.exceptions import NotFound

            raise NotFound('No Partner profile found.')


class PartnerChangePasswordView(APIView):
    """
    POST /api/partners/account/change-password/
    Đổi mật khẩu cho tài khoản Partner.
    """

    permission_classes = [IsAuthenticated, IsPartner]

    def post(self, request):
        serializer = PartnerChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response(
            {'message': 'Đổi mật khẩu thành công!'},
            status=status.HTTP_200_OK
        )


class PartnerLogoutView(APIView):
    """
    POST /api/partners/account/logout/
    Blacklist refresh token để đăng xuất.
    """

    permission_classes = [IsAuthenticated, IsPartner]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Vui lòng cung cấp refresh token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Đăng xuất thành công!'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'error': 'Token không hợp lệ hoặc đã hết hạn.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class PartnerApproveView(APIView):
    """
    POST /api/partners/<id>/approve/
    Duyệt partner đang ở trạng thái chờ phê duyệt (2) -> hoạt động (1).
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk: int):
        partner = get_object_or_404(Partner, pk=pk)

        if partner.status != Partner.Status.PENDING_APPROVAL:
            return Response(
                {
                    'error': 'Chỉ có thể duyệt partner đang ở trạng thái chờ phê duyệt.',
                    'current_status': partner.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        partner.status = Partner.Status.ACTIVE
        partner.save(update_fields=['status'])

        return Response(
            {
                'message': 'Duyệt partner thành công.',
                'id': partner.id,
                'status': partner.status,
                'status_display': partner.get_status_display(),
            },
            status=status.HTTP_200_OK,
        )


class PartnerRejectView(APIView):
    """
    POST /api/partners/<id>/reject/
    Từ chối partner đang ở trạng thái chờ phê duyệt (2) -> không hoạt động (0).
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk: int):
        partner = get_object_or_404(Partner, pk=pk)

        if partner.status != Partner.Status.PENDING_APPROVAL:
            return Response(
                {
                    'error': 'Chỉ có thể từ chối partner đang ở trạng thái chờ phê duyệt.',
                    'current_status': partner.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        partner.status = Partner.Status.INACTIVE
        partner.save(update_fields=['status'])

        return Response(
            {
                'message': 'Từ chối partner thành công.',
                'id': partner.id,
                'status': partner.status,
                'status_display': partner.get_status_display(),
            },
            status=status.HTTP_200_OK,
        )
