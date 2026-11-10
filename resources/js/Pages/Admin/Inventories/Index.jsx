import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Package, Plus, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, AlertCircle, History, Search, X, RefreshCw } from 'lucide-react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import DangerButton from '@/Components/DangerButton';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ inventories, categories = [], locations = ['warehouse', 'kitchen', 'cafe', 'general'], unlinkedMenuItems = [], cafeMenuItems = [], filters = { search: '', category: '', location: '' } }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [transactionItem, setTransactionItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [location, setLocation] = useState(filters.location || '');

    const { data: formData, setData: setFormData, post, put, delete: destroy, processing: formProcessing, reset: resetForm, errors: formErrors } = useForm({
        name: '', category: 'Bahan Makanan', unit: '', current_stock: '', initial_total_cost: '', minimum_stock: 0, price_per_unit: '', barcode: '', notes: '', location: 'warehouse'
    });

    const { data: transData, setData: setTransData, post: postTrans, processing: transProcessing, reset: resetTrans, errors: transErrors } = useForm({
        type: 'in', quantity: '', total_cost: '', notes: '', menu_item_id: '', transfer_to_menu: false
    });

    const openCreateForm = () => {
        setEditingItem(null);
        resetForm();
        setIsFormOpen(true);
    };

    const openEditForm = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category || 'Bahan Makanan',
            unit: item.unit,
            current_stock: item.current_stock || '',
            initial_total_cost: '',
            minimum_stock: item.minimum_stock,
            price_per_unit: item.price_per_unit || '',
            barcode: item.barcode || '',
            notes: item.notes || '',
            location: item.location || 'warehouse'
        });
        setIsFormOpen(true);
    };

    const openTransaction = (item) => {
        setTransactionItem(item);
        resetTrans();
        setTransData('type', 'in');
        setTransData('transfer_to_menu', false);
        setIsTransactionOpen(true);
    };

    const openHistory = (item) => {
        setHistoryItem(item);
        setIsHistoryOpen(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('admin.inventories.update', editingItem.id), {
                onSuccess: () => setIsFormOpen(false)
            });
        } else {
            post(route('admin.inventories.store'), {
                onSuccess: () => setIsFormOpen(false)
            });
        }
    };

    const submitTransaction = (e) => {
        e.preventDefault();
        // Jika "Kirim ke Cafe" dicentang: gudang -> menu (menu bertambah, gudang berkurang).
        if (transData.transfer_to_menu && transData.menu_item_id) {
            postTrans(route('admin.inventories.transfer-to-menu', transactionItem.id), {
                onSuccess: () => setIsTransactionOpen(false)
            });
            return;
        }
        postTrans(route('admin.inventories.transaction', transactionItem.id), {
            onSuccess: () => setIsTransactionOpen(false)
        });
    };

    const handleDelete = async (id) => {
        if(await window.customConfirm('Hapus bahan baku ini?')) {
            router.delete(route('admin.inventories.destroy', id));
        }
    };

    // Server-side search + category + location filter (debounced for text input)
    const applyFilter = (nextSearch, nextCategory, nextLocation) => {
        router.get(route('admin.inventories.index'), {
            search: nextSearch || '',
            category: nextCategory || '',
            location: nextLocation || '',
        }, {
            preserveState: true,
            replace: true,
            only: ['inventories', 'filters', 'categories'],
        });
    };

    const onSearchChange = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilter(value, category, location), 350);
    };

    const onCategoryChange = (value) => {
        setCategory(value);
        applyFilter(search, value, location);
    };

    const onLocationChange = (value) => {
        setLocation(value);
        applyFilter(search, category, value);
    };

    const resetFilter = () => {
        setSearch('');
        setCategory('');
        setLocation('');
        applyFilter('', '', '');
    };

    return (
        <AppLayout title="Inventori Stok">
            <Head title="Manajemen Stok" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Package className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Inventori Stok Bahan</h2>
                            <p className="text-slate-500 text-sm">Kelola stok bahan baku restoran dan resort</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={openCreateForm} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Plus size={16} /> Tambah Bahan Baru
                    </PrimaryButton>
                </div>

                {/* Location Tabs: Gudang vs Dapur */}
                <div className="flex gap-2">
                    <button onClick={() => onLocationChange('')} className={`px-4 py-2 rounded-lg text-sm font-medium ${location === '' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Semua</button>
                    <button onClick={() => onLocationChange('warehouse')} className={`px-4 py-2 rounded-lg text-sm font-medium ${location === 'warehouse' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Gudang (Bahan Baku)</button>
                    <button onClick={() => onLocationChange('kitchen')} className={`px-4 py-2 rounded-lg text-sm font-medium ${location === 'kitchen' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Dapur</button>
                    <button onClick={() => onLocationChange('cafe')} className={`px-4 py-2 rounded-lg text-sm font-medium ${location === 'cafe' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Cafe (Produk Jual)</button>
                    <button onClick={() => onLocationChange('general')} className={`px-4 py-2 rounded-lg text-sm font-medium ${location === 'general' ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}>Inventaris Umum</button>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <TextInput
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Cari nama bahan baku..."
                            className="w-full pl-9 pr-3 py-2.5"
                        />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full sm:w-56 bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl py-2.5"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select
                        value={location}
                        onChange={(e) => onLocationChange(e.target.value)}
                        className="w-full sm:w-56 bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl py-2.5"
                    >
                        <option value="">Semua Lokasi</option>
                        <option value="warehouse">Gudang</option>
                        <option value="kitchen">Dapur</option>
                        <option value="cafe">Cafe (Produk Jual)</option>
                        <option value="general">Inventaris Umum</option>
                    </select>
                    {(search || category) && (
                        <button
                            onClick={resetFilter}
                            className="text-sm font-semibold text-stone-500 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        >
                            Reset
                        </button>
                    )}
                    <span className="text-xs text-stone-400 shrink-0 hidden sm:block">
                        {inventories.length} item
                    </span>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-bold">Nama Bahan</th>
                                    <th className="p-4 font-bold">Stok Saat Ini</th>
                                    <th className="p-4 font-bold">Batas Minimum</th>
                                    <th className="p-4 font-bold">Harga/Unit</th>
                                    <th className="p-4 font-bold">Total Beli</th>
                                    <th className="p-4 font-bold">Restock Terakhir</th>
                                    <th className="p-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {inventories.map(item => {
                                    const isLowStock = parseFloat(item.current_stock) <= parseFloat(item.minimum_stock);
                                    return (
                                        <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{item.name}</div>
                                                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded mt-1">{item.category}</div>
                                                {item.notes && <div className="text-xs text-slate-500 truncate max-w-[200px] mt-1">{item.notes}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                                                    isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {isLowStock && <AlertCircle size={14} />}
                                                    {parseFloat(item.current_stock)} {item.unit}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600">{parseFloat(item.minimum_stock)} {item.unit}</td>
                                            <td className="p-4 text-slate-600">{item.price_per_unit ? `Rp ${parseFloat(item.price_per_unit).toLocaleString('id-ID')}` : '-'}</td>
                                            <td className="p-4 text-slate-600">{item.total_cost_in > 0 ? `Rp ${parseFloat(item.total_cost_in).toLocaleString('id-ID')}` : '-'}</td>
                                            <td className="p-4 text-slate-600 text-sm whitespace-nowrap">{item.last_restock ? formatDate(item.last_restock) : '-'}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => openHistory(item)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Lihat Riwayat">
                                                    <History size={18} />
                                                </button>
                                                <button onClick={() => openEditForm(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => openTransaction(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Transaksi Stok">
                                                    <RefreshCw size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {inventories.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">
                                            <Package size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Belum ada data stok bahan baku.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Modal */}
                <Modal show={isFormOpen} onClose={() => setIsFormOpen(false)}>
                    <form onSubmit={submitForm} className="p-6 space-y-6">
                        <h2 className="text-lg font-bold text-slate-900">{editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <InputLabel value="Nama Bahan Baku" />
                                <TextInput className="mt-1 block w-full" value={formData.name} onChange={e => setFormData('name', e.target.value)} required />
                            </div>
                            <div>
                                <InputLabel value="Kategori" />
                                <select 
                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl"
                                    value={formData.category}
                                    onChange={e => setFormData('category', e.target.value)}
                                    required
                                >
                                    <option value="Bahan Makanan">Bahan Makanan</option>
                                    <option value="Minuman">Minuman</option>
                                    <option value="Perlengkapan Kamar">Perlengkapan Kamar</option>
                                    <option value="Toiletries">Toiletries</option>
                                    <option value="Kebersihan">Kebersihan</option>
                                    <option value="Operasional">Operasional</option>
                                    <option value="Inventaris Umum">Inventaris Umum</option>
                                    <option value="Other Income">Other Income</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Satuan (Unit)" />
                                    <TextInput className="mt-1 block w-full" placeholder="cth: kg, pcs, liter" value={formData.unit} onChange={e => setFormData('unit', e.target.value)} required />
                                </div>
                                <div>
                                    <InputLabel value="Batas Stok Minimum" />
                                    <TextInput type="number" step="0.01" className="mt-1 block w-full" value={formData.minimum_stock} onChange={e => setFormData('minimum_stock', e.target.value)} required />
                                </div>
                            </div>
                            {!editingItem && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Stok Awal" />
                                        <TextInput type="number" step="0.01" className="mt-1 block w-full" value={formData.current_stock} onChange={e => setFormData('current_stock', e.target.value)} required />
                                        {formErrors.current_stock && <p className="text-sm text-rose-500 mt-1">{formErrors.current_stock}</p>}
                                    </div>
                                    <div>
                                        <InputLabel value="Total Pengeluaran Riil (Rp)" />
                                        <TextInput type="number" className="mt-1 block w-full" placeholder="Cth: 150000" value={formData.initial_total_cost} onChange={e => setFormData('initial_total_cost', e.target.value)} />
                                        <p className="text-xs text-stone-500 mt-1">Isi jika pembelian stok awal ini adalah pengeluaran (Opsional)</p>
                                        {formErrors.initial_total_cost && <p className="text-sm text-rose-500 mt-1">{formErrors.initial_total_cost}</p>}
                                    </div>
                                </div>
                            )}
                            <div>
                                <InputLabel value="Harga per Satuan (Opsional)" />
                                <TextInput type="number" className="mt-1 block w-full" value={formData.price_per_unit} onChange={e => setFormData('price_per_unit', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value="Barcode (Opsional)" />
                                <TextInput className="mt-1 block w-full" placeholder="Scan barcode di sini..." value={formData.barcode} onChange={e => setFormData('barcode', e.target.value)} />
                                <p className="text-xs text-stone-500 mt-1">Isi / scan barcode agar bisa dipindai saat transaksi stok (masuk/keluar).</p>
                                {formErrors.barcode && <p className="text-sm text-rose-500 mt-1">{formErrors.barcode}</p>}
                            </div>
                            <div>
                                <InputLabel value="Catatan / Deskripsi" />
                                <TextInput className="mt-1 block w-full" value={formData.notes} onChange={e => setFormData('notes', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel value="Lokasi" />
                                <select
                                    className="mt-1 block w-full border-stone-200 rounded-md"
                                    value={formData.location}
                                    onChange={e => setFormData('location', e.target.value)}
                                >
                                    <option value="warehouse">Gudang (Bahan Baku)</option>
                                    <option value="kitchen">Dapur</option>
                                    <option value="cafe">Cafe (Produk Jual)</option>
                                    <option value="general">Inventaris Umum</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <SecondaryButton onClick={() => setIsFormOpen(false)}>Batal</SecondaryButton>
                            <PrimaryButton type="submit" disabled={formProcessing}>Simpan</PrimaryButton>
                        </div>
                    </form>
                </Modal>

                {/* Transaction Modal */}
                <Modal show={isTransactionOpen} onClose={() => setIsTransactionOpen(false)}>
                    {transactionItem && (
                        <form onSubmit={submitTransaction} className="p-6 space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-stone-100 pb-3">
                                Transaksi Stok: {transactionItem.name}
                            </h2>
                            
                            <div className="bg-stone-50 p-4 rounded-xl mb-4">
                                <span className="text-sm text-stone-500">Stok Saat Ini:</span>
                                <span className="ml-2 font-bold text-lg text-slate-900">{parseFloat(transactionItem.current_stock)} {transactionItem.unit}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <InputLabel value="Jenis Transaksi" />
                                    <select 
                                        className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl"
                                        value={transData.type}
                                        onChange={e => {
                                            setTransData('type', e.target.value);
                                            if (e.target.value !== 'out') setTransData('transfer_to_menu', false);
                                        }}
                                        required
                                    >
                                        <option value="in">Stok Masuk (+)</option>
                                        <option value="out">Stok Keluar (-)</option>
                                        <option value="adjustment">Penyesuaian Mutlak (=)</option>
                                    </select>
                                </div>
                                {transData.type === 'out' && (
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={transData.transfer_to_menu}
                                                onChange={e => {
                                                    setTransData('transfer_to_menu', e.target.checked);
                                                    if (!e.target.checked) setTransData('menu_item_id', '');
                                                }}
                                                className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-slate-800">Kirim ke Cafe (menu bertambah, stok ini berkurang)</span>
                                        </label>
                                        {transData.transfer_to_menu && (
                                            <div>
                                                <InputLabel value="Menu Cafe Tujuan" />
                                                <select
                                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl"
                                                    value={transData.menu_item_id}
                                                    onChange={e => setTransData('menu_item_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Pilih menu cafe...</option>
                                                    {(cafeMenuItems || []).map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name} — {m.category}
                                                        </option>
                                                    ))}
                                                </select>
                                                {transErrors.menu_item_id && <p className="text-sm text-rose-500 mt-1">{transErrors.menu_item_id}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <InputLabel value={`Jumlah (${transactionItem.unit})`} />
                                    <TextInput type="number" step="0.01" className="mt-1 block w-full text-lg font-bold" value={transData.quantity} onChange={e => setTransData('quantity', e.target.value)} required />
                                    {transErrors.quantity && <p className="text-sm text-rose-500 mt-1">{transErrors.quantity}</p>}
                                </div>
                                {transData.type !== 'adjustment' && (
                                    <div>
                                        <InputLabel value={transData.type === 'in' ? "Total Pengeluaran Riil (Rp)" : "Total Nilai Kerugian (Rp)"} />
                                        <TextInput type="number" className="mt-1 block w-full" placeholder="Cth: 150000" value={transData.total_cost} onChange={e => setTransData('total_cost', e.target.value)} />
                                        <p className="text-xs text-stone-500 mt-1">
                                            {transData.type === 'in' ? "Isi jumlah uang riil yang dikeluarkan untuk restock ini (Opsional)" : "Isi nilai kerugian jika stok rusak/hilang (Opsional)"}
                                        </p>
                                        {transErrors.total_cost && <p className="text-sm text-rose-500 mt-1">{transErrors.total_cost}</p>}
                                    </div>
                                )}
                                <div>
                                    <InputLabel value="Catatan Transaksi" />
                                    <TextInput className="mt-1 block w-full" placeholder="cth: Pembelian dari supplier A" value={transData.notes} onChange={e => setTransData('notes', e.target.value)} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <SecondaryButton onClick={() => setIsTransactionOpen(false)}>Batal</SecondaryButton>
                                <PrimaryButton type="submit" disabled={transProcessing} className="bg-indigo-600">Simpan Transaksi</PrimaryButton>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* History Modal */}
                <Modal show={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}>
                    {historyItem && (
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <History className="text-sky-500" size={20} /> Riwayat: {historyItem.name}
                                </h2>
                                <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-stone-50 rounded-xl p-3">
                                    <div className="text-xs text-stone-500">Stok Saat Ini</div>
                                    <div className="font-bold text-slate-900">{parseFloat(historyItem.current_stock)} {historyItem.unit}</div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-3">
                                    <div className="text-xs text-stone-500">Total Beli</div>
                                    <div className="font-bold text-slate-900">{historyItem.total_cost_in > 0 ? `Rp ${parseFloat(historyItem.total_cost_in).toLocaleString('id-ID')}` : '-'}</div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-3">
                                    <div className="text-xs text-stone-500">Restock Terakhir</div>
                                    <div className="font-bold text-slate-900 text-sm">{historyItem.last_restock ? formatDate(historyItem.last_restock) : '-'}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden max-h-80 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-stone-50 text-xs text-stone-500 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2">Waktu</th>
                                            <th className="px-3 py-2">Jenis</th>
                                            <th className="px-3 py-2 text-right">Qty</th>
                                            <th className="px-3 py-2 text-right">Stok Akhir</th>
                                            <th className="px-3 py-2 text-right">Biaya</th>
                                            <th className="px-3 py-2">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {historyItem.transactions?.map((t) => {
                                            const badge = t.type === 'in' ? 'bg-emerald-100 text-emerald-700' : t.type === 'out' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
                                            const label = t.type === 'in' ? 'Masuk' : t.type === 'out' ? 'Keluar' : 'Adjust';
                                            const sign = t.type === 'in' ? '+' : t.type === 'out' ? '-' : '=';
                                            return (
                                                <tr key={t.id} className="hover:bg-stone-50">
                                                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(t.created_at)}</td>
                                                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{label}</span></td>
                                                    <td className="px-3 py-2 text-right font-semibold text-slate-900 whitespace-nowrap">{sign}{parseFloat(t.quantity)}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">{parseFloat(t.stock_after)} {historyItem.unit}</td>
                                                    <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">{parseFloat(t.cost) > 0 ? `Rp ${parseFloat(t.cost).toLocaleString('id-ID')}` : '-'}</td>
                                                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{t.user?.name || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                        {(!historyItem.transactions || historyItem.transactions.length === 0) && (
                                            <tr><td colSpan="6" className="px-3 py-6 text-center text-slate-400">Belum ada transaksi untuk bahan ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
