import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { ChefHat, Check, Clock, Utensils, Package, AlertCircle, Maximize, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { parseServerDate } from '@/utils/dateUtils';

export default function Index({ activeOrders, awaitingOrders = [] }) {
    const [showRejectId, setShowRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    // Auto refresh every 30 seconds for KDS
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['activeOrders', 'awaitingOrders'], preserveScroll: true, preserveState: true });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = (id, status) => {
        router.patch(route('staff.food-orders.status', id), { status }, { preserveScroll: true });
    };

    const reloadAll = () => router.reload({ only: ['activeOrders', 'awaitingOrders'], preserveScroll: true, preserveState: true });

    const approveOrder = (id) => {
        router.post(route('staff.food-orders.approve', id), {}, { preserveScroll: true, onSuccess: reloadAll });
    };

    const rejectOrder = (id) => {
        setRejecting(true);
        router.post(route('staff.food-orders.reject', id), {
            reason: rejectReason || 'Ditolak kasir',
            refund: true,
        }, { preserveScroll: true, onSuccess: () => { setShowRejectId(null); setRejectReason(''); reloadAll(); }, onFinish: () => setRejecting(false) });
    };

    const updateItemStatus = (orderId, itemId, status) => {
        router.patch(route('staff.food-orders.items.status', { order: orderId, item: itemId }), { status }, { preserveScroll: true });
    };

    // Per-item status meta
    const itemStatusMeta = {
        pending:    { label: 'Masak',  next: 'preparing', color: 'bg-stone-200 text-stone-600 hover:bg-stone-300' },
        preparing:  { label: 'Siap',   next: 'ready',     color: 'bg-sky-100 text-sky-700 hover:bg-sky-200' },
        ready:      { label: 'Antar',  next: 'delivered', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
        delivered:  { label: '✓',      next: null,        color: 'bg-emerald-50 text-emerald-500' },
    };

    const pendingOrders = activeOrders.filter(o => o.status === 'pending');
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
    const readyOrders = activeOrders.filter(o => o.status === 'ready');
    const deliveredOrders = activeOrders.filter(o => o.status === 'delivered');

    const OrderCard = ({ order, currentStatus }) => (
        <div className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all ${
            currentStatus === 'pending' ? 'border-rose-200 shadow-rose-100' : 
            currentStatus === 'preparing' ? 'border-amber-200 shadow-amber-100' : 
            'border-emerald-200 shadow-emerald-100'
        }`}>
            <div className="flex justify-between items-start border-b border-stone-100 pb-3 mb-3">
                <div>
                    <h4 className="font-black text-slate-900 text-lg">Order #{order.id.substring(0,4).toUpperCase()}</h4>
                    <p className="text-sm font-semibold text-slate-500">{order.user?.name}</p>
                </div>
                <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-stone-100 text-stone-700 text-[10px] font-black uppercase rounded">
                        {parseServerDate(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{order.order_type.replace('_', ' ')}</p>
                    <div className="mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                            {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                        </span>
                    </div>
                </div>
            </div>

            {order.order_type === 'room_service' && order.reservation && (
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg mb-3 flex items-center gap-2">
                    <Package size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-800">
                        Kirim ke: {order.reservation.facility?.name} (Kode: {order.reservation.unique_code})
                    </span>
                </div>
            )}

            {order.order_type === 'dine_in' && order.table_number && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Pesanan Aktif</h2>
                            <p className="text-slate-500 text-sm">Kelola pesanan makanan dan minuman dari pelanggan</p>
                        </div>
                    </div>
                    
                    <a 
                        href={route('staff.kds')} 
                        target="_blank" 
                        className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <UtensilsCrossed size={18} />
                        Buka Mode KDS (Dapur)
                    </a>
                </div>
            )}

            <ul className="space-y-2 mb-4">
                {order.items?.map(item => {
                    const st = item.status || 'pending';
                    const meta = itemStatusMeta[st] || itemStatusMeta.pending;
                    return (
                        <li key={item.id} className={`flex gap-2 text-sm items-center rounded-lg p-1.5 ${st === 'delivered' ? 'bg-emerald-50' : 'bg-stone-50'}`}>
                            <span className="font-black text-slate-900 w-6">{item.quantity}x</span>
                            <span className={`font-semibold flex-1 ${st === 'delivered' ? 'text-emerald-600 line-through' : 'text-slate-700'}`}>{item.menu_item?.name || item.menuItem?.name}</span>
                            {meta.next ? (
                                <button
                                    onClick={() => updateItemStatus(order.id, item.id, meta.next)}
                                    className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase transition-colors ${meta.color}`}
                                >
                                    {meta.label}
                                </button>
                            ) : (
                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${meta.color}`}>✓</span>
                            )}
                        </li>
                    );
                })}
            </ul>

            {order.notes && (
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg mb-4 text-xs font-medium text-amber-800 flex gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{order.notes}</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-4 bg-stone-50 p-2 rounded-lg border border-stone-100">
                <span className="text-sm font-semibold text-slate-600">Total: <span className="text-emerald-700 font-bold">Rp {order.total_amount.toLocaleString('id-ID')}</span></span>
                {order.payment_status === 'unpaid' && (
                    <button
                        onClick={() => router.patch(route('staff.food-orders.status', order.id), { status: order.status, payment_status: 'paid' }, { preserveScroll: true })}
                        className="text-[10px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Validasi Bayar Kasir
                    </button>
                )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex gap-2">
                {currentStatus === 'pending' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                    >
                        <ChefHat size={16} /> Mulai Siapkan
                    </button>
                )}
                {currentStatus === 'preparing' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                    >
                        <Check size={16} /> Pesanan Selesai / Siap
                    </button>
                )}
                {currentStatus === 'ready' && (
                    <button 
                        onClick={() => updateStatus(order.id, 'delivered')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                    >
                        <Utensils size={16} /> Tandai Sudah Diantar
                    </button>
                )}
                {currentStatus === 'delivered' && (
                    <div className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold flex justify-center items-center gap-2">
                        <Check size={16} /> Pesanan Selesai (Diantar)
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout title="Kitchen Display System">
            <Head title="Kitchen Display" />

            <div className="max-w-[1600px] mx-auto space-y-4 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ChefHat className="text-orange-500" /> Kitchen Display System
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Auto-refresh aktif
                        </div>
                        <a 
                            href={route('staff.kds')} 
                            target="_blank" 
                            className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-stone-800 transition-colors"
                        >
                            <Maximize size={16} /> Buka KDS Fullscreen
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[calc(100vh-140px)]">

                    {/* Kolom 0: PERLU ACC KASIR — gerbang sebelum dapur */}
                    <div className="bg-orange-50 rounded-2xl border-2 border-orange-300 overflow-hidden flex flex-col">
                        <div className="bg-orange-500 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><AlertCircle size={18} /> Perlu ACC Kasir</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-sm">{awaitingOrders.length}</span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto space-y-3">
                            {awaitingOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-xl border border-orange-200 p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">#{order.id.substring(0,8).toUpperCase()}</p>
                                            <p className="text-xs text-slate-500">{order.user?.name || order.customer_name || 'Tamu'}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-0.5">
                                        {order.items?.map((it, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{it.quantity}x {it.menu_item?.name || it.menuItem?.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold text-slate-900">Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</p>

                                    {showRejectId === order.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Alasan tolak (opsional)"
                                                className="w-full text-xs border-stone-200 rounded-lg py-1.5"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => rejectOrder(order.id)} disabled={rejecting} className="flex-1 bg-rose-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50">
                                                    Konfirmasi Tolak
                                                </button>
                                                <button onClick={() => { setShowRejectId(null); setRejectReason(''); }} className="px-3 bg-stone-200 text-slate-700 text-xs font-bold rounded-lg">
                                                    Batal
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => approveOrder(order.id)} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
                                                <Check size={14} /> ACC
                                            </button>
                                            <button onClick={() => setShowRejectId(order.id)} className="flex-1 bg-rose-100 text-rose-700 text-xs font-bold py-2 rounded-lg hover:bg-rose-200">
                                                Tolak
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {awaitingOrders.length === 0 && (
                                <p className="text-center text-slate-400 mt-10 font-medium text-sm">Kosong</p>
                            )}
                        </div>
                    </div>

                    {/* Kolom 1: Antrean Baru */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-rose-500 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><Clock size={18} /> Antrean Baru</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-sm">{pendingOrders.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4">
                            {pendingOrders.map(order => <OrderCard key={order.id} order={order} currentStatus="pending" />)}
                            {pendingOrders.length === 0 && (
                                <p className="text-center text-slate-400 mt-10 font-medium">Kosong</p>
                            )}
                        </div>
                    </div>

                    {/* Kolom 2: Sedang Dimasak */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-amber-500 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><ChefHat size={18} /> Sedang Disiapkan</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-sm">{preparingOrders.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4">
                            {preparingOrders.map(order => <OrderCard key={order.id} order={order} currentStatus="preparing" />)}
                            {preparingOrders.length === 0 && (
                                <p className="text-center text-slate-400 mt-10 font-medium">Kosong</p>
                            )}
                        </div>
                    </div>

                    {/* Kolom 3: Siap Antar */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-emerald-500 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><Check size={18} /> Siap Antar / Ambil</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-sm">{readyOrders.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4">
                            {readyOrders.map(order => <OrderCard key={order.id} order={order} currentStatus="ready" />)}
                            {readyOrders.length === 0 && (
                                <p className="text-center text-slate-400 mt-10 font-medium">Kosong</p>
                            )}
                        </div>
                    </div>

                    {/* Kolom 4: Selesai / Sudah Diantar */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-700 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><Check size={18} /> Selesai</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-sm">{deliveredOrders.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-4">
                            {deliveredOrders.map(order => <OrderCard key={order.id} order={order} currentStatus="delivered" />)}
                            {deliveredOrders.length === 0 && (
                                <p className="text-center text-slate-400 mt-10 font-medium">Kosong</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
