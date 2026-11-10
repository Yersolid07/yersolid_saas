import { Head, Link } from '@inertiajs/react';
import PublicFooter from '@/Components/PublicFooter';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ cms_settings }) {
    return (
        <div className="min-h-screen bg-[#f5f2ec] font-sans text-slate-900 flex flex-col">
            <Head title="Kebijakan Privasi" />

            <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
                <Link href={route('home')} className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:text-emerald-500 transition-colors">
                    <ArrowLeft size={20} /> Kembali ke Beranda
                </Link>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="bg-white rounded-[2rem] p-8 md:p-14 shadow-xl shadow-stone-200/50 border border-stone-200"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
                        Kebijakan Privasi
                    </h1>

                    <div className="prose prose-lg prose-emerald max-w-none text-slate-600">
                        {cms_settings?.privacy_policy_content ? (
                            <div dangerouslySetInnerHTML={{ __html: cms_settings.privacy_policy_content }} />
                        ) : (
                            <>
                                <p className="lead text-xl text-slate-700 font-medium mb-8">
                                    Privasi Anda adalah prioritas kami. Kami berkomitmen untuk melindungi informasi pribadi yang Anda bagikan saat melakukan reservasi atau memesan makanan di .
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Informasi yang Kami Kumpulkan</h3>
                                <p>Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat Anda:</p>
                                <ul>
                                    <li>Membuat akun di website kami.</li>
                                    <li>Melakukan reservasi fasilitas atau memesan makanan.</li>
                                    <li>Berkomunikasi dengan tim dukungan pelanggan kami.</li>
                                </ul>
                                <p>Informasi tersebut mungkin termasuk nama, alamat email, nomor telepon, dan preferensi pesanan Anda.</p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Bagaimana Kami Menggunakan Informasi Anda</h3>
                                <p>Kami menggunakan informasi yang dikumpulkan untuk:</p>
                                <ul>
                                    <li>Memproses dan mengelola reservasi dan pesanan Anda.</li>
                                    <li>Mengirimkan konfirmasi, pembaruan, dan notifikasi terkait layanan.</li>
                                    <li>Meningkatkan kualitas layanan dan pengalaman pengguna di .</li>
                                    <li>Menghubungi Anda untuk tujuan layanan pelanggan.</li>
                                </ul>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Perlindungan Data</h3>
                                <p>
                                    Kami mengimplementasikan berbagai langkah keamanan untuk menjaga keselamatan informasi pribadi Anda. 
                                    Data Anda disimpan di balik jaringan yang aman dan hanya dapat diakses oleh sejumlah terbatas staf 
                                    yang memiliki hak akses khusus ke sistem tersebut, dan diwajibkan untuk menjaga kerahasiaan informasi tersebut.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Berbagi Informasi Pihak Ketiga</h3>
                                <p>
                                    Kami tidak menjual, memperdagangkan, atau menyewakan informasi identifikasi pribadi Anda kepada pihak lain. 
                                    Kami mungkin membagikan informasi demografis gabungan generik yang tidak terkait dengan informasi 
                                    identifikasi pribadi apapun kepada mitra bisnis terpercaya kami untuk tujuan yang diuraikan di atas.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Persetujuan Anda</h3>
                                <p>
                                    Dengan menggunakan situs kami, Anda menyetujui kebijakan privasi website kami. Jika kami memutuskan untuk 
                                    mengubah kebijakan privasi kami, kami akan memposting perubahan tersebut di halaman ini.
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </main>

            <PublicFooter settings={cms_settings} />
        </div>
    );
}
