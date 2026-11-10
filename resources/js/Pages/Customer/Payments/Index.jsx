import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, Clock, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';

export default function Index({ payments }) {
    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            success: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-rose-100 text-rose-700'
        };
        const labels = {
            pending: 'Menunggu Verifikasi',
            success: 'Pembayaran Diterima',
            failed: 'Ditolak/Gagal'
        };
        const icons = {
            pending: <Clock size={14} />,
            success: <CheckCircle2 size={14} />,
            failed: <XCircle size={14} />
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
                {icons[status]} {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title="Riwayat Pembayaran">
            <Head title="Riwayat Pembayaran" />

            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="text-emerald-500" /> Riwayat Pembayaran
                    </h2>
                    <p className="text-slate-500 mt-1">Kelola dan pantau status tagihan serta pembayaran Anda.</p>
                </div>

                <div className="space-y-4">
                    {payments.data.map((payment) => (
                        <Link 
                            key={payment.id}
                            href={route('customer.payments.show', payment.id)}
                            className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row justify-between items-start md:items-center gap-4 block"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-slate-900 text-lg">
                                        {payment.reservation ? `Reservasi: ${payment.reservation.facility?.name}` : 'Tagihan Lainnya'}
                                    </h3>
                                    <StatusBadge status={payment.payment_status} />
                                </div>
                                <p className="text-sm text-slate-500 mb-1">
                                    Metode: <span className="font-semibold text-slate-700 uppercase">{payment.payment_method.replace('_', ' ')}</span>
                                </p>
                                <p className="text-xs text-slate-400">
                                    {formatDateTime(payment.created_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 self-end md:self-auto w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-stone-100 pt-4 md:pt-0">
                                <div className="text-left md:text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Dibayar</p>
                                    <p className="font-black text-xl text-emerald-600">Rp {formatPrice(payment.amount)}</p>
                                </div>
                                <ChevronRight size={24} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </Link>
                    ))}

                    {payments.data.length === 0 && (
                        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-stone-100 border-dashed">
                            <CreditCard size={64} className="mx-auto text-stone-200 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Riwayat Pembayaran</h3>
                            <p className="text-slate-500">Anda belum pernah melakukan transaksi pembayaran apapun.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

