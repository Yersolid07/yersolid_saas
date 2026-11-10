import { Head, Link, usePage, router } from '@inertiajs/react';
import { getImageUrl } from '@/utils/imagePath';
import { Coffee, Star, ArrowRight, HeartPulse, ChevronDown, Utensils, Building2, Leaf, Waves, Sun, Wind, CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import FloatingWhatsApp from '@/Components/FloatingWhatsApp';
import PublicFooter from '@/Components/PublicFooter';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const formatPrice = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '-';
    return n.toLocaleString('id-ID');
};

const FADE_UP = {
    hidden: { opacity: 0, y: 32 },
    visible: (delay = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }
    }),
};
const STAGGER = { visible: { transition: { staggerChildren: 0.1 } } };

export default function Welcome({ auth, facilities = [], menuItems = [], reviews = [], siteSettings = {}, banners = [], guestActiveOrder = null }) {
    
    // Helper to get setting or fallback
    const getSetting = (key, fallback = '') => {
        return siteSettings[key] || fallback;
    };

    return (
        <>
            <Head>
                <title>{getSetting('site_name', 'My Website')}</title>
                <meta name="description" content={getSetting('site_description', 'Welcome to our website.')} />
            </Head>

            <div className="bg-[#f5f2ec] text-slate-900 font-sans overflow-x-hidden selection:bg-emerald-200">

                {/* ═══ NAVBAR ═══ */}
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed w-full z-50 px-4 pt-4"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-stone-200/80 shadow-lg shadow-stone-900/5">
                        <div className="flex items-center gap-3 shrink-0">
                            {getSetting('primary_logo') ? (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 shrink-0">
                                    <img src={getSetting('primary_logo')} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
                                    <Coffee size={18} className="text-white" />
                                </div>
                            )}
                            <span className="text-sm md:text-lg font-bold tracking-tight text-slate-900 truncate max-w-[120px] md:max-w-none">{getSetting('site_name', 'My Website')}</span>
                        </div>

                        <nav className="hidden md:flex items-center gap-1">
                            {[
                                { label: 'Tentang Kami', href: '#about' },
                                { label: 'Fasilitas', href: route('facilities.public') },
                                { label: 'Menu Kuliner', href: route('catalog.public') },
                                { label: 'Kontak', href: '#contact' },
                            ].map(({ label, href }) => (
                                <a key={label} href={href}
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium transition-all">
                                    {label}
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link href={route('dashboard')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20">
                                    Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}
                                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                                        Masuk
                                    </Link>
                                    <Link href={route('register')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20">
                                        Daftar Gratis
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </motion.nav>

                {/* ═══ HERO ═══ */}
                <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                    {/* Full BG Photo */}
                    <div className="absolute inset-0">
                        <img
                            src={getSetting('hero_image', '/images/logo.png')}
                            alt="Hero Background"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Website&background=0f172a&color=fff&size=1024'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/85 via-stone-900/50 to-stone-900/10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f2ec] via-transparent to-transparent opacity-60" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-6 pb-20 pt-32 md:pt-20">
                        <motion.div initial="hidden" animate="visible" variants={STAGGER} className="max-w-2xl">
                            <motion.div variants={FADE_UP} custom={0}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-300 text-sm font-semibold mb-7">
                                <Leaf size={15} className="text-emerald-400" />
                                {getSetting('hero_subtitle', 'Kolam Retret & Wisata Alam Sulawesi')}
                            </motion.div>

                            <motion.h1 variants={FADE_UP} custom={0.1}
                                className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-tighter text-white mb-6">
                                {getSetting('hero_title', 'Harmoni Alam,\nKolam Biru,\nJiwa yang Tenang.').split('\n').map((line, idx) => (
                                    <span key={idx}>
                                        {line}
                                        <br/>
                                    </span>
                                ))}
                            </motion.h1>

                            <motion.p variants={FADE_UP} custom={0.2}
                                className="text-lg text-white/65 mb-10 leading-relaxed max-w-xl">
                                {getSetting('hero_description', 'Welcome! Explore our facilities, book your spot, and enjoy our menu.')}
                            </motion.p>

                            <motion.div variants={FADE_UP} custom={0.3} className="flex flex-wrap gap-4">
                                <Link href={route('facilities.public')}
                                    className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/30">
                                    Pesan Sekarang <ArrowRight size={20} />
                                </Link>
                                <a href="#about"
                                    className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95">
                                    Lihat Selengkapnya
                                </a>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Bottom scroller */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-xs"
                    >
                        Scroll ke bawah
                        <ChevronDown size={16} className="animate-bounce" />
                    </motion.div>
                </section>

                {/* ═══ VIBE STRIP ═══ */}
                <section id="features" className="py-14 px-6 bg-white border-y border-stone-200 scroll-mt-24">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { icon: Waves, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Kolam Renang Alami', desc: 'Kolam air sejuk dari sumber alam' },
                            { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Alam Hijau', desc: 'Lingkungan alami luas' },
                            { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Gazebo & Saung', desc: 'Bersantai di tepi alam terbuka' },
                            { icon: Wind, color: 'text-teal-500', bg: 'bg-teal-50', label: 'Udara Segar', desc: 'Bebas polusi, tenang sempurna' },
                        ].map(({ icon: Icon, color, bg, label, desc }) => (
                            <motion.div key={label}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.5 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
                                    <Icon size={26} className={color} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-base">{label}</p>
                                    <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ═══ BANNERS / PROMO CAROUSEL ═══ */}
                {banners && banners.length > 0 && (
                    <section className="py-12 bg-white">
                        <div className="max-w-7xl mx-auto px-6">
                            <Swiper
                                modules={[Autoplay, Pagination, EffectFade]}
                                spaceBetween={30}
                                slidesPerView={1}
                                autoplay={{ delay: 5000, disableOnInteraction: false }}
                                pagination={{ clickable: true, dynamicBullets: true }}
                                effect="fade"
                                className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-stone-200"
                            >
                                {banners.map((banner) => (
                                    <SwiperSlide key={banner.id}>
                                        <div className="relative aspect-[21/9] md:aspect-[21/7] lg:aspect-[21/6] bg-slate-900 group">
                                            <img
                                                src={getImageUrl(banner.image_path, '/storage/banners/placeholder.jpg')}
                                                alt={banner.title}
                                                className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                                                <h3 className="text-2xl md:text-4xl font-black text-white mb-2">{banner.title}</h3>
                                                {banner.description && (
                                                    <p className="text-white/80 max-w-2xl text-sm md:text-base mb-6 line-clamp-2">
                                                        {banner.description}
                                                    </p>
                                                )}
                                                {banner.link_url && (
                                                    <div>
                                                        <a href={banner.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30">
                                                            Lihat Promo <ArrowRight size={18} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </section>
                )}

                {/* ═══ ABOUT SECTION ═══ */}
                <section id="about" className="py-20 px-6 bg-white">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="flex-1 space-y-6"
                        >
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                {getSetting('about_title', 'Tentang Kami')}
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                {getSetting('about_description', 'A destination offering nature and comfort, with a range of enjoyable facilities for a peaceful visit.')}
                            </p>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="flex-1 relative"
                        >
                            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
                                <img 
                                    src={getImageUrl(getSetting('about_image', getSetting('hero_image', '/images/logo.png')))}
                                    alt="About us"
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/logo.png'; }}
                                />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-stone-100 hidden md:block">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="flex -space-x-2">
                                        {[1,2,3,4].map(i => <img key={i} src={`https://ui-avatars.com/api/?name=Guest+${i}&background=random`} className="w-10 h-10 rounded-full border-2 border-white"/>)}
                                    </div>
                                    <div className="flex items-center text-amber-500">
                                        <Star size={16} className="fill-amber-500"/><Star size={16} className="fill-amber-500"/><Star size={16} className="fill-amber-500"/><Star size={16} className="fill-amber-500"/><Star size={16} className="fill-amber-500"/>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-slate-900">4.9/5 dari 100+ Pengunjung</p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ FACILITIES ═══ */}
                <section className="py-24 px-6 bg-[#f5f2ec]">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
                        >
                            <div>
                                <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">Akomodasi</p>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                                    Fasilitas & Kamar <br />
                                    <span className="text-slate-400">Pilihan Terbaik</span>
                                </h2>
                            </div>
                            <Link href={route('facilities.public')} className="group inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors">
                                Lihat semua fasilitas <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>

                        {facilities.length > 0 ? (
                            <div className="grid lg:grid-cols-3 gap-6">
                                {facilities.map((facility, i) => (
                                    <motion.div key={facility.id}
                                        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
                                    >
                                        <Link href={route('facilities.public.show', facility.id)} className="group block bg-white rounded-3xl overflow-hidden border border-stone-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300">
                                            <div className="relative h-60 overflow-hidden">
                                                <img
                                                    src={getImageUrl(facility.image_url)}
                                                    alt={facility.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(facility.name)}&background=059669&color=fff&size=512`; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[11px] font-semibold text-slate-700 capitalize">
                                                    <Building2 size={12} /> {facility.type}
                                                </div>
                                                {facility.price_per_day && (
                                                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-emerald-500/95 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-md">
                                                        Rp {formatPrice(facility.price_per_day)}{facility.price_unit || '/malam'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{facility.name}</h3>
                                                <p className="text-slate-500 text-sm line-clamp-2">{facility.description}</p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 border-dashed">
                                <Building2 size={40} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Segera hadir — fasilitas eksklusif sedang disiapkan.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══ MENU ═══ */}
                <section className="py-24 px-6 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6"
                        >
                            <div>
                                <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest mb-3">Kuliner</p>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                                    Cita Rasa <br />
                                    <span className="text-slate-400">Autentik Sulawesi</span>
                                </h2>
                            </div>
                            <Link href={route('catalog.public')} className="group inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-sm transition-colors">
                                Lihat semua menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>

                        {menuItems.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {menuItems.map((item, i) => (
                                    <motion.div key={item.id}
                                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                                        className="group bg-[#f5f2ec] hover:bg-white rounded-3xl p-4 border border-stone-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300"
                                    >
                                        {(usePage().props.cms_settings?.catalog_show_images !== 'false' && usePage().props.cms_settings?.catalog_show_images !== '0' && usePage().props.cms_settings?.catalog_show_images !== false) ? (
                                            <div className="h-44 rounded-2xl overflow-hidden mb-5 relative">
                                                <img
                                                    src={getImageUrl(item.image_url, '/storage/menu/placeholder.jpg')}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-700 capitalize shadow-sm">
                                                    {item.category}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-xs font-bold capitalize shadow-sm">
                                                    🍽️ {item.category}
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{item.name}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{item.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <p className="font-extrabold text-emerald-700">Rp {formatPrice(item.price)}</p>
                                            <Link href={route('customer.orders.create')} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                                                <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[#f5f2ec] rounded-3xl border border-stone-200 border-dashed">
                                <Utensils size={40} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Menu kuliner segera hadir.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══ REVIEWS ═══ */}
                {reviews.length > 0 && (
                    <section className="py-24 px-6 bg-emerald-900 border-y border-emerald-800">
                        <div className="max-w-7xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-14"
                            >
                                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimoni</p>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                                    Kata Mereka <br />
                                    <span className="text-emerald-300/80">About Us</span>
                                </h2>
                            </motion.div>

                            <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory gap-6 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {reviews.map((review, i) => (
                                    <motion.div key={review.id}
                                        initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="snap-center shrink-0 w-[320px] md:w-[400px] bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex gap-1 mb-6">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                            <p className="text-emerald-50 text-lg leading-relaxed italic mb-8">"{review.comment}"</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <img 
                                                src={review.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user.name)}&background=059669&color=fff`} 
                                                alt={review.user.name} 
                                                className="w-12 h-12 rounded-full border-2 border-emerald-500/50"
                                            />
                                            <div>
                                                <p className="font-bold text-white">{review.user.name}</p>
                                                <p className="text-emerald-400 text-sm">Valued Guest</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══ CTA ═══ */}
                <section className="py-24 px-6 bg-[#f5f2ec]">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.7 }}
                            className="relative p-14 md:p-20 rounded-[2.5rem] overflow-hidden text-center"
                            style={{ backgroundImage: `url(${getSetting('hero_image', '/images/logo.png')})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 to-teal-900/80" />
                            <div className="relative z-10">
                                <p className="text-emerald-300 text-sm font-semibold uppercase tracking-widest mb-4">Mulai Perjalanan Anda</p>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                                    Reservasi Impian Anda <br />
                                    <span className="text-emerald-300">Hanya 2 Menit.</span>
                                </h2>
                                <p className="text-white/60 mb-10 max-w-lg mx-auto text-lg">Daftar gratis, pilih fasilitas, dan nikmati pengalaman retret alam terbaik Sulawesi.</p>
                                <Link href={route('register')}
                                    className="inline-flex items-center gap-2 px-10 py-5 bg-white text-emerald-800 font-extrabold rounded-2xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-black/30 active:scale-95 text-lg">
                                    Buat Akun Gratis <ArrowRight size={22} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ CONTACT SECTION ═══ */}
                <section id="contact" className="py-24 px-6 bg-white border-t border-stone-200 scroll-mt-24">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
                        <div className="flex-1 space-y-8">
                            <div>
                                <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-3">Hubungi Kami</p>
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                                    Punya Pertanyaan? <br />
                                    <span className="text-slate-400">Kami Siap Membantu.</span>
                                </h2>
                                <p className="text-slate-600 text-lg">Hubungi tim kami untuk reservasi grup besar, acara khusus, atau pertanyaan lainnya.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <Building2 className="text-emerald-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Alamat Lokasi</h4>
                                        <p className="text-slate-600">{getSetting('contact_address', 'Your address here')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <Star className="text-amber-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Kontak Cepat</h4>
                                        <p className="text-slate-600">WhatsApp: {getSetting('contact_whatsapp', '-')}<br/>Email: {getSetting('contact_email', '-')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="bg-stone-100 rounded-[2rem] w-full h-[400px] lg:h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
                                {getSetting('contact_map_embed') ? (
                                    <iframe 
                                        src={getSetting('contact_map_embed')} 
                                        className="absolute inset-0 w-full h-full border-0" 
                                        allowFullScreen="" 
                                        loading="lazy" 
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                ) : (
                                    <div className="text-center relative z-10">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 animate-bounce">
                                            <Coffee size={24} className="text-rose-500" />
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg">{getSetting('site_name', 'My Resort')}</h4>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ FOOTER ═══ */}
                <PublicFooter settings={siteSettings} />
            {/* ═══ GUEST ORDER TRACKING BANNER ═══
                 Floats at the bottom of the page when a guest has an active order
                 so they can always find their way back to the tracking page.
            */}
            {guestActiveOrder && !auth.user && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[320px] max-w-md"
                >
                    <Link
                        href={route('customer.orders.track', guestActiveOrder.id)}
                        className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 hover:bg-slate-800 transition-all group"
                    >
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={20} className="text-emerald-400" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-white leading-tight">Pesanan Aktif</p>
                            <p className="text-xs text-slate-400 truncate">
                                {guestActiveOrder.payment_status === 'unpaid'
                                    ? '⏳ Menunggu pembayaran di kasir'
                                    : guestActiveOrder.status === 'pending'
                                    ? '✅ Diterima — Menunggu dapur'
                                    : guestActiveOrder.status === 'preparing'
                                    ? '👨‍🍳 Sedang dimasak'
                                    : '📦 Siap — Menunggu pengantaran'}
                            </p>
                        </div>
                        <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                </motion.div>
            )}

            </div>
            {/* WhatsApp Floating Button */}
            <FloatingWhatsApp />
        </>
    );
}
