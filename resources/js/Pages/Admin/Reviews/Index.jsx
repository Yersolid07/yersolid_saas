import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Star, MessageSquare, Eye, EyeOff, Trash2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ reviews, filters, stats }) {
    const [rating, setRating] = useState(filters.rating || '');
    const [visibility, setVisibility] = useState(filters.visibility || '');

    const handleFilter = debounce((ratingValue, visibilityValue) => {
        router.get(
            route('admin.reviews.index'),
            { rating: ratingValue, visibility: visibilityValue },
            { preserveState: true, replace: true }
        );
    }, 300);

    const toggleVisibility = (id) => {
        router.patch(route('admin.reviews.toggle', id), {}, { preserveScroll: true });
    };

    const deleteReview = async (id) => {
        if (await window.customConfirm('Apakah Anda yakin ingin menghapus ulasan ini secara permanen?')) {
            router.delete(route('admin.reviews.destroy', id), { preserveScroll: true });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <AppLayout title="Manajemen Ulasan">
            <Head title="Manajemen Ulasan" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="text-emerald-500" /> Ulasan Pelanggan
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Star size={28} className="fill-amber-500" />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Rating Rata-rata</p>
                            <p className="text-3xl font-black text-slate-900">{parseFloat(stats.avg_rating || 0).toFixed(1)} / 5.0</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Total Ulasan</p>
                            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Eye size={28} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-semibold text-sm">Ulasan Publik</p>
                            <p className="text-3xl font-black text-slate-900">{stats.public}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={rating}
                            onChange={(e) => {
                                setRating(e.target.value);
                                handleFilter(e.target.value, visibility);
                            }}
                        >
                            <option value="">Semua Rating</option>
                            <option value="5">Bintang 5</option>
                            <option value="4">Bintang 4</option>
                            <option value="3">Bintang 3</option>
                            <option value="2">Bintang 2</option>
                            <option value="1">Bintang 1</option>
                        </select>
                        <select
                            className="bg-stone-50 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl md:w-48"
                            value={visibility}
                            onChange={(e) => {
                                setVisibility(e.target.value);
                                handleFilter(rating, e.target.value);
                            }}
                        >
                            <option value="">Semua Visibilitas</option>
                            <option value="public">Publik</option>
                            <option value="hidden">Disembunyikan</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.data.map((review) => (
                            <div key={review.id} className={`bg-white rounded-3xl border overflow-hidden shadow-sm flex flex-col transition-all ${
                                !review.is_public ? 'border-rose-200 bg-rose-50/30' : 'border-stone-100 hover:shadow-md'
                            }`}>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-slate-900">{review.user?.name}</p>
                                            <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                                        </div>
                                        <div className="flex bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 items-center gap-1">
                                            <Star size={16} className="fill-amber-500 text-amber-500" />
                                            <span className="font-black text-amber-600">{review.rating}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-700 mb-4 flex-1 text-sm italic relative z-10">
                                        <span className="text-4xl text-stone-200 absolute -top-4 -left-2 -z-10 font-serif">"</span>
                                        {review.comment || 'Tidak ada komentar text.'}
                                        <span className="text-4xl text-stone-200 absolute -bottom-8 -right-2 -z-10 font-serif">"</span>
                                    </p>
                                    
                                    <div className="mt-4 pt-4 border-t border-stone-100/50 flex flex-col gap-1 text-xs text-slate-500">
                                        {review.reservation_id && (
                                            <p><span className="font-semibold text-slate-600">Fasilitas:</span> {review.reservation?.facility?.name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {review.is_public ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                                                <Eye size={14} /> Publik
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold uppercase tracking-wider">
                                                <EyeOff size={14} /> Sembunyi
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleVisibility(review.id)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                review.is_public 
                                                    ? 'text-amber-600 hover:bg-amber-100' 
                                                    : 'text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                            title={review.is_public ? 'Sembunyikan' : 'Tampilkan Publik'}
                                        >
                                            {review.is_public ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            onClick={() => deleteReview(review.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                            title="Hapus Permanen"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {reviews.data.length === 0 && (
                        <div className="py-12 text-center bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                            <MessageSquare size={48} className="mx-auto text-stone-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Ulasan</h3>
                            <p className="text-slate-500">Tidak ada ulasan yang sesuai dengan filter saat ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

