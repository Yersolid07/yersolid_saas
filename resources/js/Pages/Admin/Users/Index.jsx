import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Users, Search, Edit2, Trash2, Shield, Plus } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ users, roles, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    const handleSearch = debounce((value, roleValue) => {
        router.get(
            route('admin.users.index'),
            { search: value, role: roleValue },
            { preserveState: true, replace: true }
        );
    }, 300);

    const deleteUser = async (id) => {
        if (await window.customConfirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            router.delete(route('admin.users.destroy', id));
        }
    };

    return (
        <AppLayout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-emerald-500" /> Manajemen Pengguna
                    </h2>
                    <Link
                        href={route('admin.users.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Tambah Pengguna
                    </Link>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                            <TextInput
                                type="text"
                                placeholder="Cari nama atau email..."
                                className="w-full pl-10 bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleSearch(e.target.value, role);
                                }}
                            />
                        </div>
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                handleSearch(search, e.target.value);
                            }}
                        >
                            <option value="">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-stone-100 text-slate-500">
                                    <th className="py-4 px-4 font-semibold">Pengguna</th>
                                    <th className="py-4 px-4 font-semibold">Role</th>
                                    <th className="py-4 px-4 font-semibold">Kontak</th>
                                    <th className="py-4 px-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-slate-900">{user.name}</p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                                                <Shield size={12} />
                                                {user.roles?.[0]?.name || 'No Role'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600">
                                            {user.phone || '-'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('admin.users.edit', user.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-500">
                                            Tidak ada data pengguna yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
