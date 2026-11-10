import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Leaf, Coffee } from 'lucide-react';
import ToastListener from '@/Components/ToastListener';

// Shared full-screen auth layout with nature photography split
export default function GuestLayout({ children, title, subtitle }) {
    const { cms_settings } = usePage().props;

    const defaultPhoto = '/storage/facilities/placeholder.jpg';
    const photo = cms_settings?.auth_image || defaultPhoto;
    
    const logoUrl = cms_settings?.primary_logo || '/images/logo.png';
    const siteName = cms_settings?.site_name || '';

    return (
        <div 
            className="h-screen overflow-hidden flex font-sans bg-cover bg-center relative"
            style={{ backgroundImage: `url(${photo})` }}
        >
            <ToastListener />
            <a href="#auth-card" className="wk-skip-link">Lewati ke form login</a>
            <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm" />
            <div className="absolute inset-0 wk-aurora pointer-events-none" />
            
            {/* ── LEFT: Info Panel ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link href={route('home')} className="flex items-center gap-3 group">
                        {logoUrl ? (
                            <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5 shadow-lg">
                                <img src={logoUrl} alt={siteName} className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                                <Coffee size={20} className="text-white" />
                            </div>
                        )}
                        <span className="text-white text-xl font-bold tracking-tight">{siteName}</span>
                    </Link>

                    {/* Bottom Quote */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Leaf size={16} className="text-emerald-300" />
                            <span className="text-emerald-300 text-sm font-semibold uppercase tracking-widest">Retreat & Wisata Alam</span>
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                            Kolam Retret &<br />
                            <span className="text-emerald-300">Harmoni Alam</span><br />
                            Menanti Anda.
                        </h2>
                        <p className="text-white/70 text-base leading-relaxed max-w-md">
                            Rasakan ketenangan yang sesungguhnya di tengah alam hijau . Kolam renang alami, gazebo mewah, dan kuliner istimewa menanti.
                        </p>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-4 mt-8">
                            {['★ 5.0 Rating', '500+ Tamu Puas', '100% Aman & Nyaman'].map((badge) => (
                                <div key={badge} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-sm font-medium">
                                    {badge}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 py-6 lg:px-12 xl:px-16 overflow-y-auto z-10">
                <div id="auth-card" className="w-full max-w-md glass-strong p-6 lg:p-8 rounded-3xl reveal">
                {/* Mobile Logo */}
                <Link href={route('home')} className="flex items-center gap-2 mb-10 lg:hidden">
                    {logoUrl ? (
                        <div className="w-10 h-10">
                            <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <Coffee size={24} className="text-emerald-600" />
                    )}
                    <span className="text-2xl font-bold text-slate-900">{siteName}</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md"
                >
                    {(title || subtitle) && (
                        <div className="mb-8">
                            {title && <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{title}</h1>}
                            {subtitle && <p className="text-slate-500">{subtitle}</p>}
                        </div>
                    )}
                    {children}
                </motion.div>

                <p className="mt-8 text-xs text-white/70 text-center max-w-sm">
                    Dengan masuk, Anda menyetujui{' '}
                    <a href="#" className="text-white font-bold hover:underline">Syarat & Ketentuan</a>
                    {' '}dan{' '}
                    <a href="#" className="text-white font-bold hover:underline">Kebijakan Privasi</a> .
                </p>
                </div>
            </div>
        </div>
    );
}
