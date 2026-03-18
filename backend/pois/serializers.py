from rest_framework import serializers
from .models import Media, POI, PartnerIntroMedia
from partners.serializers import PartnerSerializer


class MediaSerializer(serializers.ModelSerializer):
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)

    class Meta:
        model = Media
        fields = [
            'id', 'language', 'voice_region',
            'file_url', 'media_type', 'media_type_display',
        ]


class MediaCRUDSerializer(serializers.ModelSerializer):
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Media
        fields = [
            'id', 'poi',
            'language', 'voice_region',
            'file_url', 'media_type', 'media_type_display',
            'status', 'status_display',
        ]


class POIListSerializer(serializers.ModelSerializer):
    """
    Serializer nhẹ cho near-me và scan — không embed media/partners
    để giảm payload khi trả về danh sách.
    """
    # field `distance` được inject động từ view (annotate trong Python)
    distance = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description',
            'latitude', 'longitude', 'geofence_radius',
            'category', 'qr_code_data', 'status',
            'distance',
        ]


class POIDetailSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho GET /pois/<id>/ — embed media + partners."""
    media = MediaSerializer(many=True, read_only=True)
    partners = PartnerSerializer(many=True, read_only=True)

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description',
            'latitude', 'longitude', 'geofence_radius',
            'category', 'qr_code_data', 'status',
            'media', 'partners',
        ]


# ==================== Partner Serializers ====================


class PartnerIntroMediaSerializer(serializers.ModelSerializer):
    """
    Serializer cho quản lý file audio giới thiệu của Partner.
    Liên kết với file media từ core/models.py.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PartnerIntroMedia
        fields = [
            'id', 'partner', 'media_id',
            'language', 'voice_region',
            'status', 'status_display',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
