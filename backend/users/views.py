from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/users/register/
    Đăng ký tài khoản mới. Trả về JWT tokens + thông tin user.
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Tạo JWT tokens cho user vừa đăng ký
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Đăng ký thành công!',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': user.get_full_name(),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/users/login/
    Đăng nhập bằng email + password, trả về JWT access + refresh + user info.
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/users/profile/     - Xem profile
    PUT /api/users/profile/     - Cập nhật toàn bộ profile
    PATCH /api/users/profile/   - Cập nhật một phần profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/users/change-password/
    Đổi mật khẩu (yêu cầu old_password + new_password + new_password_confirm).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
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


class LogoutView(APIView):
    """
    POST /api/users/logout/
    Blacklist refresh token để đăng xuất.
    Body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

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
