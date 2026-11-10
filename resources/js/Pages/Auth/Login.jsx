import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Leaf } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPw, setShowPw] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout
            title="Selamat Datang Kembali"
            subtitle="Masuk untuk menikmati semua layanan premium ."
        >
            <Head title="Masuk" />

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium"
                >
                    <Leaf size={16} className="shrink-0" />
                    {status}
                </motion.div>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="username"
                            autoFocus
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="nama@email.com"
                            className={`w-full pl-11 pr-4 py-3.5 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm transition-all outline-none focus:ring-4 ${
                                errors.email
                                    ? 'border-red-400 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                            }`}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2 text-xs" />
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                            Password
                        </label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                                Lupa password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            id="password"
                            type={showPw ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="Masukkan password"
                            className={`w-full pl-11 pr-12 py-3.5 bg-white border rounded-2xl text-slate-900 placeholder-slate-400 text-sm transition-all outline-none focus:ring-4 ${
                                errors.password
                                    ? 'border-red-400 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2 text-xs" />
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Ingat saya</span>
                </label>

                {/* Submit */}
                <motion.button
                    type="submit"
                    disabled={processing}
                    whileHover={{ scale: processing ? 1 : 1.01 }}
                    whileTap={{ scale: processing ? 1 : 0.99 }}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${
                        processing
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40'
                    }`}
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Memproses...
                        </>
                    ) : (
                        <>Masuk <ArrowRight size={20} /></>
                    )}
                </motion.button>
                
                {/* Divider for Social Login */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Atau</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Google Login Button */}
                <a
                    href={route('auth.google')}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-base transition-all shadow-sm"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                    </svg>
                    Lanjutkan dengan Google
                </a>
            </form>

            {/* Register link */}
            <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                    Belum punya akun?{' '}
                    <Link href={route('register')} className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Daftar gratis →
                    </Link>
                </p>
            </div>


        </GuestLayout>
    );
}
