import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Tag, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Index({ coupons, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '') || status !== (filters.status || 'all')) {
            router.get(route('admin.coupons.index'), {
                search: debouncedSearch,
                status: status === 'all' ? undefined : status,
            }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, status]);

    const destroy = async (id) => {
        if (await window.customConfirm('Yakin ingin menghapus kupon ini?')) {
            router.delete(route('admin.coupons.destroy', id));
        }
    };

    const toggleStatus = (id) => {
        router.patch(route('admin.coupons.toggle', id));
    };

    return (
        <AppLayout title="Manajemen Kupon & Diskon">
            <Head title="Manajemen Kupon" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="text-emerald-500" /> Manajemen Kupon
                    </h2>
                    <Link
                        href={route('admin.coupons.create')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold border border-emerald-500 shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Tambah Kupon
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Cari kode kupon..."
                                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        </div>
                        <select
                            className="border border-stone-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 px-4 py-2"
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-stone-200 text-stone-500 text-sm">
                                    <th className="py-3 px-4 font-semibold">Kode Kupon</th>
                                    <th className="py-3 px-4 font-semibold">Tipe & Nilai</th>
                                    <th className="py-3 px-4 font-semibold">Min. Pembelian</th>
                                    <th className="py-3 px-4 font-semibold">Penggunaan</th>
                                    <th className="py-3 px-4 font-semibold">Berlaku Sampai</th>
                                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {coupons.data.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-slate-800 uppercase tracking-wider">{coupon.code}</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {coupon.type === 'percent' ? (
                                                <span className="font-bold text-emerald-600">{parseFloat(coupon.value)}%</span>
                                            ) : (
                                                <span className="font-bold text-emerald-600">Rp {parseFloat(coupon.value).toLocaleString('id-ID')}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            Rp {parseFloat(coupon.min_purchase).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="font-medium text-slate-900">{coupon.used_count}</span>
                                            {coupon.max_uses ? ` / ${coupon.max_uses}` : ' / ∞'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('id-ID') : 'Selamanya'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(coupon.id)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    coupon.is_active ? 'bg-emerald-500' : 'bg-stone-300'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                                    coupon.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('admin.coupons.edit', coupon.id)}
                                                    className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => destroy(coupon.id)}
                                                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {coupons.data.length === 0 && (
                            <div className="text-center py-12 text-stone-500">
                                Belum ada kupon yang ditambahkan.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {coupons.last_page > 1 && (
                        <div className="flex justify-center gap-2 pt-6 border-t border-stone-100">
                            {coupons.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        link.active 
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' 
                                            : link.url 
                                                ? 'bg-stone-50 text-slate-600 hover:bg-stone-100' 
                                                : 'bg-transparent text-stone-400 cursor-not-allowed'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
