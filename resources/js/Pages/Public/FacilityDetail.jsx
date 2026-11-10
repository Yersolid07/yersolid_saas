import { Head, Link, usePage, router } from '@inertiajs/react';
import { getImageUrl } from '@/utils/imagePath';
import { Coffee, ArrowLeft, Star, CheckCircle2, Bed, Maximize, Wifi, Users, Building2, Calendar, AlertCircle, Tv, AirVent, Bath, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingWhatsApp from '@/Components/FloatingWhatsApp';
import { parseServerDate } from '@/utils/dateUtils';
import PublicFooter from '@/Components/PublicFooter';
import { useState, useEffect } from 'react';
import axios from 'axios';

const formatPrice = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return '-';
    return n.toLocaleString('id-ID');
};

export default function FacilityDetail({ facility, reviews = [], avgRating = 0 }) {
    const { auth, cms_settings } = usePage().props;

    if (!facility) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Fasilitas tidak ditemukan.</p>
            </div>
        );
    }

    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const rating = avgRating || 0;

    const [bookedDates, setBookedDates] = useState([]);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        axios.get(route('facilities.public.booked-dates', facility.id))
            .then(res => setBookedDates(res.data))
            .catch(err => console.error("Failed to load booked dates", err));
    }, [facility.id]);

    const isDateOverlapping = (start, end) => {
        if (!start || !end) return false;
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (bookedDates.includes(dateStr)) return true;
        }
        return false;
    };

    useEffect(() => {
        if (checkIn && checkOut) {
            if (facility.type === 'homestay' && new Date(checkOut) <= new Date(checkIn)) {
                setErrorMsg('Untuk penginapan, tgl check-out harus setelah check-in.');
            } else if (new Date(checkOut) < new Date(checkIn)) {
                setErrorMsg('Tgl check-out tidak boleh sebelum check-in.');
            } else if (isDateOverlapping(checkIn, checkOut)) {
                setErrorMsg('Fasilitas sudah dibooking pada tanggal tersebut.');
            } else if (false) {
            } else {
                setErrorMsg('');
            }
        } else {
            setErrorMsg('');
        }
    }, [checkIn, checkOut, checkInTime, checkOutTime, bookedDates, facility.type]);

    const handleBookNow = () => {
        if (errorMsg || !checkIn || !checkOut) {
            if (!errorMsg) setErrorMsg('Pilih tanggal check-in & check-out.');
            return;
        }
        if (!auth?.user) {
            router.visit(route('login'));
            return;
        }
        if (facility.type === 'gazebo' && checkIn === checkOut && (!checkInTime || !checkOutTime)) {
            setErrorMsg('Pilih jam mulai dan selesai untuk gazebo.');
            return;
        }
        
        router.visit(route('customer.reservations.create', { 
            facility_id: facility.id, 
            check_in: checkIn, 
            check_out: checkOut,
            check_in_time: checkInTime || undefined,
            check_out_time: checkOutTime || undefined
        }));
    };

    return (
        <div className="min-h-screen bg-[#f5f2ec] text-slate-900 font-sans pb-32">
            <Head>
                <title>{`${facility.name}`}</title>
                <meta name="description" content={facility.description || `Booking kamar ${facility.name} di .`} />
            </Head>

            {/* Navbar */}
            <nav className="fixed w-full z-50 px-6 pt-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-stone-200/80 shadow-lg">
                    <Link href={route('facilities.public')} className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 transition-colors text-sm font-medium">
                        <ArrowLeft size={16} /> Semua Fasilitas
                    </Link>
                    <Link href={route('home')} className="flex items-center gap-2">
                        <Coffee size={20} className="text-emerald-600" />
                    </Link>
                </div>
            </nav>

            {/* Hero Image */}
            <div className="relative w-full h-[55vh] md:h-[70vh]">
                <img 
                    src={getImageUrl(facility.image_url)}
                    alt={facility.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f5f2ec] via-stone-900/30 to-transparent" />

                {/* Hero content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
                    <div className="max-w-7xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-slate-700 shadow-sm capitalize">
                                    <Building2 size={12} /> {facility.type}
                                </span>
                                {avgRating > 0 && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-sm">
                                        <Star size={12} className="fill-white" /> {Number(avgRating).toFixed(1)} ({reviews.length} ulasan)
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-2xl">{facility.name}</h1>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 mt-12 grid lg:grid-cols-3 gap-12">
                {/* Left */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Description */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm"
                    >
                        <h2 className="text-xl font-bold mb-4 text-slate-900">Tentang Fasilitas Ini</h2>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{facility.description || 'Deskripsi segera hadir.'}</p>
                    </motion.section>

                    {/* Amenities */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="text-xl font-bold mb-6 text-slate-900">Fasilitas Utama</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {facility.amenities && facility.amenities.length > 0 ? (
                                facility.amenities.map((amenity, idx) => {
                                    // Fallback to CheckCircle2 if icon not found or we don't want to dynamically load all lucide icons
                                    // Here we just use a generic icon for dynamic ones since we can't easily map string to component without a large map
                                    // Or we can check if it's one of the imported ones
                                    const IconComponent = { Bed, Users, Wifi, Maximize, Calendar, Coffee, Tv, AirVent, Bath, Car }[amenity.icon] || CheckCircle2;
                                    return (
                                        <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-2xl hover:border-emerald-300 transition-colors shadow-sm">
                                            <IconComponent size={20} className="text-emerald-600 shrink-0" />
                                            <span className="text-sm font-medium text-slate-700">{amenity.label}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-slate-500 italic col-span-full">Belum ada info fasilitas utama.</p>
                            )}
                        </div>
                    </motion.section>

                    {/* Syarat & Ketentuan */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <div className="p-8 bg-white border border-rose-100 rounded-3xl shadow-sm relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 p-8 opacity-5">
                                <AlertCircle size={120} />
                            </div>
                            <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                                <AlertCircle className="text-rose-500" />
                                Syarat & Ketentuan Pemesanan
                            </h2>

                            <div className="space-y-6 relative z-10">
                                {facility.type === 'homestay' ? (
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Bed size={16} className="text-emerald-600" /> Ketentuan Homestay
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Uang Muka (DP):</b> Wajib membayar DP sebesar 25% dari total harga.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Biaya Jaminan Properti:</b> Tambahan Rp 100.000 dibayarkan saat pelunasan untuk jaminan kerusakan (akan dikembalikan penuh saat check-out jika tidak ada kerusakan).</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Identitas Wajib:</b> Pelanggan wajib menunjukkan KTP asli atau tanda pengenal lain yang sah saat proses check-in.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Kapasitas Kamar:</b> Maksimal 5 orang per kamar.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Aturan Menginap (berpasangan):</b> Hanya menerima pasangan sah (suami-istri).</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Kebijakan Pembatalan:</b> DP otomatis hangus jika pesanan dibatalkan.</span></li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <Building2 size={16} className="text-emerald-600" /> Ketentuan Aula & Gazebo
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Uang Muka (DP):</b> Wajib membayar DP sebesar 30% dari total harga.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Tiket Masuk:</b> Biaya sewa aula dan gazebo belum termasuk tiket masuk lokasi.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Tarif Tiket Masuk:</b> Dikenakan biaya tambahan sebesar Rp 10.000 / orang.</span></li>
                                            <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Kebijakan Pembatalan:</b> DP otomatis hangus jika pesanan dibatalkan.</span></li>
                                        </ul>
                                    </div>
                                )}
                                
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-600" /> Metode Pembayaran & Pelunasan
                                    </h3>
                                    <ul className="space-y-2 text-sm text-slate-600">
                                        <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Cara Bayar:</b> Menerima via Transfer Bank (TF), E-Wallet, dan Tunai (Cash).</span></li>
                                        <li className="flex gap-2"><span className="text-rose-500 font-bold">•</span> <span><b>Waktu Pelunasan:</b> Sisa pembayaran {facility.type === 'homestay' ? '+ biaya jaminan homestay ' : ''}wajib dilunasi sepenuhnya pada saat check-in.</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Reviews */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <h2 className="text-xl font-bold mb-6 text-slate-900">Ulasan Tamu</h2>
                        {safeReviews.length > 0 ? (
                            <div className="space-y-4">
                                {safeReviews.map((review) => (
                                    <div key={review?.id || Math.random()} className="p-6 bg-white border border-stone-200 rounded-3xl hover:border-emerald-200 shadow-sm transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">{review?.user?.name || 'Tamu Anonim'}</p>
                                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                    {review?.created_at ? parseServerDate(review.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-xl">
                                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                                <span className="text-amber-600 font-bold text-sm">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{review?.comment || ''}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 border-dashed">
                                <Star size={32} className="text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium text-sm">Belum ada ulasan untuk fasilitas ini.</p>
                            </div>
                        )}
                    </motion.section>
                </div>

                {/* Sticky Booking Card */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="sticky top-24 p-8 rounded-3xl bg-white border border-stone-200 shadow-xl"
                    >
                        <div className="mb-6 pb-6 border-b border-stone-100">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tarif {facility?.price_unit || 'per Malam'}</p>
                            <p className="text-4xl font-extrabold text-slate-900">Rp {formatPrice(facility.price_per_day)}</p>
                            {facility.price_per_hour && (
                                <p className="text-sm font-medium text-slate-500 mt-1">atau Rp {formatPrice(facility.price_per_hour)} / jam</p>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {facility.rules && facility.rules.filter(r => r.trim() !== '').length > 0 ? (
                                facility.rules.filter(r => r.trim() !== '').map((rule, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600 font-medium text-sm">{rule}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-slate-500 italic">Belum ada info ekstra.</li>
                            )}
                        </ul>

                        {/* Availability Checker */}
                        <div className="mb-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Check-in</label>
                                    <input 
                                        type="date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="w-full text-sm rounded-xl border-stone-200 focus:ring-emerald-500 focus:border-emerald-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Check-out</label>
                                    <input 
                                        type="date" 
                                        min={checkIn || new Date().toISOString().split('T')[0]}
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="w-full text-sm rounded-xl border-stone-200 focus:ring-emerald-500 focus:border-emerald-500" 
                                    />
                                </div>
                            </div>
                            
                            {(facility.type === 'gazebo' || facility.type === 'pool') && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai <span className="text-stone-400 font-normal">(opsional)</span></label>
                                        <input 
                                            type="time" 
                                            value={checkInTime}
                                            onChange={(e) => setCheckInTime(e.target.value)}
                                            className="w-full text-sm rounded-xl border-stone-200 focus:ring-emerald-500 focus:border-emerald-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai <span className="text-stone-400 font-normal">(opsional)</span></label>
                                        <input 
                                            type="time" 
                                            value={checkOutTime}
                                            onChange={(e) => setCheckOutTime(e.target.value)}
                                            className="w-full text-sm rounded-xl border-stone-200 focus:ring-emerald-500 focus:border-emerald-500" 
                                        />
                                    </div>
                                </div>
                            )}

                            <AnimatePresence>
                                {errorMsg && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }} 
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100"
                                    >
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{errorMsg}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {checkIn && checkOut && !errorMsg && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-100"
                                >
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                                    <span>Tersedia! Anda bisa langsung memesan.</span>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={handleBookNow}
                            disabled={!!errorMsg || !checkIn || !checkOut}
                            className={`block w-full py-4 text-center font-extrabold rounded-2xl transition-all shadow-lg 
                                ${(!errorMsg && checkIn && checkOut) 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:-translate-y-0.5 hover:shadow-emerald-500/30 active:scale-95' 
                                    : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'}`}
                        >
                            Pesan Sekarang →
                        </button>
                        {!auth?.user && (
                            <p className="text-center font-medium text-xs text-slate-400 mt-4">Login diperlukan untuk menyelesaikan reservasi.</p>
                        )}
                    </motion.div>
                </div>
            </div>
            <PublicFooter settings={cms_settings} />
            <FloatingWhatsApp />
        </div>
    );
}
