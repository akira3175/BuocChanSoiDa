import type { POI, Tour, TourPOI } from '../types';

type StoredOfflinePayload = {
    tour?: Tour;
    tour_pois?: TourPOI[];
    pois?: POI[];
};

type StoredOfflinePackage = {
    id: string;
    data?: Blob;
    payload?: StoredOfflinePayload;
};

const DB_NAME = 'bcsd_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_packages';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function parsePayloadFromBlob(data?: Blob): Promise<StoredOfflinePayload | undefined> {
    if (!data) return undefined;
    try {
        const text = await data.text();
        return JSON.parse(text) as StoredOfflinePayload;
    } catch {
        return undefined;
    }
}

async function getAllStoredPackages(): Promise<StoredOfflinePackage[]> {
    const db = await openDB();
    const rows = await new Promise<StoredOfflinePackage[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll() as IDBRequest<StoredOfflinePackage[]>;
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });

    const enriched: StoredOfflinePackage[] = [];
    for (const row of rows) {
        if (row.payload) {
            enriched.push(row);
            continue;
        }
        const parsedPayload = await parsePayloadFromBlob(row.data);
        enriched.push({ ...row, payload: parsedPayload });
    }

    return enriched;
}

function dedupePois(pois: POI[]): POI[] {
    const map = new Map<string, POI>();
    pois.forEach((poi) => map.set(String(poi.id), poi));
    return Array.from(map.values());
}

function buildTourFromPayload(payload?: StoredOfflinePayload): Tour | null {
    if (!payload?.tour) return null;

    const baseTour = payload.tour;
    const poisFromMappings = Array.isArray(payload.tour_pois) ? payload.tour_pois : [];

    if (poisFromMappings.length > 0) {
        return {
            ...baseTour,
            pois: [...poisFromMappings].sort((a, b) => a.sequence_order - b.sequence_order),
        };
    }

    return {
        ...baseTour,
        pois: Array.isArray(baseTour.pois) ? baseTour.pois : [],
    };
}

export async function getOfflinePOIsFromPackages(): Promise<POI[]> {
    const rows = await getAllStoredPackages();
    const pois: POI[] = [];

    rows.forEach((row) => {
        const payload = row.payload;
        if (!payload) return;

        if (Array.isArray(payload.pois)) {
            pois.push(...payload.pois);
        }

        if (Array.isArray(payload.tour_pois)) {
            payload.tour_pois.forEach((mapping) => {
                if (mapping?.poi) pois.push(mapping.poi);
            });
        }
    });

    return dedupePois(pois);
}

export async function getOfflineToursFromPackages(): Promise<Tour[]> {
    const rows = await getAllStoredPackages();
    const tours: Tour[] = [];

    rows.forEach((row) => {
        const tour = buildTourFromPayload(row.payload);
        if (tour) tours.push(tour);
    });

    const deduped = new Map<string, Tour>();
    tours.forEach((tour) => {
        deduped.set(String(tour.id), tour);
    });

    return Array.from(deduped.values());
}

export async function getOfflineTourById(tourId: string): Promise<Tour | null> {
    const tours = await getOfflineToursFromPackages();
    return tours.find((tour) => String(tour.id) === String(tourId)) || null;
}
