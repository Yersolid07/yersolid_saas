import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Ticket, Search, Plus, Minus, Users, Banknote, Calendar, Smartphone, CreditCard, Receipt, Loader2, ArrowLeft, X, ShoppingCart, QrCode, ChevronDown } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { useConfirm } from '@/Contexts/ConfirmContext';
import AppLayout from '@/Layouts/AppLayout';
import { connectAndPrint, buildReceiptBuffer } from '@/utils/printer';

export default function TicketsIndex({ tickets, activeReservations, user }) {
    const confirm = useConfirm();
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    
    // Facility Detail Modal State
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [detailQuantity, setDetailQuantity] = useState(1);
    
    // POS Order State
    const [guestName, setGuestName] = useState('Walk-in Customer');
    
    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentQR, setPaymentQR] = useState(null);
    const [paymentId, setPaymentId] = useState(null);
    const [printUrl, setPrintUrl] = useState(null);
    const [autoPrint, setAutoPrint] = useState(true);
    const [showTodayTickets, setShowTodayTickets] = useState(true);

    // Date/Time State for non-ticket facilities
    const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split('T')[0]);
    const [checkInTime, setCheckInTime] = useState('14:00');
    const [checkOutTime, setCheckOutTime] = useState('12:00');

    // Filter Items
    const filteredTickets = tickets.filter(ticket => 
        ticket.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectFacility = (ticket) => {
        setSelectedFacility(ticket);
        setDetailQuantity(1);
        setCheckInDate(new Date().toISOString().split('T')[0]);
        setCheckOutDate(new Date().toISOString().split('T')[0]);
        setCheckInTime('14:00');
        setCheckOutTime('12:00');
    };

    const addToCart = () => {
        setCart([{ ...selectedFacility, quantity: detailQuantity }]);
        setSelectedFacility(null);
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const ticketFacility = tickets.find(t => ['ticket', 'tiket'].includes(t.type?.toLowerCase()));
    const ticketPrice = ticketFacility ? parseFloat(ticketFacility.final_price || ticketFacility.price || ticketFacility.price_per_day || 10000) : 10000;

    const totalAmount = cart.reduce((sum, item) => {
        const itemPrice = parseFloat(item.final_price || item.price || item.price_per_day || 0);
        if (['ticket', 'tiket'].includes(item.type?.toLowerCase())) {
            return sum + (itemPrice * item.quantity);
        } else {
            return sum + itemPrice;
        }
    }, 0);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');

    const handleCheckout = (e) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Pilih tiket terlebih dahulu.');
            return;
        }

        if (paymentMethod === 'cash') {
            const paid = parseFloat(amountPaid.replace(/\D/g, '')) || 0;
            if (paid < totalAmount) {
                alert('Jumlah bayar kurang dari total tagihan!');
                return;
            }
        }

        setIsProcessing(true);

        // Since we only process one facility per reservation currently in the schema, 
        // we'll send the first item. If multiple tickets are selected, we might need a different approach.
        // For simplicity, let's assume they buy one type of ticket at a time for a group.
        
        if (cart.length > 1) {
            alert('Sistem saat ini hanya mendukung pembelian 1 jenis fasilitas/tiket per transaksi.');
            setIsProcessing(false);
            return;
        }

        const isTicket = ['ticket', 'tiket'].includes(cart[0].type?.toLowerCase());

        const payload = {
            facility_id: cart[0].id,
            quantity: cart[0].quantity,
            customer_name: guestName,
            payment_method: paymentMethod,
        };

        if (!isTicket) {
            payload.check_in_date = checkInDate;
            payload.check_out_date = checkOutDate;
            payload.check_in_time = checkInTime;
            payload.check_out_time = checkOutTime;
        }

        router.post(route('staff.tickets.store'), payload, {
            onSuccess: (page) => {
                setIsProcessing(false);
                setShowPaymentModal(false);
                setCart([]);
                setGuestName('Walk-in Customer');
                setAmountPaid('');
                // reset dates
                setCheckInDate(new Date().toISOString().split('T')[0]);
                setCheckOutDate(new Date().toISOString().split('T')[0]);
                setCheckInTime('14:00');
                setCheckOutTime('12:00');
                
                if (page.props.flash.qr_url && page.props.flash.payment_id) {
                    setPaymentQR(page.props.flash.qr_url);
                    setPaymentId(page.props.flash.payment_id);
                    // Store the order details to print later
                    if (page.props.flash.order_details) {
                        setPrintUrl(page.props.flash.order_details);
                    }
                } else if (page.props.flash.print_ticket_id && page.props.flash.order_details) {
                    if (autoPrint) {
                        handlePrintReceipt(page.props.flash.order_details);
                    }
                }
            },
            onError: (errors) => {
                setIsProcessing(false);
                alert(Object.values(errors).join('\n'));
            }
        });
    };

    // Polling Payment Status for QRIS
    useEffect(() => {
        let interval;
        if (paymentId && paymentQR) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/staff/payments/${paymentId}/status`);
                    const data = await res.json();
                    
                    if (data.status === 'success') {
                        clearInterval(interval);
                        setPaymentQR(null);
                        setPaymentId(null);
                        
                        // Cek order details
                        if (printUrl) {
                            if (autoPrint) {
                                handlePrintReceipt(printUrl);
                            }
                            setPrintUrl(null);
                        }

                        // Reload activeReservations to update list
                        router.reload({ only: ['activeReservations'] });
                    }
                } catch (e) {
                    // Ignore errors during polling
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentId, paymentQR, printUrl]);

    const handlePrintReceipt = async (order) => {
        try {
            // Build simple order object for receipt
            const printOrder = {
                ...order,
                customerName: order.user?.name || order.customer_name || 'Walk-in Ticket',
                paymentStatus: order.payment_status || order.status || 'paid',
            };
            
            // Format items
            const printItems = [{
                name: order.facility?.name || 'Tiket',
                quantity: order.guest_count || 1,
                price: parseFloat(order.payment?.amount || 0) / (order.guest_count || 1)
            }];
            
            const total = parseFloat(order.payment?.amount || 0);

            const buffer = buildReceiptBuffer(printOrder, printItems, total);
            const result = await connectAndPrint(buffer);

            if (!result.success) {
                alert('Gagal print bluetooth: ' + result.error);
            }
        } catch (error) {
            console.error('Print Error:', error);
            alert('Gagal print bluetooth');
        }
    };

    return (
        <AppLayout title="Penjualan Tiket">
            <Head title="Kasir Tiket" />
            <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-stone-50 lg:overflow-hidden relative">
                
                {/* Main Content (Tickets) */}
                <div className="flex-1 flex flex-col h-full lg:overflow-hidden relative pb-24 lg:pb-0">
                    {/* Header */}
                    <div className="bg-white border-b border-stone-200 p-4 lg:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="bg-sky-100 p-3 rounded-2xl">
                                <Ticket className="text-sky-600" size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl lg:text-2xl font-black text-slate-800">Tiket & Fasilitas</h1>
                                <p className="text-slate-500 text-sm">Pilih tiket untuk pelanggan walk-in</p>
                            </div>
                        </div>

                        <div className="w-full sm:w-80 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <TextInput
                                    type="text"
                                    placeholder="Cari tiket..."
                                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border-stone-200 focus:border-sky-500 rounded-xl"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {filteredTickets.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                                {filteredTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleSelectFacility(ticket)}
                                        className="group bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                                    >
                                        <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                                            {ticket.image_url ? (
                                                <img src={`/storage/${ticket.image_url}`} alt={ticket.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                                    <Ticket size={48} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-2 flex-1">{ticket.name}</h3>
                                            <p className="font-black text-sky-600 text-lg">Rp {formatPrice(ticket.final_price || ticket.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Ticket size={64} className="mb-4 opacity-20" />
                                <p className="text-lg">Tidak ada tiket ditemukan.</p>
                            </div>
                        )}
                    </div>

                    {/* Active Reservations / Tickets List */}
                    <div className="mt-4 bg-white border-t border-stone-200">
                        <button 
                            onClick={() => setShowTodayTickets(!showTodayTickets)}
                            className="w-full flex items-center justify-between p-4 lg:p-6 text-left hover:bg-stone-50 transition-colors"
                        >
                            <h2 className="text-lg font-bold text-slate-800">Tiket Hari Ini ({activeReservations.length})</h2>
                            <span className="text-slate-400">
                                {showTodayTickets ? <ChevronDown size={20} /> : <span className="transform rotate-180 inline-block"><ChevronDown size={20} /></span>}
                            </span>
                        </button>
                        
                        {showTodayTickets && (
                            <div className="px-4 lg:px-6 pb-6 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {activeReservations.map(res => (
                                        <div key={res.id} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{res.facility?.name}</h4>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {res.user?.name || res.customer_name || 'Walk-in'} &bull; {res.guest_count} Orang
                                                </p>
                                            </div>
                                            <div className="mt-4 flex justify-between items-center border-t border-stone-200 pt-3">
                                                <span className="font-bold text-emerald-600 text-sm">Rp {formatPrice(res.payment?.amount || 0)}</span>
                                                <button 
                                                    onClick={() => handlePrintReceipt(res)}
                                                    className="p-2 bg-white rounded-xl shadow-sm border border-stone-200 hover:bg-stone-50 text-slate-600 transition-colors"
                                                    title="Print Struk"
                                                >
                                                    <Receipt size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {activeReservations.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-400">
                                            Belum ada tiket terjual hari ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Cart Toggle Button */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
                    <button 
                        onClick={() => setIsMobileCartOpen(true)}
                        className="w-full bg-sky-500 text-white font-bold py-4 rounded-2xl flex justify-between items-center px-6 shadow-xl shadow-sky-500/20"
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={20} />
                            <span>{totalItems} Tiket</span>
                        </div>
                        <span className="text-lg">Rp {formatPrice(totalAmount)}</span>
                    </button>
                </div>

                {/* Right Sidebar (Cart) */}
                <div className={`w-full lg:w-[450px] bg-white lg:border-l border-stone-200 flex flex-col h-[100dvh] lg:h-full z-40 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] shrink-0 fixed inset-0 lg:static transition-transform duration-300 ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
                    <div className="p-5 border-b border-stone-100 shrink-0 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Receipt className="text-sky-500" /> Transaksi Baru
                        </h2>
                        <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 bg-stone-100 text-slate-500 rounded-full hover:bg-stone-200">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Order Details Form */}
                    <div className="p-5 border-b border-stone-100 shrink-0 bg-stone-50 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
                                <Users size={16} className="text-slate-400" /> Nama Pelanggan
                            </label>
                            <TextInput
                                type="text"
                                className="w-full bg-white border-stone-200 focus:border-sky-500 rounded-xl"
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                placeholder="Walk-in Customer"
                            />
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                        {cart.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <Ticket size={48} className="mb-4 opacity-20" />
                                <p>Belum ada tiket yang dipilih.</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="pr-8">
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.name}</h4>
                                            <p className="font-semibold text-sky-600 text-sm mt-1">
                                                Rp {formatPrice(['ticket', 'tiket'].includes(item.type?.toLowerCase()) 
                                                    ? parseFloat(item.final_price || item.price || item.price_per_day || 0) 
                                                    : parseFloat(item.final_price || item.price || item.price_per_day || 0))}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-slate-500">Jumlah:</span>
                                        <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-sky-600 active:bg-sky-50 rounded-l-xl transition-colors">
                                                <Minus size={14} />
                                            </button>
                                            <div className="w-10 text-center font-bold text-slate-800 text-sm border-x border-stone-200">
                                                {item.quantity}
                                            </div>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-sky-600 active:bg-sky-50 rounded-r-xl transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-5 border-t border-stone-100 bg-white shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 font-medium">Total Harga</span>
                            <span className="text-3xl font-black text-sky-600">Rp {formatPrice(totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-4 justify-end">
                            <label className="text-sm text-slate-600 cursor-pointer flex items-center gap-2 select-none">
                                <input 
                                    type="checkbox" 
                                    checked={autoPrint} 
                                    onChange={(e) => setAutoPrint(e.target.checked)}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Print Otomatis Bluetooth
                            </label>
                        </div>
                        <PrimaryButton 
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full justify-center bg-sky-500 hover:bg-sky-600 rounded-2xl py-4 shadow-xl shadow-sky-500/20 text-lg"
                            disabled={cart.length === 0}
                        >
                            Checkout ({totalItems} Tiket)
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isProcessing && setShowPaymentModal(false)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 sm:p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Pembayaran Tiket</h2>
                                <p className="text-slate-500 text-sm mt-1">Total tagihan: <span className="font-bold text-sky-600">Rp {formatPrice(totalAmount)}</span></p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto">
                            <form id="paymentForm" onSubmit={handleCheckout} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Metode Pembayaran</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                paymentMethod === 'cash' 
                                                ? 'border-sky-500 bg-sky-50 text-sky-700' 
                                                : 'border-stone-200 hover:border-sky-200 text-slate-600'
                                            }`}
                                        >
                                            <Banknote size={24} className={paymentMethod === 'cash' ? 'text-sky-500' : ''} />
                                            <span className="font-semibold text-sm">Tunai</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('qris')}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                paymentMethod === 'qris' 
                                                ? 'border-sky-500 bg-sky-50 text-sky-700' 
                                                : 'border-stone-200 hover:border-sky-200 text-slate-600'
                                            }`}
                                        >
                                            <QrCode size={24} className={paymentMethod === 'qris' ? 'text-sky-500' : ''} />
                                            <span className="font-semibold text-sm">QRIS</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('transfer')}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                paymentMethod === 'transfer' 
                                                ? 'border-sky-500 bg-sky-50 text-sky-700' 
                                                : 'border-stone-200 hover:border-sky-200 text-slate-600'
                                            }`}
                                        >
                                            <CreditCard size={24} className={paymentMethod === 'transfer' ? 'text-sky-500' : ''} />
                                            <span className="font-semibold text-sm">Transfer</span>
                                        </button>
                                        {cart.length > 0 && !['ticket', 'tiket'].includes(cart[0].type?.toLowerCase()) && (
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('pay_later')}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                                                    paymentMethod === 'pay_later' 
                                                    ? 'border-sky-500 bg-sky-50 text-sky-700' 
                                                    : 'border-stone-200 hover:border-sky-200 text-slate-600'
                                                }`}
                                            >
                                                <Calendar size={24} className={paymentMethod === 'pay_later' ? 'text-sky-500' : ''} />
                                                <span className="font-semibold text-sm leading-tight">Bayar Nanti</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Uang Diterima</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                                <input
                                                    type="text"
                                                    className="w-full pl-12 pr-4 py-4 bg-white border-stone-200 focus:border-sky-500 rounded-xl font-black text-xl text-slate-800"
                                                    value={amountPaid}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAmountPaid(val ? parseInt(val).toLocaleString('id-ID') : '');
                                                    }}
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {amountPaid && (
                                            <div className="flex justify-between items-center py-3 border-t border-stone-200">
                                                <span className="text-slate-600 font-medium">Kembalian:</span>
                                                <span className={`text-xl font-black ${
                                                    (parseFloat(amountPaid.replace(/\D/g, '')) || 0) >= totalAmount ? 'text-emerald-600' : 'text-rose-500'
                                                }`}>
                                                    Rp {formatPrice(Math.max(0, (parseFloat(amountPaid.replace(/\D/g, '')) || 0) - totalAmount))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex gap-4 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-600 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                            >
                                Batal
                            </button>
                            <PrimaryButton 
                                type="submit" 
                                form="paymentForm"
                                disabled={isProcessing || (paymentMethod === 'cash' && (parseFloat(amountPaid.replace(/\D/g, '')) || 0) < totalAmount)}
                                className="flex-1 justify-center bg-sky-500 hover:bg-sky-600 rounded-xl py-4 shadow-xl shadow-sky-500/20 text-lg"
                            >
                                {isProcessing ? (
                                    <><Loader2 size={20} className="animate-spin mr-2" /> Memproses...</>
                                ) : (
                                    <>Selesaikan Pembayaran</>
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            {paymentQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center border-b border-stone-100">
                            <h2 className="text-2xl font-black text-slate-800">Scan QRIS</h2>
                            <p className="text-slate-500 text-sm mt-1">Silakan scan kode QR di bawah ini dengan aplikasi pembayaran Anda.</p>
                        </div>
                        
                        <div className="p-8 flex justify-center bg-stone-50">
                            <img src={paymentQR} alt="QRIS Payment" className="w-64 h-64 rounded-xl shadow-sm border border-stone-200" />
                        </div>
                        
                        <div className="p-6 bg-white border-t border-stone-100 flex gap-4">
                            <button
                                onClick={() => {
                                    setPaymentQR(null);
                                    setPaymentId(null);
                                    setPrintUrl(null);
                                }}
                                className="px-6 py-4 rounded-xl font-bold text-slate-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                            >
                                Tutup
                            </button>
                            <PrimaryButton 
                                onClick={() => {
                                    setPaymentQR(null);
                                    setPaymentId(null);
                                    if (printUrl) {
                                        handlePrintReceipt(printUrl);
                                        setPrintUrl(null);
                                    }
                                }}
                                className="flex-1 justify-center bg-sky-500 hover:bg-sky-600 rounded-xl py-4 shadow-xl shadow-sky-500/20 text-lg font-bold"
                            >
                                Cetak & Selesai (Manual)
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
            {/* Facility Detail Modal */}
            {selectedFacility && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedFacility(null)}></div>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Image */}
                        <div className="h-48 bg-stone-100 relative">
                            {selectedFacility.image_url ? (
                                <img src={`/storage/${selectedFacility.image_url}`} alt={selectedFacility.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <Ticket size={48} />
                                </div>
                            )}
                            <button onClick={() => setSelectedFacility(null)} className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white backdrop-blur-sm text-slate-700 rounded-full shadow-sm transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">{selectedFacility.name}</h2>
                                <p className="text-xl font-bold text-sky-600 mt-1">
                                    Rp {formatPrice(parseFloat(selectedFacility.final_price || selectedFacility.price || selectedFacility.price_per_day || 0))}
                                </p>
                                {selectedFacility.description && (
                                    <p className="text-slate-500 mt-3 text-sm leading-relaxed">{selectedFacility.description}</p>
                                )}
                            </div>

                            {/* Options based on type */}
                            {(!['ticket', 'tiket'].includes(selectedFacility.type?.toLowerCase())) && (
                                <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100 space-y-4">
                                    <h3 className="font-bold text-sky-800 flex items-center gap-2 text-sm">
                                        <Calendar size={16} /> Jadwal Reservasi
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-sky-700 mb-1">Check-in Date</label>
                                            <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="w-full rounded-xl border-sky-200 text-sm focus:border-sky-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-sky-700 mb-1">Check-in Time</label>
                                            <input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className="w-full rounded-xl border-sky-200 text-sm focus:border-sky-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-sky-700 mb-1">Check-out Date</label>
                                            <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} min={checkInDate} className="w-full rounded-xl border-sky-200 text-sm focus:border-sky-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-sky-700 mb-1">Check-out Time</label>
                                            <input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className="w-full rounded-xl border-sky-200 text-sm focus:border-sky-500" required />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah (Kuantitas / Orang)</label>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} 
                                        className="w-12 h-12 flex items-center justify-center bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-800 rounded-xl transition-colors"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input 
                                        type="number"
                                        value={detailQuantity}
                                        onChange={(e) => setDetailQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 h-12 text-center font-bold text-lg border-stone-200 focus:border-sky-500 rounded-xl"
                                        min="1"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setDetailQuantity(detailQuantity + 1)} 
                                        className="w-12 h-12 flex items-center justify-center bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-800 rounded-xl transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex gap-4 shrink-0">
                            <PrimaryButton 
                                onClick={addToCart}
                                className="w-full justify-center bg-sky-500 hover:bg-sky-600 rounded-xl py-4 shadow-xl shadow-sky-500/20 text-lg"
                            >
                                Tambahkan ke Keranjang
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
