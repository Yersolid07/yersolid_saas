import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Boxes, Search, ArrowDownCircle, ArrowUpCircle, Pencil, AlertTriangle } from 'lucide-react';

export default function StaffInventoryIndex({ inventories, filters, cafeMenuItems = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ type: 'in', quantity: '', total_cost: '', notes: '', menu_item_id: '', transfer_to_menu: false });
    const searchTimer = useRef(null);

    const applyFilter = (nextSearch) => {
        router.get(route('staff.inventory.index'), {
            search: nextSearch || '',
        }, {
            preserveState: true,
            replace: true,
            only: ['inventories', 'filters'],
        });
    };

    const onSearchChange = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilter(value), 350);
    };

    const openModal = (inv) => {
        setModal(inv);
        setForm({ type: 'in', quantity: '', total_cost: '', notes: '', menu_item_id: '', transfer_to_menu: false });
    };

    const submit = (e) => {
        e.preventDefault();
        // Jika "Kirim ke Cafe" dicentang: transfer gudang -> menu.
        if (form.transfer_to_menu && form.menu_item_id) {
            window.axios.post(route('staff.inventory.transfer-to-menu', modal.id), form)
                .then(() => { setModal(null); window.location.reload(); })
                .catch((err) => alert(err.response?.data?.message || 'Gagal transfer'));
            return;
        }
        window.axios.post(route('staff.inventory.transaction', modal.id), form)
            .then(() => { setModal(null); window.location.reload(); })
            .catch((err) => alert(err.response?.data?.message || 'Gagal menyimpan'));
    };

    return (
        <AppLayout title="Gudang">
            <Head title="Gudang Bahan Baku" />
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Boxes size={22} /> Gudang Bahan Baku
                </h1>
                <p className="text-sm text-slate-500 mb-5">Stok bahan baku & operasional. Staff bisa input masuk/keluar/penyesuaian.</p>

                <form onSubmit={(e) => { e.preventDefault(); applyFilter(search); }} className="flex gap-3 mb-5 bg-white p-4 rounded-xl border border-slate-100">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari bahan..." className="border rounded-md text-sm pl-9 pr-3 py-2 w-full" />
                    </div>
                </form>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="px-4 py-3 text-left">Kategori</th>
                                <th className="px-4 py-3 text-left">Stok</th>
                                <th className="px-4 py-3 text-left">Min</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inventories.map((inv) => (
                                <tr key={inv.id} className={inv.low ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}>
                                    <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                        {inv.low && <AlertTriangle size={14} className="text-red-500" />}
                                        {inv.name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{inv.category || '-'}</td>
                                    <td className="px-4 py-3">{inv.current_stock} {inv.unit}</td>
                                    <td className="px-4 py-3 text-slate-500">{inv.minimum_stock} {inv.unit}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => openModal(inv)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">Input Stok</button>
                                    </td>
                                </tr>
                            ))}
                            {inventories.length === 0 && (
                                <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-400">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{modal.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">Stok saat ini: {modal.current_stock} {modal.unit}</p>
                        <form onSubmit={submit} className="space-y-3">
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, transfer_to_menu: e.target.value !== 'out' ? false : form.transfer_to_menu })} className="border rounded-md text-sm px-3 py-2 w-full">
                                <option value="in">Masuk (Restock)</option>
                                <option value="out">Keluar (Pakai/Rusak)</option>
                                <option value="adjustment">Penyesuaian (Set exact)</option>
                            </select>
                            {form.type === 'out' && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.transfer_to_menu}
                                            onChange={(e) => setForm({ ...form, transfer_to_menu: e.target.checked, menu_item_id: e.target.checked ? form.menu_item_id : '' })}
                                            className="rounded border-stone-300 text-indigo-600"
                                        />
                                        <span>Kirim ke Cafe (menu bertambah, stok ini berkurang)</span>
                                    </label>
                                    {form.transfer_to_menu && (
                                        <select value={form.menu_item_id} onChange={(e) => setForm({ ...form, menu_item_id: e.target.value })} className="border rounded-md text-sm px-3 py-2 w-full" required>
                                            <option value="">Pilih menu cafe...</option>
                                            {cafeMenuItems.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name} — {m.category}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                            <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Jumlah" className="border rounded-md text-sm px-3 py-2 w-full" required />
                            <input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} placeholder="Total biaya (opsional)" className="border rounded-md text-sm px-3 py-2 w-full" />
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan" className="border rounded-md text-sm px-3 py-2 w-full" />
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-md py-2 text-sm">Batal</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold flex items-center justify-center gap-2">
                                    {form.type === 'in' ? <ArrowDownCircle size={16} /> : form.type === 'out' ? <ArrowUpCircle size={16} /> : <Pencil size={16} />}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
