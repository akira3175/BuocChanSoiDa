import { useTranslation } from 'react-i18next';
import type { Partner } from '../types';

interface PartnerCardProps {
    partner: Partner;
}

export default function PartnerCard({ partner }: PartnerCardProps) {
    const { t } = useTranslation();
    const distText = partner.distance_meters
        ? partner.distance_meters < 1000
            ? `${partner.distance_meters}m`
            : `${(partner.distance_meters / 1000).toFixed(1)}km`
        : null;

    const priceText = partner.avg_price ? `${partner.avg_price.toLocaleString('vi-VN')}đ` : null;

    return (
        <div className="flex-none w-72 bg-white rounded-xl p-3 shadow-sm border border-primary/5 flex gap-3">
            <div className="size-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                {partner.image_url ? (
                    <img src={partner.image_url} alt={partner.business_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 text-3xl">restaurant</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{partner.business_name}</h3>
                    {(distText || priceText) && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium">
                            {distText && (
                                <>
                                    <span className="material-symbols-outlined text-[10px]">location_on</span>
                                    <span>{distText}</span>
                                </>
                            )}
                            {distText && priceText && <span>•</span>}
                            {priceText && <span>{priceText}</span>}
                        </div>
                    )}
                    {partner.menu_details?.must_try && partner.menu_details.must_try.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            ★ {partner.menu_details.must_try[0]}
                        </p>
                    )}
                </div>
                <button className="mt-2 py-1 px-3 bg-primary/10 text-primary text-[10px] font-bold rounded-lg w-max hover:bg-primary hover:text-white transition-colors">
                    {t('partner.viewMenu')}
                </button>
            </div>
        </div>
    );
}
