import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Search, ShoppingCart, Plus, Minus, X, Banknote, Receipt, ArrowLeft, Loader2, UtensilsCrossed, Users, Maximize, Trash2, QrCode, Smartphone, CreditCard, Building, Wallet } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { connectAndPrint, buildReceiptBuffer, isPrinterPaired, clearSavedPrinter } from '@/utils/printer';

export default function POSIndex({ menuItems, activeOrders = [], user, paymentChannels = [], tables = [] }) {
    const confirm = useConfirm();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [cart, setCart] = useState([]);
    
    // POS Order State
    const [selectedOrderId, setSelectedOrderId] = useState(null); // ID of existing order if we are editing/paying an active one
    const [orderType, setOrderType] = useState('dine_in');
    const [tableNumber, setTableNumber] = useState('');
    const [guestName, setGuestName] = useState('');
    const [notes, setNotes] = useState('');
    
    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentChannel, setPaymentChannel] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Print Modal State
    const [printUrl, setPrintUrl] = useState(null);
    const [printOrderData, setPrintOrderData] = useState(null);
    const [isPrintingBt, setIsPrintingBt] = useState(false);
    const [printerPaired, setPrinterPaired] = useState(() => isPrinterPaired());
    
    // QR Modal State
    const [paymentQR, setPaymentQR] = useState(null);
    const [paymentId, setPaymentId] = useState(null);

    // Layout State
    const [layoutDirection, setLayoutDirection] = useState('horizontal'); // 'horizontal' or 'vertical'

    // Categories
    const categories = ['Semua', ...Object.keys(menuItems)];

    // Filter Items
    const filteredItems = useMemo(() => {
        let items = [];
        if (activeCategory === 'Semua') {
            Object.values(menuItems).forEach(catItems => {
                items = [...items, ...catItems];
            });
        } else {
            items = menuItems[activeCategory] || [];
        }

        if (search) {
            items = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
        }
        return items;
    }, [menuItems, activeCategory, search]);

    const addToCart = (item) => {
        if (item.is_out_of_stock) {
            alert(`Stok ${item.name} habis.`);
            return;
        }
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && !i.is_existing);
            
            // Respect stock limit
            const maxQty = item.current_stock !== null
                ? Math.max(0, item.current_stock)
                : Infinity;

            if (existing) {
                const newQty = existing.quantity + 1;
                if (newQty > maxQty) {
                    alert(`Stok ${item.name} tidak mencukupi.`);
                    return prev;
                }
                return prev.map(i => (i.id === item.id && !i.is_existing) ? { ...i, quantity: newQty } : i);
            }
            return [...prev, { ...item, quantity: 1, itemNotes: '', is_existing: false }];
        });
    };

    // Barcode Scanner Listener
    useEffect(() => {
        let barcodeBuffer = '';
        let barcodeTimeout = null;

        const handleKeyDown = (e) => {
                    // Ignore if any input or textarea is focused (to avoid interfering with search, etc.)
                    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                      return;
                    }

                    // Most barcode scanners end with Enter
                    if (e.key === 'Enter') {
                      if (barcodeBuffer.length > 2) {
                        // Search for item with this barcode
                        let foundItem = null;
                        for (const catItems of Object.values(menuItems)) {
                          const match = catItems.find(item => item.barcode === barcodeBuffer);
                          if (match) {
                            foundItem = match;
                            break;
                          }
                        }

                        if (foundItem) {
                          addToCart(foundItem);
                        } else {
                          // Optional: show a small toast or play a beep error
                          console.warn('Barcode not found:', barcodeBuffer);
                        }
                      }
                      barcodeBuffer = '';
                    } else if (e.key.length === 1) { // Normal character
                      barcodeBuffer += e.key;

                      // Reset buffer if no input for 50ms (barcode scanners type very fast)
                      if (barcodeTimeout) clearTimeout(barcodeTimeout);
                      barcodeTimeout = setTimeout(() => {
                        barcodeBuffer = '';
                      }, 100);
                    }
                  };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (barcodeTimeout) clearTimeout(barcodeTimeout);
        };
    }, [menuItems, cart]);

    const updateQuantity = (id, delta, isExisting) => {
        if (isExisting) return; // Cannot modify existing items quantity from POS (already sent to kitchen)
        setCart(prev => prev.map(item => {
            if (item.id === id && item.is_existing === isExisting) {
                const newQty = item.quantity + delta;
                
                // Respect stock limit
                const maxQty = item.current_stock !== null
                    ? Math.max(0, item.current_stock)
                    : Infinity;
                const clampedQty = Math.min(newQty, maxQty);

                return clampedQty > 0 ? { ...item, quantity: clampedQty } : item;
            }
            return item;
        }));
    };

    const updateItemNotes = (id, notes, isExisting) => {
        if (isExisting) return; // Cannot modify notes for existing items
        setCart(prev => prev.map(item => (item.id === id && item.is_existing === isExisting) ? { ...item, itemNotes: notes } : item));
    };

    const removeFromCart = (id, isExisting) => {
        if (isExisting) return; // Cannot remove existing items
        setCart(prev => prev.filter(item => !(item.id === id && item.is_existing === isExisting)));
    };

    const loadActiveOrder = (order) => {
        setSelectedOrderId(order.id);
        setOrderType(order.order_type);
        setTableNumber(order.table_number || (order.reservation ? order.reservation.facility.name : ''));
        setGuestName(order.customer_name || (order.user ? order.user.name : 'Tamu QR'));
        setNotes(order.notes || '');
        
        // Load items into cart and mark as existing
        const existingItems = order.items.map(item => ({
            id: item.menu_item.id,
            name: item.menu_item.name,
            price: item.price,
            final_price: item.menu_item.final_price ?? item.price,
            daily_stock: item.menu_item.daily_stock ?? null,
            current_stock: item.menu_item.current_stock ?? 0,
            quantity: item.quantity,
            itemNotes: item.notes || '',
            is_existing: true // Flag to prevent modifying/removing
        }));
        
        setCart(existingItems);
    };

    const clearActiveOrder = () => {
        setSelectedOrderId(null);
        setOrderType('dine_in');
        setTableNumber('');
        setGuestName('');
        setNotes('');
        setCart([]);
    };

    const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.final_price !== undefined ? item.final_price : item.price) * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const formatPrice = (price) => parseFloat(price).toLocaleString('id-ID');

    const handleCheckout = (e) => {
        e.preventDefault();
        
        if (orderType === 'dine_in' && !tableNumber) {
            alert('Silakan isi Nomor Meja untuk pesanan Dine In.');
            return;
        }

        if (!guestName.trim()) {
            alert('Silakan isi Nama Tamu.');
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

        const payload = {
            order_id: selectedOrderId,
            order_type: orderType,
            table_number: tableNumber,
            customer_name: guestName,
            notes: notes,
            payment_method: paymentMethod,
            payment_channel: paymentChannel,
            amount_paid: paymentMethod === 'cash' ? (parseFloat(amountPaid.replace(/\D/g, '')) || 0) : totalAmount,
            items: cart.map(item => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                notes: item.itemNotes,
                is_existing: item.is_existing || false
            }))
        };

        router.post(route('staff.pos.store'), payload, {
            onSuccess: (page) => {
                setShowPaymentModal(false);
                clearActiveOrder();
                setAmountPaid('');
                setIsProcessing(false);
                
                if (page.props.flash.checkout_url || page.props.flash.qr_url) {
                    setPaymentQR({
                        checkoutUrl: page.props.flash.checkout_url,
                        qrUrl: page.props.flash.qr_url
                    });
                    setPaymentId(page.props.flash.payment_id);
                }

                if (page.props.flash.print_order_id) {
                    let url = route('staff.pos.print', page.props.flash.print_order_id);
                    if (page.props.flash.change_amount !== undefined) {
                        url += '?change_amount=' + page.props.flash.change_amount;
                    }
                    setPrintUrl(url);
                    setPrintOrderData(page.props.flash.print_order_data || null);
                }
            },
            onError: (errors) => {
                setIsProcessing(false);
                alert(Object.values(errors).join('\n'));
            },
            onFinish: () => {
                setIsProcessing(false);
            }
        });
    };

    const handleDeleteOrder = async (order) => {
        if (await confirm('Apakah Anda yakin ingin menghapus pesanan aktif ini secara permanen? Sisa stok dari menu yang dipesan akan dikembalikan otomatis.')) {
            router.delete(route('staff.food-orders.destroy', order.id), {
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedOrderId === order.id) {
                        clearActiveOrder();
                    }
                }
            });
        }
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
                        
                        // Proceed to print automatically since payment succeeded
                        if (printOrderData) {
                            handlePrintReceipt(printOrderData);
                        } else if (printUrl) {
                            // Fallback if no bluetooth
                            window.open(printUrl, '_blank', 'width=400,height=600');
                            setPrintUrl(null);
                        }
                        
                        // Reload activeOrders to clear the paid order
                        router.reload({ only: ['activeOrders'] });
                    }
                } catch (error) {
                    // Ignore polling errors
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentId, paymentQR, printUrl, printOrderData]);

    const handlePrintReceipt = (order) => {
        // Set standard print iframe URL
        setPrintUrl(route('staff.pos.print', order.id));
        
        // Setup data for Bluetooth printing
        const orderData = {
            id: order.id,
            customerName: order.customer_name || 'Walk-in',
            cashierName: order.user ? order.user.name.split(' ')[0] : 'System',
            date: order.created_at,
            orderType: order.order_type === 'dine_in' ? 'DINE IN' : 'TAKEAWAY',
            tableNumber: order.table_number,
            paymentStatus: order.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS',
            total: order.total_amount,
            items: order.items.map(item => ({
                name: item.menu_item ? item.menu_item.name : 'Item',
                quantity: item.quantity,
                price: item.price,
                notes: item.notes
            }))
        };
        setPrintOrderData(orderData);
    };

    const quickCashOptions = [50000, 100000, 150000, 200000, 500000];

    // All supported POS payment methods — includes static Tailwind classes to avoid JIT purging
    const POS_PAYMENT_METHODS = [
        { id: 'cash',     label: 'Tunai',         sublabel: 'Cash',              Icon: Banknote,   activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
        { id: 'qris',     label: 'QRIS',          sublabel: 'Scan QR',           Icon: QrCode,     activeClass: 'border-violet-500 bg-violet-50 text-violet-700' },
        { id: 'transfer', label: 'Transfer',      sublabel: 'ATM/m-Banking',     Icon: Building,   activeClass: 'border-sky-500 bg-sky-50 text-sky-700' },
        { id: 'edc',      label: 'EDC / Debit',   sublabel: 'Gesek Kartu',       Icon: CreditCard, activeClass: 'border-amber-500 bg-amber-50 text-amber-700' },
        { id: 'ewallet',  label: 'E-Wallet',      sublabel: 'OVO/Dana/GoPay',    Icon: Wallet,     activeClass: 'border-rose-500 bg-rose-50 text-rose-700' },
    ];

    // Non-cash instruction panels — fully static classes
    const NON_CASH_PANELS = {
        qris: {
            wrap:  'bg-violet-50 border-2 border-violet-200',
            icon:  'text-violet-600',
            title: 'text-violet-900',
            body:  'text-violet-700',
            foot:  'bg-violet-100',
            footText: 'text-violet-800',
            text: 'Minta pelanggan scan QRIS statis di kasir atau tampilkan QR Code di mesin. Pastikan notifikasi pembayaran telah diterima sebelum memproses.',
        },
        transfer: {
            wrap:  'bg-sky-50 border-2 border-sky-200',
            icon:  'text-sky-600',
            title: 'text-sky-900',
            body:  'text-sky-700',
            foot:  'bg-sky-100',
            footText: 'text-sky-800',
            text: 'Minta pelanggan transfer ke rekening resmi. Konfirmasi bukti transfer / screenshot mutasi sebelum memproses pesanan.',
        },
        edc: {
            wrap:  'bg-amber-50 border-2 border-amber-200',
            icon:  'text-amber-600',
            title: 'text-amber-900',
            body:  'text-amber-700',
            foot:  'bg-amber-100',
            footText: 'text-amber-800',
            text: 'Gesekkan / tap kartu debit/kredit pelanggan di mesin EDC. Pastikan struk EDC menampilkan status APPROVED sebelum memproses.',
        },
        ewallet: {
            wrap:  'bg-rose-50 border-2 border-rose-200',
            icon:  'text-rose-600',
            title: 'text-rose-900',
            body:  'text-rose-700',
            foot:  'bg-rose-100',
            footText: 'text-rose-800',
            text: 'Pastikan pelanggan menunjukkan bukti transfer dari OVO / Dana / GoPay / dll dan saldo telah masuk ke rekening sebelum memproses.',
        },
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleBluetoothPrint = async () => {
        if (!printOrderData) return;
        setIsPrintingBt(true);
        try {
            const buffer = buildReceiptBuffer(
                printOrderData,
                printOrderData.items,
                printOrderData.total
            );
            const res = await connectAndPrint(buffer);
            setPrinterPaired(isPrinterPaired());
            if (!res.success) {
                alert('Gagal mencetak bluetooth: ' + res.error);
            }
        } catch (err) {
            alert('Gagal: ' + err.message);
        } finally {
            setIsPrintingBt(false);
        }
    };

    const forgetPrinter = () => {
        clearSavedPrinter();
        setPrinterPaired(false);
    };

    return (
        <div className={`min-h-screen bg-stone-100 flex font-sans ${layoutDirection === 'horizontal' ? 'flex-col md:flex-row' : 'flex-col'}`}>
            <Head title="Kasir POS" />

            {/* Left Side: Active Orders & Catalog */}
            <div className={`flex flex-col bg-stone-50 ${layoutDirection === 'horizontal' ? 'flex-1 h-[55vh] md:h-screen overflow-hidden border-b md:border-b-0 border-stone-200' : 'h-[55vh] overflow-hidden border-b border-stone-200'}`}>
                {/* Header */}
                <header className="bg-white border-b border-stone-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href={route('dashboard')} className="p-2 text-stone-500 hover:text-emerald-600 bg-stone-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <UtensilsCrossed className="text-emerald-500" size={24} /> 
                                POS
                            </h1>
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Kasir: {user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setLayoutDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                            className="hidden md:flex p-2 text-stone-500 hover:text-emerald-600 bg-stone-100 hover:bg-emerald-50 rounded-xl transition-colors" title="Toggle Layout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                        </button>
                        <button onClick={toggleFullScreen} className="p-2 text-stone-500 hover:text-emerald-600 bg-stone-100 hover:bg-emerald-50 rounded-xl transition-colors" title="Toggle Fullscreen">
                            <Maximize size={20} />
                        </button>
                        <div className="relative w-48 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                            <TextInput
                                type="text"
                                placeholder="Cari menu..."
                                className="w-full pl-10 bg-stone-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* Active Orders Horizontal Scroll (If any) */}
                {activeOrders && activeOrders.length > 0 && (
                    <div className="bg-white border-b border-stone-200 p-4 shrink-0 overflow-x-auto hide-scrollbar">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pesanan Aktif (Meja/QR)</span>
                        </div>
                        <div className="flex gap-3">
                            {activeOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={`relative px-4 py-3 rounded-2xl border-2 text-left flex flex-col min-w-[160px] transition-all cursor-pointer ${
                                        selectedOrderId === order.id 
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/20' 
                                            : 'border-stone-200 bg-white hover:border-emerald-300'
                                    }`}
                                    onClick={() => loadActiveOrder(order)}
                                >
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-100 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                                        title="Hapus Pesanan"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <span className="font-black text-slate-900 truncate w-full pr-4">
                                        {order.order_type === 'dine_in' ? `Meja ${order.table_number}` : (order.reservation ? order.reservation.facility.name : 'Takeaway')}
                                    </span>
                                    <span className="text-xs font-bold text-stone-500 truncate w-full mb-1">
                                        {order.guest_name || order.user?.name || 'Tamu'}
                                    </span>
                                    <span className="text-sm font-black text-emerald-600">Rp {formatPrice(order.total_amount)}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handlePrintReceipt(order); }}
                                        className="mt-2 text-xs font-bold text-stone-500 hover:text-emerald-600 flex items-center gap-1"
                                    >
                                        <Receipt size={12} /> Cetak Ulang
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories */}
                <div className="bg-white border-b border-stone-200 p-4 shrink-0 overflow-x-auto hide-scrollbar">
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                    activeCategory === cat 
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            >
                                {cat === 'other_income' ? 'Lainnya' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredItems.map(item => {
                            const isTracked = item.current_stock !== null;
                            const cartItem = cart.find(i => i.id === item.id && !i.is_existing);
                            const cartQty = cartItem ? cartItem.quantity : 0;
                            const availableStock = isTracked ? Math.max(0, item.current_stock - cartQty) : null;
                            const isOutOfStock = item.is_out_of_stock || (isTracked && availableStock === 0);
                            
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => !isOutOfStock && addToCart(item)}
                                    className={`bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col h-full transition-all group ${
                                        isOutOfStock 
                                            ? 'opacity-50 cursor-not-allowed grayscale' 
                                            : 'cursor-pointer hover:border-emerald-500 hover:shadow-lg active:scale-95'
                                    }`}
                                >
                                <div className="h-28 bg-stone-100 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img src={`/storage/${item.image_url}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                                            <UtensilsCrossed size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                        {isOutOfStock && (
                                            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                                                HABIS
                                            </span>
                                        )}
                                        {isTracked && !isOutOfStock && (
                                            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                                                SISA: {availableStock}
                                            </span>
                                        )}
                                        <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                                            {item.category === 'other_income' ? 'Lainnya' : item.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col justify-between flex-1">
                                    <h3 className="font-bold text-slate-900 leading-tight mb-1 text-sm line-clamp-2">{item.name}</h3>
                                    {item.final_price < item.price ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 line-through">Rp {formatPrice(item.price)}</span>
                                            <span className="font-black text-rose-600 text-sm">Rp {formatPrice(item.final_price)}</span>
                                        </div>
                                    ) : (
                                        <div className="font-black text-emerald-600 text-sm">Rp {formatPrice(item.price)}</div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 text-stone-400">
                            <Search size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold text-lg">Menu tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className={`bg-white flex flex-col border-stone-200 shadow-2xl z-20 shrink-0 ${
                layoutDirection === 'horizontal' 
                    ? 'w-full md:w-[400px] lg:w-[450px] h-[45vh] md:h-screen md:border-l' 
                    : 'w-full h-[45vh] border-t'
            }`}>
                <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center shrink-0">
                    <h2 className="font-black text-slate-900 text-xl flex items-center gap-2">
                        <ShoppingCart className="text-emerald-500" /> 
                        {selectedOrderId ? 'Tagihan Meja' : 'Pesanan Baru'}
                    </h2>
                    <div className="flex gap-2">
                        {selectedOrderId && (
                            <button onClick={clearActiveOrder} className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full text-xs hover:bg-rose-200 transition-colors">
                                Batal / Reset
                            </button>
                        )}
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm">
                            {totalItems} item
                        </span>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className={`rounded-xl p-3 border flex gap-3 ${item.is_existing ? 'bg-orange-50/50 border-orange-200' : 'bg-stone-50 border-stone-200'}`}>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 leading-tight">{item.name}</h4>
                                        {item.is_existing && (
                                            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">Sudah Dipesan</span>
                                        )}
                                    </div>
                                    {!item.is_existing && (
                                        <button onClick={() => removeFromCart(item.id, item.is_existing)} className="text-stone-400 hover:text-rose-500 transition-colors p-1">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                {item.final_price < item.price && !item.is_existing ? (
                                    <div className="flex flex-col mb-2">
                                        <span className="text-xs text-slate-400 line-through">Rp {formatPrice(item.price)}</span>
                                        <span className="text-rose-600 font-bold text-sm">Rp {formatPrice(item.final_price)}</span>
                                    </div>
                                ) : (
                                    <div className="text-emerald-600 font-bold text-sm mb-2">Rp {formatPrice(item.is_existing ? item.price : (item.final_price !== undefined ? item.final_price : item.price))}</div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-1">
                                        <button 
                                            onClick={() => updateQuantity(item.id, -1, item.is_existing)} 
                                            disabled={item.is_existing}
                                            className="w-7 h-7 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-50 flex items-center justify-center text-stone-600"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1, item.is_existing)} 
                                            disabled={item.is_existing}
                                            className="w-7 h-7 rounded bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 flex items-center justify-center text-emerald-700"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="font-black text-slate-900">
                                        Rp {formatPrice((item.is_existing ? item.price : (item.final_price !== undefined ? item.final_price : item.price)) * item.quantity)}
                                    </div>
                                </div>
                                {!item.is_existing && (
                                    <input
                                        type="text"
                                        placeholder="Catatan (opsional)..."
                                        className="w-full mt-2 text-xs bg-white border-stone-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                        value={item.itemNotes}
                                        onChange={(e) => updateItemNotes(item.id, e.target.value, item.is_existing)}
                                    />
                                )}
                                {item.is_existing && item.itemNotes && (
                                    <p className="text-xs font-bold text-orange-600 italic mt-2">Catatan: {item.itemNotes}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                            <ShoppingCart size={64} className="opacity-30" />
                            <p className="font-bold text-lg">Keranjang Kosong</p>
                            <p className="text-sm text-center px-8">Klik menu di sebelah kiri untuk menambah pesanan ke keranjang.</p>
                        </div>
                    )}
                </div>

                {/* Checkout Summary */}
                <div className="border-t border-stone-200 bg-stone-50 p-4 shrink-0 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Tipe Pesanan</label>
                            <select 
                                className="w-full mt-1 rounded-xl border-stone-200 text-sm font-bold bg-white focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-stone-100"
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                disabled={selectedOrderId !== null}
                            >
                                <option value="dine_in">Makan di Tempat</option>
                                <option value="takeaway">Bungkus / Takeaway</option>
                                <option value="room_service">Layanan Kamar</option>
                            </select>
                        </div>
                        {(orderType === 'dine_in' || orderType === 'room_service') && (
                            <div>
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                    {orderType === 'dine_in' ? 'Pilih Meja' : 'Kamar/Fasilitas'} <span className="text-rose-500">*</span>
                                </label>
                                {orderType === 'dine_in' ? (
                                    <select
                                        className="w-full mt-1 rounded-xl border-stone-200 text-sm font-bold bg-white focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-stone-100 disabled:text-stone-500"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        disabled={selectedOrderId !== null}
                                    >
                                        <option value="">— Pilih Meja —</option>
                                        {(tables || []).map((group) => (
                                            <optgroup key={group.gazebo} label={group.gazebo}>
                                                {group.tables.map((t) => (
                                                    <option key={t.id} value={t.label}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full mt-1 rounded-xl border-stone-200 text-sm font-bold bg-white focus:ring-emerald-500 focus:border-emerald-500 placeholder:font-normal disabled:bg-stone-100 disabled:text-stone-500"
                                        placeholder="Gazebo A"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        disabled={selectedOrderId !== null}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                            Nama Tamu <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full mt-1 rounded-xl border-stone-200 text-sm font-bold bg-white focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-stone-100 disabled:text-stone-500"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            disabled={selectedOrderId !== null}
                        />
                    </div>

                    <div className="flex justify-between items-end pt-2 border-t border-stone-200">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">Total Tagihan</span>
                        <span className="text-3xl font-black text-emerald-600 leading-none">Rp {formatPrice(totalAmount)}</span>
                    </div>

                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {selectedOrderId ? 'BAYAR TAGIHAN' : 'BAYAR SEKARANG'}
                    </button>
                </div>
            </div>

            {/* ─── Payment Modal ─── */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                        {/* Header */}
                        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-black">Proses Pembayaran</h3>
                                <p className="text-slate-400 text-xs mt-0.5">{guestName || 'Walk-in'} · {orderType === 'dine_in' ? `Meja ${tableNumber}` : 'Takeaway'}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <div className="p-6 space-y-5">

                                {/* Total */}
                                <div className="text-center py-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <p className="text-emerald-700 font-bold uppercase text-xs tracking-widest mb-1">Total Tagihan</p>
                                    <p className="text-5xl font-black text-emerald-600 tracking-tight">Rp {formatPrice(totalAmount)}</p>
                                </div>

                                {/* Payment Method Grid */}
                                <div>
                                    <p className="font-black text-slate-900 mb-3 text-sm uppercase tracking-wider">Metode Pembayaran</p>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                        {POS_PAYMENT_METHODS.map(({ id, label, sublabel, Icon, activeClass }) => (
                                            <button
                                                key={id}
                                                onClick={() => { setPaymentMethod(id); if (id !== 'cash') setAmountPaid(''); }}
                                                className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all gap-1.5 ${
                                                    paymentMethod === id
                                                        ? `${activeClass} shadow-md`
                                                        : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                                                }`}
                                            >
                                                <Icon size={22} />
                                                <span className="font-black text-xs leading-tight text-center">{label}</span>
                                                <span className="text-[9px] text-center leading-tight opacity-70 hidden sm:block">{sublabel}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cash Section */}
                                {paymentMethod === 'cash' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="font-bold text-slate-900 block mb-2 text-sm">Jumlah Uang Diterima:</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">Rp</span>
                                                <input
                                                    type="text"
                                                    value={amountPaid}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAmountPaid(val ? formatPrice(val) : '');
                                                    }}
                                                    className="w-full pl-12 pr-4 py-4 text-2xl font-black rounded-2xl border-stone-300 focus:border-emerald-500 focus:ring-emerald-500"
                                                    placeholder="0"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Cash Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setAmountPaid(formatPrice(totalAmount))}
                                                className="px-3 py-2 bg-stone-800 text-white rounded-xl font-bold text-sm"
                                            >
                                                Uang Pas
                                            </button>
                                            {quickCashOptions.filter(opt => opt >= totalAmount).map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setAmountPaid(formatPrice(opt))}
                                                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl font-bold text-stone-700 text-sm"
                                                >
                                                    {opt >= 1000000 ? `${opt / 1000000}jt` : `${opt / 1000}k`}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Change Display */}
                                        {amountPaid && parseFloat(amountPaid.replace(/\D/g, '')) >= totalAmount && (
                                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                                                <span className="font-bold text-orange-800 uppercase text-sm">Kembalian:</span>
                                                <span className="font-black text-2xl text-orange-600">
                                                    Rp {formatPrice(parseFloat(amountPaid.replace(/\D/g, '')) - totalAmount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Non-Cash Section */}
                                {paymentMethod !== 'cash' && NON_CASH_PANELS[paymentMethod] && (() => {
                                    const method = POS_PAYMENT_METHODS.find(m => m.id === paymentMethod);
                                    const panel = NON_CASH_PANELS[paymentMethod];
                                    return (
                                        <div className={`p-5 rounded-2xl animate-in fade-in slide-in-from-top-2 ${panel.wrap}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                {method && <method.Icon size={22} className={panel.icon} />}
                                                <p className={`font-black ${panel.title}`}>{method?.label}</p>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${panel.body}`}>
                                                {panel.text}
                                            </p>

                                            {/* Tripay Payment Channel Selection for Transfer & E-Wallet */}
                                            {(paymentMethod === 'transfer' || paymentMethod === 'ewallet') && (
                                                <div className="mt-4">
                                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${panel.title}`}>
                                                        Pilih {paymentMethod === 'transfer' ? 'Bank' : 'E-Wallet'}:
                                                    </label>
                                                    <select
                                                        value={paymentChannel}
                                                        onChange={(e) => setPaymentChannel(e.target.value)}
                                                        className={`w-full rounded-xl border-2 bg-white/60 focus:ring-0 text-sm font-bold p-3 transition-colors ${
                                                            paymentMethod === 'transfer'
                                                                ? 'border-sky-200 focus:border-sky-500 text-sky-900'
                                                                : 'border-rose-200 focus:border-rose-500 text-rose-900'
                                                        }`}
                                                    >
                                                        <option value="" disabled>-- Silakan Pilih --</option>
                                                        {paymentChannels
                                                            .filter(c => paymentMethod === 'transfer' ? c.group === 'Virtual Account' : c.group === 'E-Wallet' && c.code !== 'QRIS' && c.code !== 'QRIS2')
                                                            .map(c => (
                                                                <option key={c.code} value={c.code}>{c.name}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            )}

                                            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${panel.foot}`}>
                                                <span className="text-lg">✓</span>
                                                <p className={`text-xs font-bold ${panel.footText}`}>
                                                    {(paymentMethod === 'qris' || paymentMethod === 'transfer' || paymentMethod === 'ewallet')
                                                        ? 'Sistem akan membuka halaman Tripay setelah Anda klik "Selesaikan Pesanan".'
                                                        : 'Konfirmasi dulu sebelum klik "Selesaikan Pesanan".'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-5 border-t border-stone-100 shrink-0">
                            <button
                                onClick={handleCheckout}
                                disabled={
                                    isProcessing ||
                                    (paymentMethod === 'cash' && (!amountPaid || parseFloat(amountPaid.replace(/\D/g, '')) < totalAmount)) ||
                                    ((paymentMethod === 'transfer' || paymentMethod === 'ewallet') && !paymentChannel)
                                }
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="animate-spin" /> MEMPROSES...</>
                                ) : (
                                    <>SELESAIKAN PESANAN &amp; CETAK STRUK</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Payment Modal */}
            {paymentQR && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-8 items-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <QrCode size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Pindai QRIS</h3>
                        <p className="text-slate-500 text-sm mb-6">Silakan arahkan pelanggan untuk memindai kode QR ini dari layar Anda.</p>
                        
                        {paymentQR.qrUrl ? (
                            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-6">
                                <img src={paymentQR.qrUrl} alt="QRIS" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mb-6 w-full text-amber-800 text-sm font-medium">
                                Kode QR image tidak tersedia secara langsung. Silakan klik tombol di bawah.
                            </div>
                        )}

                        <div className="w-full flex gap-3 flex-col">
                            {paymentQR.checkoutUrl && (
                                <button 
                                    onClick={() => window.open(paymentQR.checkoutUrl, '_blank', 'width=600,height=800')} 
                                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    Buka Halaman Tripay
                                </button>
                            )}
                            <div className="flex gap-2 w-full mt-2">
                                <button 
                                    onClick={() => {
                                        setPaymentQR(null);
                                        setPaymentId(null);
                                        setPrintUrl(null);
                                    }} 
                                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold transition-colors"
                                >
                                    Tutup
                                </button>
                                <button 
                                    onClick={() => {
                                        setPaymentQR(null);
                                        setPaymentId(null);
                                        if (printOrderData) {
                                            handlePrintReceipt(printOrderData);
                                        } else if (printUrl) {
                                            window.open(printUrl, '_blank', 'width=400,height=600');
                                            setPrintUrl(null);
                                        }
                                    }} 
                                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    Cetak Manual
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Printer status badge + forget (always visible in POS) */}
            <div className="fixed bottom-4 right-4 z-[55] flex items-center gap-2">
                {printerPaired ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        Printer Ter-pairing · Auto-Print Aktif
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-stone-700 text-stone-200 text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                        Printer Belum Pairing
                    </span>
                )}
                {printerPaired && (
                    <button
                        onClick={forgetPrinter}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg"
                        title="Lupakan printer (pair ulang)"
                    >
                        Lupakan
                    </button>
                )}
            </div>

            {/* Print Modal (Bypass Pop-up Blocker) */}
            {!paymentQR && printUrl && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-black flex items-center gap-2"><Receipt size={20} /> Cetak Struk</h3>
                            <button onClick={() => setPrintUrl(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 w-full bg-stone-100 overflow-hidden relative">
                            <iframe 
                                id="receipt-iframe"
                                src={printUrl} 
                                className="w-full h-full border-0 absolute inset-0" 
                                title="Struk Pembayaran"
                            ></iframe>
                        </div>
                        <div className="p-4 bg-white border-t border-stone-200 shrink-0 grid grid-cols-2 gap-3">
                            <button
                                onClick={handleBluetoothPrint}
                                disabled={isPrintingBt || !printOrderData}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isPrintingBt ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
                                Thermal Bluetooth
                            </button>
                            <button
                                onClick={() => {
                                    try {
                                        document.getElementById('receipt-iframe').contentWindow.print();
                                    } catch(err) {}
                                }}
                                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Receipt size={18} />
                                Printer Sistem (USB)
                            </button>
                            <button
                                onClick={() => { setPrintUrl(null); setPrintOrderData(null); }}
                                className="w-full py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-bold transition-all col-span-2"
                            >
                                Tutup & Lanjut
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
