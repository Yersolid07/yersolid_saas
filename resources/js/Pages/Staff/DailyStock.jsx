import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useCallback, useRef } from 'react';
import { PackageOpen, Save, CheckCircle2, Search } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import NumberInput from '@/Components/NumberInput';
import TextInput from '@/Components/TextInput';

export default function DailyStock({ items, categories = [], filters = { search: '', category: '' } }) {
    // Track which indexes the user has changed
    const [changedIndexes, setChangedIndexes] = useState(new Set());
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');

    const { data, setData, post, processing } = useForm({
        stocks: items.map(item => ({
            id: item.id,
            current_stock: Number(item.current_stock ?? 0),
            daily_stock: Number(item.daily_stock ?? 0),
        }))
    });

    // ✅ FIX: Deep-clone each element with spread to avoid mutating
    //    the original object references stored inside Inertia's defaults.
    //    Shallow copy `[...data.stocks]` kept the same object refs, so
    //    isDirty was always false (mutating the obj mutated both copies).
    const handleStockChange = useCallback((index, value) => {
        const newStocks = data.stocks.map((stock, i) =>
            i === index
                ? { ...stock, current_stock: parseInt(value) || 0 }
                : stock
        );
        setData('stocks', newStocks);
        setChangedIndexes(prev => new Set(prev).add(index));
    }, [data.stocks, setData]);

    const hasChanges = changedIndexes.size > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Only send items that were actually changed to avoid overwriting NULLs with 0
        const changedStocks = data.stocks.filter((_, index) => changedIndexes.has(index));
        
        if (changedStocks.length === 0) {
            return;
        }

        router.post(route('staff.daily-stock.update'), {
            stocks: changedStocks
        }, {
            preserveScroll: true,
            onSuccess: () => setChangedIndexes(new Set()),
        });
    };

    // Server-side search + category filter (debounced for text input)
    const applyFilter = (nextSearch, nextCategory) => {
        router.get(route('staff.daily-stock.index'), {
            search: nextSearch || '',
            category: nextCategory || '',
        }, {
            preserveState: true,
            replace: true,
            only: ['items', 'categories', 'filters'],
        });
    };

    const searchTimer = useRef(null);
    const onSearchChange = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilter(value, category), 350);
    };

    const onCategoryChange = (value) => {
        setCategory(value);
        applyFilter(search, value);
    };

    const resetFilter = () => {
        setSearch('');
        setCategory('');
        applyFilter('', '');
    };

    return (
        <AppLayout title="Input Stok Harian">
            <Head title="Stok Harian Cafe" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                            <PackageOpen className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Input Stok Harian</h2>
                            <p className="text-slate-500 text-sm">Update sisa porsi/stok harian untuk Cafe &amp; Resto</p>
                        </div>
                    </div>
                    {hasChanges && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 animate-pulse">
                            {changedIndexes.size} item diubah
                        </span>
                    )}
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <TextInput
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Cari nama menu..."
                            className="w-full pl-9 pr-3 py-2.5"
                        />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full sm:w-56 bg-stone-50 border-stone-200 focus:border-orange-500 rounded-xl py-2.5"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
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
                        {items.length} menu
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold">Kategori</th>
                                <th className="p-4 font-bold">Nama Menu</th>
                                <th className="p-4 font-bold text-center w-44">Sisa Stok</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {items.map((item, index) => {
                                const isChanged = changedIndexes.has(index);
                                return (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors ${isChanged ? 'bg-orange-50/60' : 'hover:bg-stone-50/50'}`}
                                    >
                                        <td className="p-4">
                                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 inline-block px-2 py-0.5 rounded">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`font-bold ${isChanged ? 'text-orange-700' : 'text-slate-900'}`}>
                                                {item.name}
                                            </div>
                                            {item.daily_stock != null && (
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    Stok harian: {item.daily_stock}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <NumberInput
                                                    value={data.stocks[index].current_stock}
                                                    onChange={(val) => handleStockChange(index, val)}
                                                    min={0}
                                                />
                                                {isChanged && (
                                                    <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-slate-400">
                                        <PackageOpen size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Belum ada menu yang aktif.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            {hasChanges
                                ? `${changedIndexes.size} item siap disimpan`
                                : 'Ubah jumlah stok, lalu klik Simpan'}
                        </p>
                        <PrimaryButton
                            type="submit"
                            disabled={processing || !hasChanges}
                            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-8 py-3 text-sm flex items-center gap-2 transition-all"
                        >
                            <Save size={18} />
                            {processing ? 'Menyimpan...' : 'Simpan Stok'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
