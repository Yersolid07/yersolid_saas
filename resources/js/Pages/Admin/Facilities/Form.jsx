import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Link } from '@inertiajs/react';

export default function FacilityForm({ facility }) {
    const isEdit = !!facility;
    const [imagePreview, setImagePreview] = useState(facility?.image_url ? `/storage/${facility.image_url}` : null);
    const imageRef = useRef(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: facility?.name || '',
        type: facility?.type || 'homestay',
        description: facility?.description || '',
        capacity: facility?.capacity || '',
        price_per_day: facility?.price_per_day || '',
        price_per_hour: facility?.price_per_hour || '',
        price_prefix: facility?.price_prefix || 'Mulai dari',
        price_unit: facility?.price_unit || '/malam',
        bed_count: facility?.bed_count || '',
        image: null,
        promo_name: facility?.promo_name || '',
        is_active: facility?.is_active ?? true,
        amenities: facility?.amenities || [],
        rules: facility?.rules || [],
        _method: isEdit ? 'PUT' : 'POST',
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            post(route('admin.facilities.update', facility.id), { forceFormData: true });
        } else {
            post(route('admin.facilities.store'), { forceFormData: true });
        }
    };

    const addAmenity = () => {
        setData('amenities', [...data.amenities, { icon: 'CheckCircle2', label: '' }]);
    };

    const updateAmenity = (index, field, value) => {
        const newAmenities = [...data.amenities];
        newAmenities[index][field] = value;
        setData('amenities', newAmenities);
    };

    const removeAmenity = (index) => {
        const newAmenities = data.amenities.filter((_, i) => i !== index);
        setData('amenities', newAmenities);
    };

    const addRule = () => {
        setData('rules', [...data.rules, '']);
    };

    const updateRule = (index, value) => {
        const newRules = [...data.rules];
        newRules[index] = value;
        setData('rules', newRules);
    };

    const removeRule = (index) => {
        const newRules = data.rules.filter((_, i) => i !== index);
        setData('rules', newRules);
    };

    const typeOptions = [
        { value: 'homestay', label: '🏠 Homestay / Villa' },
        { value: 'gazebo', label: '🌿 Gazebo' },
        { value: 'pool', label: '🏊 Kolam Renang' },
        { value: 'cafe', label: '☕ Café' },
    ];

    return (
        <AppLayout title={isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas'}>
            <Head title={`${isEdit ? 'Edit' : 'Tambah'} Fasilitas`} />

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href={route('admin.facilities.index')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas Baru'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {isEdit ? `Mengedit: ${facility.name}` : 'Isi informasi fasilitas resort'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Image Upload */}
                        <div
                            className="relative h-48 bg-gray-50 dark:bg-gray-700 cursor-pointer group"
                            onClick={() => imageRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="text-white text-sm flex items-center gap-2">
                                            <Upload size={16} /> Ganti Gambar
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <Upload size={32} />
                                    <p className="text-sm">Klik untuk upload gambar</p>
                                    <p className="text-xs">JPG, PNG max. 2MB</p>
                                </div>
                            )}
                            <input
                                ref={imageRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                        {errors.image && <p className="text-xs text-red-500 px-5 py-1">{errors.image}</p>}

                        <div className="p-5 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nama Fasilitas *
                                </label>
                                <input
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="contoh: Villa Example 1"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipe Fasilitas *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {typeOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('type', opt.value)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                                                data.type === opt.value
                                                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Deskripsi fasilitas..."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                />
                            </div>

                            {/* Promo Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nama Promo / Campaign (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={data.promo_name}
                                    onChange={e => setData('promo_name', e.target.value)}
                                    placeholder="contoh: Promo Lebaran"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>

                            {/* Capacity + Pricing */}
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kapasitas</label>
                                    <input
                                        type="number"
                                        value={data.capacity}
                                        onChange={e => setData('capacity', e.target.value)}
                                        min="1"
                                        placeholder="orang"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Bed (Kasur)</label>
                                    <input
                                        type="number"
                                        value={data.bed_count}
                                        onChange={e => setData('bed_count', e.target.value)}
                                        min="0"
                                        placeholder="Kosongkan jika tidak ada"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga/Hari (Rp)</label>
                                    <input
                                        type="number"
                                        value={data.price_per_day}
                                        onChange={e => setData('price_per_day', e.target.value)}
                                        min="0"
                                        placeholder="0"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga/Jam (Rp)</label>
                                    <input
                                        type="number"
                                        value={data.price_per_hour}
                                        onChange={e => setData('price_per_hour', e.target.value)}
                                        min="0"
                                        placeholder="0"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Display Config */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Awalan Teks Harga (Prefix)</label>
                                    <input
                                        type="text"
                                        value={data.price_prefix}
                                        onChange={e => setData('price_prefix', e.target.value)}
                                        placeholder="Mulai dari"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Satuan Waktu Harga (Unit)</label>
                                    <input
                                        type="text"
                                        value={data.price_unit}
                                        onChange={e => setData('price_unit', e.target.value)}
                                        placeholder="/malam"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Amenities */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Fasilitas Utama (Amenities)
                                    </label>
                                    <button type="button" onClick={addAmenity} className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700">
                                        <Plus size={14} /> Tambah Fasilitas
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.amenities.map((amenity, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <select
                                                value={amenity.icon}
                                                onChange={e => updateAmenity(index, 'icon', e.target.value)}
                                                className="w-1/3 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                            >
                                                <option value="CheckCircle2">✅ Centang</option>
                                                <option value="Bed">🛏️ Kasur</option>
                                                <option value="Users">👥 Orang</option>
                                                <option value="Wifi">📶 Wi-Fi</option>
                                                <option value="Maximize">🔲 Luas</option>
                                                <option value="Calendar">📅 Kalender</option>
                                                <option value="Coffee">☕ F&B</option>
                                                <option value="Tv">📺 TV</option>
                                                <option value="AirVent">❄️ AC/Kipas</option>
                                                <option value="Bath">🛁 K. Mandi</option>
                                                <option value="Car">🚗 Parkir</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={amenity.label}
                                                onChange={e => updateAmenity(index, 'label', e.target.value)}
                                                placeholder="Label (ex: 2 Kasur Besar)"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                            <button type="button" onClick={() => removeAmenity(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {data.amenities.length === 0 && <p className="text-sm text-gray-400 italic">Belum ada fasilitas utama ditambahkan.</p>}
                                </div>
                            </div>

                            {/* Dynamic Rules / Perks */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Aturan / Info Ekstra (Checkmarks)
                                    </label>
                                    <button type="button" onClick={addRule} className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700">
                                        <Plus size={14} /> Tambah Info
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.rules.map((rule, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <input
                                                type="text"
                                                value={rule}
                                                onChange={e => updateRule(index, e.target.value)}
                                                placeholder="ex: Batal gratis 24 jam sebelum check-in"
                                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                                            />
                                            <button type="button" onClick={() => removeRule(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {data.rules.length === 0 && <p className="text-sm text-gray-400 italic">Belum ada info ekstra ditambahkan.</p>}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Fasilitas</p>
                                    <p className="text-xs text-gray-400">Fasilitas aktif dapat dibooking tamu</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('is_active', !data.is_active)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        data.is_active ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        data.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                            <Link
                                href={route('admin.facilities.index')}
                                className="flex-1 text-center px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
