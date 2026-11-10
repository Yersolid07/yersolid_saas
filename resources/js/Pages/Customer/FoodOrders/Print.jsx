import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { MapPin, Phone, Mail, UtensilsCrossed, CreditCard } from 'lucide-react';
import { parseServerDate, formatDateTime } from '@/utils/dateUtils';

export default function Print({ order, company }) {
    useEffect(() => {
        // Automatically trigger print dialog when loaded
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <div className="bg-white min-h-screen text-slate-800 p-8 max-w-4xl mx-auto print:p-0 print:m-0">
            <Head title={`Struk Pesanan - ${order.id}`} />
            
            <div className="print-wrapper p-8 bg-white print:p-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-stone-100 pb-8 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center print:border print:border-amber-500">
                            <UtensilsCrossed className="text-white" size={32} />
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
                        <h2 className="text-3xl font-black text-slate-200 uppercase tracking-widest mb-2">STRUK</h2>
                        <p className="font-bold text-slate-800">#{order.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-sm text-slate-500">Tanggal: {formatDateTime(order.created_at)}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-stone-50 p-6 rounded-2xl print:border print:border-stone-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pemesan</h3>
                        <p className="font-bold text-lg text-slate-800 mb-1">{order.user ? order.user.name : (order.customer_name || 'Tamu')}</p>
                        <p className="text-slate-600 mb-1">{order.user ? order.user.email : (order.customer_phone || '-')}</p>
                    </div>
                    <div className="bg-stone-50 p-6 rounded-2xl print:border print:border-stone-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detail Pengantaran</h3>
                        <p className="font-bold text-slate-800 capitalize mb-1">
                            Tipe: <span className="text-amber-600">{order.order_type.replace('_', ' ')}</span>
                        </p>
                        {order.delivery_location ? (
                            <p className="text-slate-600">Lokasi: {order.delivery_location}</p>
                        ) : order.reservation ? (
                            <p className="text-slate-600">Lokasi: {order.reservation.facility.name}</p>
                        ) : null}
                    </div>
                </div>

                {/* Items */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-stone-200 pb-2">Rincian Pesanan</h3>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-stone-200 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="py-3 font-medium">Menu</th>
                                <th className="py-3 font-medium text-center">Qty</th>
                                <th className="py-3 font-medium text-right">Harga Satuan</th>
                                <th className="py-3 font-medium text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => (
                                <tr key={item.id} className="border-b border-stone-100">
                                    <td className="py-4">
                                        <p className="font-bold text-slate-800">{item.menu_item?.name || 'Menu Tidak Diketahui'}</p>
                                    </td>
                                    <td className="py-4 text-center font-medium text-slate-600">{item.quantity}</td>
                                    <td className="py-4 text-right text-slate-600">{formatCurrency(item.price)}</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-sm">Total Tagihan</td>
                                <td className="py-4 text-right font-black text-2xl text-amber-500">
                                    {formatCurrency(order.total_amount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Payment Method */}
                {order.payment && (
                    <div className="mb-12 flex items-start gap-4 p-4 bg-amber-50 text-amber-800 rounded-xl print:border print:border-amber-200">
                        <CreditCard className="mt-1 shrink-0" />
                        <div>
                            <p className="font-bold">Informasi Pembayaran</p>
                            <p className="text-sm opacity-80 mt-1">
                                Pembayaran menggunakan metode {order.payment.payment_method.toUpperCase()} 
                                {order.payment.payment_channel ? ` (${order.payment.payment_channel})` : ''} 
                                pada {parseServerDate(order.payment.created_at).toLocaleString('id-ID')}
                            </p>
                            <p className="text-sm font-bold mt-1 text-emerald-600 uppercase">Status: {order.payment.status}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 border-t border-stone-200 text-slate-500 text-sm flex flex-col items-center">
                    <UtensilsCrossed size={24} className="mb-3 text-stone-300" />
                    <p className="font-bold text-slate-800 mb-2">Selamat Menikmati Hidangan Kami!</p>
                    <p> Resto — Terima Kasih</p>
                </div>
            </div>

            {/* Print Action for screen */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="bg-amber-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                    <UtensilsCrossed size={18} /> Cetak Struk
                </button>
            </div>
        </div>
    );
}
