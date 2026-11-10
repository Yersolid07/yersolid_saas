import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Form({ coupon = null }) {
    const { data, setData, post, put, processing, errors } = useForm({
        code: coupon?.code || '',
        type: coupon?.type || 'percent',
        value: coupon?.value || '',
        min_purchase: coupon?.min_purchase || 0,
        max_uses: coupon?.max_uses || '',
        valid_until: coupon?.valid_until ? coupon.valid_until.substring(0, 16) : '',
        is_active: coupon?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (coupon) {
            put(route('admin.coupons.update', coupon.id));
        } else {
            post(route('admin.coupons.store'));
        }
    };

    return (
        <AppLayout title={coupon ? 'Edit Kupon' : 'Tambah Kupon'}>
            <Head title={coupon ? 'Edit Kupon' : 'Tambah Kupon'} />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.coupons.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="text-emerald-500" /> {coupon ? 'Edit Kupon' : 'Tambah Kupon Baru'}
                    </h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            
                            <div>
                                <InputLabel htmlFor="code" value="Kode Kupon (Unik)" />
                                <TextInput
                                    id="code"
                                    type="text"
                                    className="mt-1 block w-full uppercase"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="WK-SUMMER26"
                                    required
                                />
                                <InputError message={errors.code} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="type" value="Tipe Diskon" />
                                    <select
                                        id="type"
                                        className="mt-1 block w-full bg-white border-stone-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                    >
                                        <option value="percent">Persentase (%)</option>
                                        <option value="fixed">Potongan Tetap (Rp)</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="value" value="Nilai Diskon" />
                                    <TextInput
                                        id="value"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        placeholder={data.type === 'percent' ? '10' : '50000'}
                                        required
                                        min="0"
                                        step={data.type === 'percent' ? '0.1' : '1000'}
                                    />
                                    <InputError message={errors.value} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="min_purchase" value="Minimal Pembelian (Rp)" />
                                <TextInput
                                    id="min_purchase"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.min_purchase}
                                    onChange={(e) => setData('min_purchase', e.target.value)}
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Set 0 jika tidak ada minimal.</p>
                                <InputError message={errors.min_purchase} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="max_uses" value="Batas Maksimal Penggunaan" />
                                <TextInput
                                    id="max_uses"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.max_uses}
                                    onChange={(e) => setData('max_uses', e.target.value)}
                                    min="1"
                                />
                                <p className="text-xs text-slate-500 mt-1">Kosongkan jika kupon tidak terbatas jumlahnya.</p>
                                <InputError message={errors.max_uses} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="valid_until" value="Batas Waktu Berlaku (Opsional)" />
                                <input
                                    id="valid_until"
                                    type="datetime-local"
                                    className="mt-1 block w-full bg-white border border-stone-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm text-sm"
                                    value={data.valid_until}
                                    onChange={(e) => setData('valid_until', e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-1">Kosongkan jika berlaku selamanya.</p>
                                <InputError message={errors.valid_until} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100 self-end">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                    Kupon Aktif
                                </label>
                            </div>

                        </div>

                        <div className="flex items-center justify-end gap-4 pt-8 border-t border-stone-100">
                            <Link
                                href={route('admin.coupons.index')}
                                className="px-6 py-3 text-slate-600 font-semibold hover:bg-stone-100 rounded-xl transition-colors"
                            >
                                Batal
                            </Link>
                            <PrimaryButton className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2" disabled={processing}>
                                <Save size={18} /> {coupon ? 'Simpan Perubahan' : 'Tambah Kupon'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
