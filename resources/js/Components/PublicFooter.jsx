import { Link } from '@inertiajs/react';
import { Coffee, HeartPulse } from 'lucide-react';

export default function PublicFooter({ settings = {} }) {
    const getSetting = (key, defaultValue = '') => {
        return settings[key] || defaultValue;
    };

    return (
        <footer className="border-t border-stone-200 py-10 px-6 bg-slate-900">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-6 text-slate-400 text-sm">
                
                {/* Brand & Copyright */}
                <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between">
                    <div className="flex items-center gap-2 text-white">
                        {getSetting('primary_logo') ? (
                            <img src={getSetting('primary_logo')} alt="Logo" className="w-6 h-6 object-contain" />
                        ) : (
                            <Coffee size={20} className="text-emerald-500" />
                        )}
                        <span className="font-bold">{getSetting('site_name', '')}</span>
                    </div>

                    <p>{getSetting('footer_text', '© 2024 ')}</p>

                    <div className="flex items-center gap-1.5">
                        Dibuat dengan <HeartPulse size={15} className="text-rose-500 mx-1" /> untuk alam & Anda
                    </div>
                </div>

                {/* Additional Links */}
                <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mt-2">
                    <Link href={route('about')} className="hover:text-emerald-400 transition-colors">Tentang Kami</Link>
                    <span>&bull;</span>
                    <Link href={route('privacy')} className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link>
                    <span>&bull;</span>
                    <Link href={route('terms')} className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link>
                </div>
            </div>
        </footer>
    );
}
