from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Partner

User = get_user_model()


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = ['id', 'business_name', 'intro_text', 'qr_url', 'menu_details', 'opening_hours']


class PartnerCRUDSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Partner
        fields = [
            'id',
            'user',
            'poi',
            'business_name',
            'intro_text',
            'qr_url',
            'menu_details',
            'opening_hours',
            'status',
            'status_display',
        ]
        read_only_fields = ['user']
        extra_kwargs = {
            'poi': {'required': False, 'allow_null': True},
        }


class PartnerRegisterSerializer(serializers.ModelSerializer):
    """Serializer đăng ký tài khoản Partner actor."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number',
            'preferred_language', 'preferred_voice_region',
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
            'preferred_language': {'required': False},
            'preferred_voice_region': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {'password_confirm': 'Mật khẩu xác nhận không khớp.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Gán quyền actor Partner cho tài khoản vừa đăng ký.
        partner_group, _ = Group.objects.get_or_create(name='Partner')
        user.groups.add(partner_group)

        return user


class PartnerTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login serializer cho Partner actor."""

    def validate(self, attrs):
        data = super().validate(attrs)
        is_partner = self.user.groups.filter(name='Partner').exists()
        if not is_partner:
            raise serializers.ValidationError(
                {'detail': 'Tài khoản không thuộc nhóm Partner.'}
            )

        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'full_name': self.user.get_full_name(),
            'preferred_language': self.user.preferred_language,
            'preferred_voice_region': self.user.preferred_voice_region,
            'roles': list(self.user.groups.values_list('name', flat=True)),
        }
        return data


class PartnerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer cho CRUD business profile của Partner.
    Endpoint: /api/partners/account/profile/
    """

    menu_details = serializers.JSONField(required=False)

    class Meta:
        model = Partner
        fields = [
            'id',
            'business_name',
            'intro_text',
            'qr_url',
            'menu_details',
            'opening_hours',
            'poi',
            'status',
        ]
        extra_kwargs = {
            'poi': {'required': False, 'allow_null': True},
            'qr_url': {'required': False, 'allow_blank': True},
            'menu_details': {'required': False},
        }


class PartnerChangePasswordSerializer(serializers.Serializer):
    """Serializer đổi mật khẩu cho Partner account."""

    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mật khẩu cũ không đúng.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Mật khẩu xác nhận không khớp.'}
            )
        return attrs
