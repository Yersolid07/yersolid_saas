import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarDays, UtensilsCrossed, ArrowRight, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/dateUtils';

export default function Customer({ auth, upcomingReservations = [], recentReservations = [], recentOrders = [] }) {
    const { t } = useTranslation();
    const user = auth.user;

    const formatPrice = (val) => {
        const n = parseFloat(val);
        if (isNaN(n)) return '-';
        return n.toLocaleString('id-ID');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-800 border-amber-200',
            confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        const color = colors[status] || 'bg-stone-100 text-stone-800 border-stone-200';
        return (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${color}`}>
                {status}
            </span>
        );
    };

    return (
        <AppLayout title="Dashboard Saya">
            <Head>
                <title>{`Dashboard Saya`}</title>
            </Head>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Welcome Hero - Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-emerald-900 text-white shadow-2xl shadow-emerald-900/20"
                >
                    <div className="absolute inset-0 bg-[url('/storage/facilities/placeholder.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-transparent backdrop-blur-[2px]" />
                    
                    <div className="relative p-10 md:p-14 lg:p-16">
                        <div className="max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-sm font-bold tracking-wide mb-6">
                                    Resor & Alam 
                                </span>
                            </motion.div>
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                                Selamat Datang kembali, <br/><span className="text-emerald-300">{user.name.split(' ')[0]}!</span>
                            </h2>
                            <p className="text-emerald-50/90 text-lg mb-10 leading-relaxed font-medium max-w-xl">
                                Siap untuk petualangan alam berikutnya? Pesan kamar atau gazebo di  sekarang dan nikmati liburan yang tenang.
                            </p>
                            <Link
                                href={route('facilities.public')}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1"
                            >
                                <CalendarDays size={20} /> Booking Sekarang
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upcoming Trip */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Perjalanan Mendatang</h3>
                                <Link href={route('customer.reservations.index')} className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm flex items-center gap-1">
                                    Lihat Semua <ArrowRight size={16} />
                                </Link>
                            </div>

                            {upcomingReservations.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingReservations.map(res => (
                                        <div key={res.id} className="group flex flex-col sm:flex-row bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1">
                                            <div className="sm:w-56 h-56 sm:h-auto relative overflow-hidden p-2">
                                                <img 
                                                    src={res.facility?.image_url || '/storage/facilities/placeholder.jpg'} 
                                                    alt={res.facility?.name}
                                                    className="w-full h-full object-cover rounded-3xl group-hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="text-xl font-extrabold text-slate-900">{res.facility?.name}</h4>
                                                        <StatusBadge status={res.status} />
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 mb-6 bg-stone-50 p-3 rounded-2xl inline-flex border border-stone-100">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays size={18} className="text-emerald-500" />
                                                            {formatDate(res.check_in_date)}
                                                        </div>
                                                        <ArrowRight size={16} className="text-stone-400" />
                                                        <div className="flex items-center gap-2">
                                                            {formatDate(res.check_out_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-5 mt-2 border-t border-stone-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Biaya</p>
                                                        <span className="text-emerald-700 font-black text-xl">Rp {formatPrice(res.total_amount || res.total_price)}</span>
                                                    </div>
                                                    <Link href={route('customer.reservations.show', res.id)} className="px-6 py-3 bg-stone-900 hover:bg-emerald-600 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg">
                                                        Lihat Detail
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-stone-200 border-dashed p-8 text-center">
                                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CalendarDays size={28} className="text-stone-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">Belum ada perjalanan</h4>
                                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">Anda belum memiliki reservasi yang aktif atau mendatang. Yuk, rencanakan liburan Anda sekarang!</p>
                                    <Link href={route('facilities.public')} className="inline-flex px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors">
                                        Mulai Cari Kamar
                                    </Link>
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="space-y-8">
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <UtensilsCrossed size={20} className="text-emerald-500" /> Pesanan Kuliner
                            </h3>
                            {recentOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {recentOrders.map(order => (
                                        <div key={order.id} className="flex items-start gap-4 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                                                <UtensilsCrossed size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    Pesanan #{order.id.substring(0,6).toUpperCase()}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">{formatDate(order.created_at)}</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-emerald-600">Rp {formatPrice(order.total_amount)}</span>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href={route('customer.orders.index')} className="block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-4">
                                        Lihat Semua Pesanan
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">Belum ada pesanan kuliner.</p>
                            )}
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-emerald-500" /> Riwayat Singkat
                            </h3>
                            {recentReservations.length > 0 ? (
                                <div className="space-y-3">
                                    {recentReservations.map(res => (
                                        <div key={res.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{res.facility?.name}</p>
                                                <p className="text-xs text-slate-500">{formatDate(res.check_in_date)}</p>
                                            </div>
                                            <StatusBadge status={res.status} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">Belum ada riwayat reservasi.</p>
                            )}
                        </motion.section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

