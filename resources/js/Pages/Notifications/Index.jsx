import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, Clock } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ notifications }) {
    const markAsRead = (id) => {
        router.post(route('notifications.read', id), {}, { preserveScroll: true, preserveState: true });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AppLayout title="Semua Notifikasi">
            <Head title="Notifikasi" />

            <div className="max-w-3xl mx-auto mt-6">
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Bell className="text-emerald-500" /> Histori Notifikasi
                        </h2>
                        <Link 
                            href={route('notifications.read-all')} 
                            method="post" 
                            as="button"
                            className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors"
                        >
                            Tandai Semua Dibaca
                        </Link>
                    </div>

                    <div className="divide-y divide-stone-100">
                        {notifications.data.map(notif => (
                            <div key={notif.id} className={`p-6 flex gap-4 transition-colors ${notif.read_at ? 'bg-white' : 'bg-emerald-50/50'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notif.read_at ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-slate-900 text-base">{notif.data.title}</h3>
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                            <Clock size={12} /> {formatDate(notif.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3 leading-relaxed">{notif.data.message}</p>
                                    
                                    <div className="flex items-center gap-3">
                                        <Link 
                                            href={notif.data.url} 
                                            className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (!notif.read_at) markAsRead(notif.id);
                                                router.visit(notif.data.url);
                                            }}
                                        >
                                            Lihat Detail
                                        </Link>
                                        {!notif.read_at && (
                                            <button 
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
                                            >
                                                <Check size={14} /> Tandai Dibaca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {notifications.data.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium text-lg text-slate-600">Belum ada notifikasi.</p>
                                <p className="text-sm">Semua pemberitahuan akan muncul di sini.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

