import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, ChefHat, Check, Printer, Phone, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { formatDateTime } from '@/utils/dateUtils';

export default function Show({ order, isGuest }) {
    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const [currentTime, setCurrentTime] = useState(new Date());

    // Auto-refresh order status every 15 seconds if not yet delivered or cancelled
    useEffect(() => {
        let interval;
        if (!['delivered', 'cancelled'].includes(order.status)) {
            interval = setInterval(() => {
                router.reload({ only: ['order'], preserveScroll: true, preserveState: true });
            }, 15000);
        }
        
        // Timer for countdown
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => {
            if (interval) clearInterval(interval);
            clearInterval(timer);
        };
    }, [order.status]);

    const getCountdown = () => {
        if (order.status !== 'preparing' || !order.estimated_ready_at) return null;
        
        const estDate = new Date(order.estimated_ready_at);
        const diffSec = Math.floor((estDate - currentTime) / 1000);
        
        if (diffSec < 0) {
            const absSec = Math.abs(diffSec);
            const min = Math.floor(absSec / 60);
            const sec = absSec % 60;
            return { text: `TERLAMBAT ${min}:${sec.toString().padStart(2, '0')}`, isOverdue: true };
        } else {
            const min = Math.floor(diffSec / 60);
            const sec = diffSec % 60;
            return { text: `${min}:${sec.toString().padStart(2, '0')}`, isOverdue: false };
        }
    };
    
    const countdown = getCountdown();

    const steps = [
        { id: 'pending', title: 'Pesanan Diterima', icon: Clock },
        { id: 'preparing', title: 'Sedang Disiapkan', icon: ChefHat },
        { id: 'ready', title: 'Siap Diantar/Ambil', icon: Package },
        { id: 'delivered', title: 'Selesai', icon: Check }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status);

    return (
        <AppLayout title={`Detail Pesanan #${order.id.substring(0,6)}`}>
            <Head title="Detail Pesanan Kuliner" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    {isGuest ? (
                        <Link href={route('catalog.public')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                    ) : (
                        <Link href={route('customer.orders.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Order #{order.id.substring(0,8).toUpperCase()}
                        </h2>
                        <p className="text-slate-500 text-sm">Dipesan pada {formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="ml-auto">
                        <a 
                            href={route('customer.orders.print', order.id)} 
                            target="_blank"
                            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl font-bold border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm"
                        >
                            <Printer size={18} /> Cetak Struk
                        </a>
                    </div>
                </div>

                {order.status === 'cancelled' ? (
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-6 text-center">
                        <h3 className="font-bold text-rose-800 text-lg mb-1">Pesanan Dibatalkan</h3>
                        <p className="text-rose-600">Pesanan ini telah dibatalkan.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm mb-6">
                        <h3 className="font-bold text-slate-900 mb-8 text-center text-lg">Status Pesanan Anda</h3>
                        
                        {order.status === 'preparing' && countdown && (
                            <div className="mb-10 text-center animate-in fade-in zoom-in slide-in-from-top-4">
                                <div className="inline-block bg-slate-900 px-6 py-4 rounded-2xl shadow-xl border border-slate-700">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Estimasi Selesai</p>
                                    <p className={`font-mono font-black text-4xl tracking-tighter ${countdown.isOverdue ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                                        {countdown.text}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {order.status === 'ready' && (
                            <div className="mb-10 p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                                <h2 className="text-2xl font-black text-emerald-700 uppercase tracking-widest">PESANAN SIAP!</h2>
                                <p className="text-emerald-600 font-bold mt-2">Mohon ambil pesanan Anda atau tunggu pramusaji kami.</p>
                            </div>
                        )}
                        
                        <div className="relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-100 -translate-y-1/2 z-0 hidden sm:block"></div>
                            
                            <div className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-1000 hidden sm:block" 
                                style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }}>
                            </div>

                            <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                                {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isActive = currentStepIndex === idx;
                                    const isPassed = currentStepIndex > idx;
                                    
                                    return (
                                        <div key={step.id} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 text-left sm:text-center flex-1">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-500 ${
                                                isActive ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg shadow-emerald-500/30' :
                                                isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                'bg-white border-stone-200 text-stone-300'
                                            }`}>
                                                <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold sm:mt-2 ${
                                                    isActive || isPassed ? 'text-emerald-700' : 'text-stone-400'
                                                }`}>
                                                    {step.title}
                                                </p>
                                                {isActive && (
                                                    <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider hidden sm:block">
                                                        Saat Ini
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-6 border-b border-stone-100 pb-4">
                                Rincian Pesanan
                            </h3>
                            <div className="space-y-4">
                                {order.items?.map(item => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                                                {item.menu_item?.image_url ? (
                                                    <img src={`/storage/${item.menu_item.image_url}`} alt={item.menu_item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-50">
                                                        <ChefHat size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{item.menu_item?.name}</h4>
                                                <p className="text-sm text-slate-500">{item.quantity} x Rp {formatPrice(item.price)}</p>
                                                {item.notes && (
                                                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">
                                                        Catatan: {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="font-bold text-slate-900">Rp {formatPrice(item.quantity * item.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-md text-white">
                            <h3 className="font-bold text-lg mb-6 text-slate-200">
                                Informasi Pengiriman
                            </h3>
                            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-slate-700">
                                <div>
                                    <p className="text-slate-400 mb-1">Tipe Pesanan</p>
                                    <p className="font-bold uppercase tracking-wider text-emerald-400">{order.order_type.replace('_', ' ')}</p>
                                </div>
                                {order.table_number && (
                                    <div>
                                        <p className="text-slate-400 mb-1">Nomor Meja</p>
                                        <p className="font-semibold text-white">{order.table_number}</p>
                                    </div>
                                )}
                                {order.reservation && (
                                    <div>
                                        <p className="text-slate-400 mb-1">Diantar Ke Fasilitas</p>
                                        <p className="font-semibold text-white">{order.reservation.facility?.name}</p>
                                    </div>
                                )}
                                {order.notes && (
                                    <div>
                                        <p className="text-slate-400 mb-1">Catatan Tambahan</p>
                                        <p className="font-medium text-amber-100 italic">{order.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                                    Informasi Pemesan
                                </h3>
                                {isGuest ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                            <span className="text-sm text-slate-400">Nama Pemesan</span>
                                            <span className="font-bold text-white">{order.customer_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                            <span className="text-sm text-slate-400">Nomor Kontak</span>
                                            <span className="font-bold text-white flex items-center gap-1">
                                                <Phone size={14} className="text-slate-400" /> {order.customer_phone}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                            <span className="text-sm text-slate-400">Nama Akun</span>
                                            <span className="font-bold text-white">{order.user?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                            <span className="text-sm text-slate-400">Email</span>
                                            <span className="font-bold text-white">{order.user?.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Tagihan</p>
                                <p className="text-3xl font-black text-white">Rp {formatPrice(order.total_amount)}</p>
                                {order.reservation_id ? (
                                    <p className="text-xs text-slate-400 mt-2">Biaya akan ditambahkan ke total tagihan reservasi Anda.</p>
                                ) : order.payment_status === 'paid' ? (
                                    <p className="text-xs text-emerald-400 mt-2 font-medium">Pembayaran Lunas.</p>
                                ) : (!order.payment || order.payment.payment_method === 'cash') ? (
                                    <p className="text-xs text-amber-400 mt-2 font-medium">Silakan lakukan pembayaran di kasir.</p>
                                ) : (
                                    <p className="text-xs text-blue-400 mt-2 font-medium">Silakan selesaikan pembayaran online Anda.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

