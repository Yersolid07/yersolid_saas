import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Settings, Save, Image as ImageIcon, MessageSquare, PhoneCall, BookOpen, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ settings }) {
    const [activeTab, setActiveTab] = useState('hero');

    const { data, setData, post, processing, errors } = useForm({
        // General
        site_name: settings.site_name || '',
        site_description: settings.site_description || '',
        footer_text: settings.footer_text || '',
        theme_color: settings.theme_color || '#10b981', // Default emerald-500
        primary_logo: null,
        auth_image: null,
        catalog_show_images: settings.catalog_show_images === 'false' || settings.catalog_show_images === '0' ? false : true,
        // Hero
        hero_title: settings.hero_title || '',
        hero_subtitle: settings.hero_subtitle || '',
        hero_description: settings.hero_description || '',
        hero_image: null,
        // About
        about_title: settings.about_title || '',
        about_description: settings.about_description || '',
        // Contact
        contact_whatsapp: settings.contact_whatsapp || '',
        contact_email: settings.contact_email || '',
        contact_address: settings.contact_address || '',
        contact_map_embed: settings.contact_map_embed || '',
        // Static Pages (Rich Text)
        about_us_content: settings.about_us_content || '',
        privacy_policy_content: settings.privacy_policy_content || '',
        terms_of_service_content: settings.terms_of_service_content || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('hero_image', null);
                setData('primary_logo', null);
                setData('auth_image', null);
            }
        });
    };

    const tabs = [
        { id: 'hero', label: 'Tampilan Awal (Hero)', icon: ImageIcon },
        { id: 'about', label: 'Tentang Kami (Hero)', icon: MessageSquare },
        { id: 'contact', label: 'Kontak & Maps', icon: PhoneCall },
        { id: 'static_pages', label: 'Halaman Info (Rich Text)', icon: BookOpen },
        { id: 'general', label: 'Pengaturan Umum', icon: Settings },
        { id: 'danger_zone', label: 'Zona Bahaya (Reset Data)', icon: AlertTriangle },
    ];

    const [resetDate, setResetDate] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const handleResetData = () => {
        if (!resetDate) {
            alert('Pilih tanggal mulai penghapusan data terlebih dahulu.');
            return;
        }
        if (confirmText !== 'HAPUS DATA') {
            alert('Ketik "HAPUS DATA" (huruf kapital) untuk konfirmasi.');
            return;
        }
        if (confirm(`PERINGATAN: Anda akan MENGHAPUS SEMUA data transaksi (Reservasi, Pesanan Makanan, Pembayaran) mulai dari tanggal ${resetDate} ke atas. Stok harian juga akan direset ke setelan awal. Tindakan ini TIDAK DAPAT DIBATALKAN. Anda yakin?`)) {
            router.post(route('admin.settings.reset-data'), { reset_date: resetDate, confirm_text: confirmText }, {
                onSuccess: () => alert('Data berhasil direset dari tanggal ' + resetDate),
                onError: (e) => alert(e.confirm_text || e.reset_date || 'Gagal mereset data.')
            });
        }
    };

    return (
        <AppLayout title="Pengaturan Situs (CMS)">
            <Head title="Pengaturan Situs" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="text-emerald-500" /> Pengaturan Konten Situs
                    </h2>
                    <p className="text-slate-500 mt-1">Ubah teks dan gambar di halaman depan dengan mudah.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-stone-100 p-2 shadow-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 p-4 border-b md:border-b-0 md:border-r border-stone-100 flex md:flex-col gap-2 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                                        : 'text-slate-500 hover:bg-stone-50'}`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 md:p-8">
                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* HERO SETTINGS */}
                            {activeTab === 'hero' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Bagian Hero (Atas)</h3>
                                    
                                    <div>
                                        <InputLabel value="Gambar Latar Belakang" />
                                        <div className="mt-2 flex items-center gap-4">
                                            {settings.hero_image && (
                                                <div className="w-32 h-20 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                                                    <img src={settings.hero_image} alt="Hero" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                                onChange={e => setData('hero_image', e.target.files[0])}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel value="Judul Utama" />
                                        <TextInput 
                                            value={data.hero_title}
                                            onChange={e => setData('hero_title', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value="Sub-Judul (Teks Kecil di Atas)" />
                                        <TextInput 
                                            value={data.hero_subtitle}
                                            onChange={e => setData('hero_subtitle', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value="Deskripsi Singkat" />
                                        <textarea 
                                            value={data.hero_description}
                                            onChange={e => setData('hero_description', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {/* ABOUT SETTINGS */}
                            {activeTab === 'about' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Bagian Tentang Kami</h3>
                                    
                                    <div>
                                        <InputLabel value="Judul Bagian" />
                                        <TextInput 
                                            value={data.about_title}
                                            onChange={e => setData('about_title', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value="Deskripsi Lengkap" />
                                        <textarea 
                                            value={data.about_description}
                                            onChange={e => setData('about_description', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                            rows="5"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {/* CONTACT SETTINGS */}
                            {activeTab === 'contact' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Informasi Kontak & Peta</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Nomor WhatsApp" />
                                            <TextInput 
                                                value={data.contact_whatsapp}
                                                onChange={e => setData('contact_whatsapp', e.target.value)}
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Alamat Email" />
                                            <TextInput 
                                                value={data.contact_email}
                                                onChange={e => setData('contact_email', e.target.value)}
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel value="Alamat Lengkap" />
                                        <textarea 
                                            value={data.contact_address}
                                            onChange={e => setData('contact_address', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                            rows="2"
                                        ></textarea>
                                    </div>

                                    <div>
                                        <InputLabel value="Link Embed Google Maps (URL pada src iframe)" />
                                        <TextInput 
                                            value={data.contact_map_embed}
                                            onChange={e => setData('contact_map_embed', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Hanya ambil URL yang ada di dalam src="..." ketika Anda membagikan embed peta di Google Maps.</p>
                                    </div>
                                </div>
                            )}

                            {/* STATIC PAGES SETTINGS (RICH TEXT) */}
                            {activeTab === 'static_pages' && (
                                <div className="space-y-8 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Konten Halaman Informasi</h3>
                                    
                                    <div>
                                        <InputLabel value="Tentang Kami (Full Content)" className="mb-2 text-base font-semibold" />
                                        <ReactQuill 
                                            theme="snow" 
                                            value={data.about_us_content} 
                                            onChange={val => setData('about_us_content', val)} 
                                            className="bg-white rounded-b-xl"
                                        />
                                    </div>
                                    
                                    <div>
                                        <InputLabel value="Kebijakan Privasi" className="mb-2 text-base font-semibold" />
                                        <ReactQuill 
                                            theme="snow" 
                                            value={data.privacy_policy_content} 
                                            onChange={val => setData('privacy_policy_content', val)} 
                                            className="bg-white rounded-b-xl"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value="Syarat dan Ketentuan" className="mb-2 text-base font-semibold" />
                                        <ReactQuill 
                                            theme="snow" 
                                            value={data.terms_of_service_content} 
                                            onChange={val => setData('terms_of_service_content', val)} 
                                            className="bg-white rounded-b-xl"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* GENERAL SETTINGS */}
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Pengaturan Umum</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Nama Situs" />
                                            <TextInput 
                                                value={data.site_name}
                                                onChange={e => setData('site_name', e.target.value)}
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Warna Tema Utama (Hex)" />
                                            <div className="flex gap-2 items-center mt-1">
                                                <input
                                                    type="color"
                                                    value={data.theme_color}
                                                    onChange={e => setData('theme_color', e.target.value)}
                                                    className="w-12 h-10 p-1 rounded border border-stone-200"
                                                />
                                                <TextInput 
                                                    value={data.theme_color}
                                                    onChange={e => setData('theme_color', e.target.value)}
                                                    className="block w-full flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Logo Utama" />
                                            <div className="mt-2 flex items-center gap-4">
                                                {settings.primary_logo && (
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-50 flex items-center justify-center p-2">
                                                        <img src={settings.primary_logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}
                                                <input 
                                                    type="file" 
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                                    onChange={e => setData('primary_logo', e.target.files[0])}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel value="Gambar Latar Halaman Login/Register" />
                                            <div className="mt-2 flex items-center gap-4">
                                                {settings.auth_image && (
                                                    <div className="w-24 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-50">
                                                        <img src={settings.auth_image} alt="Auth" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <input 
                                                    type="file" 
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                                    onChange={e => setData('auth_image', e.target.files[0])}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel value="Deskripsi Singkat (SEO)" />
                                        <TextInput 
                                            value={data.site_description}
                                            onChange={e => setData('site_description', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value="Teks Footer (Hak Cipta)" />
                                        <TextInput 
                                            value={data.footer_text}
                                            onChange={e => setData('footer_text', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-stone-100">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="peer sr-only"
                                                    checked={data.catalog_show_images}
                                                    onChange={e => setData('catalog_show_images', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 group-hover:after:scale-95"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">Tampilkan Foto Menu di Katalog</p>
                                                <p className="text-xs text-slate-500">Jika dimatikan, halaman katalog (QR Menu) hanya akan menampilkan nama dan deskripsi menu tanpa gambar.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* DANGER ZONE SETTINGS */}
                            {activeTab === 'danger_zone' && (
                                <div className="space-y-6 animate-fade-in bg-rose-50 p-6 rounded-2xl border-2 border-rose-200">
                                    <h3 className="text-xl font-black text-rose-700 flex items-center gap-2">
                                        <AlertTriangle /> Reset Data Transaksi
                                    </h3>
                                    <p className="text-rose-600 font-medium">
                                        Gunakan fitur ini ketika sistem mulai digunakan pada environment production untuk menghapus semua data transaksi testing, tanpa menghapus data master (Fasilitas, Menu, dll).
                                    </p>
                                    
                                    <div className="bg-white p-6 rounded-xl border border-rose-200">
                                        <InputLabel value="Tanggal Mulai Reset" className="text-rose-900" />
                                        <p className="text-sm text-slate-500 mb-4 mt-1">Semua transaksi, reservasi, dan pesanan makanan yang dibuat PADA dan SETELAH tanggal ini akan <strong>Dihapus Permanen</strong>.</p>
                                        <TextInput 
                                            type="date"
                                            value={resetDate}
                                            onChange={e => setResetDate(e.target.value)}
                                            className="mt-1 block w-full max-w-sm mb-6"
                                        />
                                        <InputLabel value='Ketik "HAPUS DATA" untuk konfirmasi' className="text-rose-900" />
                                        <TextInput 
                                            type="text"
                                            value={confirmText}
                                            onChange={e => setConfirmText(e.target.value)}
                                            placeholder="HAPUS DATA"
                                            className="mt-1 block w-full max-w-sm mb-6"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleResetData}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                                        >
                                            <AlertTriangle size={20} /> EKSEKUSI RESET DATA
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'danger_zone' && (
                                <div className="pt-8 border-t border-stone-200 flex justify-end">
                                    <PrimaryButton type="submit" disabled={processing} className="rounded-xl px-8 py-4 text-base font-bold flex items-center gap-2">
                                        {processing ? 'Menyimpan...' : (
                                            <><Save size={20} /> Simpan Pengaturan Umum</>
                                        )}
                                    </PrimaryButton>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
