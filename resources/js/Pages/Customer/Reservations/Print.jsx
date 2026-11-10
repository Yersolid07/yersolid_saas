import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { Hotel, MapPin, Phone, Mail, Calendar, Users, CreditCard } from 'lucide-react';
import { formatDate, parseServerDate } from '@/utils/dateUtils';

export default function Print({ reservation, company }) {
    useEffect(() => {
        // Automatically trigger print dialog when loaded
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div className="bg-white min-h-screen text-slate-800 p-8 max-w-4xl mx-auto print:p-0 print:m-0">
            <Head title={`Invoice - ${reservation.id}`} />
            
            <div className="print-wrapper p-8 bg-white print:p-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center print:border print:border-emerald-600">
                            <span className="text-white font-black text-3xl">W</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{company.name}</h1>
                            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1"><MapPin size={14}/> {company.address}</p>
                            <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                                <span className="flex items-center gap-1"><Phone size={14}/> {company.phone}</span>
                                <span className="flex items-center gap-1"><Mail size={14}/> {company.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-slate-200 uppercase tracking-widest mb-2">INVOICE</h2>
                        <p className="font-bold text-slate-800">{reservation.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-sm text-slate-500">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-stone-50 p-6 rounded-2xl print:border print:border-stone-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ditagihkan Kepada</h3>
                        <p className="font-bold text-lg text-slate-800 mb-1">{reservation.user.name}</p>
                        <p className="text-slate-600 mb-1">{reservation.user.email}</p>
                        <p className="text-slate-600">{reservation.user.phone || '-'}</p>
                    </div>
                    <div className="bg-stone-50 p-6 rounded-2xl print:border print:border-stone-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detail Reservasi</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 flex items-center gap-2"><Hotel size={16}/> Fasilitas</span>
                                <span className="font-bold">{reservation.facility.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 flex items-center gap-2"><Calendar size={16}/> Check-in</span>
                                <span className="font-bold">{formatDate(reservation.check_in_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 flex items-center gap-2"><Calendar size={16}/> Check-out</span>
                                <span className="font-bold">{formatDate(reservation.check_out_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 flex items-center gap-2"><Users size={16}/> Tamu</span>
                                <span className="font-bold">{reservation.guest_count} Orang</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-stone-200 pb-2">Rincian Pembayaran</h3>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-stone-200 text-slate-500">
                                <th className="py-3 font-medium">Deskripsi</th>
                                <th className="py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-stone-100">
                                <td className="py-4">
                                    <p className="font-bold text-slate-800">Sewa {reservation.facility.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">Status Pembayaran: <span className="uppercase font-bold text-emerald-600">{reservation.payment_status}</span></p>
                                </td>
                                <td className="py-4 text-right font-bold text-slate-800">
                                    {formatCurrency(reservation.total_amount)}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-sm">Total Dibayar</td>
                                <td className="py-4 text-right font-black text-2xl text-emerald-600">
                                    {formatCurrency(reservation.total_amount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Payment Method */}
                {reservation.payment && (
                    <div className="mb-12 flex items-start gap-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl print:border print:border-emerald-200">
                        <CreditCard className="mt-1 shrink-0" />
                        <div>
                            <p className="font-bold">Informasi Pembayaran</p>
                            <p className="text-sm opacity-80 mt-1">
                                Pembayaran menggunakan metode {reservation.payment.payment_method.toUpperCase()} 
                                {reservation.payment.payment_channel ? ` (${reservation.payment.payment_channel})` : ''} 
                                pada {parseServerDate(reservation.payment.created_at).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 border-t border-stone-200 text-slate-500 text-sm">
                    <p className="font-bold text-slate-800 mb-2">Terima Kasih atas Kunjungan Anda!</p>
                    <p>Jika Anda memiliki pertanyaan mengenai invoice ini, silakan hubungi kami di {company.phone}</p>
                </div>
            </div>

            {/* Print Action for screen */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors"
                >
                    Cetak Invoice
                </button>
            </div>
        </div>
    );
}

