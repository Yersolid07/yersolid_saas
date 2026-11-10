import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { UtensilsCrossed, Clock, CheckCircle2, ChevronRight, Plus, Package } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';

export default function Index({ orders }) {
    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-rose-100 text-rose-700',
            preparing: 'bg-amber-100 text-amber-700',
            ready: 'bg-blue-100 text-blue-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-stone-100 text-stone-600'
        };
        const labels = {
            pending: 'Menunggu',
            preparing: 'Sedang Disiapkan',
            ready: 'Siap',
            delivered: 'Selesai',
            cancelled: 'Dibatalkan'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title="Riwayat Pesanan Kuliner">
            <Head title="Pesanan Kuliner Saya" />

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <UtensilsCrossed className="text-orange-500" /> Pesanan Kuliner
                        </h2>
                        <p className="text-slate-500 mt-1">Riwayat pesanan makanan dan minuman Anda.</p>
                    </div>
                    <Link
                        href={route('customer.orders.create')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Pesan Makanan
                    </Link>
                </div>

                <div className="space-y-4">
                    {orders.data.map((order) => (
                        <div key={order.id} className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            Order #{order.id.substring(0,6).toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={14} /> {formatDateTime(order.created_at)}
                                        </p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <p className="text-sm font-semibold text-slate-700 bg-stone-50 inline-block px-3 py-1 rounded-lg">
                                        Tipe: <span className="capitalize">{order.order_type.replace('_', ' ')}</span>
                                    </p>
                                    
                                    <ul className="space-y-1">
                                        {order.items?.slice(0, 3).map(item => (
                                            <li key={item.id} className="text-sm text-slate-600 flex justify-between">
                                                <span><span className="font-bold text-slate-900">{item.quantity}x</span> {item.menuItem?.name}</span>
                                            </li>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <li className="text-sm text-stone-400 italic">...dan {order.items.length - 3} item lainnya</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="sm:w-48 flex flex-col justify-between sm:items-end border-t sm:border-t-0 sm:border-l border-stone-100 pt-4 sm:pt-0 sm:pl-6">
                                <div className="mb-4 sm:mb-0 text-left sm:text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Harga</p>
                                    <p className="font-black text-xl text-emerald-600">Rp {formatPrice(order.total_amount)}</p>
                                </div>
                                <Link 
                                    href={route('customer.orders.show', order.id)}
                                    className="w-full sm:w-auto text-center inline-flex justify-center items-center gap-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors text-sm"
                                >
                                    Detail <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {orders.data.length === 0 && (
                        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-stone-100 border-dashed">
                            <Package size={64} className="mx-auto text-stone-200 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Pesanan Makanan</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Lapar? Coba menu-menu andalan  Resort dan nikmati liburan yang lebih berkesan.</p>
                            <Link
                                href={route('customer.orders.create')}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                <UtensilsCrossed size={20} /> Lihat Katalog Menu
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

