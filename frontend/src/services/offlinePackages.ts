import type { Tour, TourPOIGroup } from '../types';
import { getTourById, getTourPOIGroups, getTours } from './api';

export interface OfflinePackageData {
    id: string;
    name: string;
    description: string;
    poi_count: number;
    size_mb: number;
    source: 'api' | 'mock';
    source_detail: 'tour-pois' | 'tours-fallback' | 'mock';
    related_pois: Array<{
        id: string;
        name: string;
        sequence_order: number;
    }>;
}

export class OfflineDataSourceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OfflineDataSourceError';
    }
}

const OFFLINE_DATA_MODE_KEY = 'bcsd_offline_data_mode';

const MOCK_OFFLINE_PACKAGES: OfflinePackageData[] = [
    {
        id: 'pkg-vinh-khanh',
        name: 'Phố Vĩnh Khánh - Quận 4',
        description: 'Toàn bộ dữ liệu ẩm thực và âm thanh phố Vĩnh Khánh',
        poi_count: 12,
        size_mb: 48,
        source: 'mock',
        source_detail: 'mock',
        related_pois: [
            { id: 'mock-poi-1', name: 'Bún bò Vĩnh Khánh', sequence_order: 1 },
            { id: 'mock-poi-2', name: 'Ốc đêm Vĩnh Khánh', sequence_order: 2 },
        ],
    },
    {
        id: 'pkg-benh-vien',
        name: 'Khu Bệnh Viện Nhi - Quận 10',
        description: 'Các điểm ăn vặt, cà phê xung quanh bệnh viện Nhi Đồng',
        poi_count: 8,
        size_mb: 30,
        source: 'mock',
        source_detail: 'mock',
        related_pois: [
            { id: 'mock-poi-3', name: 'Cháo dinh dưỡng cổng viện', sequence_order: 1 },
            { id: 'mock-poi-4', name: 'Cà phê sân vườn', sequence_order: 2 },
        ],
    },
    {
        id: 'pkg-q1-bui-vien',
        name: 'Bùi Viện - Quận 1',
        description: 'Phố Tây nổi tiếng với bar, nhà hàng và ẩm thực quốc tế',
        poi_count: 20,
        size_mb: 82,
        source: 'mock',
        source_detail: 'mock',
        related_pois: [
            { id: 'mock-poi-5', name: 'Phố Tây Bùi Viện', sequence_order: 1 },
            { id: 'mock-poi-6', name: 'Ẩm thực quốc tế', sequence_order: 2 },
        ],
    },
];

export const getOfflineDataMode = (): 'api' | 'mock' => {
    const mode = localStorage.getItem(OFFLINE_DATA_MODE_KEY);
    if (mode === 'mock' || mode === 'api') {
        return mode;
    }

    return import.meta.env.VITE_OFFLINE_DATA_MODE === 'mock' ? 'mock' : 'api';
};

export const setOfflineDataMode = (mode: 'api' | 'mock'): void => {
    localStorage.setItem(OFFLINE_DATA_MODE_KEY, mode);
};

export const isOfflineMockMode = (): boolean => getOfflineDataMode() === 'mock';

const createMockBlob = (packageId: string): Blob => {
    return new Blob([
        JSON.stringify({
            package_id: packageId,
            mock: true,
            generated_at: new Date().toISOString(),
        }),
    ], { type: 'application/json' });
};

const createApiOfflineBlob = async (tourId: string): Promise<Blob> => {
    let tour: Tour | null = null;
    try {
        tour = await getTourById(tourId);
    } catch {
        const tours = await getTours();
        tour = tours.find((item) => String(item.id) === String(tourId)) ?? null;
    }

    if (!tour) {
        throw new Error('Không tìm thấy tour để tạo gói offline.');
    }

    let groups: TourPOIGroup[] = [];
    try {
        groups = await getTourPOIGroups([tourId]);
    } catch {
        groups = [];
    }

    const group = groups[0] ?? null;
    const tourPois = group
        ? group.items.map((item) => ({
            sequence_order: item.sequence_order,
            poi: item.poi,
        }))
        : (tour.pois || []).map((item) => ({
            sequence_order: item.sequence_order,
            poi: item.poi,
        }));

    const pois = tourPois.map((item) => item.poi);

    const payload = {
        package_type: 'tour_offline_package',
        source: 'api',
        tour_id: tourId,
        generated_at: new Date().toISOString(),
        tour,
        tour_pois_group: group,
        tour_pois: tourPois,
        pois,
    };

    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
};

const bytesToMb = (bytes: number): number => {
    const mb = bytes / (1024 * 1024);
    return Math.max(0.01, Number(mb.toFixed(2)));
};

const groupByTourId = (groups: TourPOIGroup[]): Map<string, TourPOIGroup> => {
    const map = new Map<string, TourPOIGroup>();
    groups.forEach((group) => {
        map.set(String(group.tour_id), group);
    });
    return map;
};

const mapToursToPackages = (tours: Tour[], groups: TourPOIGroup[]): OfflinePackageData[] => {
    const groupMap = groupByTourId(groups);

    return tours.map((tour) => {
        const group = groupMap.get(String(tour.id));
        const poiCount = group?.items?.length ?? tour.pois?.length ?? 0;
        const payloadBytes =
            group?.payload_bytes ??
            (group ? new TextEncoder().encode(JSON.stringify(group)).length : 0);
        const relatedPois = group
            ? group.items.map((item) => ({
                id: String(item.poi.id),
                name: item.poi.name,
                sequence_order: item.sequence_order,
            }))
            : (tour.pois || []).map((item) => ({
                id: String(item.poi.id),
                name: item.poi.name,
                sequence_order: item.sequence_order,
            }));

        return {
            id: String(tour.id),
            name: tour.name,
            description: tour.description || 'Gói dữ liệu offline cho tour này',
            poi_count: poiCount,
            size_mb: bytesToMb(payloadBytes),
            source: 'api' as const,
            source_detail: group ? 'tour-pois' : 'tours-fallback',
            related_pois: relatedPois,
        };
    });
};

export const getAvailableOfflinePackages = async (): Promise<OfflinePackageData[]> => {
    if (isOfflineMockMode()) {
        return MOCK_OFFLINE_PACKAGES;
    }

    try {
        const tours = await getTours();
        if (tours.length === 0) {
            return [];
        }

        const tourIds = tours.map((tour) => String(tour.id));
        const groups = await getTourPOIGroups(tourIds);
        const packages = mapToursToPackages(tours, groups);

        return packages;
    } catch {
        throw new OfflineDataSourceError('Không thể tải dữ liệu từ API. Vui lòng kiểm tra backend.');
    }
};

export const downloadOfflinePackageByMode = async (packageId: string): Promise<Blob> => {
    if (isOfflineMockMode()) {
        return createMockBlob(packageId);
    }

    return createApiOfflineBlob(packageId);
};
