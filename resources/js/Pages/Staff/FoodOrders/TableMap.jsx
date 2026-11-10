import { useState, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { LayoutGrid, CheckCircle2, XCircle, Users, ArrowLeft, RefreshCw } from 'lucide-react';

export default function TableMap({ tables = [], onBack }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const clock = setInterval(() => setCurrentTime(new Date()), 1000);
        const poller = setInterval(() => {
            router.reload({ only: ['tables'], preserveScroll: true, preserveState: true });
        }, 15000);
        return () => { clearInterval(clock); clearInterval(poller); };
    }, []);

    const occupied = tables.filter(t => t.status === 'occupied').length;
    const available = tables.length - occupied;

    return (
        <div className="min-h-screen bg-stone-950 font-sans text-stone-200 flex flex-col">
            <Head title="Table Map" />
            <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="w-12 h-12 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center transition-colors text-stone-400 hover:text-white"
                            title="Kembali ke Pesanan"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                    <Link href={route('staff.kds')} className="w-12 h-12 bg-stone-800 hover:bg-stone-700 rounded-full flex items-center justify-center transition-colors text-stone-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    )}
                    <div className="flex items-center gap-3 text-emerald-500">
                        <LayoutGrid size={36} />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest text-white leading-none">PETA MEJA</h1>
                            <p className="text-emerald-500/70 font-bold text-xs tracking-widest">REAL-TIME TABLE STATUS</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-black text-emerald-500 leading-none">{available}</div>
                            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Kosong</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-rose-500 leading-none">{occupied}</div>
                            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Terisi</div>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-stone-700"></div>
                    <div className="text-4xl font-black font-mono text-stone-200 tracking-tighter">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                    // Group tables by gazebo (identity). Tables without a gazebo go to "Lainnya".
                    const grouped = {};
                    tables.forEach((t) => {
                        const key = t.gazebo_name || 'Lainnya';
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(t);
                    });
                    const gazeboNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
                    return gazeboNames.map((gName) => (
                        <div key={gName} className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-1.5 rounded-full bg-emerald-500"></div>
                                <h2 className="text-2xl font-black text-white tracking-wide uppercase">{gName}</h2>
                                <span className="text-sm font-bold text-stone-500">
                                    {grouped[gName].filter(t => t.status === 'occupied').length}/{grouped[gName].length} terisi
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {grouped[gName].map((table) => {
                                    const isOccupied = table.status === 'occupied';
                                    return (
                                        <div
                                            key={table.id}
                                            className={`relative rounded-2xl p-4 border-2 transition-all ${
                                                isOccupied
                                                    ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-900/20'
                                                    : 'bg-emerald-950/30 border-emerald-700/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className={`text-2xl font-black ${isOccupied ? 'text-rose-300' : 'text-emerald-300'}`}>
                                                        {table.table_number}
                                                    </div>
                                                    <div className="text-[11px] text-stone-500 mt-0.5 max-w-[120px] truncate">
                                                        {table.label}
                                                    </div>
                                                </div>
                                                {isOccupied
                                                    ? <XCircle size={22} className="text-rose-400" />
                                                    : <CheckCircle2 size={22} className="text-emerald-400" />}
                                            </div>

                                            <div className={`mt-3 text-xs font-bold uppercase tracking-wider ${
                                                isOccupied ? 'text-rose-400' : 'text-emerald-400'
                                            }`}>
                                                {isOccupied ? 'TERISI' : 'KOSONG'}
                                            </div>

                                            {isOccupied && table.order && (
                                                <div className="mt-3 pt-3 border-t border-stone-800 space-y-1">
                                                    <div className="flex items-center gap-1.5 text-stone-300 text-xs">
                                                        <Users size={13} /> {table.order.customer || 'Guest'}
                                                    </div>
                                                    <div className="text-stone-400 text-[11px]">
                                                        {table.order.items_count} item · Rp {(table.order.total || 0).toLocaleString('id-ID')}
                                                    </div>
                                                    <div className="text-[10px] text-stone-500 uppercase">
                                                        status: {table.order.status}
                                                    </div>
                                                    <Link
                                                        href={route('staff.kds')}
                                                        className="inline-block mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                                                    >
                                                        Lihat di KDS →
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
}
