import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Wallet, Search, CheckCircle2, XCircle, Clock, Check, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ payments, filters, stats }) {
    const [status, setStatus] = useState(filters.status || '');
    const [method, setMethod] = useState(filters.method || '');
    const [selectedPayment, setSelectedPayment] = useState(null);

    const handleFilter = debounce((statusValue, methodValue) => {
        router.get(
            route('admin.payments.index'),
            { status: statusValue, method: methodValue },
            { preserveState: true, replace: true }
        );
    }, 300);

    const verifyPayment = async (id, action) => {
        if (await window.customConfirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} pembayaran ini?`)) {
            router.patch(route('admin.payments.verify', id), { action }, { preserveScroll: true });
        }
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('id-ID');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            failed: 'bg-rose-100 text-rose-700 border-rose-200'
        };
        const labels = {
            pending: 'Menunggu Verifikasi',
            success: 'Lunas',
            failed: 'Ditolak/Gagal'
        };
        const icons = {
            pending: <Clock size={14} />,
            success: <CheckCircle2 size={14} />,
            failed: <XCircle size={14} />
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status]}`}>
                {icons[status]} {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title="Manajemen Pembayaran">
            <Head title="Manajemen Pembayaran" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="text-emerald-500" /> Manajemen Pembayaran
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <Wallet size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Pemasukan Hari Ini</p>
                            <p className="text-2xl font-black text-slate-900">Rp {formatPrice(stats.total_today)}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Pemasukan Bulan Ini</p>
                            <p className="text-2xl font-black text-slate-900">Rp {formatPrice(stats.total_month)}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Menunggu Verifikasi</p>
                            <p className="text-3xl font-black text-slate-900">{stats.pending_count}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilter(e.target.value, method);
                            }}
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Menunggu Verifikasi</option>
                            <option value="success">Lunas / Sukses</option>
                            <option value="failed">Ditolak / Gagal</option>
                        </select>
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={method}
                            onChange={(e) => {
                                setMethod(e.target.value);
                                handleFilter(status, e.target.value);
                            }}
                        >
                            <option value="">Semua Metode</option>
                            <option value="transfer">Transfer Bank (Manual)</option>
                            <option value="cash">Tunai (Di Tempat)</option>
                            <option value="tripay">Payment Gateway (TriPay)</option>
                            <option value="ewallet">E-Wallet</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-stone-100 text-slate-500">
                                    <th className="py-4 px-4 font-semibold">Terkait</th>
                                    <th className="py-4 px-4 font-semibold">Pelanggan</th>
                                    <th className="py-4 px-4 font-semibold">Jumlah & Metode</th>
                                    <th className="py-4 px-4 font-semibold">Status</th>
                                    <th className="py-4 px-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {payments.data.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="py-4 px-4">
                                            {payment.reservation_id ? (
                                                <div>
                                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded mb-1">Reservasi</span>
                                                    <p className="text-sm font-semibold text-slate-900">{payment.reservation?.facility?.name}</p>
                                                    <p className="text-xs text-slate-500">Check-in: {new Date(payment.reservation?.check_in_date).toLocaleDateString('id-ID')}</p>
                                                </div>
                                            ) : payment.food_order_id ? (
                                                <div>
                                                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded mb-1">Pesanan Makanan</span>
                                                    <p className="text-sm font-semibold text-slate-900">Order #{payment.food_order_id}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic text-sm">Tidak spesifik</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-slate-900">
                                                {payment.reservation?.user?.name || payment.reservation?.customer_name || 
                                                 payment.food_order?.user?.name || payment.food_order?.customer_name || 
                                                 payment.foodOrder?.user?.name || payment.foodOrder?.customer_name || 
                                                 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-slate-500">{formatDate(payment.created_at)}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-black text-emerald-600">Rp {formatPrice(payment.amount)}</p>
                                            <p className="text-xs text-slate-500 uppercase font-semibold mt-1">{payment.payment_method.replace('_', ' ')}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <StatusBadge status={payment.payment_status} />
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {payment.proof_image && (
                                                    <button 
                                                        onClick={() => setSelectedPayment(payment)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Lihat Bukti Pembayaran"
                                                    >
                                                        <ImageIcon size={18} />
                                                    </button>
                                                )}
                                                {payment.payment_status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => verifyPayment(payment.id, 'approve')}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Verifikasi (Lunas)"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => verifyPayment(payment.id, 'reject')}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Tolak Pembayaran"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {payments.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-500">
                                            Tidak ada data pembayaran yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Bukti Pembayaran */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Bukti Transfer</h3>
                            <button onClick={() => setSelectedPayment(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-stone-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 bg-stone-50">
                            <div className="aspect-[3/4] bg-stone-200 rounded-xl overflow-hidden relative">
                                <img 
                                    src={`/storage/${selectedPayment.proof_image}`} 
                                    alt="Bukti Pembayaran" 
                                    className="absolute inset-0 w-full h-full object-contain"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-stone-100 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Nominal Transfer</p>
                                    <p className="text-2xl font-black text-emerald-600">Rp {formatPrice(selectedPayment.amount)}</p>
                                </div>
                                <StatusBadge status={selectedPayment.payment_status} />
                            </div>
                            
                            {selectedPayment.payment_status === 'pending' && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            verifyPayment(selectedPayment.id, 'reject');
                                            setSelectedPayment(null);
                                        }}
                                        className="flex-1 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => {
                                            verifyPayment(selectedPayment.id, 'approve');
                                            setSelectedPayment(null);
                                        }}
                                        className="flex-1 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl transition-colors"
                                    >
                                        Verifikasi & Lunas
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

