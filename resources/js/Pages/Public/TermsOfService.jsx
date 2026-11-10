import { Head, Link } from '@inertiajs/react';
import PublicFooter from '@/Components/PublicFooter';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService({ cms_settings }) {
    return (
        <div className="min-h-screen bg-[#f5f2ec] font-sans text-slate-900 flex flex-col">
            <Head title="Syarat & Ketentuan" />

            <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
                <Link href={route('home')} className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:text-emerald-500 transition-colors">
                    <ArrowLeft size={20} /> Kembali ke Beranda
                </Link>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="bg-white rounded-[2rem] p-8 md:p-14 shadow-xl shadow-stone-200/50 border border-stone-200"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8">
                        Syarat & Ketentuan
                    </h1>

                    <div className="prose prose-lg prose-emerald max-w-none text-slate-600">
                        {cms_settings?.terms_of_service_content ? (
                            <div dangerouslySetInnerHTML={{ __html: cms_settings.terms_of_service_content }} />
                        ) : (
                            <>
                                <p className="lead text-xl text-slate-700 font-medium mb-8">
                                    Selamat datang di . Dengan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut ini. Harap baca dengan cermat.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Penggunaan Layanan</h3>
                                <p>
                                    Anda setuju untuk menggunakan layanan website  hanya untuk tujuan yang sah, 
                                    seperti melakukan reservasi fasilitas dan pemesanan makanan, serta tidak melanggar hak 
                                    atau membatasi penggunaan dan kenikmatan situs ini oleh pihak ketiga manapun.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Reservasi dan Pembayaran</h3>
                                <ul>
                                    <li>Semua reservasi fasilitas dan pemesanan makanan tunduk pada ketersediaan.</li>
                                    <li>Harga yang tercantum dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya, namun harga untuk reservasi yang sudah dikonfirmasi tidak akan berubah.</li>
                                    <li>Anda bertanggung jawab atas semua biaya yang timbul dari akun Anda.</li>
                                    <li>Pembatalan atau perubahan jadwal harus dilakukan sesuai dengan kebijakan pembatalan yang berlaku di .</li>
                                </ul>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Kebijakan Pembatalan</h3>
                                <p>
                                    Pembatalan reservasi yang dilakukan kurang dari 24 jam sebelum waktu kedatangan mungkin 
                                    dikenakan biaya pembatalan. Kami berhak membatalkan reservasi jika terjadi keadaan kahar 
                                    (force majeure) atau kondisi di luar kendali kami.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Kewajiban Pengguna</h3>
                                <p>
                                    Saat berkunjung ke , Anda setuju untuk menjaga ketertiban, kebersihan, dan 
                                    mematuhi semua peraturan yang berlaku di area fasilitas kami. Kerusakan yang disebabkan 
                                    oleh kelalaian pengunjung dapat dikenakan biaya ganti rugi.
                                </p>

                                <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Perubahan Syarat & Ketentuan</h3>
                                <p>
                                     berhak memperbarui atau mengubah Syarat dan Ketentuan ini sewaktu-waktu 
                                    tanpa pemberitahuan sebelumnya. Penggunaan Anda yang berkelanjutan atas situs web 
                                    ini setelah adanya perubahan merupakan penerimaan Anda terhadap perubahan tersebut.
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
