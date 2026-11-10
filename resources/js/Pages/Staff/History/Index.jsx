import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FileText, UtensilsCrossed, CalendarDays, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function StaffHistoryIndex({ tab, orders, reservations, filters }) {
    const [activeTab, setActiveTab] = React.useState(tab || 'orders');
    const [status, setStatus] = React.useState(filters.status || '');

    const switchTab = (t) => {
        setActiveTab(t);
        router.get(route('staff.history.index'), { tab: t, status }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.history.index'), { tab: activeTab, status }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout title="Riwayat">
            <Head title="Riwayat Pesanan & Reservasi" />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <FileText size={22} /> Riwayat Pesanan & Reservasi
                </h1>
                <p className="text-sm text-slate-500 mb-5">Semua catatan pemesanan kafe dan reservasi fasilitas.</p>

                <div className="flex gap-2 mb-5">
                    <button onClick={() => switchTab('orders')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>
                        <UtensilsCrossed size={16} /> Pesanan Kafe
                    </button>
                    <button onClick={() => switchTab('reservations')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'reservations' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>
                        <CalendarDays size={16} /> Reservasi
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 mb-5 bg-white p-4 rounded-xl border border-slate-100">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-md text-sm px-3 py-2">
                        <option value="">Semua Status</option>
                        {activeTab === 'orders' ? (
                            ['pending','preparing','ready','delivered','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)
                        ) : (
                            ['pending','confirmed','checked_in','checked_out','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)
                        )}
                    </select>
                    <button className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"><Search size={16} /> Cari</button>
                </form>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Waktu</th>
                                <th className="px-4 py-3 text-left">Pelanggan</th>
                                <th className="px-4 py-3 text-left">Detail</th>
                                <th className="px-4 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeTab === 'orders' && orders.data.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{format(new Date(o.created_at), 'dd MMM HH:mm', { locale: id })}</td>
                                    <td className="px-4 py-3">{o.user?.name || 'Guest'}</td>
                                    <td className="px-4 py-3">{o.items?.map(i => `${i.menuItem?.name || i.menu_item?.name || 'Item'} x${i.quantity}`).join(', ') || '-'}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{o.status}</span></td>
                                </tr>
                            ))}
                            {activeTab === 'reservations' && reservations.data.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{format(new Date(r.created_at), 'dd MMM HH:mm', { locale: id })}</td>
                                    <td className="px-4 py-3">{r.user?.name || 'Guest'}</td>
                                    <td className="px-4 py-3">{r.facility?.name} ({r.date})</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{r.status}</span></td>
                                </tr>
                            ))}
                            {((activeTab === 'orders' && orders.data.length === 0) || (activeTab === 'reservations' && reservations.data.length === 0)) && (
                                <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-400">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-between text-sm text-slate-600">
                        <span>Menampilkan {(activeTab === 'orders' ? orders.from : reservations.from)}-{(activeTab === 'orders' ? orders.to : reservations.to)} dari {(activeTab === 'orders' ? orders.total : reservations.total)}</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
