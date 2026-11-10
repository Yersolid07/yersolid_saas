import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, UtensilsCrossed, CreditCard, CheckCircle2, Clock, ChefHat, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Staff({ todayCheckIns = [], todayCheckOuts = [], activeFoodOrders = [], pendingPayments = [], financials = {}, filters = {} }) {
    const { t } = useTranslation();

    const [dateRange, setDateRange] = useState(filters.date_range || 'today');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const formatPrice = (val) => {
        const n = parseFloat(val);
        if (isNaN(n)) return '-';
        return n.toLocaleString('id-ID');
    };

    const handleFilterChange = (e) => {
        const val = e.target.value;
        setDateRange(val);
        if (val !== 'custom') {
            router.get(route('dashboard'), { date_range: val }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomFilter = () => {
        if (startDate && endDate) {
            router.get(route('dashboard'), { date_range: 'custom', start_date: startDate, end_date: endDate }, { preserveState: true, preserveScroll: true });
        }
    };

    const StatCard = ({ icon: Icon, label, value, subtext, colorClass, delay = 0 }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay, duration: 0.5 }}
            className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass.split(' ')[0]}`}></div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass}`}>
                <Icon size={24} />
            </div>
            <h4 className="text-slate-500 font-bold text-sm mb-2">{label}</h4>
            <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-slate-400 font-semibold">{subtext}</p>}
        </motion.div>
    );

    return (
        <AppLayout title="Staff Dashboard">
            <Head title="Staff Dashboard" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header with Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 px-2">Ringkasan Laporan Finansial</h2>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-500">Periode:</span>
                            <select 
                                value={dateRange} 
                                onChange={handleFilterChange}
                                className="border-stone-200 text-sm rounded-xl focus:border-emerald-500 focus:ring-emerald-500 font-semibold text-slate-700 bg-stone-50"
                            >
                                <option value="today">Hari Ini</option>
                                <option value="week">Minggu Ini</option>
                                <option value="month">Bulan Ini</option>
                                <option value="year">Tahun Ini</option>
                                <option value="custom">Pilih Tanggal</option>
                            </select>
                        </div>
                        {dateRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 p-1" />
                                <span className="text-slate-400 text-sm">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 p-1" />
                                <button onClick={applyCustomFilter} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">Terapkan</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <StatCard 
                        icon={Wallet} label="Pendapatan Bersih" 
                        value={`Rp ${formatPrice(financials.net)}`} 
                        subtext="Pemasukan dikurangi Pengeluaran"
                        colorClass="bg-emerald-100 text-emerald-700" 
                        delay={0.1}
                    />
                    <StatCard 
                        icon={TrendingUp} label="Total Pemasukan" 
                        value={`Rp ${formatPrice(financials.income)}`} 
                        subtext="Kotor (termasuk dipotong payment gateway)"
                        colorClass="bg-blue-100 text-blue-700" 
                        delay={0.15}
                    />
                    <StatCard 
                        icon={TrendingDown} label="Total Pengeluaran" 
                        value={`Rp ${formatPrice(financials.expense)}`} 
                        subtext="Potongan admin & operasional"
                        colorClass="bg-red-100 text-red-700" 
                        delay={0.2}
                    />
                </div>

                {/* Quick Actions / Main Access */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 mt-4">
                    <Link href={route('staff.pos.index')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 md:p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex items-center justify-between">
                        <div>
                            <p className="text-emerald-200 font-bold uppercase tracking-widest text-sm mb-2">Kasir Utama</p>
                            <h2 className="text-3xl md:text-4xl font-black">Buka POS</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UtensilsCrossed size={32} />
                        </div>
                    </Link>
                    
                    <Link href={route('staff.kds')} className="bg-stone-900 hover:bg-black text-white p-6 md:p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group flex items-center justify-between">
                        <div>
                            <p className="text-stone-400 font-bold uppercase tracking-widest text-sm mb-2">Monitor Dapur</p>
                            <h2 className="text-3xl md:text-4xl font-black">Buka KDS</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ChefHat size={32} />
                        </div>
                    </Link>
                </div>

                {/* Operational Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2 text-emerald-600">
                            <LogIn size={24} /> <h3 className="font-bold text-slate-700">Check-in Hari Ini</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 mt-4">{todayCheckIns.length}</p>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2 text-rose-500">
                            <LogOut size={24} /> <h3 className="font-bold text-slate-700">Check-out Hari Ini</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 mt-4">{todayCheckOuts.length}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2 text-amber-500">
                            <UtensilsCrossed size={24} /> <h3 className="font-bold text-slate-700">Pesanan Aktif</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 mt-4">{activeFoodOrders.length}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2 text-blue-500">
                            <CreditCard size={24} /> <h3 className="font-bold text-slate-700">Verifikasi Bayar</h3>
                        </div>
                        <p className="text-4xl font-black text-slate-900 mt-4">{pendingPayments.length}</p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Check In / Out */}
                    <div className="space-y-6">
                        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <LogIn size={24} className="text-emerald-500" /> Tamu Check-In Hari Ini
                            </h3>
                            {todayCheckIns.length > 0 ? (
                                <div className="space-y-4">
                                    {todayCheckIns.map(res => (
                                        <div key={res.id} className="flex justify-between items-center p-5 border border-stone-100 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-md transition-all">
                                            <div>
                                                <p className="font-bold text-slate-900">{res.user?.name}</p>
                                                <p className="text-sm text-slate-500 mt-1">{res.facility?.name}</p>
                                            </div>
                                            <Link href={route('staff.reservations.index')} className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors shadow-sm">
                                                Proses
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                    <p className="text-sm font-medium text-slate-500">Tidak ada jadwal check-in hari ini.</p>
                                </div>
                            )}
                        </motion.section>

                        <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <LogOut size={24} className="text-rose-500" /> Tamu Check-Out Hari Ini
                            </h3>
                            {todayCheckOuts.length > 0 ? (
                                <div className="space-y-4">
                                    {todayCheckOuts.map(res => (
                                        <div key={res.id} className="flex justify-between items-center p-5 border border-stone-100 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-md transition-all">
                                            <div>
                                                <p className="font-bold text-slate-900">{res.user?.name}</p>
                                                <p className="text-sm text-slate-500 mt-1">{res.facility?.name}</p>
                                            </div>
                                            <Link href={route('staff.reservations.index')} className="px-5 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors shadow-sm">
                                                Proses
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                    <p className="text-sm font-medium text-slate-500">Tidak ada jadwal check-out hari ini.</p>
                                </div>
                            )}
                        </motion.section>
                    </div>

                    {/* Operational */}
                    <div className="space-y-6">
                        <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    <UtensilsCrossed size={24} className="text-amber-500" /> Antrean Dapur & Pesanan
                                </h3>
                                <Link href={route('staff.food-orders.index')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Lihat Semua</Link>
                            </div>
                            
                            {activeFoodOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {activeFoodOrders.map(order => (
                                        <div key={order.id} className="p-5 border border-stone-100 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-base">{order.user?.name}</p>
                                                    <p className="text-sm text-slate-500 font-medium italic">"{order.notes || 'Tanpa catatan khusus'}"</p>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider
                                                    ${order.status === 'pending' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-700 border-t border-stone-200 pt-3 flex justify-between">
                                                <span>{order.items?.length || 0} items</span>
                                                <span className="text-emerald-700 font-black">Rp {formatPrice(order.total_amount)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                    <p className="text-sm font-medium text-slate-500">Dapur sedang santai. Tidak ada pesanan aktif.</p>
                                </div>
                            )}
                        </motion.section>

                        <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <CreditCard size={24} className="text-blue-500" /> Verifikasi Pembayaran
                            </h3>
                            {pendingPayments.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingPayments.map(payment => (
                                        <div key={payment.id} className="flex justify-between items-center p-5 border border-stone-100 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-md transition-all">
                                            <div>
                                                <p className="font-bold text-slate-900 text-base">{payment.reservation?.user?.name || 'Tamu'}</p>
                                                <p className="text-sm font-black text-blue-600 mt-1">Rp {formatPrice(payment.amount)}</p>
                                            </div>
                                            <Link href="#" className="px-5 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-200 transition-colors shadow-sm">
                                                Cek Bukti
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                    <p className="text-sm font-medium text-slate-500">Tidak ada pembayaran yang perlu diverifikasi.</p>
                                </div>
                            )}
                        </motion.section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
