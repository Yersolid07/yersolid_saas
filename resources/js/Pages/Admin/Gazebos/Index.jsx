import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Home, Plus, Edit, Trash2, Grid3x3, QrCode, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import DangerButton from '@/Components/DangerButton';

export default function Index({ gazebos, facilities }) {
    const [isGazeboOpen, setIsGazeboOpen] = useState(false);
    const [editingGazebo, setEditingGazebo] = useState(null);
    const [tableGazebo, setTableGazebo] = useState(null); // gazebo sedang tambah meja
    const [isTableOpen, setIsTableOpen] = useState(false);

    const { data: gzData, setData: setGzData, post: gzPost, put: gzPut, processing: gzProcessing, reset: resetGz, errors: gzErrors } = useForm({
        name: '', facility_id: '', description: '', is_active: true,
    });

    const { data: tbData, setData: setTbData, post: tbPost, processing: tbProcessing, reset: resetTb, errors: tbErrors } = useForm({
        label: '', table_number: '',
    });

    const openCreateGazebo = () => {
        setEditingGazebo(null);
        resetGz();
        setGzData('is_active', true);
        setIsGazeboOpen(true);
    };

    const openEditGazebo = (g) => {
        setEditingGazebo(g);
        setGzData({
            name: g.name,
            facility_id: g.facility_id || '',
            description: g.description || '',
            is_active: g.is_active,
        });
        setIsGazeboOpen(true);
    };

    const submitGazebo = (e) => {
        e.preventDefault();
        if (editingGazebo) {
            gzPut(route('admin.gazebos.update', editingGazebo.id), { onSuccess: () => setIsGazeboOpen(false) });
        } else {
            gzPost(route('admin.gazebos.store'), { onSuccess: () => setIsGazeboOpen(false) });
        }
    };

    const handleDeleteGazebo = async (id) => {
        if (await window.customConfirm('Hapus gazebo ini? Meja di dalamnya harus dihapus dulu.')) {
            router.delete(route('admin.gazebos.destroy', id));
        }
    };

    const openAddTable = (g) => {
        setTableGazebo(g);
        resetTb();
        setIsTableOpen(true);
    };

    const submitTable = (e) => {
        e.preventDefault();
        tbPost(route('admin.gazebos.tables.store', tableGazebo.id), {
            onSuccess: () => setIsTableOpen(false),
        });
    };

    const handleDeleteTable = async (gazeboId, tableId) => {
        if (await window.customConfirm('Hapus meja ini?')) {
            router.delete(route('admin.gazebos.tables.destroy', gazeboId, tableId));
        }
    };

    return (
        <AppLayout title="Manajemen Gazebo & Meja">
            <Head title="Gazebo & Meja" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <Home className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-stone-800">Gazebo & Meja</h1>
                            <p className="text-stone-500 text-sm">Kelola gazebo dan meja (QR) yang menjadi identitas tiap pesanan.</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={openCreateGazebo}>
                        <Plus size={18} className="mr-1" /> Tambah Gazebo
                    </PrimaryButton>
                </div>

                {/* List Gazebos */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {gazebos.map((g) => (
                        <div key={g.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
                                        <Home size={18} className="text-emerald-600" /> {g.name}
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        {g.facility_name ? `Fasilitas: ${g.facility_name}` : 'Tidak terikat fasilitas'}
                                        {' · '}
                                        <span className={g.is_active ? 'text-emerald-600' : 'text-rose-500'}>
                                            {g.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditGazebo(g)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteGazebo(g.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Hapus">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Tables */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                                    <Grid3x3 size={14} /> {g.tables.length} Meja
                                </span>
                                <button onClick={() => openAddTable(g)} className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                                    <Plus size={13} /> Meja
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {g.tables.length === 0 && (
                                    <span className="text-xs text-stone-400 italic">Belum ada meja</span>
                                )}
                                {g.tables.map((t) => (
                                    <span key={t.id} className="group inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg text-sm font-bold text-stone-700">
                                        <QrCode size={12} className="text-stone-400" />
                                        {t.table_number}
                                        <button
                                            onClick={() => handleDeleteTable(g.id, t.id)}
                                            className="text-rose-400 opacity-0 group-hover:opacity-100 transition"
                                            title="Hapus meja"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gazebo Modal */}
            <Modal show={isGazeboOpen} onClose={() => setIsGazeboOpen(false)} maxWidth="md">
                <form onSubmit={submitGazebo} className="p-6 space-y-4">
                    <h2 className="text-lg font-black text-stone-800">
                        {editingGazebo ? 'Edit Gazebo' : 'Tambah Gazebo'}
                    </h2>

                    <div>
                        <InputLabel htmlFor="name" value="Nama Gazebo" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full"
                            value={gzData.name}
                            onChange={(e) => setGzData('name', e.target.value)}
                            placeholder="Mis. Kawasar 1"
                            required
                        />
                        {gzErrors.name && <p className="text-rose-500 text-sm mt-1">{gzErrors.name}</p>}
                    </div>

                    <div>
                        <InputLabel htmlFor="facility_id" value="Ikaitkan dengan Fasilitas (opsional)" />
                        <select
                            id="facility_id"
                            className="mt-1 block w-full rounded-md border-stone-300"
                            value={gzData.facility_id}
                            onChange={(e) => setGzData('facility_id', e.target.value)}
                        >
                            <option value="">— Tidak diikat —</option>
                            {facilities.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Deskripsi (opsional)" />
                        <TextInput
                            id="description"
                            className="mt-1 block w-full"
                            value={gzData.description}
                            onChange={(e) => setGzData('description', e.target.value)}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                        <input
                            type="checkbox"
                            checked={gzData.is_active}
                            onChange={(e) => setGzData('is_active', e.target.checked)}
                        />
                        Gazebo aktif
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <SecondaryButton onClick={() => setIsGazeboOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={gzProcessing}>{gzProcessing ? 'Menyimpan...' : 'Simpan'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Table Modal */}
            <Modal show={isTableOpen} onClose={() => setIsTableOpen(false)} maxWidth="sm">
                <form onSubmit={submitTable} className="p-6 space-y-4">
                    <h2 className="text-lg font-black text-stone-800">
                        Tambah Meja — {tableGazebo?.name}
                    </h2>

                    <div>
                        <InputLabel htmlFor="label" value="Label Meja" />
                        <TextInput
                            id="label"
                            className="mt-1 block w-full"
                            value={tbData.label}
                            onChange={(e) => setTbData('label', e.target.value)}
                            placeholder="Mis. Kawasar 1 Meja 08"
                            required
                        />
                        {tbErrors.label && <p className="text-rose-500 text-sm mt-1">{tbErrors.label}</p>}
                    </div>

                    <div>
                        <InputLabel htmlFor="table_number" value="Nomor Meja" />
                        <TextInput
                            id="table_number"
                            className="mt-1 block w-full"
                            value={tbData.table_number}
                            onChange={(e) => setTbData('table_number', e.target.value)}
                            placeholder="Meja 08"
                            required
                        />
                        {tbErrors.table_number && <p className="text-rose-500 text-sm mt-1">{tbErrors.table_number}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <SecondaryButton onClick={() => setIsTableOpen(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={tbProcessing}>{tbProcessing ? 'Menyimpan...' : 'Tambah Meja'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
