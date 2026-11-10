import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { QrCode, Building2, Utensils, Printer, Trash2, Link as LinkIcon, Download } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ facilities, qrcodes }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        label: '',
        type: 'facility',
        facility_id: '',
        table_number: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.qrcodes.generate'), {
            onSuccess: () => {
                reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleDelete = async (qrcodeId) => {
        if (await window.customConfirm('Yakin ingin menghapus QR Code ini?')) {
            router.delete(route('admin.qrcodes.destroy', qrcodeId));
        }
    };

    const handlePrint = (qrcode) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${qrcode.label}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
                        h1 { font-size: 24px; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; font-size: 14px; }
                        .qr-container { padding: 20px; border: 2px dashed #ccc; border-radius: 10px; }
                        img { max-width: 300px; height: auto; }
                    </style>
                </head>
                <body>
                    <h1>${qrcode.label}</h1>
                    <p>Scan untuk memesan langsung dari meja Anda</p>
                    <div class="qr-container">
                        <img src="${qrcode.image_path}" alt="QR Code" />
                    </div>
                    <script>
                        window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <AppLayout title="QR Codes">
            <Head title="Manajemen QR Code" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <QrCode className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">QR Codes</h2>
                            <p className="text-slate-500 text-sm">Kelola QR Code pemesanan untuk fasilitas dan meja</p>
                        </div>
                    </div>
                    
                    <PrimaryButton 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        + Buat QR Code Baru
                    </PrimaryButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {qrcodes.map(qr => (
                        <div key={qr.id} className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6 bg-stone-50 flex justify-center items-center relative group">
                                <img src={qr.image_path} alt={qr.label} className="w-40 h-40 object-contain mix-blend-multiply" />
                                
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <button onClick={() => handlePrint(qr)} className="p-2 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform" title="Print">
                                        <Printer size={20} />
                                    </button>
                                    <a href={qr.image_path} download={`QR_${qr.label}.svg`} className="p-2 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform" title="Download">
                                        <Download size={20} />
                                    </a>
                                </div>
                            </div>
                            <div className="p-5 border-t border-stone-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{qr.label}</h3>
                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                        qr.location_type === 'facility' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {qr.location_type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg break-all">
                                    <LinkIcon size={12} className="shrink-0" />
                                    <a href={qr.url} target="_blank" className="hover:text-indigo-600 truncate">{qr.url}</a>
                                </div>
                                <div className="flex justify-end border-t border-stone-50 pt-3">
                                    <button 
                                        onClick={() => handleDelete(qr.id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {qrcodes.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-stone-200">
                            <QrCode size={48} className="mx-auto mb-4 text-stone-300" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Belum ada QR Code</h3>
                            <p className="text-slate-500">Buat QR code pertama Anda untuk pengunjung memesan makanan.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Buat QR Code Baru</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="label" value="Label / Nama QR Code" />
                            <TextInput
                                id="label"
                                className="mt-1 block w-full"
                                value={data.label}
                                onChange={e => setData('label', e.target.value)}
                                placeholder="Contoh: QR Meja 01, QR Gazebo Melati"
                                required
                            />
                            <InputError message={errors.label} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value="Tipe Lokasi" />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'facility')}
                                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors text-sm ${
                                        data.type === 'facility' ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700' : 'bg-stone-50 border-2 border-transparent text-stone-500 hover:bg-stone-100'
                                    }`}
                                >
                                    <Building2 size={16} /> Fasilitas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'table')}
                                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors text-sm ${
                                        data.type === 'table' ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700' : 'bg-stone-50 border-2 border-transparent text-stone-500 hover:bg-stone-100'
                                    }`}
                                >
                                    <Utensils size={16} /> Meja Resto
                                </button>
                            </div>
                        </div>

                        {data.type === 'facility' ? (
                            <div>
                                <InputLabel value="Pilih Fasilitas" />
                                <select 
                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm"
                                    value={data.facility_id}
                                    onChange={e => setData('facility_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Fasilitas --</option>
                                    {facilities.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                                    ))}
                                </select>
                                <InputError message={errors.facility_id} className="mt-2" />
                            </div>
                        ) : (
                            <div>
                                <InputLabel value="Nomor / Nama Meja" />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full"
                                    placeholder="Contoh: Meja 01, VIP 2"
                                    value={data.table_number}
                                    onChange={e => setData('table_number', e.target.value)}
                                    required
                                />
                                <InputError message={errors.table_number} className="mt-2" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsCreateModalOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>Simpan & Generate</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
