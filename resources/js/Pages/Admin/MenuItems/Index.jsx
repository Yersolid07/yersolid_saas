import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { UtensilsCrossed, Search, Edit2, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';
import TextInput from '@/Components/TextInput';

export default function Index({ items, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = debounce((searchValue, categoryValue, statusValue) => {
        router.get(
            route('admin.menu-items.index'),
            { search: searchValue, category: categoryValue, status: statusValue },
            { preserveState: true, replace: true }
        );
    }, 300);

    const deleteItem = async (id) => {
        if (await window.customConfirm('Apakah Anda yakin ingin menghapus menu ini?')) {
            router.delete(route('admin.menu-items.destroy', id));
        }
    };

    const toggleAvailability = (id) => {
        router.patch(route('admin.menu-items.toggle', id), {}, { preserveScroll: true });
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('id-ID');
    };

    return (
        <AppLayout title="Katalog Menu & Kuliner">
            <Head title="Katalog Menu" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UtensilsCrossed className="text-emerald-500" /> Katalog Menu
                    </h2>
                    <Link
                        href={route('admin.menu-items.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Tambah Menu
                    </Link>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                            <TextInput
                                type="text"
                                placeholder="Cari menu..."
                                className="w-full pl-10 bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilter(e.target.value, category, status);
                                }}
                            />
                        </div>
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                handleFilter(search, e.target.value, status);
                            }}
                        >
                            <option value="">Semua Kategori</option>
                            <option value="makanan">Makanan</option>
                            <option value="minuman">Minuman</option>
                            <option value="snack">Snack</option>
                            <option value="dessert">Dessert</option>
                            <option value="tiket">Tiket Masuk</option>
                            <option value="other_income">Other Income (Lainnya)</option>
                            <option value="toiletries">Toiletries</option>
                        </select>
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilter(search, category, e.target.value);
                            }}
                        >
                            <option value="">Semua Status</option>
                            <option value="available">Tersedia</option>
                            <option value="unavailable">Habis / Tidak Tersedia</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.data.map((item) => (
                            <div key={item.id} className="group bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col hover:-translate-y-1 duration-300">
                                <div className="h-48 bg-stone-100 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img 
                                            src={`/storage/${item.image_url}`} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 group-hover:bg-stone-200 transition-colors">
                                            <ImageIcon size={48} />
                                            <span className="text-xs mt-2">Tanpa Gambar</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                                            item.category === 'makanan' ? 'bg-orange-500/90 text-white' : 
                                            item.category === 'minuman' ? 'bg-blue-500/90 text-white' : 
                                            item.category === 'tiket' ? 'bg-emerald-600/90 text-white' : 
                                            'bg-stone-500/90 text-white'
                                        }`}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <button 
                                            onClick={() => toggleAvailability(item.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm transition-colors ${
                                                item.is_available 
                                                    ? 'bg-emerald-100/90 text-emerald-700 hover:bg-emerald-200/90' 
                                                    : 'bg-rose-100/90 text-rose-700 hover:bg-rose-200/90'
                                            }`}
                                        >
                                            {item.is_available ? 'Tersedia' : 'Habis'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{item.description || 'Tidak ada deskripsi'}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                                        <span className="font-black text-emerald-600 text-lg">Rp {formatPrice(item.price)}</span>
                                        <div className="flex gap-2">
                                            <Link 
                                                href={route('admin.menu-items.edit', item.id)}
                                                className="p-2 bg-stone-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </Link>
                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 bg-stone-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {items.data.length === 0 && (
                        <div className="py-12 text-center">
                            <UtensilsCrossed size={48} className="mx-auto text-stone-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Menu</h3>
                            <p className="text-slate-500 mb-6">Anda belum menambahkan menu atau tidak ada menu yang cocok dengan pencarian.</p>
                            <Link
                                href={route('admin.menu-items.create')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                <Plus size={18} /> Tambah Menu Sekarang
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
