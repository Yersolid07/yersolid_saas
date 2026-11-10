import { Head, Link, router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/imagePath';
import { Coffee, Search, ArrowLeft, ArrowRight, Utensils, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingWhatsApp from '@/Components/FloatingWhatsApp';
import PublicFooter from '@/Components/PublicFooter';
import { useState, useEffect } from 'react';

const formatPrice = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '-';
    return n.toLocaleString('id-ID');
};

const CATEGORIES = [
    { id: 'all', label: 'Semua' },
    { id: 'makanan', label: 'Makanan' },
    { id: 'minuman', label: 'Minuman' },
    { id: 'snack', label: 'Snack' },
    { id: 'dessert', label: 'Dessert' },
];

export default function Katalog({ menuItems = [], filters = {} }) {
    const { cms_settings } = usePage().props;
    const showImages = cms_settings?.catalog_show_images !== 'false' && cms_settings?.catalog_show_images !== '0' && cms_settings?.catalog_show_images !== false;

    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 450);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const isChanged = debouncedSearch !== (filters.search || '') || category !== (filters.category || 'all');
        if (!isChanged) return;
        setIsFiltering(true);
        router.get(route('catalog.public'), { search: debouncedSearch || undefined, category: category === 'all' ? undefined : category }, {
            preserveState: true, preserveScroll: true, replace: true,
            onFinish: () => setIsFiltering(false)
        });
    }, [debouncedSearch, category]);

    return (
        <div className="min-h-screen bg-[#f5f2ec] text-slate-900 font-sans">
            <Head>
                <title>Katalog Menu</title>
                <meta name="description" content="Jelajahi menu kuliner istimewa : makanan, minuman, snack, dan dessert premium." />
            </Head>

            {/* Navbar */}
            <nav className="fixed w-full z-50 px-6 pt-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-stone-200/80 shadow-lg">
                    <Link href={route('home')} className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Beranda
                    </Link>
                    <Link href={route('home')} className="flex items-center gap-2">
                        <Coffee size={20} className="text-emerald-600" />
                        <span className="font-bold hidden sm:block text-slate-900"></span>
                    </Link>
                    <Link href={route('facilities.public')} className="text-sm text-slate-600 hover:text-emerald-700 transition-colors font-medium flex items-center gap-1.5">
                        Fasilitas <ChevronRight size={14} />
                    </Link>
                </div>
            </nav>

            <main className="pt-36 pb-24 max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <p className="text-emerald-600 text-sm font-bold uppercase tracking-widest mb-4">Kuliner Premium</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">Katalog Menu</h1>
                    <p className="text-slate-500 text-lg">Setiap hidangan disiapkan dengan cita rasa tinggi oleh koki berpengalaman kami.</p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 p-3 bg-white border border-stone-200 rounded-2xl shadow-sm"
                >
                    {/* Category tabs with animated indicator */}
                    <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    category === cat.id ? 'text-white' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {category === cat.id && (
                                    <motion.div
                                        layoutId="catTab"
                                        className="absolute inset-0 bg-emerald-600 rounded-xl"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-10">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm text-slate-900 placeholder-slate-400"
                        />
                        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isFiltering ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                </motion.div>

                {/* Grid */}
                {menuItems.length > 0 ? (
                    <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {menuItems.map((item, i) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="group bg-white border border-stone-200 hover:border-emerald-300 rounded-3xl p-4 transition-all hover:shadow-xl hover:shadow-emerald-100/50"
                                >
                                    {showImages ? (
                                        <div className="h-44 rounded-2xl overflow-hidden mb-5 relative">
                                            <img
                                                src={getImageUrl(item.image_url, '/storage/menu/placeholder.jpg')}
                                                alt={item.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-700 capitalize shadow-sm w-max">
                                                    {item.category}
                                                </span>
                                                {item.final_price < item.price && (
                                                    <span className="px-2.5 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase shadow-sm w-max">
                                                        {item.promo_name || 'Promo Spesial'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 mb-3">
                                            <span className="px-2.5 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-700 capitalize w-max">
                                                {item.category}
                                            </span>
                                            {item.final_price < item.price && (
                                                <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase w-max">
                                                    {item.promo_name || 'Promo Spesial'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <h3 className="font-bold text-slate-900 text-base mb-1 truncate group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                                    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Harga</p>
                                            {item.final_price < item.price ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 line-through">Rp {formatPrice(item.price)}</span>
                                                    <span className="font-extrabold text-rose-600">Rp {formatPrice(item.final_price)}</span>
                                                </div>
                                            ) : (
                                                <p className="font-extrabold text-slate-900">Rp {formatPrice(item.price)}</p>
                                            )}
                                        </div>
                                        <a
                                            href={`${route('customer.orders.create')}${typeof window !== 'undefined' ? window.location.search : ''}`}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-xs"
                                        >
                                            Pesan <ArrowRight size={12} />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed"
                    >
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Utensils className="text-slate-300" size={28} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Menu tidak ditemukan</h3>
                        <p className="text-slate-500 text-sm mb-6">Coba ubah kata kunci atau kategori pencarian Anda.</p>
                        <button
                            onClick={() => { setSearch(''); setCategory('all'); }}
                            className="px-6 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-sm"
                        >
                            Reset Filter
                        </button>
                    </motion.div>
                )}
            </main>
            <PublicFooter settings={cms_settings} />
            <FloatingWhatsApp />
        </div>
    );
}
