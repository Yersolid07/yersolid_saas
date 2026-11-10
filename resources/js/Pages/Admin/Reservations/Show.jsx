import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, User, CreditCard, UtensilsCrossed, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatDate } from '@/utils/dateUtils';

export default function Show({ reservation }) {
    const updateStatus = (status, refundMethod = null) => {
        const data = { status };
        if (refundMethod) data.refund_method = refundMethod;
        router.patch(route('admin.reservations.status', reservation.id), data, { preserveScroll: true });
    };

    const cancelHangus = () => {
        if (confirm('Batalkan reservasi?\nDP/garansi akan HANGUS (tidak dikembalikan).')) {
            updateStatus('cancelled');
        }
    };

    const cancelRefund = () => {
        if (confirm('Batalkan reservasi DAN refund manual ke customer?\n(Staff akan membayar refund secara manual: tunai/transfer.)')) {
            updateStatus('cancelled', 'manual');
        }
    };

    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');

    const paidTotal = (reservation.payments || []).reduce((s, p) => s + (p.payment_status === 'success' ? parseFloat(p.amount) : 0), 0);
    const remaining = Math.max(0, parseFloat(reservation.total_amount) - paidTotal);
    const dpPaid = !!reservation.dp_paid_at;

    const recordDp = () => {
        const amt = prompt('Nominal DP (Rp):', '100000');
        if (amt === null) return;
        if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) {
            alert('Nominal tidak valid.'); return;
        }
        if (!confirm(`Catat DP Rp ${parseFloat(amt).toLocaleString('id-ID')} untuk reservasi ini?`)) return;
        router.post(route('admin.reservations.dp', reservation.id), { amount: parseFloat(amt), method: 'cash' }, { preserveScroll: true });
    };

    const settle = (method) => {
        const label = method === 'cash' ? 'tunai' : (method === 'qris' ? 'QRIS' : 'online (Tripay)');
        if (!confirm(`Catat pelunasan Rp ${remaining.toLocaleString('id-ID')} via ${label}?`)) return;
        router.post(route('admin.reservations.settle', reservation.id), { method }, { preserveScroll: true });
    };
    

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-rose-100 text-rose-700'
        };
        return (
            <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <AppLayout title={`Reservasi #${reservation.id.substring(0, 8)}`}>
            <Head title="Detail Reservasi" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.reservations.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Detail Reservasi
                        </h2>
                    </div>
                    <StatusBadge status={reservation.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        {/* Facility Details */}
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                                <Calendar className="text-emerald-500" /> Informasi Pemesanan
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Fasilitas</p>
                                    <p className="font-bold text-slate-900 text-lg">{reservation.facility?.name}</p>
                                    <span className="text-xs font-semibold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">
                                        {reservation.facility?.type}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Jumlah Tamu</p>
                                    <p className="font-bold text-slate-900 text-lg">{reservation.guest_count} Orang</p>
                                </div>
                                <div className="col-span-2 flex gap-8 border-t border-stone-100 pt-6">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Check-in</p>
                                        <p className="font-bold text-slate-900">{formatDate(reservation.check_in_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Check-out</p>
                                        <p className="font-bold text-slate-900">{formatDate(reservation.check_out_date)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                                <User size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                    Data Pelanggan
                                </h3>
                                <div className="space-y-2 mb-4">
                                    <p><span className="text-slate-500 inline-block w-24">Nama:</span> <span className="font-semibold text-slate-900">{reservation.user?.name}</span></p>
                                    <p><span className="text-slate-500 inline-block w-24">Email:</span> <span className="font-semibold text-slate-900">{reservation.user?.email}</span></p>
                                    <p><span className="text-slate-500 inline-block w-24">Telepon:</span> <span className="font-semibold text-slate-900">{reservation.user?.phone || '-'}</span></p>
                                </div>
                                {reservation.user?.phone && (
                                    <a 
                                        href={`https://wa.me/${reservation.user.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(reservation.user.name)},%20ini%20dari%20Our%20Resort.`}
                                        target="_blank"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl text-sm transition-colors"
                                    >
                                        <MessageSquare size={16} /> Hubungi via WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Food Orders if any */}
                        {reservation.foodOrders && reservation.foodOrders.length > 0 && (
                            <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                                    <UtensilsCrossed className="text-orange-500" /> Pesanan Makanan Kamar
                                </h3>
                                <div className="space-y-4">
                                    {reservation.foodOrders.map(order => (
                                        <div key={order.id} className="border border-stone-100 rounded-xl p-4 bg-stone-50 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-900">Order #{order.id.substring(0,6)}</p>
                                                <p className="text-sm text-slate-500">{order.items?.length || 0} item dipesan</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-600">Rp {formatPrice(order.total_amount)}</p>
                                                <span className="text-xs font-bold uppercase text-slate-500">{order.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Payment Details */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 shadow-md text-white">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-200">
                                <CreditCard /> Rincian Tagihan
                            </h3>
                            <div className="space-y-3 text-sm mb-6 pb-6 border-b border-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Harga</span>
                                    <span className="font-semibold">Rp {formatPrice(reservation.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">DP / Deposit</span>
                                    <span className="font-semibold">
                                        {dpPaid ? `Rp ${formatPrice(reservation.dp_amount)} (dibayar ${formatDate(reservation.dp_paid_at)})` : 'Belum bayar DP'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Status Pembayaran</span>
                                    <span className={`font-bold uppercase ${reservation.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {reservation.payment_status === 'dp_paid' ? 'DP TERBAYAR' : reservation.payment_status}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Total Dibayar</p>
                                    <p className="text-3xl font-black text-white">Rp {formatPrice(paidTotal)}</p>
                                </div>
                                {remaining > 0 && (
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Sisa Tagihan</p>
                                        <p className="text-xl font-bold text-amber-300">Rp {formatPrice(remaining)}</p>
                                    </div>
                                )}
                                {!dpPaid && (
                                    <button onClick={recordDp} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors">
                                        Catat DP (Rp 100.000)
                                    </button>
                                )}
                                {dpPaid && remaining > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => settle('cash')} className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs">Lunas Tunai</button>
                                        <button onClick={() => settle('qris')} className="py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs">Lunas QRIS</button>
                                        <button onClick={() => settle('tripay')} className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs">Lunas Online</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4">Aksi Reservasi</h3>
                            <div className="space-y-3">
                                {reservation.status === 'pending' && (
                                    <>
                                        <button onClick={() => updateStatus('confirmed')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                                            <CheckCircle2 size={18} /> Konfirmasi
                                        </button>
                                        <button onClick={cancelHangus} className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-colors">
                                            Batalkan (Hangus)
                                        </button>
                                        {reservation.payment_status === 'paid' && (
                                            <button onClick={cancelRefund} className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-bold transition-colors">
                                                Batalkan + Refund Manual
                                            </button>
                                        )}
                                    </>
                                )}
                                {reservation.status === 'confirmed' && (
                                    <button onClick={() => updateStatus('completed')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                                        <CheckCircle2 size={18} /> Tandai Selesai (Check-out)
                                    </button>
                                )}
                                {reservation.status === 'completed' && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-emerald-700 font-semibold text-sm">
                                        Reservasi ini telah selesai.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

