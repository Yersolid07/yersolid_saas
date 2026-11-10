import { Head, Link, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/imagePath';
import { Coffee, ArrowLeft, ArrowRight, Bed, Users, Building2 } from 'lucide-react';
import PublicFooter from '@/Components/PublicFooter';
import { motion } from 'framer-motion';
import FloatingWhatsApp from '@/Components/FloatingWhatsApp';
import { useState, useMemo } from 'react';

const formatPrice = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '-';
    return n.toLocaleString('id-ID');
};

export default function Facilities({ facilities = [] }) {
    const { cms_settings } = usePage().props;
    const safeFacilities = Array.isArray(facilities) ? facilities : [];
    
    // Extract unique categories from facilities
    const categories = useMemo(() => {
        const types = new Set(safeFacilities.map(f => f?.type).filter(Boolean));
        return ['Semua', ...Array.from(types)];
    }, [safeFacilities]);

    const [activeCategory, setActiveCategory] = useState('Semua');

    const filteredFacilities = useMemo(() => {
        if (activeCategory === 'Semua') return safeFacilities;
        return safeFacilities.filter(f => f?.type === activeCategory);
    }, [safeFacilities, activeCategory]);
    return (
        <div className="min-h-screen bg-[#f5f2ec] font-sans text-slate-900">
            <Head>
                <title>Fasilitas</title>
                <meta name="description" content="Jelajahi kamar, kolam, dan gazebo eksklusif . Temukan akomodasi retret alam terbaik di Sulawesi." />
            </Head>

            {/* Navbar */}
            <nav className="fixed w-full z-50 px-4 pt-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-stone-200/80 shadow-lg">
                    <Link href={route('home')} className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Beranda
                    </Link>
                    <Link href={route('home')} className="flex items-center gap-2">
                        <Coffee size={20} className="text-emerald-600" />
                        <span className="font-bold hidden sm:block text-slate-900"></span>
                    </Link>
                    <Link href={route('catalog.public')} className="text-sm text-slate-600 hover:text-emerald-700 transition-colors font-medium">
                        Menu Kuliner →
                    </Link>
                </div>
            </nav>

            {/* Hero Banner */}
            <div className="relative h-56 md:h-80 overflow-hidden">
                <img src="/storage/facilities/placeholder.jpg" alt="Fasilitas" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f5f2ec] via-stone-900/30 to-stone-900/40" />
                <div className="absolute inset-x-0 bottom-0 p-8 max-w-7xl mx-auto">
                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-2">Akomodasi Premium</p>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">Kamar & Fasilitas</h1>
                </div>
            </div>

            <main className="pt-8 pb-24 max-w-7xl mx-auto px-6">
                <p className="text-slate-500 text-lg mb-8 max-w-2xl">
                    Setiap ruang kami rancang khusus untuk memberikan pengalaman retret alam yang tak terlupakan — dari gazebo tepi kolam hingga homestay mewah di tengah alam.
                </p>

                {/* Filter Tabs */}
                {categories.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 mb-10 p-2 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                    activeCategory === cat ? 'text-white' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {activeCategory === cat && (
                                    <motion.div
                                        layoutId="facilityTab"
                                        className="absolute inset-0 bg-emerald-600 rounded-xl"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <span className="relative z-10 capitalize">{cat}</span>
                            </button>
                        ))}
                    </div>
                )}

                {filteredFacilities.length > 0 ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {filteredFacilities.map((facility, i) => (
                            <motion.div key={facility?.id || i}
                                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                            >
                                <Link
                                    href={facility?.id ? route('facilities.public.show', facility.id) : '#'}
                                    className="group flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-stone-200 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-300"
                                >
                                    <div className="w-full md:w-2/5 h-56 md:h-auto relative overflow-hidden group">
                                        <img
                                            src={getImageUrl(facility.image_url)}
                                            alt={facility.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent opacity-60" />
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                                                {facility?.type || 'Akomodasi'}
                                            </span>
                                            {facility?.final_price < facility?.price_per_day && (
                                                <span className="px-3 py-1 bg-rose-500 text-white rounded-full text-xs font-black uppercase shadow-sm border border-rose-400">
                                                    {facility?.promo_name || 'Promo Spesial'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:w-3/5 p-6 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{facility?.name || 'Nama Fasilitas'}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{facility?.description || ''}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                            <div>
                                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{facility?.price_prefix || 'Mulai dari'}</p>
                                                <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mb-2">
                                                    <span className="flex items-center gap-1.5"><Users size={14} className="text-emerald-500" /> Maks {facility?.capacity ?? 0}</span>
                                                    {facility?.bed_count > 0 && (
                                                        <span className="flex items-center gap-1.5"><Bed size={14} className="text-emerald-500" /> {facility.bed_count} Bed</span>
                                                    )}
                                                    <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-500" /> {facility?.type || '-'}</span>
                                                </div>
                                                {facility?.final_price < facility?.price_per_day ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-400 line-through">Rp {formatPrice(facility?.price_per_day)}</span>
                                                        <p className="text-xl font-extrabold text-rose-600">
                                                            Rp {formatPrice(facility?.final_price)}
                                                            <span className="text-sm font-normal text-slate-400 ml-1">{facility?.price_unit || '/malam'}</span>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xl font-extrabold text-slate-900">
                                                        Rp {formatPrice(facility?.price_per_day)}
                                                        <span className="text-sm font-normal text-slate-400 ml-1">{facility?.price_unit || '/malam'}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed">
                        <Building2 size={48} className="text-slate-300 mx-auto mb-5" />
                        <h3 className="text-xl font-semibold text-slate-500 mb-2">Belum ada fasilitas</h3>
                        <p className="text-slate-400 text-sm">Segera hadir — fasilitas eksklusif sedang disiapkan.</p>
                    </div>
                )}
            </main>
            <PublicFooter settings={cms_settings} />
            <FloatingWhatsApp />
        </div>
    );
}
