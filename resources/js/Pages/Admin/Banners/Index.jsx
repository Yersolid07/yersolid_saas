import { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle, GripVertical, Save, Loader2 } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';

export default function BannerIndex({ auth, banners }) {
    const [items, setItems] = useState(banners);
    const [isReordering, setIsReordering] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setItems(banners);
    }, [banners]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        description: '',
        link_url: '',
        image: null,
        _method: 'post'
    });

    const openModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setData({
                title: banner.title,
                description: banner.description || '',
                link_url: banner.link_url || '',
                image: null,
                _method: 'put'
            });
        } else {
            setEditingBanner(null);
            setData({
                title: '',
                description: '',
                link_url: '',
                image: null,
                _method: 'post'
            });
        }
        clearErrors();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setTimeout(() => {
            reset();
            setEditingBanner(null);
        }, 300);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingBanner) {
            post(route('admin.banners.update', editingBanner.id), {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        } else {
            post(route('admin.banners.store'), {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        }
    };

    const toggleStatus = (id) => {
        router.patch(route('admin.banners.toggle-status', id), {}, { preserveScroll: true });
    };

    const deleteBanner = async (id) => {
        if (await window.customConfirm('Yakin ingin menghapus banner ini?')) {
            router.delete(route('admin.banners.destroy', id), { preserveScroll: true });
        }
    };

    const saveReorder = () => {
        const payload = items.map((item, idx) => ({ id: item.id, sort_order: idx + 1 }));
        router.post(route('admin.banners.reorder'), { items: payload }, {
            preserveScroll: true,
            onSuccess: () => setIsReordering(false)
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-xl text-slate-800 leading-tight">Manajemen Banner</h2>}
        >
            <Head title="Manajemen Banner" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <p className="text-slate-500 text-sm">Kelola banner yang akan tampil di halaman utama.</p>
                        <div className="flex gap-3 w-full sm:w-auto">
                            {isReordering ? (
                                <>
                                    <button
                                        onClick={() => { setItems(banners); setIsReordering(false); }}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={saveReorder}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Save size={18} /> Simpan Urutan
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsReordering(true)}
                                        disabled={banners.length === 0}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Ubah Urutan
                                    </button>
                                    <button
                                        onClick={() => openModal()}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus size={18} /> Tambah Banner
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Banner List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
                        {items.length === 0 ? (
                            <div className="text-center py-16">
                                <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">Belum ada Banner</h3>
                                <p className="text-slate-500 mb-6">Tambahkan banner untuk mempromosikan event atau penawaran menarik.</p>
                                <button onClick={() => openModal()} className="text-emerald-600 font-bold hover:text-emerald-700">
                                    + Tambah Banner Pertama
                                </button>
                            </div>
                        ) : (
                            isReordering ? (
                                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
                                    {items.map((banner) => (
                                        <Reorder.Item key={banner.id} value={banner} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 cursor-grab active:cursor-grabbing">
                                            <GripVertical className="text-slate-400" />
                                            <img src={`/storage/${banner.image_path}`} alt={banner.title} className="w-32 h-16 object-cover rounded-lg shadow-sm" />
                                            <div>
                                                <h4 className="font-bold text-slate-800">{banner.title}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-1">{banner.description}</p>
                                            </div>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {banners.map((banner) => (
                                        <div key={banner.id} className={`group bg-white border ${banner.is_active ? 'border-slate-200' : 'border-dashed border-slate-300'} rounded-2xl overflow-hidden transition-all hover:shadow-lg`}>
                                            <div className="aspect-[21/9] bg-slate-100 relative overflow-hidden">
                                                <img src={`/storage/${banner.image_path}`} alt={banner.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!banner.is_active && 'grayscale opacity-70'}`} />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(banner.id)}
                                                        className={`p-1.5 rounded-lg backdrop-blur-md text-white shadow-sm transition-colors ${banner.is_active ? 'bg-emerald-500/80 hover:bg-emerald-600' : 'bg-rose-500/80 hover:bg-rose-600'}`}
                                                        title={banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        {banner.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={banner.title}>{banner.title}</h3>
                                                <p className="text-sm text-slate-500 mb-4 line-clamp-2" title={banner.description}>{banner.description || 'Tidak ada deskripsi'}</p>
                                                
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                    <a href={banner.link_url} target="_blank" rel="noreferrer" className={`text-xs font-bold ${banner.link_url ? 'text-blue-600 hover:underline' : 'text-slate-400'}`}>
                                                        {banner.link_url ? 'Lihat Tautan' : 'Tanpa Tautan'}
                                                    </a>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openModal(banner)} className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => deleteBanner(banner.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            <Modal show={showModal} onClose={closeModal} maxWidth="xl">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                        {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Banner *</label>
                            <TextInput
                                type="text"
                                className="w-full bg-slate-50"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="Cth: Promo Akhir Tahun"
                                required
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Gambar Banner *</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                                onChange={e => setData('image', e.target.files[0])}
                                accept="image/*"
                                required={!editingBanner}
                            />
                            <p className="text-xs text-slate-400 mt-1">Rekomendasi rasio 21:9 atau 16:9 (Maks 2MB)</p>
                            <InputError message={errors.image} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tautan URL (Opsional)</label>
                            <TextInput
                                type="url"
                                className="w-full bg-slate-50"
                                value={data.link_url}
                                onChange={e => setData('link_url', e.target.value)}
                                placeholder="https://..."
                            />
                            <InputError message={errors.link_url} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                            <textarea
                                className="w-full border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm bg-slate-50"
                                rows="3"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Jelaskan sedikit tentang promo ini..."
                            ></textarea>
                            <InputError message={errors.description} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 text-white bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing && <Loader2 size={18} className="animate-spin" />}
                            {editingBanner ? 'Simpan Perubahan' : 'Upload Banner'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
