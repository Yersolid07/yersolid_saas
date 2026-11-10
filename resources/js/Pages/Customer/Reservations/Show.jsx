import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, Receipt, FileText, CheckCircle2, Star, Send, XCircle, AlertCircle, Printer } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { useState } from 'react';
import { formatDate } from '@/utils/dateUtils';

export default function Show({ reservation, canReview, canCancel }) {
    const [showReviewForm, setShowReviewForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        reservation_id: reservation.id,
        rating: 5,
        comment: '',
    });

    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');
    

    const handleCancel = async () => {
        if (await window.customConfirm('Apakah Anda yakin ingin membatalkan reservasi ini? Tindakan ini tidak dapat diurungkan.')) {
            router.patch(route('customer.reservations.cancel', reservation.id));
        }
    };

    const submitReview = (e) => {
        e.preventDefault();
        post(route('customer.reviews.store'), {
            onSuccess: () => {
                setShowReviewForm(false);
                reset();
            }
        });
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-rose-100 text-rose-700'
        };
        const labels = {
            pending: 'Menunggu Konfirmasi',
            confirmed: 'Terkonfirmasi',
            completed: 'Selesai',
            cancelled: 'Dibatalkan'
        };
        return (
            <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <AppLayout title={`Detail Reservasi`}>
            <Head title="Detail Reservasi" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('customer.reservations.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Reservasi #{reservation.id.substring(0,8).toUpperCase()}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <a 
                            href={route('customer.reservations.print', reservation.id)} 
                            target="_blank"
                            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl font-bold border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm"
                        >
                            <Printer size={18} /> Cetak Invoice
                        </a>
                        <StatusBadge status={reservation.status} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Status Alert if Cancelled */}
                        {reservation.status === 'cancelled' && (
                            <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-6 flex items-start gap-4">
                                <XCircle className="text-rose-500 shrink-0 mt-1" size={28} />
                                <div>
                                    <h3 className="font-bold text-rose-800 text-lg mb-1">Reservasi Dibatalkan</h3>
                                    <p className="text-rose-600">Reservasi ini telah dibatalkan. Jika Anda telah melakukan pembayaran, silakan hubungi admin untuk proses refund sesuai S&K yang berlaku.</p>
                                </div>
                            </div>
                        )}

                        {/* Facility Card */}
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                            <div className="w-full sm:w-48 aspect-square rounded-2xl bg-stone-100 overflow-hidden shrink-0">
                                {reservation.facility?.image_url ? (
                                    <img src={`/storage/${reservation.facility.image_url}`} alt={reservation.facility.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                        <MapPin size={48} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 w-full">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{reservation.facility?.name}</h3>
                                <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-sm font-bold uppercase tracking-wider mb-6">
                                    {reservation.facility?.type}
                                </span>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Calendar size={14} /> Check-in</p>
                                        <p className="font-bold text-slate-900">{formatDate(reservation.check_in_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Calendar size={14} /> Check-out</p>
                                        <p className="font-bold text-slate-900">{formatDate(reservation.check_out_date)}</p>
                                    </div>
                                </div>
                                {reservation.special_requests && (
                                    <div className="mt-6 pt-4 border-t border-stone-100">
                                        <p className="text-sm text-slate-500 mb-1 font-semibold">Permintaan Khusus:</p>
                                        <p className="text-slate-700 text-sm italic">{reservation.special_requests}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Foods */}
                        {['confirmed', 'pending'].includes(reservation.status) && (
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-[2rem] border border-orange-100 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-bold text-orange-900 mb-2 flex items-center gap-2">
                                        Lapar? Pesan Makanan ke Kamar
                                    </h3>
                                    <p className="text-orange-700 text-sm">Pesan kuliner lezat dari  langsung diantar ke fasilitas Anda.</p>
                                </div>
                                <Link 
                                    href={route('customer.orders.create', { reservation_id: reservation.id })}
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors whitespace-nowrap"
                                >
                                    Pesan Sekarang
                                </Link>
                            </div>
                        )}

                        {/* Review Section */}
                        {reservation.review ? (
                            <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                    <Star className="text-amber-500 fill-amber-500" /> Ulasan Anda
                                </h3>
                                <div className="flex gap-1 mb-3">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={20} className={star <= reservation.review.rating ? "text-amber-500 fill-amber-500" : "text-stone-200"} />
                                    ))}
                                </div>
                                <p className="text-slate-700 italic">"{reservation.review.comment}"</p>
                            </div>
                        ) : canReview ? (
                            showReviewForm ? (
                                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-900 mb-4">Tulis Ulasan</h3>
                                    <form onSubmit={submitReview} className="space-y-4">
                                        <div>
                                            <InputLabel value="Rating" />
                                            <div className="flex gap-2 mt-2">
                                                {[1,2,3,4,5].map(star => (
                                                    <button 
                                                        key={star} 
                                                        type="button" 
                                                        onClick={() => setData('rating', star)}
                                                        className="p-1"
                                                    >
                                                        <Star size={28} className={star <= data.rating ? "text-amber-500 fill-amber-500" : "text-stone-200 hover:text-amber-300"} />
                                                    </button>
                                                ))}
                                            </div>
                                            <InputError message={errors.rating} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="comment" value="Komentar Anda" />
                                            <textarea
                                                id="comment"
                                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm min-h-[100px]"
                                                value={data.comment}
                                                onChange={e => setData('comment', e.target.value)}
                                                placeholder="Bagaimana pengalaman Anda di ?"
                                            />
                                            <InputError message={errors.comment} className="mt-2" />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-stone-100 rounded-xl">Batal</button>
                                            <PrimaryButton disabled={processing} className="px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex gap-2">
                                                <Send size={16} /> Kirim Ulasan
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-emerald-900 mb-1">Bagaimana Pengalaman Anda?</h3>
                                        <p className="text-sm text-emerald-700">Tinggalkan ulasan untuk reservasi yang telah selesai ini.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowReviewForm(true)}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shrink-0"
                                    >
                                        Tulis Ulasan
                                    </button>
                                </div>
                            )
                        ) : null}
                    </div>

                    <div className="space-y-6">
                        {/* Payment Details */}
                        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-md text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Receipt size={120} />
                            </div>
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-200 relative z-10">
                                <CreditCard /> Tagihan & Pembayaran
                            </h3>
                            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-slate-700 relative z-10">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total Biaya</span>
                                    <span className="font-semibold text-lg">Rp {formatPrice(reservation.total_amount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        reservation.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                        {reservation.payment_status === 'paid' ? 'Sudah Lunas' : 'Belum Lunas'}
                                    </span>
                                </div>
                            </div>
                            
                            {reservation.payment_status !== 'paid' && reservation.status !== 'cancelled' ? (
                                <div className="relative z-10 space-y-3">
                                    <p className="text-amber-300 text-sm mb-4 leading-relaxed font-medium">Segera lakukan pembayaran agar reservasi Anda tidak dibatalkan otomatis oleh sistem.</p>
                                    
                                    <button 
                                        onClick={() => router.post(route('customer.payments.store'), { reservation_id: reservation.id, payment_method: 'tripay' })}
                                        disabled={processing}
                                        className="block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={18} /> Bayar Otomatis (QRIS / Virtual Account)
                                    </button>
                                    
                                    <p className="text-center text-xs text-slate-400 mt-2">Didukung oleh Tripay</p>
                                </div>
                            ) : reservation.payment_status === 'paid' ? (
                                <div className="relative z-10 flex flex-col items-center justify-center py-4 text-emerald-400">
                                    <CheckCircle2 size={48} className="mb-2" />
                                    <p className="font-bold text-lg">Pembayaran Berhasil</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4">Aksi</h3>
                            <div className="space-y-3">
                                <Link 
                                    href={route('customer.reservations.coupon', reservation.id)}
                                    className="w-full py-3 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                                >
                                    <FileText size={18} /> Tampilkan Kupon / E-Tiket
                                </Link>
                                
                                {canCancel && (
                                    <button 
                                        onClick={handleCancel}
                                        className="w-full py-3 bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors"
                                    >
                                        <XCircle size={18} /> Batalkan Reservasi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

