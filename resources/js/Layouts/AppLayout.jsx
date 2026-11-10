import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard, Hotel, CalendarDays, UtensilsCrossed, Armchair,
    CreditCard, Star, Users, FileText, Menu, X, ChevronDown, Monitor,
    Bell, LogOut, Settings, User, Check, QrCode, Package, ShoppingCart, Image as ImageIcon, Activity, Ticket, Boxes, TrendingUp
} from 'lucide-react';
import ToastListener from '@/Components/ToastListener';

const navGroups = [
    {
        title: 'Utama',
        items: [
            { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff', 'customer'] },
            { label: 'Kasir POS', href: 'staff.pos.index', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
            { label: 'Kasir Tiket', href: 'staff.tickets.index', icon: Ticket, roles: ['admin', 'manager', 'staff'] },
            { label: 'Monitor Dapur', href: 'staff.kds', icon: UtensilsCrossed, roles: ['admin', 'manager', 'staff'] },
            { label: 'Display Fasilitas', href: 'staff.facility-display', icon: Monitor, roles: ['admin', 'manager', 'staff'] },
        ]
    },
    {
        title: 'Operasional',
        items: [
            { label: 'Semua Reservasi', href: 'admin.reservations.index', icon: CalendarDays, roles: ['admin', 'manager'] },
            { label: 'Check-in/out', href: 'staff.reservations.index', icon: CalendarDays, roles: ['admin', 'manager', 'staff'] },
            { label: 'Semua Pesanan', href: 'admin.food-orders.index', icon: UtensilsCrossed, roles: ['admin', 'manager'] },
            { label: 'Orders Aktif', href: 'staff.food-orders.index', icon: UtensilsCrossed, roles: ['admin', 'manager', 'staff'] },
            { label: 'Riwayat Pesanan & Reservasi', href: 'staff.history.index', icon: FileText, roles: ['staff'] },
            { label: 'Gudang', href: 'staff.inventory.index', icon: Boxes, roles: ['staff'] },
            { label: 'Pembayaran', href: 'admin.payments.index', icon: CreditCard, roles: ['admin', 'manager'] },
            { label: 'Pembayaran (Staff)', href: 'staff.payments.index', icon: CreditCard, roles: ['staff'] },
        ]
    },
    {
        title: 'Stok & Keuangan',
        items: [
            { label: 'Pusat Keputusan Bisnis', href: 'admin.bi.index', icon: TrendingUp, roles: ['admin', 'manager'] },
            { label: 'Laporan', href: 'admin.reports.index', icon: FileText, roles: ['admin', 'manager'] },
            { label: 'Inventori & Pengeluaran', href: 'admin.inventories.index', icon: Package, roles: ['admin', 'manager'] },
            { label: 'Stok Harian Cafe', href: 'staff.daily-stock.index', icon: Package, roles: ['admin', 'manager', 'staff'] },
            { label: 'Tutup Kasir', href: 'staff.pos-closing.index', icon: CreditCard, roles: ['admin', 'manager', 'staff'] },
        ]
    },
    {
        title: 'Master Data & Sistem',
        items: [
            { label: 'Fasilitas', href: 'admin.facilities.index', icon: Hotel, roles: ['admin', 'manager'] },
            { label: 'Gazebo & Meja', href: 'admin.gazebos.index', icon: Armchair, roles: ['admin', 'manager'] },
            { label: 'Menu Café & Layanan', href: 'admin.menu-items.index', icon: UtensilsCrossed, roles: ['admin', 'manager'] },
            { label: 'Kupon & Diskon', href: 'admin.coupons.index', icon: Package, roles: ['admin', 'manager'] },
            { label: 'Ulasan Tamu', href: 'admin.reviews.index', icon: Star, roles: ['admin', 'manager'] },
            { label: 'CMS Banner', href: 'admin.banners.index', icon: ImageIcon, roles: ['admin', 'manager'] },
            { label: 'QR Codes', href: 'admin.qrcodes.index', icon: QrCode, roles: ['admin'] },
            { label: 'Pengguna', href: 'admin.users.index', icon: Users, roles: ['admin'] },
            { label: 'Pengaturan', href: 'admin.settings.index', icon: Settings, roles: ['admin'] },
            { label: 'Audit Trail', href: 'admin.activity-logs.index', icon: Activity, roles: ['admin'] },
        ]
    },
    {
        title: 'Area Pelanggan',
        items: [
            { label: 'Reservasi Saya', href: 'customer.reservations.index', icon: CalendarDays, roles: ['customer'] },
            { label: 'Pesanan Saya', href: 'customer.orders.index', icon: UtensilsCrossed, roles: ['customer'] },
        ]
    }
];;

export default function AppLayout({ children, title }) {
    const { auth, cms_settings } = usePage().props;
    const userRoles = auth?.user?.roles?.map(r => r.name) || [];
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // Polling for notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['auth'], preserveState: true, preserveScroll: true });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = (id) => {
        router.post(route('notifications.read', id), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setNotifOpen(false)
        });
    };

    // Removed visibleNav mapping here, will map inside render

    const isActive = (href) => {
        try {
            return route().current(href) || route().current(href + '.*');
        } catch {
            return false;
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-[var(--wk-bg)] wk-aurora text-slate-900 font-sans flex">
            <ToastListener />
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex h-full flex-col glass border-r border-[var(--wk-border)] bg-[var(--wk-surface)]">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-8 py-8">
                        {cms_settings?.primary_logo ? (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                <img src={cms_settings.primary_logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                <img src="/images/logo.png" alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                        <div>
                            <p className="text-slate-900 font-extrabold text-base leading-tight tracking-wide">{cms_settings?.site_name || 'My App'}</p>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-0.5">{cms_settings?.site_description || 'Retreat & Nature'}</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                        {navGroups.map((group, gIdx) => {
                            const visibleItems = group.items.filter(item => item.roles.some(role => userRoles.includes(role)));
                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={gIdx} className="space-y-1.5">
                                    <h4 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        {group.title}
                                    </h4>
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={route(item.href)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                                                    active 
                                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-emerald-400' : 'text-slate-400'} />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {/* User Info at Bottom */}
                    <div className="p-6">
                        <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
                            <img
                                src={auth?.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'U')}&background=047857&color=fff`}
                                alt={auth?.user?.name}
                                className="w-10 h-10 rounded-xl object-cover shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-800 text-sm font-bold truncate">{auth?.user?.name}</p>
                                <p className="text-emerald-600 text-xs capitalize font-bold">
                                    {userRoles[0] || 'user'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="bg-transparent border-none z-30 pt-6 px-6 lg:px-10 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-stone-100"
                            >
                                <Menu size={20} />
                            </button>
                            {title && (
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    className="relative p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                    <Bell size={20} />
                                    {auth?.user?.unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 w-auto bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden flex flex-col max-h-[400px]">
                                        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                                            <h3 className="font-bold text-slate-800">Notifikasi</h3>
                                            {auth?.user?.unreadCount > 0 && (
                                                <Link
                                                    href={route('notifications.read-all')}
                                                    method="post"
                                                    as="button"
                                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                                    onClick={() => setNotifOpen(false)}
                                                >
                                                    Tandai Semua Dibaca
                                                </Link>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                            {auth?.user?.unreadNotifications?.length > 0 ? (
                                                auth.user.unreadNotifications.map(notif => (
                                                    <div key={notif.id} className="p-3 bg-white hover:bg-emerald-50 rounded-xl transition-colors text-left flex gap-3 relative group">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <Bell size={14} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-slate-800">{notif.data.title}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.data.message}</p>
                                                            <Link
                                                                href={notif.data.url}
                                                                className="text-xs font-bold text-emerald-600 mt-2 inline-block hover:underline"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    markAsRead(notif.id);
                                                                    router.visit(notif.data.url);
                                                                }}
                                                            >
                                                                Lihat Detail
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 text-center text-slate-400">
                                                    <Check size={24} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Tidak ada notifikasi baru</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-stone-100 bg-stone-50 text-center">
                                            <Link href={route('notifications.index')} className="text-xs font-bold text-slate-600 hover:text-emerald-600" onClick={() => setNotifOpen(false)}>
                                                Lihat Semua Notifikasi
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white border border-stone-200 shadow-sm hover:border-emerald-200 transition-all"
                                >
                                    <span className="hidden sm:block text-sm font-bold text-slate-700">
                                        {auth?.user?.name}
                                    </span>
                                    <img
                                        src={auth?.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'U')}&background=047857&color=fff`}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                                    />
                                    <ChevronDown size={16} className="text-slate-400 mr-1" />
                                </button>

                                {userMenuOpen && (
                                    <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 w-auto bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-stone-100 mb-2">
                                            <p className="text-sm font-bold text-slate-800">{auth?.user?.name}</p>
                                            <p className="text-xs text-slate-500">{auth?.user?.email}</p>
                                        </div>
                                        <Link
                                            href={route('profile.edit')}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <User size={16} /> Profil Saya
                                        </Link>
                                        {userRoles.some(role => ['admin', 'manager', 'staff'].includes(role)) && (
                                            <>
                                                <Link href={route('staff.food-orders.index')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${route().current('staff.food-orders.index') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-stone-50 hover:text-emerald-600'}`}>
                                                    <UtensilsCrossed size={20} />
                                                    Manajemen Pesanan
                                                </Link>
                                                <Link href={route('staff.pos.index')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${route().current('staff.pos.index') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-stone-50 hover:text-emerald-600'}`}>
                                                    <ShoppingCart size={20} />
                                                    Kasir POS
                                                </Link>
                                            </>
                                        )}
                                        <div className="h-px bg-stone-100 my-1"></div>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <LogOut size={16} /> Keluar
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-3 text-center text-xs text-gray-400 border-t border-gray-200">
                    © {new Date().getFullYear()} {cms_settings?.footer_text || 'All rights reserved.'}
                </footer>
            </div>
        </div>
    );
}
