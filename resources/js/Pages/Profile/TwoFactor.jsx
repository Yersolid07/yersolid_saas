import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { toast } from 'react-hot-toast';

export default function TwoFactor({ qr_image, secret, confirmed }) {
    const { data, setData, post, processing } = useForm({ code: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('two-factor.confirm'), {
            onSuccess: () => toast.success('2FA aktif!'),
            onError: () => toast.error('Kode tidak valid'),
        });
    };

    return (
        <AuthenticatedLayout header="Two-Factor Authentication">
            <Head title="Two-Factor Authentication" />
            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-stone-800 shadow sm:rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Keamanan Ekstra (2FA)</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Tambahkan lapisan keamanan dengan aplikasi authenticator (Google Authenticator / Authy).
                        </p>

                        {!confirmed && qr_image && (
                            <div className="mt-6">
                                <InputLabel value="Scan QR dengan aplikasi authenticator" />
                                <img src={qr_image} alt="2FA QR" className="mt-2 rounded-lg border p-2" />
                                <p className="mt-2 text-xs text-gray-500">Atau masukkan manual: <code className="font-mono">{secret}</code></p>

                                <form onSubmit={submit} className="mt-4 flex items-end gap-3">
                                    <div className="flex-1">
                                        <InputLabel htmlFor="code" value="Kode 6 digit" />
                                        <TextInput id="code" value={data.code} onChange={(e) => setData('code', e.target.value)}
                                            className="mt-1 block w-full" maxLength={6} placeholder="123456" />
                                    </div>
                                    <PrimaryButton disabled={processing}>Konfirmasi</PrimaryButton>
                                </form>
                            </div>
                        )}

                        {confirmed && (
                            <div className="mt-6">
                                <p className="text-green-600 font-medium">✅ 2FA sudah aktif.</p>
                                <form onSubmit={(e) => { e.preventDefault(); post(route('two-factor.disable')); }} className="mt-3">
                                    <PrimaryButton className="bg-red-600 hover:bg-red-700">Nonaktifkan 2FA</PrimaryButton>
                                </form>
                            </div>
                        )}

                        <div className="mt-4">
                            <Link href={route('profile.edit')} className="text-sm text-emerald-600 hover:underline">Kembali ke Profil</Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
