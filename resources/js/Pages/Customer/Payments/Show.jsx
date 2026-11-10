import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Clock, CheckCircle2, XCircle, Image as ImageIcon, Receipt } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime } from '@/utils/dateUtils';

export default function Show({ payment }) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    
    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            success: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-rose-100 text-rose-700'
        };
        const labels = {
            pending: 'Menunggu Verifikasi Admin',
            success: 'Pembayaran Diterima / Lunas',
            failed: 'Ditolak/Gagal'
        };
        const icons = {
            pending: <Clock size={20} />,
            success: <CheckCircle2 size={20} />,
            failed: <XCircle size={20} />
        };
        return (
            <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold uppercase tracking-wider mb-6 border ${styles[status]}`}>
                {icons[status]} {labels[status]}
            </div>
        );
    };

    return (
        <AppLayout title={`Detail Pembayaran`}>
            <Head title="Detail Pembayaran" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('customer.payments.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Rincian Pembayaran
                        </h2>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <StatusBadge status={payment.payment_status} />

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Receipt className="text-slate-400" size={18} /> Informasi Tagihan
                                </h3>
                                <div className="space-y-3">
                                    {payment.reservation && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Terkait Reservasi</span>
                                            <span className="font-semibold text-slate-900">{payment.reservation.facility?.name}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tanggal Bayar</span>
                                        <span className="font-semibold text-slate-900">{formatDateTime(payment.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Metode</span>
                                        <span className="font-semibold text-slate-900 uppercase">{payment.payment_method.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Dibayarkan</p>
                                <p className="font-black text-4xl text-emerald-600">Rp {formatPrice(payment.amount)}</p>
                            </div>
                        </div>

                        {payment.proof_image && (
                            <div className="w-full md:w-64 space-y-3">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <ImageIcon className="text-slate-400" size={18} /> Bukti Transfer
                                </h3>
                                <button 
                                    onClick={() => setIsImageModalOpen(true)}
                                    className="w-full aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden relative group border border-stone-200"
                                >
                                    <img 
                                        src={`/storage/${payment.proof_image}`} 
                                        alt="Bukti Transfer" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
                                        <span className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0">
                                            Perbesar
                                        </span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {isImageModalOpen && payment.proof_image && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <div className="max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end mb-4">
                            <button 
                                onClick={() => setIsImageModalOpen(false)}
                                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                            >
                                <XCircle size={32} />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex-1 flex items-center justify-center">
                            <img 
                                src={`/storage/${payment.proof_image}`} 
                                alt="Bukti Transfer Besar" 
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

