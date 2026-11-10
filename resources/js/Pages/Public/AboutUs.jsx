import { Head, Link } from '@inertiajs/react';
import PublicFooter from '@/Components/PublicFooter';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Coffee, Users, Phone } from 'lucide-react';

export default function AboutUs({ cms_settings }) {
    return (
        <div className="min-h-screen bg-[#f5f2ec] font-sans text-slate-900 flex flex-col">
            <Head title="Tentang Kami" />

            <main className="flex-1 max-w-5xl mx-auto px-6 py-20">
                <Link href={route('home')} className="inline-flex items-center gap-2 text-emerald-600 font-bold mb-8 hover:text-emerald-500 transition-colors">
                    <ArrowLeft size={20} /> Kembali ke Beranda
                </Link>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-stone-200/50 border border-stone-200"
                >
                    {/* Hero Section */}
                    <div className="relative h-64 md:h-96 bg-emerald-900 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/storage/facilities/placeholder.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-transparent to-transparent"></div>
                        <div className="relative z-10 text-center px-6">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4"></h1>
                            <p className="text-emerald-100 text-lg md:text-2xl font-medium max-w-2xl mx-auto">
                                Menghadirkan ketenangan alam dan kehangatan kebersamaan di setiap momen Anda.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-14">
                        {cms_settings?.about_us_content ? (
                            <div 
                                className="prose prose-lg prose-emerald max-w-none text-slate-600"
                                dangerouslySetInnerHTML={{ __html: cms_settings.about_us_content }}
                            />
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Kisah Kami</h2>
                                        <p className="text-slate-600 text-lg leading-relaxed mb-4">
                                            Berawal dari keinginan untuk menyediakan tempat pelarian dari hiruk-pikuk 
                                            kehidupan perkotaan,  didirikan sebagai destinasi agrowisata 
                                            dan retret keluarga yang menyatu dengan keindahan alam Sulawesi.
                                        </p>
                                        <p className="text-slate-600 text-lg leading-relaxed">
                                            Kami percaya bahwa setiap orang membutuhkan tempat untuk berhenti sejenak, 
                                            menghirup udara segar, menikmati hidangan lezat, dan menciptakan 
                                            kenangan indah bersama orang-orang tercinta.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 p-6 rounded-2xl flex flex-col items-center text-center">
                                            <MapPin size={32} className="text-emerald-600 mb-4" />
                                            <h3 className="font-bold text-slate-900 mb-2">Lokasi Strategis</h3>
                                            <p className="text-sm text-slate-600">Tersembunyi dalam pelukan alam namun mudah dijangkau.</p>
                                        </div>
                                        <div className="bg-amber-50 p-6 rounded-2xl flex flex-col items-center text-center">
                                            <Coffee size={32} className="text-amber-600 mb-4" />
                                            <h3 className="font-bold text-slate-900 mb-2">Kelezatan Kuliner</h3>
                                            <p className="text-sm text-slate-600">Menyajikan cita rasa otentik dari bahan-bahan segar lokal.</p>
                                        </div>
                                        <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center text-center">
                                            <Users size={32} className="text-blue-600 mb-4" />
                                            <h3 className="font-bold text-slate-900 mb-2">Kapasitas Besar</h3>
                                            <p className="text-sm text-slate-600">Fasilitas memadai untuk acara keluarga hingga gathering kantor.</p>
                                        </div>
                                        <div className="bg-rose-50 p-6 rounded-2xl flex flex-col items-center text-center">
                                            <Phone size={32} className="text-rose-600 mb-4" />
                                            <h3 className="font-bold text-slate-900 mb-2">Layanan Ramah</h3>
                                            <p className="text-sm text-slate-600">Tim kami selalu siap memberikan pelayanan sepenuh hati.</p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-stone-200 mb-16" />

                                <div className="text-center max-w-3xl mx-auto">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Misi Kami</h2>
                                    <p className="text-slate-600 text-xl italic leading-relaxed">
                                        "Menjadi destinasi pilihan utama untuk relaksasi, rekreasi, dan perayaan 
                                        dengan terus menjaga kelestarian alam dan memberdayakan komunitas lokal."
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </main>

            <PublicFooter settings={cms_settings} />
        </div>
    );
}
