import { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Clock, LogIn, LogOut, Home, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function FacilityDisplay({ active = [], checkIns = [], checkOuts = [], ticketVisitorsToday = 0 }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time clock
    useEffect(() => {
        const clock = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clock);
    }, []);

    // Auto-refresh every 15s (real-time board)
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['active', 'checkIns', 'checkOuts'], preserveScroll: true, preserveState: true });
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const fmtTime = (t) => (t ? String(t).slice(0, 5) : '-');
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-');

    const updateStatus = (id, status) => {
        router.patch(route('staff.reservations.status', id), { status }, { preserveScroll: true });
    };

    const typeLabel = (type) =>
        ({ gazebo: 'Gazebo', homestay: 'Homestay', ticket: 'Tiket', pool: 'Kolam' }[type] || type);

    const statusBadge = (status) => {
        const map = {
            pending: { txt: 'MENUNGGU', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
            confirmed: { txt: 'KONFIRMASI', cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
            checked_in: { txt: 'SEDANG SEWA', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
            completed: { txt: 'SELESAI', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
        };
        const s = map[status] || map.pending;
        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.txt}</span>;
    };

    const FacilityCard = ({ r, context }) => {
        const fac = r.facility || {};
        const isActive = context === 'active';
        return (
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 mb-3 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="text-white font-bold text-base leading-tight">{fac.name || 'Fasilitas'}</h3>
                        <span className="text-[11px] text-neutral-400">{typeLabel(fac.type)}</span>
                    </div>
                    {statusBadge(r.status)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <User size={13} /> <span className="truncate">{r.customer_name || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                        <Calendar size={13} /> <span>{r.guest_count || 1} org</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-300">
                        <LogIn size={13} /> <span>IN {fmtDate(r.check_in_date)} {fmtTime(r.check_in_time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-300">
                        <LogOut size={13} /> <span>OUT {fmtDate(r.check_out_date)} {fmtTime(r.check_out_time)}</span>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    {context === 'checkIns' && r.status !== 'checked_in' && (
                        <button
                            onClick={() => updateStatus(r.id, 'checked_in')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <CheckCircle size={14} /> CHECK-IN
                        </button>
                    )}
                    {isActive && (
                        <button
                            onClick={() => updateStatus(r.id, 'completed')}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <LogOut size={14} /> CHECK-OUT
                        </button>
                    )}
                    {context === 'checkOuts' && r.status === 'checked_in' && (
                        <button
                            onClick={() => updateStatus(r.id, 'completed')}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <LogOut size={14} /> CHECK-OUT
                        </button>
                    )}
                    {r.payment_status === 'unpaid' && (
                        <span className="text-[10px] text-yellow-400 font-medium flex items-center gap-1">
                            <AlertCircle size={12} /> BELUM BAYAR
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const Column = ({ title, icon, accent, items, context, empty }) => (
        <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${accent}`}>
                {icon}
                <h2 className="text-white font-bold text-sm">{title}</h2>
                <span className="ml-auto bg-black/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="bg-neutral-900/60 rounded-b-xl p-3 h-[calc(100vh-180px)] overflow-y-auto">
                {items.length === 0 ? (
                    <p className="text-neutral-500 text-xs text-center mt-8">{empty}</p>
                ) : (
                    items.map((r) => <FacilityCard key={r.id} r={r} context={context} />)
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <Head title="Facility Display System" />
            <header className="flex items-center gap-3 px-5 py-3 bg-neutral-900 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <Home className="text-emerald-400" size={22} />
                    <span className="text-white font-black text-lg">FACILITY DISPLAY</span>
                    <span className="text-[10px] text-emerald-400 tracking-widest">DISPLAY SYSTEM</span>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                    <User size={14} className="text-amber-400" />
                    <span className="text-amber-300 text-xs font-semibold">Pengunjung Tiket Hari Ini: {ticketVisitorsToday} org</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> REAL-TIME
                    </span>
                    <span className="text-white font-mono text-xl">
                        {currentTime.toLocaleTimeString('id-ID')}
                    </span>
                </div>
            </header>

            <div className="flex gap-3 p-3">
                <Column
                    title="SEDANG DISEWA"
                    icon={<Clock className="text-emerald-400" size={16} />}
                    accent="bg-emerald-600/30 border-b-2 border-emerald-500"
                    items={active}
                    context="active"
                    empty="Tidak ada fasilitas disewa"
                />
                <Column
                    title="CHECK-IN HARI INI"
                    icon={<LogIn className="text-sky-400" size={16} />}
                    accent="bg-sky-600/30 border-b-2 border-sky-500"
                    items={checkIns}
                    context="checkIns"
                    empty="Tidak ada check-in"
                />
                <Column
                    title="CHECK-OUT HARI INI"
                    icon={<LogOut className="text-rose-400" size={16} />}
                    accent="bg-rose-600/30 border-b-2 border-rose-500"
                    items={checkOuts}
                    context="checkOuts"
                    empty="Tidak ada check-out"
                />
            </div>
        </div>
    );
}
