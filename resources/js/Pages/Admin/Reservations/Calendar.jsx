import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function Calendar({ reservations, month, year }) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    const changeMonth = (delta) => {
        let newMonth = parseInt(month) + delta;
        let newYear = parseInt(year);
        
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        
        router.get(route('admin.reservations.calendar'), { month: newMonth, year: newYear }, { preserveState: true });
    };

    const monthName = new Date(year, month - 1, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    // Build calendar grid
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getReservationsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return reservations.filter(r => r.check_in_date.startsWith(dateStr));
    };

    return (
        <AppLayout title="Kalender Reservasi">
            <Head title="Kalender Reservasi" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.reservations.index')} className="p-2 hover:bg-white rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="text-emerald-500" /> Kalender Reservasi
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-stone-100">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-100 rounded-lg">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold min-w-[150px] text-center">{monthName}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-100 rounded-lg">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-6 shadow-sm overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-7 gap-4 mb-4 text-center font-bold text-slate-500">
                            <div>Minggu</div>
                            <div>Senin</div>
                            <div>Selasa</div>
                            <div>Rabu</div>
                            <div>Kamis</div>
                            <div>Jumat</div>
                            <div>Sabtu</div>
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            {days.map((day, idx) => {
                                const dayReservations = getReservationsForDay(day);
                                return (
                                    <div key={idx} className={`min-h-[120px] p-2 rounded-xl border ${day ? 'border-stone-200 bg-white' : 'bg-stone-50 border-transparent'}`}>
                                        {day && (
                                            <>
                                                <span className="text-sm font-bold text-slate-400 mb-2 block">{day}</span>
                                                <div className="space-y-1">
                                                    {dayReservations.map(res => (
                                                        <Link 
                                                            key={res.id} 
                                                            href={route('admin.reservations.show', res.id)}
                                                            className={`block p-1.5 text-xs rounded truncate ${
                                                                res.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 
                                                                res.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                                'bg-amber-100 text-amber-700'
                                                            }`}
                                                            title={`${res.user?.name} - ${res.facility?.name}`}
                                                        >
                                                            <span className="font-bold">{res.user?.name?.split(' ')[0]}</span>
                                                            <span className="block opacity-75">{res.facility?.name}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
