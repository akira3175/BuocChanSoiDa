from rest_framework import serializers
from .models import Media, POI, PartnerIntroMedia
from partners.serializers import PartnerSerializer


class MediaSerializer(serializers.ModelSerializer):
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)

    class Meta:
        model = Media
        fields = [
            'id', 'language', 'voice_region',
            'file_url', 'tts_content', 'media_type', 'media_type_display',
        ]


class MediaCRUDSerializer(serializers.ModelSerializer):
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Media
        fields = [
            'id', 'poi',
            'language', 'voice_region',
            'file_url', 'tts_content', 'media_type', 'media_type_display',
            'status', 'status_display',
        ]


class POIListSerializer(serializers.ModelSerializer):
    """
    Serializer nhẹ cho near-me và scan — không embed media/partners
    để giảm payload khi trả về danh sách.
    """
    translated_description = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description', 'translated_description',
            'latitude', 'longitude', 'geofence_radius',
            'category', 'qr_code_data', 'status',
            'distance',
        ]

    def get_translated_description(self, obj):
        request = self.context.get('request')
        if not request:
            return obj.description
        lang = request.query_params.get('language', 'vi')
        if lang == 'vi':
            return obj.description
        
        # Tìm bản dịch trong media (đã được prefetch nếu gọi từ POINearMeView)
        # Nếu dùng obj.media.filter(...) nó sẽ query tiếp (N+1). 
        # Tốt hơn là dùng list comprehension trên bộ nhớ nếu đã prefetch.
        media_list = getattr(obj, '_prefetched_media_cache', obj.media.all())
        for m in media_list:
            if m.language == lang and m.tts_content:
                return m.tts_content
        return obj.description


class POIDetailSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho GET /pois/<id>/ — embed media + partners."""
    media = MediaSerializer(many=True, read_only=True)
    partners = PartnerSerializer(many=True, read_only=True)
    translated_description = serializers.SerializerMethodField()

    class Meta:
        model = POI
        fields = [
            'id', 'name', 'description', 'translated_description',
            'latitude', 'longitude', 'geofence_radius',
            'category', 'qr_code_data', 'status',
            'media', 'partners',
        ]

    def get_translated_description(self, obj):
        request = self.context.get('request')
        if not request:
            return obj.description
        lang = request.query_params.get('language', 'vi')
        if lang == 'vi':
            return obj.description
        
        # Vì DetailView đã prefetch media nên media.all() không gây N+1
        for m in obj.media.all():
            if m.language == lang and m.tts_content:
                return m.tts_content
        return obj.description


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
