import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Form({ user = null, roles }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        phone: user?.phone || '',
        address: user?.address || '',
        role: user?.roles?.[0]?.name || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (user) {
            put(route('admin.users.update', user.id));
        } else {
            post(route('admin.users.store'));
        }
    };

    return (
        <AppLayout title={user ? 'Edit Pengguna' : 'Tambah Pengguna'}>
            <Head title={user ? 'Edit Pengguna' : 'Tambah Pengguna'} />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                    </h2>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="name" value="Nama Lengkap" />
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

                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value={user ? "Password (Kosongkan jika tidak ingin mengubah)" : "Password"} />
                            <TextInput
                                id="password"
                                type="password"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required={!user}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="phone" value="No. Telepon" />
                                <TextInput
                                    id="phone"
                                    type="text"
                                    className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 rounded-xl"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="role" value="Role Pengguna" />
                                <div className="relative mt-1">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                    <select
                                        id="role"
                                        className="pl-10 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm"
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih Role...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.name}>{r.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.role} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="address" value="Alamat Lengkap" />
                            <textarea
                                id="address"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm min-h-[100px]"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                            />
                            <InputError message={errors.address} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-stone-100">
                            <Link
                                href={route('admin.users.index')}
                                className="px-6 py-3 text-slate-600 font-semibold hover:bg-stone-100 rounded-xl transition-colors"
                            >
                                Batal
                            </Link>
                            <PrimaryButton className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2" disabled={processing}>
                                <Save size={18} /> {user ? 'Simpan Perubahan' : 'Buat Pengguna'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
