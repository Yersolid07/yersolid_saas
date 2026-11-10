import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, MapPin, CreditCard, ArrowRight, Clock, Plus } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ reservations }) {
    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-rose-100 text-rose-700'
        };
        const labels = {
            pending: 'Menunggu Konfirmasi',
            confirmed: 'Terkonfirmasi (Aktif)',
            completed: 'Selesai',
            cancelled: 'Dibatalkan'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title="Riwayat Reservasi Saya">
            <Head title="Reservasi Saya" />

            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarDays className="text-emerald-500" /> Reservasi Saya
                        </h2>
                        <p className="text-slate-500 mt-1">Kelola dan lihat riwayat pemesanan fasilitas Anda.</p>
                    </div>
                    <Link
                        href={route('customer.reservations.create')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Booking Baru
                    </Link>
                </div>

                <div className="space-y-6">
                    {reservations.data.map((res) => (
                        <div key={res.id} className="bg-white rounded-3xl border border-stone-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/3 space-y-4">
                                <div className="aspect-[4/3] rounded-2xl bg-stone-100 overflow-hidden relative">
                                    {res.facility?.image_url ? (
                                        <img src={`/storage/${res.facility.image_url}`} alt={res.facility.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                                            <MapPin size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <StatusBadge status={res.status} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:w-2/3 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-black text-slate-900">{res.facility?.name}</h3>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">Rp {formatPrice(res.total_amount)}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                                        <Clock size={16} /> Dipesan pada {formatDate(res.created_at)}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Check-in</p>
                                            <p className="font-semibold text-slate-900">{formatDate(res.check_in_date)}</p>
                                        </div>
                                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Check-out</p>
                                            <p className="font-semibold text-slate-900">{formatDate(res.check_out_date)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <CreditCard size={18} className="text-slate-400" />
                                        <span className={res.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                                            {res.payment_status === 'paid' ? 'Sudah Lunas' : 'Belum Lunas / Menunggu'}
                                        </span>
                                    </div>
                                    <Link 
                                        href={route('customer.reservations.show', res.id)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Lihat Detail <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {reservations.data.length === 0 && (
                        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-stone-100 border-dashed">
                            <CalendarDays size={64} className="mx-auto text-stone-200 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Reservasi</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Anda belum pernah melakukan pemesanan fasilitas. Ayo mulai rencanakan liburan Anda di  Resort!</p>
                            <Link
                                href={route('customer.reservations.create')}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                <Plus size={20} /> Buat Reservasi Pertama
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

