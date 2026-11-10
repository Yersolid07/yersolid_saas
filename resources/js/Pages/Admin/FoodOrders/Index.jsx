import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { UtensilsCrossed, Clock, CheckCircle2, XCircle, ChevronDown, Package, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';
import { formatDateTime } from '@/utils/dateUtils';

export default function Index({ orders, filters, stats }) {
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = debounce((statusValue, typeValue, from, to, searchValue) => {
        router.get(
            route('admin.food-orders.index'),
            { status: statusValue, type: typeValue, date_from: from, date_to: to, search: searchValue },
            { preserveState: true, replace: true }
        );
    }, 300);

    const updateStatus = (id, newStatus) => {
        router.patch(route('admin.food-orders.status', id), { status: newStatus }, { preserveScroll: true });
    };

    const deleteOrder = (id) => {
        if (window.customConfirm('HAPUS permanen pesanan ini? Dana, stok, dan transaksi keuangan terkait juga akan dihapus/dikembalikan. Tindakan tidak bisa dibatalkan.')) {
            router.delete(route('admin.food-orders.destroy', id), { preserveScroll: true });
        }
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('id-ID');
    };


    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-rose-100 text-rose-700 border-rose-200',
            preparing: 'bg-amber-100 text-amber-700 border-amber-200',
            ready: 'bg-blue-100 text-blue-700 border-blue-200',
            delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            cancelled: 'bg-stone-100 text-stone-600 border-stone-200'
        };
        const labels = {
            pending: 'Menunggu',
            preparing: 'Disiapkan',
            ready: 'Siap Antar',
            delivered: 'Selesai',
            cancelled: 'Dibatalkan'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title="Manajemen Pesanan Makanan">
            <Head title="Pesanan Makanan" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UtensilsCrossed className="text-emerald-500" /> Pesanan Kuliner
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Menunggu (Pending)</p>
                            <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <UtensilsCrossed size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Sedang Disiapkan</p>
                            <p className="text-3xl font-black text-slate-900">{stats.preparing}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Package size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Siap Diantar</p>
                            <p className="text-3xl font-black text-slate-900">{stats.ready}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter(status, type, dateFrom, dateTo, e.target.value);
                            }}
                            placeholder="Cari nama pelanggan..."
                            className="pl-9 pr-3 py-2 bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl text-sm w-full"
                        />
                    </div>
                    <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilter(e.target.value, type, dateFrom, dateTo, search);
                            }}
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="preparing">Disiapkan</option>
                            <option value="ready">Siap Antar</option>
                            <option value="delivered">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>
                        <div className="relative md:w-48">
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    handleFilter(status, e.target.value, dateFrom, dateTo, search);
                                }}
                                className="pl-4 pr-10 py-2 bg-stone-50 border-stone-200 focus:border-sky-500 rounded-xl text-sm w-full"
                            >
                                <option value="">Semua Tipe</option>
                                <option value="room_delivery">Antar ke Kamar/Fasilitas</option>
                                <option value="dine_in">Makan di Resto/Cafe</option>
                                <option value="takeaway">Bawa Pulang</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {/* Filter Tanggal */}
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    handleFilter(status, type, e.target.value, dateTo, search);
                                }}
                                className="px-4 py-2 bg-stone-50 border-stone-200 focus:border-sky-500 rounded-xl text-sm w-full"
                                placeholder="Mulai Tanggal"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    handleFilter(status, type, dateFrom, e.target.value, search);
                                }}
                                className="px-4 py-2 bg-stone-50 border-stone-200 focus:border-sky-500 rounded-xl text-sm w-full"
                                placeholder="Sampai Tanggal"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {orders.data.map((order) => (
                            <div key={order.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-emerald-300 transition-colors shadow-sm flex flex-col md:flex-row">
                                <div className="p-6 md:w-1/3 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">{order.customer_name || order.user?.name || 'Guest'}</p>
                                            <p className="text-sm text-slate-500">{formatDateTime(order.created_at)}</p>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Tipe Pesanan:</span>
                                            <span className="font-bold text-slate-700 capitalize">{order.order_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-slate-500 font-medium">Status Bayar:</span>
                                            <span className={`font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {order.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                                            </span>
                                        </div>
                                        {order.order_type === 'room_service' && order.reservation && (
                                            <div className="flex justify-between bg-blue-50 p-2 rounded-lg border border-blue-100 mt-2">
                                                <span className="text-blue-700 font-medium">Kirim ke:</span>
                                                <span className="font-bold text-blue-900">{order.reservation.facility?.name}</span>
                                            </div>
                                        )}
                                        {order.order_type === 'dine_in' && order.table_number && String(order.table_number).trim() !== '' && String(order.table_number).trim() !== '.' && (
                                            <div className="flex justify-between bg-purple-50 p-2 rounded-lg border border-purple-100 mt-2">
                                                <span className="text-purple-700 font-medium">Meja:</span>
                                                <span className="font-bold text-purple-900">{order.table_number}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-stone-200 pt-2 mt-2">
                                            <span className="text-slate-500 font-medium">Total Harga:</span>
                                            <span className="font-black text-emerald-700">Rp {formatPrice(order.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Detail Item</h4>
                                        <ul className="space-y-2 mb-4">
                                            {order.items?.map((item) => (
                                                <li key={item.id} className="flex justify-between text-sm">
                                                    <span className="font-medium text-slate-900">{item.quantity}x {item.menu_item?.name}</span>
                                                    <span className="text-slate-600">Rp {formatPrice(item.price * item.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {order.notes && (
                                            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-sm italic border border-amber-100">
                                                <span className="font-semibold not-italic">Catatan:</span> {order.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-stone-100">
                                        {order.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'preparing')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors">
                                                    Mulai Siapkan
                                                </button>
                                                <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold transition-colors">
                                                    Batalkan
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button onClick={() => updateStatus(order.id, 'ready')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors">
                                                Siap Diantar / Diambil
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button onClick={() => updateStatus(order.id, 'delivered')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors">
                                                Selesai (Sudah Diterima)
                                            </button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <button onClick={() => {
                                                if (window.customConfirm('Yakin meja sudah dibersihkan? Meja akan bisa dipesan tamu lain. Jangan lupa bersihkan meja 🧹')) {
                                                    updateStatus(order.id, 'completed');
                                                }
                                            }} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors">
                                                Selesai & Bebasin Meja
                                            </button>
                                        )}
                                        {order.payment_status === 'unpaid' && (
                                            <button onClick={() => router.patch(route('admin.food-orders.status', order.id), { status: order.status, payment_status: 'paid' }, { preserveScroll: true })} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors ml-auto">
                                                Validasi Bayar Kasir
                                            </button>
                                        )}
                                        {/* Print Button */}
                                        <a href={route('staff.pos.print', order.id)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2 border border-slate-200">
                                            Print Struk
                                        </a>
                                        
                                        {/* Delete Button */}
                                        <button onClick={() => deleteOrder(order.id)} className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2 border border-rose-100 ml-auto">
                                            <Trash2 size={16} />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {orders.data.length === 0 && (
                            <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                                <UtensilsCrossed size={48} className="mx-auto text-stone-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Pesanan</h3>
                                <p className="text-slate-500">Tidak ada pesanan makanan yang sesuai dengan kriteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination — tampilkan semua riwayat dari awal */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                            <div className="text-sm text-slate-600">
                                Menampilkan <span className="font-bold text-slate-900">{orders.from || 0}</span> - <span className="font-bold text-slate-900">{orders.to || 0}</span> dari <span className="font-bold text-slate-900">{orders.total}</span> pesanan
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {orders.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                                                : link.url
                                                    ? 'bg-white text-slate-600 hover:bg-stone-100 border-stone-300'
                                                    : 'bg-stone-100 text-slate-400 border-stone-200 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
