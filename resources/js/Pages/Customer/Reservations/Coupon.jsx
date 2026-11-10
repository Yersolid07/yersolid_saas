import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, MapPin, Calendar, Clock, Users, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/utils/dateUtils';

export default function Coupon({ reservation }) {
    const facility = reservation.facility;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-bold text-xl text-slate-800 leading-tight">Kupon Reservasi</h2>}
        >
            <Head title="Kupon Reservasi" />

            <div className="py-12 bg-[#f5f2ec] min-h-screen">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">

                    {/* Success Alert */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-emerald-800">Reservasi Berhasil!</h3>
                            <p className="text-emerald-600 text-sm mt-1">
                                Silakan simpan dan tunjukkan kupon ini kepada petugas di  saat kedatangan Anda.
                            </p>
                        </div>
                    </motion.div>

                    {/* The Coupon Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[2rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-stone-200"
                    >
                        {/* Coupon Header */}
                        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                            <ShieldCheck size={48} className="text-emerald-300 mx-auto mb-4 opacity-50 absolute right-8 top-8" />
                            
                            <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest mb-2 relative z-10">
                                Kode Kupon Akses
                            </p>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-widest relative z-10 drop-shadow-md">
                                {reservation.unique_code}
                            </h1>
                        </div>

                        {/* Coupon Body */}
                        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center justify-between">
                            <div className="flex-1 space-y-6 w-full">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Fasilitas Dipesan</p>
                                    <h2 className="text-2xl font-bold text-slate-900">{facility.name} <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2 capitalize">{facility.type}</span></h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-stone-200">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Calendar size={14}/> Tanggal</p>
                                        <p className="font-semibold text-slate-800">{formatDate(reservation.check_in_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Clock size={14}/> Jam</p>
                                        <p className="font-semibold text-slate-800">
                                            {reservation.check_in_time ? reservation.check_in_time.substring(0, 5) : '08:00'} - {reservation.check_out_time ? reservation.check_out_time.substring(0, 5) : '18:00'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-stone-200">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><Users size={14}/> Kapasitas</p>
                                        <p className="font-semibold text-slate-800">{reservation.guest_count} Orang</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5"><MapPin size={14}/> Lokasi</p>
                                        <p className="font-semibold text-slate-800">Our Venue</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* QR Code */}
                            <div className="shrink-0 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center">
                                <QRCodeSVG value={reservation.unique_code} size={140} level="H" includeMargin={true} />
                                <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase">Scan to Verify</p>
                            </div>
                        </div>

                        {/* Coupon Footer */}
                        <div className="bg-stone-50 p-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-slate-500 flex-1 text-center sm:text-left">
                                Tunjukkan QR Code atau Kode Unik ini kepada staf kami. Harap simpan tangkapan layar (screenshot) halaman ini sebagai bukti cadangan.
                            </p>
                            <button 
                                onClick={() => window.print()}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                <Download size={16} /> Simpan PDF
                            </button>
                        </div>
                    </motion.div>

                    {/* Navigation */}
                    <div className="mt-8 text-center">
                        <Link href={route('dashboard')} className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold transition-colors">
                            <ArrowLeft size={16} /> Kembali ke Dashboard
                        </Link>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}

