import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { logoutPartner } from '../services/api';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

type ApprovalStatus = 'pending' | 'approved' | 'needs_fix';
type PartnerTab = 'profile' | 'content' | 'distribution' | 'analytics';

interface PartnerDraft {
  businessName: string;
  address: string;
  introText: string;
  openingHours: string;
  mustTry: string;
  menuHighlight: string;
  hasAudioUpload: boolean;
  linkedPOIs: string[];
  isActive: boolean;
}

interface CampaignStat {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
}

const DEFAULT_DRAFT: PartnerDraft = {
  businessName: 'Quán Hải Sản Ánh Trăng',
  address: '102 Vĩnh Khánh, Phường 8, Quận 4, TP.HCM',
  introText:
    'Quán chuyên món hải sản nướng mộc, ghẹ rang me và lẩu Thái cay nhẹ. Không gian phù hợp cho nhóm bạn và gia đình buổi tối.',
  openingHours: '16:00 - 23:30',
  mustTry: 'Ghẹ rang me, Tôm tít nướng, Mực sa tế',
  menuHighlight: 'Combo 2 người 289.000đ, Combo 4 người 539.000đ',
  hasAudioUpload: false,
  linkedPOIs: ['POI-001 Chợ đêm Vĩnh Khánh', 'POI-002 Hẻm Bánh Tráng Nướng'],
  isActive: true,
};

const PARTNER_TABS: { id: PartnerTab; label: string; icon: string }[] = [
  { id: 'profile', label: 'Hồ sơ', icon: 'badge' },
  { id: 'content', label: 'Nội dung', icon: 'mic' },
  { id: 'distribution', label: 'Phân phối', icon: 'hub' },
  { id: 'analytics', label: 'Hiệu quả', icon: 'monitoring' },
];

const REVIEW_TIMELINE = [
  {
    title: 'Gửi bản cập nhật',
    desc: 'Partner gửi nội dung giới thiệu và thông tin menu/giờ mở cửa.',
    time: '09:20',
    done: true,
  },
  {
    title: 'CMS kiểm duyệt',
    desc: 'Admin kiểm tra ngôn ngữ, chất lượng audio và tính chính xác thông tin.',
    time: '10:05',
    done: true,
  },
  {
    title: 'Xuất bản đa kênh',
    desc: 'Nội dung được publish cho app online/offline sau khi duyệt.',
    time: 'Đang chờ',
    done: false,
  },
];

export default function PartnerPortal() {
  const navigate = useNavigate();
  const [approvalStatus] = useState<ApprovalStatus>('pending');
  const [activeTab, setActiveTab] = useState<PartnerTab>('profile');
  const [draft, setDraft] = useState<PartnerDraft>(DEFAULT_DRAFT);
  const [savedAt, setSavedAt] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);
  const { isPlaying, speakTTS, pause } = useAudioPlayer();

  const stats = useMemo<CampaignStat[]>(
    () => [
      {
        label: 'Lượt hiển thị',
        value: '12,480',
        trend: '+18% WoW',
        trendUp: true,
        icon: 'visibility',
      },
      {
        label: 'Lượt tương tác',
        value: '3,296',
        trend: '+9% WoW',
        trendUp: true,
        icon: 'touch_app',
      },
      {
        label: 'Lượt xem menu',
        value: '1,204',
        trend: '-2% WoW',
        trendUp: false,
        icon: 'restaurant_menu',
      },
      {
        label: 'Tỉ lệ chuyển đổi',
        value: '9.7%',
        trend: '+1.4 pts',
        trendUp: true,
        icon: 'trending_up',
      },
    ],
    []
  );

  const handleFieldChange = (key: keyof PartnerDraft, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = () => {
    setSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  };

  const handlePartnerLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutPartner();
    } finally {
      navigate('/partner/login?next=%2Fpartner', { replace: true });
      setLoggingOut(false);
    }
  };

  const handleTestIntro = () => {
    if (isPlaying) {
      pause();
    } else if (draft.introText) {
      speakTTS(draft.introText, 'vi-VN');
    }
  };

  const kpiSummary = useMemo(() => {
    const interaction = 3296;
    const impression = 12480;
    const ctr = ((interaction / impression) * 100).toFixed(1);
    return `${ctr}% CTR`;
  }, []);

  const statusClassName =
    approvalStatus === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : approvalStatus === 'needs_fix'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const statusLabel = approvalStatus === 'approved'
    ? 'Đã duyệt'
    : approvalStatus === 'needs_fix'
      ? 'Cần chỉnh sửa'
      : 'Chờ duyệt';

  const renderProfileTab = () => (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-stagger-item">
      <h3 className="text-base font-bold text-slate-900">1) Hồ sơ đối tác</h3>
      <p className="mt-1 text-xs text-slate-500">Đăng ký/hồ sơ đối tác và liên kết khu vực hoạt động theo Partner Flow.</p>

      <div className="mt-3 grid gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Tên thương hiệu</label>
          <input
            value={draft.businessName}
            onChange={(e) => handleFieldChange('businessName', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Địa chỉ</label>
          <input
            value={draft.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Khung giờ mở cửa</label>
          <input
            value={draft.openingHours}
            onChange={(e) => handleFieldChange('openingHours', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-semibold text-slate-600">POI liên kết</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.linkedPOIs.map((poi) => (
              <span key={poi} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {poi}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleFieldChange('isActive', !draft.isActive)}
          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
            draft.isActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-300 bg-slate-50 text-slate-600'
          }`}
        >
          {draft.isActive ? 'Đang hoạt động' : 'Tạm ngưng hoạt động'}
        </button>
      </div>
    </section>
  );

  const renderContentTab = () => (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-stagger-item">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">2) Tạo nội dung giới thiệu</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">Audio ưu tiên, TTS dự phòng</span>
      </div>

      <label className="mt-4 block text-xs font-semibold text-slate-600">Script giới thiệu</label>
      <textarea
        value={draft.introText}
        onChange={(e) => handleFieldChange('introText', e.target.value)}
        rows={4}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
      />

      <div className="mt-3 grid gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Món nổi bật</label>
          <input
            value={draft.mustTry}
            onChange={(e) => handleFieldChange('mustTry', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Combo/Menu nổi bật</label>
          <input
            value={draft.menuHighlight}
            onChange={(e) => handleFieldChange('menuHighlight', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => handleFieldChange('hasAudioUpload', !draft.hasAudioUpload)}
          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
            draft.hasAudioUpload
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {draft.hasAudioUpload ? 'Đã tải audio thu sẵn' : 'Tải audio thu sẵn'}
        </button>
        <button 
          onClick={handleTestIntro}
          className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{isPlaying ? 'stop_circle' : 'play_circle'}</span>
          {isPlaying ? 'Dừng nghe' : 'Nghe thử intro'}
        </button>
      </div>
    </section>
  );

  const renderDistributionTab = () => (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-stagger-item">
      <h3 className="text-base font-bold text-slate-900">3) Kiểm duyệt và phân phối</h3>
      <p className="mt-1 text-xs text-slate-500">Theo dõi hàng chờ duyệt CMS và cách nội dung hiển thị tới người dùng tại từng POI.</p>

      <div className="mt-3 space-y-2">
        {REVIEW_TIMELINE.map((item, index) => (
          <div key={item.title} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5">
            <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${item.done ? 'bg-emerald-500' : 'bg-primary'}`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-600">{item.desc}</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-700">Vị trí hiển thị trong app người dùng</p>
        <div className="mt-2 space-y-2 text-xs text-slate-600">
          <p>• Bottom sheet gợi ý đối tác khi đang phát thuyết minh.</p>
          <p>• Đoạn intro ngắn phát ở cuối bài thuyết minh (nếu được bật).</p>
          <p>• Thẻ menu/giờ mở cửa ưu tiên hiển thị theo POI liên kết.</p>
        </div>
      </div>
    </section>
  );

  const renderAnalyticsTab = () => (
    <section className="mx-4 mt-4 mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-stagger-item">
      <h3 className="text-base font-bold text-slate-900">4) Theo dõi hiệu quả</h3>
      <p className="mt-1 text-xs text-slate-500">Dashboard ghi nhận lượt hiển thị, tương tác và tối ưu chiến dịch tiếp thị.</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[18px] text-slate-500">{stat.icon}</span>
              <span className={`text-[10px] font-bold ${stat.trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>{stat.trend}</span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-slate-900">{stat.value}</p>
            <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs font-semibold text-slate-700">Tổng quan chiến dịch hiện tại</p>
        <p className="mt-1 text-sm font-bold text-primary">{kpiSummary} • POI hiệu quả nhất: Chợ đêm Vĩnh Khánh</p>
      </div>
    </section>
  );

  return (
    <AppLayout
      title="Partner Hub"
      backPath="/settings"
      hideNav
      contentClassName="bg-background-light pb-24"
      headerAction={(
        <button
          onClick={handlePartnerLogout}
          disabled={loggingOut}
          className="flex size-10 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          title="Đăng xuất partner"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      )}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-[-80px] h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute top-10 left-[-100px] h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />

        <section className="relative mx-4 mt-4 rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-orange-50/70 to-orange-100/70 p-5 shadow-sm animate-fade-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Kênh đối tác</p>
              <h2 className="mt-1 text-lg font-bold leading-tight text-slate-900">{draft.businessName}</h2>
              <p className="mt-1 text-xs text-slate-500">Liên kết: Phố Vĩnh Khánh, Quận 4 • 2 POI</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusClassName}`}>{statusLabel}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.slice(0, 2).map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur-sm">
                <p className="text-[11px] font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
          <div className="grid grid-cols-4 gap-1">
            {PARTNER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-2 py-2 text-center transition ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {tab.icon}
                  </span>
                  <p className="mt-1 text-[10px] font-bold leading-tight">{tab.label}</p>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'distribution' && renderDistributionTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}

        <section className="mx-4 mt-4 mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-stagger-item">
          <button
            onClick={handleSaveDraft}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
          >
            Lưu thay đổi đối tác
          </button>
          {savedAt && <p className="mt-2 text-center text-[11px] font-medium text-emerald-600">Đã lưu lúc {savedAt}</p>}
        </section>
      </div>
    </AppLayout>
  );
}
