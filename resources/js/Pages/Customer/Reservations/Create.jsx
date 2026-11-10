import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Building2, Calendar, Clock, Users, ArrowRight, Wallet, CheckCircle2, Tag, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import { motion } from 'framer-motion';

export default function Create({ facilities, selectedFacilityId, initialCheckIn, initialCheckOut, initialCheckInTime, initialCheckOutTime, paymentChannels = [] }) {
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        facility_id: selectedFacilityId || (facilities.length > 0 ? facilities[0].id : ''),
        check_in_date: initialCheckIn || '',
        check_out_date: initialCheckOut || '',
        check_in_time: initialCheckInTime || '08:00',
        check_out_time: initialCheckOutTime || '18:00',
        guest_count: 1,
        special_requests: '',
        coupon_code: '',
        payment_method: '',
        payment_channel: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        payment_preference: 'full',
    });

    const [selectedFacility, setSelectedFacility] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);
    const [dateError, setDateError] = useState('');

    // Fetch booked dates for selected facility (real-time availability display)
    useEffect(() => {
        if (data.facility_id) {
            fetch(route('facilities.public.booked-dates', data.facility_id))
                .then(r => r.json())
                .then(dates => setBookedDates(Array.isArray(dates) ? dates : []))
                .catch(() => setBookedDates([]));
        } else {
            setBookedDates([]);
        }
    }, [data.facility_id]);

    // Cek apakah tanggal (atau range) bentrok dengan yang sudah dibooking
    const isDateBooked = (dateStr) => bookedDates.includes(dateStr);

    const handleDateChange = (field, value) => {
        if (value && isDateBooked(value)) {
            setDateError('Tanggal ' + value + ' sudah dibooking tamu lain. Pilih tanggal lain.');
            return;
        }
        setDateError('');
        setData(field, value);
    };

    useEffect(() => {
        if (data.facility_id) {
            setSelectedFacility(facilities.find(f => f.id === data.facility_id));
        }
    }, [data.facility_id, facilities]);

    // Force checkout date to be same as checkin date for Gazebos ( flow)
    useEffect(() => {
        if (selectedFacility?.type === 'gazebo' || selectedFacility?.type === 'pool') {
            setData('check_out_date', data.check_in_date);
        }
    }, [data.check_in_date, selectedFacility]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('customer.reservations.store'));
    };

    return (
        <AppLayout header={<h2 className="font-bold text-xl text-slate-800 leading-tight">Buat Reservasi Baru</h2>}>
            <Head title="Buat Reservasi" />

            <div className="py-12 bg-[#f5f2ec] min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
                    
                    {/* Form Section */}
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 border border-stone-200"
                        >
                            <h3 className="text-2xl font-bold text-slate-800 mb-6">Detail Pemesanan</h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Facility Selection */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Building2 size={16} className="text-emerald-600"/> Pilih Fasilitas/Gazebo
                                    </label>
                                    <select
                                        value={data.facility_id}
                                        onChange={e => setData('facility_id', e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500 transition-colors capitalize"
                                    >
                                        <option value="" disabled>Pilih Fasilitas</option>
                                        {Array.from(new Set(facilities.map(f => f.type))).map(type => (
                                            <optgroup key={type} label={type || 'Lainnya'} className="capitalize font-bold text-emerald-700 bg-emerald-50/50">
                                                {facilities.filter(f => f.type === type).map(facility => (
                                                    <option key={facility.id} value={facility.id} className="text-slate-800 font-medium">
                                                        {facility.name} (Kapasitas: {facility.capacity} org)
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {errors.facility_id && <p className="text-red-500 text-xs mt-1">{errors.facility_id}</p>}
                                </div>

                                {/* Date & Time */}
                                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                            <Calendar size={16} className="text-emerald-600"/> Tanggal Kedatangan
                                        </label>
                                        <input
                                            type="date"
                                            value={data.check_in_date}
                                            onChange={e => handleDateChange('check_in_date', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        {errors.check_in_date && <p className="text-red-500 text-xs mt-1">{errors.check_in_date}</p>}
                                        {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
                                        {bookedDates.length > 0 && (
                                            <p className="text-amber-600 text-[11px] mt-1">
                                                ⚠ Tanggal tidak tersedia: {bookedDates.slice(0, 5).join(', ')}{bookedDates.length > 5 ? '…' : ''}
                                            </p>
                                        )}
                                    </div>

                                    {selectedFacility?.type === 'homestay' ? (
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                <Calendar size={16} className="text-emerald-600"/> Tanggal Keluar
                                            </label>
                                            <input
                                                type="date"
                                                value={data.check_out_date}
                                                onChange={e => handleDateChange('check_out_date', e.target.value)}
                                                min={data.check_in_date || new Date().toISOString().split('T')[0]}
                                                className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            {errors.check_out_date && <p className="text-red-500 text-xs mt-1">{errors.check_out_date}</p>}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                    <Clock size={16} className="text-emerald-600"/> Jam Masuk
                                                </label>
                                                <input
                                                    type="time"
                                                    value={data.check_in_time}
                                                    onChange={e => setData('check_in_time', e.target.value)}
                                                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                {errors.check_in_time && <p className="text-red-500 text-xs mt-1">{errors.check_in_time}</p>}
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                                    <Clock size={16} className="text-emerald-600"/> Jam Keluar
                                                </label>
                                                <input
                                                    type="time"
                                                    value={data.check_out_time}
                                                    onChange={e => setData('check_out_time', e.target.value)}
                                                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                                {errors.check_out_time && <p className="text-red-500 text-xs mt-1">{errors.check_out_time}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Guest & Request */}
                                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                            <Users size={16} className="text-emerald-600"/> Jumlah Orang
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.guest_count}
                                            onChange={e => setData('guest_count', e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <InputError message={errors.guest_count} className="mt-2" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                            <Tag size={16} className="text-emerald-600"/> Kode Kupon (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.coupon_code}
                                            onChange={e => setData('coupon_code', e.target.value.toUpperCase())}
                                            className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500 uppercase placeholder-normal"
                                            placeholder="Masukkan kode kupon"
                                        />
                                        <InputError message={errors.coupon_code} className="mt-2" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-stone-100">
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Catatan / Request Khusus (Opsional)</label>
                                    <textarea
                                        rows="3"
                                        value={data.special_requests}
                                        onChange={e => setData('special_requests', e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Tuliskan permintaan khusus Anda..."
                                    ></textarea>
                                </div>

                                {!auth.user && (
                                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-4 pt-4 mt-4">
                                        <div className="text-sm font-bold text-orange-800">Data Pemesan (Guest)</div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                                                <input
                                                    type="text"
                                                    value={data.customer_name}
                                                    onChange={e => setData('customer_name', e.target.value)}
                                                    required
                                                    className="w-full bg-white border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="Contoh: Budi Santoso"
                                                />
                                                <InputError message={errors.customer_name} className="mt-2" />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={data.customer_email}
                                                    onChange={e => setData('customer_email', e.target.value)}
                                                    required
                                                    className="w-full bg-white border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="contoh@email.com"
                                                />
                                                <InputError message={errors.customer_email} className="mt-2" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">Nomor HP/WhatsApp</label>
                                            <input
                                                type="tel"
                                                value={data.customer_phone}
                                                onChange={e => setData('customer_phone', e.target.value)}
                                                required
                                                className="w-full bg-white border border-stone-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="Contoh: 08123456789"
                                            />
                                            <InputError message={errors.customer_phone} className="mt-2" />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 mt-4 border-t border-stone-100">
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Opsi Pembayaran</label>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-2 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setData('payment_preference', 'full')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                                                data.payment_preference === 'full'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-stone-200 bg-white text-slate-500 hover:border-emerald-200'
                                            }`}
                                        >
                                            <span className="font-bold text-sm">Bayar Penuh (100%)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('payment_preference', 'dp')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                                                data.payment_preference === 'dp'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-stone-200 bg-white text-slate-500 hover:border-emerald-200'
                                            }`}
                                        >
                                            <span className="font-bold text-sm">Bayar Uang Muka (DP)</span>
                                            {selectedFacility?.type === 'homestay' ? (
                                                <span className="text-xs">DP 25%</span>
                                            ) : (
                                                <span className="text-xs">DP 30%</span>
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.payment_preference} className="mt-2" />

                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Metode Pembayaran</label>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('payment_method', 'tripay')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                data.payment_method === 'tripay'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-stone-200 bg-white text-slate-500 hover:border-emerald-200'
                                            }`}
                                        >
                                            <CreditCard size={24} />
                                            <span className="font-bold text-sm">Bayar Online</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setData('payment_method', 'cash'); setData('payment_channel', ''); }}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                data.payment_method === 'cash'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-stone-200 bg-white text-slate-500 hover:border-emerald-200'
                                            }`}
                                        >
                                            <Banknote size={24} />
                                            <span className="font-bold text-sm">Bayar di Kasir</span>
                                        </button>
                                    </div>

                                    {data.payment_method === 'tripay' && (
                                        paymentChannels && paymentChannels.length > 0 ? (
                                            <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                                                <p className="text-sm font-bold text-slate-700 mb-3">Pilih Metode Pembayaran Online</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {paymentChannels.map((channel) => (
                                                        <label 
                                                            key={channel.code}
                                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${
                                                                data.payment_channel === channel.code 
                                                                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                                                                : 'border-stone-200 bg-white hover:border-emerald-200'
                                                            }`}
                                                        >
                                                            <input 
                                                                type="radio" 
                                                                name="payment_channel" 
                                                                className="sr-only"
                                                                value={channel.code}
                                                                checked={data.payment_channel === channel.code}
                                                                onChange={(e) => setData('payment_channel', e.target.value)}
                                                            />
                                                            <div className="h-10 flex items-center justify-center">
                                                                {channel.icon_url ? (
                                                                    <img src={channel.icon_url} alt={channel.name} className="max-h-full max-w-full object-contain" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-slate-400">{channel.code}</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                                <InputError message={errors.payment_channel} className="mt-2" />
                                            </div>
                                        ) : (
                                            <div className="mt-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm flex gap-2">
                                                <AlertCircle size={16} className="shrink-0" />
                                                <span>Pembayaran online sedang tidak tersedia saat ini. Silakan pilih Bayar di Kasir.</span>
                                            </div>
                                        )
                                    )}

                                    <InputError message={errors.payment_method} className="mt-2" />
                                </div>

                                {/* Legal Consent Checkbox */}
                                <div className="pt-4 border-t border-stone-100">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            required 
                                            className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-stone-300"
                                        />
                                        <span className="text-sm text-slate-600 leading-relaxed">
                                            Saya telah membaca dan menyetujui <a href={route('terms')} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold">Syarat & Ketentuan</a> serta <a href={route('privacy')} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-bold">Kebijakan Privasi</a> .
                                        </span>
                                    </label>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-70"
                                    >
                                        Selesaikan Reservasi <ArrowRight size={18}/>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:w-[400px]">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className="bg-stone-900 rounded-3xl shadow-xl p-8 text-white sticky top-24"
                        >
                            <h3 className="text-xl font-bold mb-6 text-emerald-400 border-b border-white/10 pb-4">Ringkasan</h3>
                            
                            {selectedFacility ? (
                                <div className="space-y-6">
                                    {selectedFacility.image_url && (
                                        <img src={`/storage/${selectedFacility.image_url}`} alt={selectedFacility.name} className="w-full h-40 object-cover rounded-2xl" />
                                    )}
                                    
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{selectedFacility.name}</h4>
                                        <p className="text-sm text-white/50 mb-3">{selectedFacility.description}</p>
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70 capitalize">{selectedFacility.type}</span>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className="text-emerald-400"/>
                                            <span className="text-sm text-white/70">Maks. {selectedFacility.capacity} Orang</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Wallet size={16} className="text-emerald-400"/>
                                            <span className="text-sm text-white/70">
                                                Rp {parseFloat(selectedFacility.price_per_day || selectedFacility.price_per_hour || 0).toLocaleString('id-ID')} {selectedFacility.price_per_day ? '/ hari' : '/ jam'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-8 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <div className="flex gap-2 items-start">
                                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-emerald-200/80 leading-relaxed">
                                                Kode Kupon khusus akan diberikan setelah reservasi ini selesai.
                                            </p>
                                        </div>
                                    </div>

                                    {data.payment_preference === 'dp' && (
                                        <div className="mt-4 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                                            <div className="flex gap-2 items-start">
                                                <AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />
                                                <div className="text-xs text-orange-200/90 leading-relaxed">
                                                    <p className="font-bold text-orange-400 mb-1">Informasi Pembayaran DP</p>
                                                    Anda memilih pembayaran Uang Muka (DP). 
                                                    {selectedFacility.type === 'homestay' ? (
                                                        <span> Anda akan ditagihkan DP sebesar 25% dari total harga. Sisa pembayaran beserta Biaya Jaminan Rp 100.000 wajib dilunasi saat Check-in.</span>
                                                    ) : (
                                                        <span> Anda akan ditagihkan DP sebesar 30% dari total harga. Sisa pembayaran wajib dilunasi saat kedatangan.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <Building2 size={40} className="mx-auto mb-4" />
                                    <p className="text-sm">Silakan pilih fasilitas terlebih dahulu</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
