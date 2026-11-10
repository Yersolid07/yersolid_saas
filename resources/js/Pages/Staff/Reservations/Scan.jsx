import { useState } from 'react';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { QrCode, Search, CheckCircle, XCircle, ChevronRight, User, Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { formatDate } from '@/utils/dateUtils';

export default function Scan({ auth }) {
    const { flash } = usePage().props;
    const reservation = flash.reservation;

    const { data, setData, post, processing, errors, reset } = useForm({
        unique_code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('staff.reservations.verify'), {
            preserveState: true,
            onSuccess: () => {
                if (flash.reservation) {
                    reset('unique_code');
                }
            }
        });
    };

    const updateStatus = (id, newStatus) => {
        router.patch(route('staff.reservations.status', id), {
            status: newStatus
        }, {
            preserveState: true,
            onSuccess: () => {
                // Clear the flash data to close the view
            }
        });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <AppLayout
            header={<h2 className="font-bold text-xl text-slate-800 leading-tight">Scan Kupon Reservasi</h2>}
        >
            <Head title="Scan Kupon" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Input Form */}
                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-200">
                        <QrCode size={48} className="mx-auto text-emerald-600 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Scan atau Input Kode Kupon</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Gunakan barcode scanner atau ketik manual kode unik pelanggan untuk memverifikasi reservasi.
                        </p>
                        
                        <form onSubmit={submit} className="max-w-md mx-auto relative">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={20} className="text-slate-400" />
                                </div>
                                <TextInput
                                    type="text"
                                    className="pl-12 w-full text-center text-xl font-bold uppercase tracking-widest bg-slate-50 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                                    placeholder="WK-XXXXXX"
                                    value={data.unique_code}
                                    onChange={e => setData('unique_code', e.target.value.toUpperCase())}
                                    autoFocus
                                    required
                                />
                            </div>
                            <InputError message={errors.unique_code} className="mt-2 text-left" />
                            
                            <PrimaryButton
                                className="w-full justify-center mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl py-3 text-base shadow-lg shadow-emerald-600/20"
                                disabled={processing || !data.unique_code}
                            >
                                {processing ? 'Memverifikasi...' : 'Verifikasi Kupon'}
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* Result */}
                    {reservation && (
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-emerald-50 px-6 py-4 flex items-center justify-between border-b border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-emerald-900">Reservasi Valid</h3>
                                        <p className="text-sm text-emerald-600">{reservation.unique_code}</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    {reservation.status}
                                </span>
                            </div>

                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left: User Info */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><User size={16}/> Informasi Pemesan</p>
                                            <p className="text-lg font-bold text-slate-900">{reservation.user?.name || reservation.customer_name}</p>
                                            <p className="text-slate-600">{reservation.user?.email || reservation.customer_email}</p>
                                            <p className="text-slate-600 font-mono mt-1">{reservation.user?.phone || reservation.customer_phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><MapPin size={16}/> Fasilitas / Tempat</p>
                                            <p className="text-lg font-bold text-slate-900">{reservation.facility?.name}</p>
                                            <p className="text-emerald-600 font-semibold">{reservation.guest_count} Orang</p>
                                        </div>
                                    </div>

                                    {/* Right: Booking Info */}
                                    <div className="flex-1 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><Calendar size={16}/> Jadwal</p>
                                            <p className="font-bold text-slate-900">{formatDate(reservation.check_in_date)}</p>
                                            <p className="text-slate-600 flex items-center gap-2 mt-1">
                                                <Clock size={14} className="text-slate-400"/>
                                                {reservation.check_in_time ? reservation.check_in_time.substring(0, 5) : '08:00'} - {reservation.check_out_time ? reservation.check_out_time.substring(0, 5) : '18:00'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-400 mb-1">Total Biaya & Pembayaran</p>
                                            <p className="font-black text-slate-900 text-xl">Rp {parseFloat(reservation.total_amount).toLocaleString('id-ID')}</p>
                                            {reservation.payment_status === 'paid' ? (
                                                <p className="text-emerald-600 font-semibold mt-1">LUNAS (Paid)</p>
                                            ) : (
                                                <p className="text-orange-500 font-semibold mt-1">BELUM LUNAS (Unpaid)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={() => updateStatus(reservation.id, 'checked_in')}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                    >
                                        {reservation.payment_status === 'paid' ? 'Tandai Pelanggan Tiba (Check-in)' : 'Terima Pembayaran Cash & Check-in'} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    );
}

