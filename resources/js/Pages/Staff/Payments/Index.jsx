import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CreditCard, Check, X, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const StatusBadge = ({ status }) => {
    const map = {
        success: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        failed: 'bg-rose-100 text-rose-700',
    };
    const label = { success: 'Lunas', pending: 'Menunggu', failed: 'Gagal' }[status] || status;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>{label}</span>;
};

export default function StaffPaymentsIndex({ payments, filters, stats }) {
    const [data, setData] = React.useState({
        status: filters.status || '', date_from: filters.date_from || '', date_to: filters.date_to || '',
    });

    const verifyPayment = (id, action) => {
        router.patch(route('staff.payments.verify', id), { payment_status: action }, { preserveScroll: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('staff.payments.index'), data, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout title="Pembayaran">
            <Head title="Pembayaran" />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <CreditCard size={22} /> Pembayaran
                </h1>
                <p className="text-sm text-slate-500 mb-5">Daftar semua pembayaran. Staff dapat memverifikasi pembayaran yang menunggu.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <p className="text-xs text-slate-500">Total Hari Ini (Lunas)</p>
                        <p className="text-2xl font-black text-slate-900">Rp {Number(stats.total_today || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <p className="text-xs text-slate-500">Total Bulan Ini (Lunas)</p>
                        <p className="text-2xl font-black text-slate-900">Rp {Number(stats.total_month || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <p className="text-xs text-slate-500">Menunggu Verifikasi</p>
                        <p className="text-3xl font-black text-amber-600">{stats.pending_count || 0}</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-5 bg-white p-4 rounded-xl border border-slate-100">
                    <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })} className="border rounded-md text-sm px-3 py-2">
                        <option value="">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="success">Lunas</option>
                        <option value="failed">Gagal</option>
                    </select>
                    <input type="date" value={data.date_from} onChange={e => setData({ ...data, date_from: e.target.value })} className="border rounded-md text-sm px-3 py-2" />
                    <input type="date" value={data.date_to} onChange={e => setData({ ...data, date_to: e.target.value })} className="border rounded-md text-sm px-3 py-2" />
                    <button className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"><Search size={16} /> Cari</button>
                </form>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Waktu</th>
                                <th className="px-4 py-3 text-left">Pelanggan</th>
                                <th className="px-4 py-3 text-left">Metode</th>
                                <th className="px-4 py-3 text-left">Jumlah</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.data.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{format(new Date(p.created_at), 'dd MMM HH:mm', { locale: id })}</td>
                                    <td className="px-4 py-3">{p.reservation?.user?.name || p.foodOrder?.user?.name || p.user?.name || '-'}</td>
                                    <td className="px-4 py-3 uppercase">{p.payment_method}</td>
                                    <td className="px-4 py-3 font-semibold">Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3"><StatusBadge status={p.payment_status} /></td>
                                    <td className="px-4 py-3">
                                        {p.payment_status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => verifyPayment(p.id, 'success')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1"><Check size={14} /> Setuju</button>
                                                <button onClick={() => verifyPayment(p.id, 'failed')} className="bg-rose-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1"><X size={14} /> Tolak</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payments.data.length === 0 && (
                                <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">Tidak ada data pembayaran.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="p-4 flex justify-between text-sm text-slate-600">
                        <span>Menampilkan {payments.from}-{payments.to} dari {payments.total}</span>
                        <div className="flex gap-1">
                            {payments.links.map((l, i) => (
                                <button key={i} disabled={!l.url} onClick={() => l.url && router.get(l.url)} className={`px-3 py-1 border rounded ${l.active ? 'bg-slate-800 text-white' : 'bg-white'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
