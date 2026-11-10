import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState, useRef } from 'react';

export default function Form({ item = null }) {
    const fileInput = useRef();
    const [preview, setPreview] = useState(item?.image_url ? `/storage/${item.image_url}` : null);

    const { data, setData, post, processing, errors } = useForm({
        name: item?.name || '',
        description: item?.description || '',
        category: item?.category || '',
        price: item?.price || '',
        is_available: item?.is_available ?? true,
        discount_type: item?.discount_type || 'none',
        discount_value: item?.discount_value || '',
        promo_name: item?.promo_name || '',
        promo_start: item?.promo_start ? item.promo_start.substring(0, 16) : '',
        promo_end: item?.promo_end ? item.promo_end.substring(0, 16) : '',
        daily_stock: item?.daily_stock ?? '',
        reset_stock: false,
        barcode: item?.barcode || '',
        is_counter_pickup: item?.is_counter_pickup ?? false,
        image: null,
        _method: item ? 'PUT' : 'POST', // For file uploads in Laravel PUT requests
    });

    const submit = (e) => {
        e.preventDefault();
        if (item) {
            // Using POST with _method=PUT to support multipart/form-data
            post(route('admin.menu-items.update', item.id));
        } else {
            post(route('admin.menu-items.store'));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(item?.image_url ? `/storage/${item.image_url}` : null);
        }
    };

    return (
        <AppLayout title={item ? 'Edit Menu' : 'Tambah Menu'}>
            <Head title={item ? 'Edit Menu' : 'Tambah Menu'} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.menu-items.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {item ? 'Edit Menu' : 'Tambah Menu Baru'}
                    </h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Column - Image Upload */}
                            <div className="space-y-4">
                                <InputLabel value="Foto Menu" />
                                <div 
                                    onClick={() => fileInput.current.click()}
                                    className={`relative aspect-square md:aspect-[4/3] rounded-3xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all ${
                                        preview ? 'border-emerald-500 bg-emerald-50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-stone-400'
                                    }`}
                                >
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white font-semibold">Ganti Foto</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6 text-stone-500">
                                            <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                                            <p className="font-semibold text-sm">Klik untuk mengunggah foto</p>
                                            <p className="text-xs mt-1 opacity-75">PNG, JPG, JPEG (Max 2MB)</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInput}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                />
                                <InputError message={errors.image} />
                            </div>

                            {/* Right Column - Form Fields */}
                            <div className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nama Menu" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="category" value="Kategori" />
                                        <select
                                            id="category"
                                            className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            required
                                        >
                                            <option value="">Pilih...</option>
                                            <option value="makanan">Makanan</option>
                                            <option value="minuman">Minuman</option>
                                            <option value="snack">Snack</option>
                                            <option value="dessert">Dessert</option>
                                            <option value="tiket">Tiket Masuk Kolam</option>
                                            <option value="other_income">Other Income (Lainnya)</option>
                                            <option value="toiletries">Toiletries</option>
                                        </select>
                                        <InputError message={errors.category} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="price" value="Harga (Rp)" />
                                        <TextInput
                                            id="price"
                                            type="number"
                                            className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            required
                                            min="0"
                                        />
                                        <InputError message={errors.price} className="mt-2" />
                                    </div>

                                    <div className="col-span-2">
                                        <InputLabel htmlFor="daily_stock" value="Stok Harian Default (Kosongkan jika stok tak terbatas)" />
                                        <div className="flex gap-4 items-start">
                                            <div className="flex-1">
                                                <TextInput
                                                    id="daily_stock"
                                                    type="number"
                                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                                    value={data.daily_stock}
                                                    onChange={(e) => setData('daily_stock', e.target.value)}
                                                    min="0"
                                                />
                                                <InputError message={errors.daily_stock} className="mt-2" />
                                            </div>
                                            {item && data.daily_stock !== '' && data.daily_stock !== null && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="reset_stock"
                                                        checked={data.reset_stock || false}
                                                        onChange={(e) => setData('reset_stock', e.target.checked)}
                                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <label htmlFor="reset_stock" className="text-sm font-medium text-slate-700">
                                                        Reset Stok Sekarang
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="barcode" value="Barcode Scanner (Opsional)" />
                                    <div className="relative">
                                        <TextInput
                                            id="barcode"
                                            type="text"
                                            className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                            value={data.barcode}
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            placeholder="Scan barcode di sini..."
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                            <span className="text-xs font-semibold">Tembak Scanner</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Gunakan alat pemindai barcode untuk mengisi otomatis, atau ketik manual.</p>
                                    <InputError message={errors.barcode} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="description" value="Deskripsi Singkat" />
                                    <textarea
                                        id="description"
                                        className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm min-h-[100px]"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                                    <input
                                        type="checkbox"
                                        id="is_available"
                                        checked={data.is_available}
                                        onChange={(e) => setData('is_available', e.target.checked)}
                                        className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                                    />
                                    <label htmlFor="is_available" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                        Menu Tersedia untuk Dipesan
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <input
                                        type="checkbox"
                                        id="show_in_kds"
                                        checked={!data.is_counter_pickup}
                                        onChange={(e) => setData('is_counter_pickup', !e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                                    />
                                    <label htmlFor="show_in_kds" className="text-sm font-semibold text-slate-700 cursor-pointer">
                                        Tampil di Dapur (KDS) — centang jika item ini dimasak/dibuat di dapur.
                                        <span className="block text-xs font-normal text-slate-500">Jika tidak dicentang, item diambil langsung di kasir (tidak muncul di layar dapur).</span>
                                    </label>
                                </div>

                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 space-y-4">
                                    <h4 className="font-bold text-orange-800 flex items-center gap-2">
                                        Pengaturan Diskon / Promo
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="discount_type" value="Tipe Diskon" />
                                            <select
                                                id="discount_type"
                                                className="mt-1 block w-full bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl shadow-sm text-sm"
                                                value={data.discount_type}
                                                onChange={(e) => setData('discount_type', e.target.value)}
                                            >
                                                <option value="none">Tidak Ada Diskon</option>
                                                <option value="percentage">Persentase (%)</option>
                                                <option value="nominal">Potongan Tetap (Rp)</option>
                                            </select>
                                            <InputError message={errors.discount_type} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="discount_value" value="Nilai Diskon" />
                                            <TextInput
                                                id="discount_value"
                                                type="number"
                                                className="mt-1 block w-full bg-white border-orange-200 focus:border-orange-500 rounded-xl"
                                                value={data.discount_value}
                                                onChange={(e) => setData('discount_value', e.target.value)}
                                                disabled={data.discount_type === 'none'}
                                                min="0"
                                            />
                                            <InputError message={errors.discount_value} className="mt-2" />
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <InputLabel htmlFor="promo_name" value="Nama Promo / Badge" />
                                        <TextInput
                                            id="promo_name"
                                            type="text"
                                            placeholder="contoh: Flash Sale"
                                            className="mt-1 block w-full bg-white border-orange-200 focus:border-orange-500 rounded-xl"
                                            value={data.promo_name}
                                            onChange={(e) => setData('promo_name', e.target.value)}
                                            disabled={data.discount_type === 'none'}
                                        />
                                        <InputError message={errors.promo_name} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="promo_start" value="Mulai Promo" />
                                            <input
                                                id="promo_start"
                                                type="datetime-local"
                                                className="mt-1 block w-full bg-white border-orange-200 focus:border-orange-500 rounded-xl text-sm"
                                                value={data.promo_start}
                                                onChange={(e) => setData('promo_start', e.target.value)}
                                                disabled={data.discount_type === 'none'}
                                            />
                                            <InputError message={errors.promo_start} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="promo_end" value="Selesai Promo" />
                                            <input
                                                id="promo_end"
                                                type="datetime-local"
                                                className="mt-1 block w-full bg-white border-orange-200 focus:border-orange-500 rounded-xl text-sm"
                                                value={data.promo_end}
                                                onChange={(e) => setData('promo_end', e.target.value)}
                                                disabled={data.discount_type === 'none'}
                                            />
                                            <InputError message={errors.promo_end} className="mt-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-8 border-t border-stone-100">
                            <Link
                                href={route('admin.menu-items.index')}
                                className="px-6 py-3 text-slate-600 font-semibold hover:bg-stone-100 rounded-xl transition-colors"
                            >
                                Batal
                            </Link>
                            <PrimaryButton className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2" disabled={processing}>
                                <Save size={18} /> {item ? 'Simpan Perubahan' : 'Tambah Menu'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
