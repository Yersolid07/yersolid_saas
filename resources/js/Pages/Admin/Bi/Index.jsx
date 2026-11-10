import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState, Fragment } from 'react';
import {
    RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, FileText,
    ShoppingCart, Users, Bed, Timer, ClipboardList, CheckCircle2, Plus, Pencil
} from 'lucide-react';

// ── Helper format ──────────────────────────────────────────────
const rp = (n) => {
    const v = Number(n || 0);
    if (v >= 1e9) return 'Rp' + (v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace('.', ',') + ' M';
    if (v >= 1e6) return 'Rp' + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1).replace('.', ',') + ' jt';
    if (v >= 1e3) return 'Rp' + Math.round(v / 1e3) + ' rb';
    return 'Rp' + Math.round(v);
};
const fmt = (n) => Math.round(Number(n || 0)).toLocaleString('id-ID');
const pct = (n) => (Number(n || 0)).toFixed(1) + '%';

const TYPE_COLOR = { peluang: '#059669', perhatian: '#d97706', risiko: '#dc2626', test: '#2563eb' };
const SEV_COLOR = { critical: '#dc2626', warning: '#d97706', info: '#2563eb', success: '#059669', danger: '#dc2626' };

function Card({ title, sub, children, delay = 0, className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${className}`}
            style={{ animationDelay: `${delay}ms` }}>
            {title && <h3 className="text-[15px] font-semibold text-gray-900 m-0">{title}</h3>}
            {sub && <p className="text-[13px] text-gray-500 mt-0.5 mb-3">{sub}</p>}
            {children}
        </div>
    );
}

function Kpi({ label, value, sub, delta, deltaColor }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{label}</div>
            <div className="text-[26px] font-bold text-gray-900 tracking-tight mt-1">{value}</div>
            {delta !== undefined && (
                <div className={`text-[12px] font-semibold mt-1 flex items-center gap-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(delta).toFixed(1)}%
                    {sub && <span className="text-gray-400 font-normal ml-1">{sub}</span>}
                </div>
            )}
        </div>
    );
}

function BarRow({ name, value, max, color, suffix, onClick }) {
    return (
        <div className="flex items-center gap-2.5 my-1.5 cursor-pointer" onClick={onClick}>
            <span className="w-[130px] flex-none text-[13px] text-gray-700 truncate">{name}</span>
            <div className="flex-1 bg-gray-100 rounded-md h-5 overflow-hidden">
                <div className="h-full rounded-md transition-all duration-700"
                    style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color || '#059669' }} />
            </div>
            <span className="w-[72px] text-right text-[13px] tabular-nums text-gray-700">{suffix ? suffix(value) : value}</span>
        </div>
    );
}

function Heatmap({ heatmap }) {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 09:00–20:00
    let max = 0;
    (heatmap || []).forEach((row) => row.forEach((v) => { if (v > max) max = v; }));
    max = Math.max(1, max);
    return (
        <div className="grid gap-[3px] text-[10px]" style={{ gridTemplateColumns: `34px repeat(${hours.length}, 1fr)` }}>
            <span />
            {hours.map((h) => <span key={h} className="text-gray-400 text-center">{h}</span>)}
            {days.map((d, di) => (
                <Fragment key={d}>
                    <span className="text-gray-400 self-center">{d}</span>
                    {hours.map((h, hi) => {
                        const v = (heatmap?.[di]?.[h] || 0);
                        const op = v > 0 ? 0.12 + (v / max) * 0.88 : 0.05;
                        return <span key={h} className="rounded-[4px] aspect-[1.3]"
                            style={{ background: `rgba(5,150,105,${op})` }}
                            title={`${d} ${h}.00: ${v} pesanan`} />;
                    })}
                </Fragment>
            ))}
        </div>
    );
}

// ── Komponen utama ─────────────────────────────────────────────
export default function BiIndex({ meta, financial, inventory, menu, customers, facilities, operations, risks, insights, decisions, snapshots }) {
    const { props, url } = usePage();
    const [tab, setTab] = useState(0);
    const [range, setRange] = useState(meta?.range || '30d');
    const [loading, setLoading] = useState(false);

    const go = (params) => {
        setLoading(true);
        router.get(url.split('?')[0], params, { preserveState: true, onFinish: () => setLoading(false) });
    };

    const TABS = ['Ringkasan', 'Keuangan', 'Stok', 'Menu', 'Pelanggan', 'Fasilitas', 'Operasional', 'Risiko', 'Keputusan'];

    // Chart data
    const daily = financial?.daily || [];
    const revSeries = daily.map((d) => ({ ...d }));
    const maxRev = Math.max(1, ...revSeries.map((d) => d.revenue));

    return (
        <AppLayout>
            <Head title="Pusat Keputusan Bisnis" />
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div>
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Business Intelligence Dashboard</div>
                        <h1 className="text-[22px] font-bold text-gray-900 m-0">Pusat Keputusan Bisnis</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex border border-gray-200 rounded-[10px] overflow-hidden bg-white">
                            {[['7d', '7 hari'], ['30d', '30 hari'], ['90d', '90 hari'], ['this_month', 'Bulan ini']].map(([v, l]) => (
                                <button key={v} onClick={() => { setRange(v); go({ range: v }); }}
                                    className={`px-3 py-1.5 text-[13px] ${range === v ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{l}</button>
                            ))}
                        </div>
                        <button onClick={() => { go({ range }); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-gray-200 bg-white text-[13px] text-gray-600 hover:bg-gray-50">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-5">
                    {TABS.map((t, i) => (
                        <button key={t} onClick={() => setTab(i)}
                            className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap border-b-2 ${tab === i ? 'border-emerald-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {loading && <div className="text-[13px] text-emerald-600 mb-3">Memuat data…</div>}

                {tab === 0 && <SummaryTab financial={financial} insights={insights} menu={menu} customers={customers} facilities={facilities} inventory={inventory} operations={operations} revSeries={revSeries} maxRev={maxRev} />}
                {tab === 1 && <FinanceTab financial={financial} revSeries={revSeries} maxRev={maxRev} />}
                {tab === 2 && <InventoryTab inventory={inventory} />}
                {tab === 3 && <MenuTab menu={menu} />}
                {tab === 4 && <CustomersTab customers={customers} />}
                {tab === 5 && <FacilitiesTab facilities={facilities} />}
                {tab === 6 && <OperationsTab operations={operations} />}
                {tab === 7 && <RisksTab risks={risks} insights={insights} />}
                {tab === 8 && <DecisionsTab decisions={decisions} />}

                <p className="text-[12px] text-gray-400 mt-6">Semua angka dihitung deterministik dari data transaksi, stok, dan reservasi. Diperbarui: {meta?.generated_at}. Rentang: {meta?.period_from} – {meta?.period_to}.</p>
            </div>
        </AppLayout>
    );
}

// ── Tab 0: Ringkasan ───────────────────────────────────────────
function SummaryTab({ financial, insights, menu, customers, facilities, inventory, operations, revSeries, maxRev }) {
    const rev = financial?.total_revenue || 0;
    const exp = financial?.total_expense || 0;
    const net = financial?.net_profit || 0;
    const orders = customers?.total_orders || 0;
    const aov = customers?.avg_order_value || 0;
    const repeat = customers?.repeat_rate_pct || 0;
    const occ = facilities?.occupancy_rate_pct || 0;

    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Omzet" value={rp(rev)} delta={net >= 0 ? 1 : -1} />
                <Kpi label="Laba Bersih" value={rp(net)} delta={net >= 0 ? 1 : -1} />
                <Kpi label="Pesanan" value={fmt(orders)} />
                <Kpi label="Nilai Rata-rata Pesanan" value={rp(aov)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Tren Omzet Harian" sub="Garis = revenue per hari periode ini">
                    <svg viewBox="0 0 600 220" className="w-full h-auto block">
                        {[0, 0.5, 1].map((f) => (
                            <g key={f}>
                                <line x1="30" x2="590" y1={190 - f * 160} y2={190 - f * 160} stroke="#e5e7eb" />
                                <text x="0" y={190 - f * 160 + 3} fill="#9ca3af" fontSize="10">{rp(maxRev * f)}</text>
                            </g>
                        ))}
                        <path d={revSeries.map((d, i) => `${i === 0 ? 'M' : 'L'}${30 + i * ((560) / Math.max(1, revSeries.length - 1))},${190 - (d.revenue / maxRev) * 160}`).join(' ')}
                            fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" />
                    </svg>
                </Card>
                <Card title="Insight Otomatis" sub="Sistem membaca pola, mengusulkan tindakan.">
                    {(insights || []).slice(0, 5).map((ins, i) => (
                        <div key={i} className="flex gap-2.5 py-2.5 border-t border-gray-100 first:border-0 text-[13px]">
                            <span className="flex-none text-[11px] font-bold px-2 py-0.5 rounded-md text-white h-fit"
                                style={{ background: TYPE_COLOR[ins.type] || '#059669' }}>
                                {ins.type.toUpperCase()}
                            </span>
                            <div>
                                <div className="font-semibold text-gray-800">{ins.title}</div>
                                <div className="text-gray-500 mt-0.5">{ins.action}</div>
                            </div>
                        </div>
                    ))}
                    {(insights || []).length === 0 && <div className="text-gray-400 text-[13px]">Belum ada insight untuk periode ini.</div>}
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Menu Terlaris" sub="Berdasarkan jumlah porsi">
                    {(menu?.top || []).slice(0, 6).map((m, i) => (
                        <BarRow key={i} name={m.name} value={m.qty} max={menu?.top?.[0]?.qty || 1} color="#059669" suffix={(v) => fmt(v)} />
                    ))}
                </Card>
                <Card title="Pelanggan & Layanan" sub="Ringkasan pelanggan">
                    <div className="space-y-2.5 text-[13px]">
                        <div className="flex justify-between"><span className="text-gray-500">Pelanggan kembali</span><b>{pct(repeat)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tamu (reservasi)</span><b>{fmt(customers?.visitors || 0)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Rating rata-rata</span><b>{customers?.avg_rating ?? '—'} ★</b></div>
                    </div>
                </Card>
                <Card title="Operasional" sub="Sinyal cepat">
                    <div className="space-y-2.5 text-[13px]">
                        <div className="flex justify-between"><span className="text-gray-500">Pesanan tertunda &gt;15 mnt</span><b className={operations?.stale_count > 0 ? 'text-amber-600' : ''}>{operations?.stale_count || 0}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Okupansi fasilitas</span><b>{pct(occ)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Menu stok habis</span><b className={inventory?.menu_stockout_count > 0 ? 'text-red-600' : ''}>{inventory?.menu_stockout_count || 0}</b></div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ── Tab 1: Keuangan ────────────────────────────────────────────
function FinanceTab({ financial, revSeries, maxRev }) {
    const expCats = financial?.expense_categories || [];
    const payMethods = financial?.payment_methods || [];
    const maxExp = Math.max(1, ...expCats.map((c) => c.amount));
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Pendapatan" value={rp(financial?.total_revenue)} />
                <Kpi label="Pengeluaran" value={rp(financial?.total_expense)} />
                <Kpi label="Laba Bersih" value={rp(financial?.net_profit)} />
                <Kpi label="Margin Kotor" value={pct(financial?.gross_margin_pct)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Pendapatan per Sumber" sub="Breakdown kategori">
                    <BarRow name="Kafe" value={financial?.revenue_cafe} max={financial?.total_revenue || 1} color="#059669" suffix={rp} />
                    <BarRow name="Reservasi" value={financial?.revenue_reservations} max={financial?.total_revenue || 1} color="#2563eb" suffix={rp} />
                    <BarRow name="Lainnya" value={financial?.revenue_other} max={financial?.total_revenue || 1} color="#d97706" suffix={rp} />
                </Card>
                <Card title="Kategori Pengeluaran" sub="Terbesar dulu">
                    {expCats.slice(0, 6).map((c, i) => (
                        <BarRow key={i} name={c.category} value={c.amount} max={maxExp} color="#d97706" suffix={rp} />
                    ))}
                </Card>
                <Card title="Metode Pembayaran" sub="Distribusi pembayaran sukses">
                    {payMethods.map((p, i) => (
                        <BarRow key={i} name={p.method} value={p.total} max={Math.max(1, ...payMethods.map((x) => x.total))} color="#2563eb" suffix={rp} />
                    ))}
                </Card>
            </div>
            <Card title="Tren Harian (Revenue vs Expense)" sub="Per hari dalam periode">
                <div className="flex items-end gap-1 h-[140px]">
                    {revSeries.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end" title={`${d.date}: rev ${rp(d.revenue)}, exp ${rp(d.expense)}`}>
                            <div className="bg-emerald-500 rounded-t" style={{ height: `${(d.revenue / maxRev) * 120}px` }} />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ── Tab 2: Stok ────────────────────────────────────────────────
function InventoryTab({ inventory }) {
    const items = inventory?.items || [];
    const suspicious = inventory?.suspicious_inventory || [];
    const lowStock = inventory?.low_stock || [];
    const maxVal = Math.max(1, ...items.map((i) => i.value));
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Nilai Stok" value={rp(inventory?.stock_value)} />
                <Kpi label="Stok Habis" value={inventory?.stockout_count || 0} />
                <Kpi label="Menu Stok Habis" value={inventory?.menu_stockout_count || 0} />
                <Kpi label="Item Mencurigakan" value={suspicious.length} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Nilai Stok per Item" sub="Barang wajar (exclude kasbon & placeholder)">
                    {items.slice(0, 8).map((i, idx) => (
                        <BarRow key={idx} name={i.name} value={i.value} max={maxVal} color="#059669" suffix={rp} />
                    ))}
                </Card>
                <Card title="Stok Menipis" sub="Perlu perhatian">
                    {lowStock.slice(0, 8).map((l, i) => (
                        <div key={i} className="flex justify-between text-[13px] py-1.5 border-t border-gray-100 first:border-0">
                            <span className="text-gray-700">{l.name}</span>
                            <span className="text-amber-600 font-semibold">{l.stock} (min {l.min})</span>
                        </div>
                    ))}
                </Card>
            </div>
            {suspicious.length > 0 && (
                <Card title="Item Mencurigakan (dikecualikan dari nilai stok)" sub="Data kotor yang mengacaukan BI — perlu ditindaklanjuti">
                    <div className="text-[13px]">
                        {suspicious.map((s, i) => (
                            <div key={i} className="flex justify-between py-1 border-t border-gray-100 first:border-0">
                                <span className="text-gray-700">{s.name} <span className="text-gray-400">({s.location})</span></span>
                                <span className="text-red-600">{s.reason} · {rp(s.stock * s.price)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ── Tab 3: Menu ────────────────────────────────────────────────
function MenuTab({ menu }) {
    const quads = menu?.quadrants || {};
    const [hppOpen, setHppOpen] = useState(false);
    const [targetPct, setTargetPct] = useState(32);
    const [hppCat, setHppCat] = useState('makanan');
    const [hppData, setHppData] = useState(null);
    const [hppLoading, setHppLoading] = useState(false);
    const [hppEdits, setHppEdits] = useState({});

    const csrfHeader = () => {
        // Laravel menyediakan cookie XSRF-TOKEN (URL-encoded). Ini yang benar
        // dipakai fetch — bukan meta tag yang sering tidak ada di Inertia.
        const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    };
    const csrfHeaders = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': csrfHeader() };

    const proposeHpp = async () => {
        setHppLoading(true);
        try {
            const res = await fetch(`/admin/bi/hpp/propose`, {
                method: 'POST',
                headers: csrfHeaders,
                body: JSON.stringify({ category: hppCat, target_pct: targetPct }),
            });
            const data = await res.json();
            if (data.suggestions) {
                setHppData(data);
                const edits = {};
                data.suggestions.forEach((s) => { edits[s.id] = s.suggested_cost; });
                setHppEdits(edits);
            } else {
                console.error('Propose gagal:', data);
            }
        } catch (e) { console.error(e); }
        setHppLoading(false);
    };

    const applyHpp = async () => {
        const updates = (hppData?.suggestions || []).map((s) => ({ id: s.id, cost_price: hppEdits[s.id] }));
        await fetch(`/admin/bi/hpp/apply`, {
            method: 'POST',
            headers: csrfHeaders,
            body: JSON.stringify({ updates }),
        });
        setHppOpen(false);
        setHppData(null);
        router.reload({ only: ['menu'] });
    };

    const quadMeta = {
        star: { label: 'Bintang', color: '#059669', desc: 'Laris & untung. Pertahankan, jangan diskon.' },
        cash_cow: { label: 'Penarik Traffic', color: '#2563eb', desc: 'Laris margin rendah: naikkan harga kecil.' },
        question: { label: 'Potensial', color: '#d97706', desc: 'Margin bagus kurang laku: ubah nama/foto.' },
        dog: { label: 'Evaluasi', color: '#dc2626', desc: 'Kurang laku & margin rendah: uji ulang / hapus.' },
    };
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Margin Rata-rata" value={pct(menu?.avg_margin_pct)} />
                <Kpi label="Cakupan HPP" value={pct(menu?.cost_coverage_pct)} sub="menu dgn cost_price" />
                <Kpi label="Menu Terjual" value={menu?.items?.length || 0} />
                <div className="flex items-end justify-end">
                    <button onClick={() => setHppOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700">
                        <Plus size={14} /> Isi HPP Massal
                    </button>
                </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                {Object.keys(quadMeta).map((q) => (
                    <Card key={q} title={`${quadMeta[q].label} (${(quads[q] || []).length})`} sub={quadMeta[q].desc}>
                        <div className="space-y-1.5">
                            {(quads[q] || []).slice(0, 5).map((m, i) => (
                                <div key={i} className="flex justify-between text-[13px]">
                                    <span className="text-gray-700">{m.name}</span>
                                    <span className="text-gray-500">{m.qty} porsi · {pct(m.margin_pct)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
            <Card title="Top Menu (terjual terbanyak)" sub="Dengan margin & laba kotor">
                {(menu?.top || []).map((m, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-t border-gray-100 first:border-0 text-[13px]">
                        <span className="w-6 text-center text-gray-400">{i + 1}</span>
                        <span className="flex-1 text-gray-700">{m.name}</span>
                        <span className="text-gray-500 w-20 text-right">{m.qty} porsi</span>
                        <span className="text-gray-500 w-24 text-right">{rp(m.revenue)}</span>
                        <span className="w-16 text-right font-semibold" style={{ color: m.margin_pct >= 50 ? '#059669' : m.margin_pct >= 25 ? '#d97706' : '#dc2626' }}>{pct(m.margin_pct)}</span>
                    </div>
                ))}
            </Card>

            {hppOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setHppOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[16px] font-bold text-gray-900">Isi HPP Massal</h3>
                            <button onClick={() => setHppOpen(false)} className="text-gray-400 hover:text-gray-600 text-[20px]">×</button>
                        </div>
                        <p className="text-[13px] text-gray-500 mb-4">
                            Usulan dihitung transparan: <b>harga jual × % food-cost</b>. Ini <b>bukan asumsi harga bahan</b> — kamu yang memutuskan & bisa edit per item sebelum simpan.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['makanan', 'minuman', 'snack', 'dessert'].map((c) => (
                                <button key={c} onClick={() => setHppCat(c)}
                                    className={`px-3 py-1.5 rounded-lg text-[13px] border ${hppCat === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <label className="text-[13px] text-gray-600">Target food-cost:</label>
                            <input type="number" value={targetPct} onChange={(e) => setTargetPct(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-[14px]" min="5" max="80" />
                            <span className="text-[13px] text-gray-500">%</span>
                            <button onClick={proposeHpp} disabled={hppLoading}
                                className="ml-2 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[13px] disabled:opacity-50">
                                {hppLoading ? 'Menghitung…' : 'Hitung Usulan'}
                            </button>
                        </div>
                        {hppData && (
                            <>
                                <div className="max-h-[40vh] overflow-y-auto border border-gray-200 rounded-xl">
                                    {hppData.suggestions.map((s) => (
                                        <div key={s.id} className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 first:border-0 text-[13px]">
                                            <span className="flex-1 text-gray-700 truncate">{s.name}</span>
                                            <span className="text-gray-400 w-20 text-right">{rp(s.price)}</span>
                                            <input type="number" value={hppEdits[s.id] ?? ''}
                                                onChange={(e) => setHppEdits({ ...hppEdits, [s.id]: e.target.value })}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-right" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setHppOpen(false)} className="px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:bg-gray-100">Batal</button>
                                    <button onClick={applyHpp} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold">
                                        Simpan {hppData.count} HPP
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tab 4: Pelanggan ───────────────────────────────────────────
function CustomersTab({ customers }) {
    const segs = customers?.segments || {};
    const segList = [
        { key: 'baru', label: 'Baru', color: '#2563eb' },
        { key: 'loyal', label: 'Loyal', color: '#059669' },
        { key: 'berpotensi', label: 'Berpotensi', color: '#d97706' },
        { key: 'berisiko', label: 'Berisiko', color: '#dc2626' },
    ];
    const maxSeg = Math.max(1, ...segList.map((s) => segs[s.key] || 0));
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Pelanggan Unik" value={fmt(customers?.unique_customers)} />
                <Kpi label="Tingkat Kembali" value={pct(customers?.repeat_rate_pct)} />
                <Kpi label="Tamu Reservasi" value={fmt(customers?.visitors)} />
                <Kpi label="Rating Rata-rata" value={customers?.avg_rating ? `${customers.avg_rating} ★` : '—'} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Segmen Pelanggan" sub="Baru vs kembali vs loyal vs berisiko">
                    {segList.map((s, i) => (
                        <BarRow key={i} name={s.label} value={segs[s.key] || 0} max={maxSeg} color={s.color} suffix={fmt} />
                    ))}
                </Card>
                <Card title="Corong & Metrik" sub="Ringkasan perilaku">
                    <div className="space-y-2.5 text-[13px]">
                        <div className="flex justify-between"><span className="text-gray-500">Total pesanan</span><b>{fmt(customers?.total_orders)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Pesanan tamu (non-akun)</span><b>{fmt(customers?.guest_orders)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Pelanggan baru</span><b>{fmt(customers?.new_customers)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Pelanggan kembali</span><b>{fmt(customers?.returning_customers)}</b></div>
                        <div className="flex justify-between"><span className="text-gray-500">Ulasan</span><b>{fmt(customers?.review_count)}</b></div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ── Tab 5: Fasilitas ───────────────────────────────────────────
function FacilitiesTab({ facilities }) {
    const rows = facilities?.rows || [];
    const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Reservasi" value={fmt(facilities?.total_reservations)} />
                <Kpi label="Okupansi" value={pct(facilities?.occupancy_rate_pct)} />
                <Kpi label="Pendapatan per Unit Tersedia" value={rp(facilities?.revenue_per_available)} />
                <Kpi label="Tingkat Pembatalan" value={pct(facilities?.cancellation_rate_pct)} />
            </div>
            <Card title="Fasilitas: Pendapatan & Pemakaian" sub="Per unit">
                {rows.map((r, i) => (
                    <div key={i} className="py-1.5 border-t border-gray-100 first:border-0">
                        <div className="flex justify-between text-[13px] mb-1">
                            <span className="text-gray-700 font-medium">{r.name}</span>
                            <span className="text-gray-500">{r.reservations} res · {pct(r.cancellation_rate_pct)} batal</span>
                        </div>
                        <BarRow name="" value={r.revenue} max={maxRev} color="#059669" suffix={rp} />
                    </div>
                ))}
            </Card>
        </div>
    );
}

// ── Tab 6: Operasional ─────────────────────────────────────────
function OperationsTab({ operations }) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Total Pesanan" value={fmt(operations?.total_orders)} />
                <Kpi label="Rata-rata Waktu Proses" value={`${operations?.avg_prep_minutes || 0} mnt`} />
                <Kpi label="Pesanan Tertunda" value={operations?.stale_count || 0} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Peta Jam Sibuk" sub="Pesanan per jam (Sen–Min, 09:00–20:00)">
                    <Heatmap heatmap={operations?.heatmap} />
                </Card>
                <Card title="Pesanan Tertunda &gt;15 Menit" sub="Perlu perhatian dapur">
                    {(operations?.stale_orders || []).map((o, i) => (
                        <div key={i} className="flex justify-between text-[13px] py-1.5 border-t border-gray-100 first:border-0">
                            <span className="text-gray-700">#{o.id} · {o.status}</span>
                            <span className="text-amber-600">{o.minutes} mnt · {rp(o.total)}</span>
                        </div>
                    ))}
                    {(operations?.stale_orders || []).length === 0 && <div className="text-gray-400 text-[13px]">Tidak ada pesanan tertunda. 👍</div>}
                </Card>
            </div>
        </div>
    );
}

// ── Tab 7: Risiko ──────────────────────────────────────────────
function RisksTab({ risks, insights }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Daftar Risiko & Kualitas Data" sub="Deteksi otomatis dari data">
                {(risks || []).map((r, i) => (
                    <div key={i} className="flex gap-3 py-2.5 border-t border-gray-100 first:border-0">
                        <span className="flex-none text-[11px] font-bold px-2 py-0.5 rounded-md text-white h-fit"
                            style={{ background: SEV_COLOR[r.severity] || '#6b7280' }}>{r.severity.toUpperCase()}</span>
                        <div>
                            <div className="text-[13px] font-semibold text-gray-800">{r.title}</div>
                            <div className="text-[13px] text-gray-500 mt-0.5">{r.action}</div>
                        </div>
                    </div>
                ))}
                {(risks || []).length === 0 && <div className="text-gray-400 text-[13px]">Tidak ada risiko terdeteksi. 👍</div>}
            </Card>
            <Card title="Semua Insight" sub="Peluang, perhatian, risiko, dan test">
                {(insights || []).map((ins, i) => (
                    <div key={i} className="flex gap-2.5 py-2.5 border-t border-gray-100 first:border-0 text-[13px]">
                        <span className="flex-none text-[11px] font-bold px-2 py-0.5 rounded-md text-white h-fit"
                            style={{ background: TYPE_COLOR[ins.type] || '#059669' }}>{ins.type.toUpperCase()}</span>
                        <div>
                            <div className="font-semibold text-gray-800">{ins.title}</div>
                            <div className="text-gray-500 mt-0.5">{ins.detail} <b>{ins.action}</b></div>
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
}

// ── Tab 8: Keputusan ───────────────────────────────────────────
function DecisionsTab({ decisions }) {
    const [form, setForm] = useState({ title: '', hypothesis: '', metric: '', target: '', evaluate_at: '' });
    const [showForm, setShowForm] = useState(false);
    const statusColors = { direncanakan: '#2563eb', berjalan: '#d97706', terbukti: '#059669', tidak_berhasil: '#dc2626' };

    const submit = (e) => {
        e.preventDefault();
        router.post('/admin/bi/decisions', form, {
            preserveScroll: true,
            onSuccess: () => { setForm({ title: '', hypothesis: '', metric: '', target: '', evaluate_at: '' }); setShowForm(false); },
        });
    };
    const setStatus = (id, status) => {
        router.patch(`/admin/bi/decisions/${id}`, { status }, { preserveScroll: true });
    };

    return (
        <div className="grid gap-4">
            <div className="flex justify-between items-center">
                <div className="text-[13px] text-gray-500">Siklus: data → insight → hipotesis → tindakan → ukur.</div>
                <button onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700">
                    <Plus size={14} /> Catat Keputusan
                </button>
            </div>
            {showForm && (
                <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Judul keputusan (mis. uji paket menu)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]" />
                    <textarea value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="Hipotesis: mengapa ini akan berhasil?" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]" rows={2} />
                    <div className="grid gap-3 sm:grid-cols-3">
                        <input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} placeholder="Metrik (mis. AOV)" className="px-3 py-2 border border-gray-300 rounded-lg text-[14px]" />
                        <input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="Target (mis. +10%)" className="px-3 py-2 border border-gray-300 rounded-lg text-[14px]" />
                        <input value={form.evaluate_at} onChange={(e) => setForm({ ...form, evaluate_at: e.target.value })} type="date" className="px-3 py-2 border border-gray-300 rounded-lg text-[14px]" />
                    </div>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold">Simpan</button>
                </form>
            )}
            {(decisions || []).map((d) => (
                <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-gray-900 text-[15px]">{d.title}</div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: statusColors[d.status] || '#6b7280' }}>{d.status}</span>
                    </div>
                    {d.hypothesis && <div className="text-[13px] text-gray-600 mt-1">Hipotesis: {d.hypothesis}</div>}
                    {(d.metric || d.target) && <div className="text-[13px] text-gray-500 mt-1">Metrik: {d.metric} · Target: {d.target}</div>}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {Object.keys(statusColors).map((s) => (
                            <button key={s} onClick={() => setStatus(d.id, s)}
                                className="text-[12px] px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 capitalize">{s.replace('_', ' ')}</button>
                        ))}
                    </div>
                </div>
            ))}
            {(decisions || []).length === 0 && <div className="text-gray-400 text-[13px]">Belum ada keputusan dicatat. Mulai dari insight yang muncul.</div>}
        </div>
    );
}
