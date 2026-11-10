import AppLayout from '@/Layouts/AppLayout';
import { Head, router, Link } from '@inertiajs/react';
import { LogIn, LogOut, Clock, CheckCircle2, QrCode } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ checkIns, checkOuts, pending }) {
    
    const updateStatus = async (id, status) => {
        if (await window.customConfirm(`Tandai reservasi ini sebagai ${status.toUpperCase()}?`)) {
            router.patch(route('staff.reservations.status', id), { status }, { preserveScroll: true });
        }
    };

    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');

    const ReservationCard = ({ res, type }) => (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-slate-900 text-lg">{res.user?.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">#{res.id.substring(0,8).toUpperCase()}</p>
                </div>
                <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold uppercase rounded-full">
                    {res.guest_count} Tamu
                </span>
            </div>
            
            <div className="space-y-2 text-sm border-y border-stone-100 py-3 mb-3">
                <div className="flex justify-between">
                    <span className="text-slate-500">Fasilitas</span>
                    <span className="font-semibold text-slate-700">{res.facility?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Total Harga</span>
                    <span className="font-bold text-emerald-600">Rp {formatPrice(res.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Status Pembayaran</span>
                    <span className={`font-bold uppercase ${res.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {res.payment_status}
                    </span>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {type === 'check-in' && (
                    <button disabled className="px-4 py-2 bg-stone-100 text-stone-400 font-semibold text-sm rounded-xl cursor-not-allowed">
                        Tamu Masuk Hari Ini
                    </button>
                )}
                
                {type === 'check-out' && (
                    <PrimaryButton 
                        onClick={() => updateStatus(res.id, 'completed')}
                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-sm py-2"
                    >
                        Check-out Sekarang (Selesai)
                    </PrimaryButton>
                )}

                {type === 'pending' && (
                    <PrimaryButton 
                        onClick={() => updateStatus(res.id, 'confirmed')}
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-sm py-2"
                    >
                        Konfirmasi Booking
                    </PrimaryButton>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout title="Operasional Reservasi">
            <Head title="Operasional Reservasi" />

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="text-blue-500" /> Operasional Harian
                    </h2>
                    <div className="flex gap-4 items-center">
                        <Link 
                            href={route('staff.reservations.scan')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold border border-emerald-500 shadow-sm flex items-center gap-2 transition-colors"
                        >
                            <QrCode size={18} /> Scan Kupon
                        </Link>
                        <span className="bg-white px-4 py-2 rounded-xl text-slate-700 font-bold border border-stone-100 shadow-sm">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Check Ins Today */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-emerald-700 flex items-center gap-2 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                            <LogIn size={20} /> Jadwal Check-in Hari Ini ({checkIns.length})
                        </h3>
                        {checkIns.length > 0 ? (
                            <div className="space-y-4">
                                {checkIns.map(res => <ReservationCard key={res.id} res={res} type="check-in" />)}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                                <p className="text-slate-400 font-medium">Tidak ada jadwal Check-in hari ini</p>
                            </div>
                        )}
                    </div>

                    {/* Check Outs Today */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-rose-700 flex items-center gap-2 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">
                            <LogOut size={20} /> Jadwal Check-out Hari Ini ({checkOuts.length})
                        </h3>
                        {checkOuts.length > 0 ? (
                            <div className="space-y-4">
                                {checkOuts.map(res => <ReservationCard key={res.id} res={res} type="check-out" />)}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                                <p className="text-slate-400 font-medium">Tidak ada jadwal Check-out hari ini</p>
                            </div>
                        )}
                    </div>

                    {/* Need Confirmation */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-amber-700 flex items-center gap-2 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                            <CheckCircle2 size={20} /> Butuh Konfirmasi ({pending.length})
                        </h3>
                        {pending.length > 0 ? (
                            <div className="space-y-4">
                                {pending.map(res => <ReservationCard key={res.id} res={res} type="pending" />)}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
                                <p className="text-slate-400 font-medium">Tidak ada reservasi yang pending</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
