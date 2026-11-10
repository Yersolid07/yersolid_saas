import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Shield, Key, Trash2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;

    return (
        <AppLayout user={auth.user}>
            <Head title="Profile" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <User className="text-emerald-600" size={28} />
                                Profil Pengguna
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 font-medium">
                                Kelola informasi akun dan pengaturan keamanan Anda.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:rounded-2xl sm:p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <Shield className="text-emerald-500" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Informasi Profil</h3>
                                    <p className="text-sm text-slate-500">Perbarui nama dan email akun Anda.</p>
                                </div>
                            </div>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        <div className="bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:rounded-2xl sm:p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <Key className="text-orange-500" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Ubah Password</h3>
                                    <p className="text-sm text-slate-500">Pastikan akun Anda menggunakan password yang panjang dan acak untuk tetap aman.</p>
                                </div>
                            </div>
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>

                        <div className="bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:rounded-2xl sm:p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <Trash2 className="text-red-500" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold text-red-600">Hapus Akun</h3>
                                    <p className="text-sm text-slate-500">Setelah akun Anda dihapus, semua sumber daya dan data akan dihapus secara permanen.</p>
                                </div>
                            </div>
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
