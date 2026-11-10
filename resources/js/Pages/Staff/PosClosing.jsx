import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function PosClosing({ initialCash, todaySales, expectedCash, expectedQris, expectedTransfer, expectedEdc, expectedEwallet, previousClosing, today, alreadyClosed }) {
    const { data, setData, post, processing, errors } = useForm({
        closing_balance: expectedCash || 0,
        cash_100k: 0,
        cash_50k: 0,
        cash_20k: 0,
        cash_10k: 0,
        cash_5k: 0,
        cash_2k: 0,
        cash_1k: 0,
        coins: 0,
        note: '',
        qris_expected: expectedQris || 0,
        qris_actual: expectedQris || 0,
        transfer_expected: expectedTransfer || 0,
        transfer_actual: expectedTransfer || 0,
        edc_expected: expectedEdc || 0,
        edc_actual: expectedEdc || 0,
        ewallet_expected: expectedEwallet || 0,
        ewallet_actual: expectedEwallet || 0,
    });

    const [totalPhysicalCash, setTotalPhysicalCash] = useState(0);
    const [difference, setDifference] = useState(0);

    useEffect(() => {
        const total = 
            (parseInt(data.cash_100k) || 0) * 100000 +
            (parseInt(data.cash_50k) || 0) * 50000 +
            (parseInt(data.cash_20k) || 0) * 20000 +
            (parseInt(data.cash_10k) || 0) * 10000 +
            (parseInt(data.cash_5k) || 0) * 5000 +
            (parseInt(data.cash_2k) || 0) * 2000 +
            (parseInt(data.cash_1k) || 0) * 1000 +
            (parseInt(data.coins) || 0);

        setTotalPhysicalCash(total);
        setDifference(total - data.closing_balance);
    }, [
        data.cash_100k, data.cash_50k, data.cash_20k, 
        data.cash_10k, data.cash_5k, data.cash_2k, 
        data.cash_1k, data.coins, data.closing_balance
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const nonCashDiffTotal = 
            Math.abs(data.qris_actual - data.qris_expected) +
            Math.abs(data.transfer_actual - data.transfer_expected) +
            Math.abs(data.edc_actual - data.edc_expected) +
            Math.abs(data.ewallet_actual - data.ewallet_expected);
            
        if (difference !== 0 || nonCashDiffTotal > 0) {
            if (!(await window.customConfirm(`Terdapat selisih kas tunai sebesar Rp ${difference.toLocaleString('id-ID')} dan/atau selisih non-tunai. Anda yakin ingin melanjutkan?`))) {
                return;
            }
        }
        post(route('staff.pos-closing.store'));
    };

    const denominations = [
        { key: 'cash_100k', label: 'Rp 100.000' },
        { key: 'cash_50k', label: 'Rp 50.000' },
        { key: 'cash_20k', label: 'Rp 20.000' },
        { key: 'cash_10k', label: 'Rp 10.000' },
        { key: 'cash_5k', label: 'Rp 5.000' },
        { key: 'cash_2k', label: 'Rp 2.000' },
        { key: 'cash_1k', label: 'Rp 1.000' },
    ];

    return (
        <AppLayout title="Tutup Kasir (POS Closing)">
            <Head title="POS Closing" />

            <div className="max-w-4xl mx-auto space-y-6">
                {alreadyClosed && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3">
                        <AlertTriangle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">
                            Kasir untuk tanggal ini sudah pernah ditutup. Menyimpan lagi akan mencatat laporan tambahan — pastikan ini memang diperlukan (mis. koreksi).
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Wallet className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Tutup Kasir / Setor Tunai</h2>
                        <p className="text-slate-500 text-sm">Hitung dan cocokkan fisik uang dengan sistem ({today})</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden p-6 space-y-8">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                            <p className="text-sm font-bold text-slate-500 mb-1">Kas Masuk Sistem (Tunai)</p>
                            <p className="text-2xl font-black text-slate-900">Rp {parseFloat(data.closing_balance).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                            <p className="text-sm font-bold text-emerald-600 mb-1">Total Uang Fisik</p>
                            <p className="text-2xl font-black text-emerald-700">Rp {totalPhysicalCash.toLocaleString('id-ID')}</p>
                        </div>
                        <div className={`rounded-2xl p-5 border ${difference === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                            <p className={`text-sm font-bold mb-1 ${difference === 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Selisih (Fisik - Sistem)</p>
                            <div className="flex items-center gap-2">
                                <p className={`text-2xl font-black ${difference === 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                                    Rp {difference.toLocaleString('id-ID')}
                                </p>
                                {difference === 0 ? <CheckCircle size={20} className="text-indigo-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-stone-100 pb-2">Rincian Lembar Uang Kertas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {denominations.map((denom) => (
                                <div key={denom.key}>
                                    <InputLabel value={denom.label} />
                                    <div className="relative mt-1">
                                        <TextInput
                                            type="number"
                                            min="0"
                                            className="block w-full pl-3 pr-12 text-center text-lg font-bold bg-stone-50"
                                            value={data[denom.key]}
                                            onChange={(e) => setData(denom.key, e.target.value)}
                                        />
                                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 font-medium">lbr</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-stone-100 pb-2">Total Koin (Rupiah)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Masukkan Total Nilai Koin Keseluruhan" />
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 font-bold">Rp</span>
                                    <TextInput
                                        type="number"
                                        min="0"
                                        className="block w-full pl-10 text-lg font-bold bg-stone-50"
                                        value={data.coins}
                                        onChange={(e) => setData('coins', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-stone-100 pb-2">Rekapitulasi Non-Tunai (Actual / Riil)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {[
                                { key: 'qris_actual', expectedKey: 'qris_expected', label: 'QRIS', expectedVal: data.qris_expected },
                                { key: 'transfer_actual', expectedKey: 'transfer_expected', label: 'Transfer Bank', expectedVal: data.transfer_expected },
                                { key: 'edc_actual', expectedKey: 'edc_expected', label: 'Mesin EDC', expectedVal: data.edc_expected },
                                { key: 'ewallet_actual', expectedKey: 'ewallet_expected', label: 'E-Wallet (Ovo/Dana/Shopee)', expectedVal: data.ewallet_expected },
                            ].map(method => {
                                const diff = method.expectedVal - data[method.key];
                                return (
                                    <div key={method.key} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <InputLabel value={method.label} />
                                            <span className="text-xs text-stone-500 font-medium bg-stone-200 px-2 py-1 rounded">Sistem: Rp {parseFloat(method.expectedVal).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="relative mt-1">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500 font-bold">Rp</span>
                                            <TextInput
                                                type="number"
                                                min="0"
                                                className={`block w-full pl-10 text-lg font-bold ${diff !== 0 ? 'bg-rose-50 border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'bg-white'}`}
                                                value={data[method.key]}
                                                onChange={(e) => setData(method.key, e.target.value)}
                                            />
                                        </div>
                                        {diff !== 0 && (
                                            <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                Selisih: Rp {Math.abs(diff).toLocaleString('id-ID')} ({diff > 0 ? 'Kurang' : 'Lebih'})
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-stone-100 pb-2">Catatan Laporan</h3>
                        <div>
                            <InputLabel value="Catatan Opsional (Misal: Alasan jika ada selisih, kembalian kurang, dll)" />
                            <textarea
                                className="mt-1 block w-full rounded-xl border-stone-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-stone-50"
                                rows="3"
                                value={data.note}
                                onChange={e => setData('note', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
                        <PrimaryButton type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 text-sm flex items-center gap-2">
                            <Save size={18} /> Simpan Laporan POS
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
