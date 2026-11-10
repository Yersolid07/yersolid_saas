import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Download, TrendingUp, TrendingDown, CalendarDays, FileDown, FileSpreadsheet, DollarSign, ShoppingBag, Users, X, Search } from 'lucide-react';
import { useState, useRef } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatDate } from '@/utils/dateUtils';

export default function Index({ stats, chartData, filters, bestSellingMenus, recentRestocks, expenses, expenseCategories = [], totalExpensePeriod = 0 }) {
    const [periodFrom, setPeriodFrom] = useState(filters.period_from || '');
    const [periodTo, setPeriodTo] = useState(filters.period_to || '');

    const [expCategory, setExpCategory] = useState(filters.exp_category || '');
    const [expSearch, setExpSearch] = useState(filters.exp_search || '');
    const [expSort, setExpSort] = useState(filters.exp_sort || 'date_desc');

    const [showManualTxModal, setShowManualTxModal] = useState(false);
    
    const { data: txData, setData: setTxData, post: postTx, processing: txProcessing, errors: txErrors, reset: txReset } = useForm({
        type: 'expense',
        category: 'Operasional Cafe',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });

    const handleManualTxSubmit = (e) => {
        e.preventDefault();
        postTx(route('admin.reports.store-transaction'), {
            onSuccess: () => {
                setShowManualTxModal(false);
                txReset();
            }
        });
    };


    const handleFilter = (e) => {
        e.preventDefault();
        router.get(
            route('admin.reports.index'),
            { period_from: periodFrom, period_to: periodTo },
            { preserveState: true }
        );
    };

    const applyExpenseFilter = () => {
        router.get(
            route('admin.reports.index'),
            {
                period_from: periodFrom,
                period_to: periodTo,
                exp_category: expCategory || '',
                exp_search: expSearch || '',
                exp_sort: expSort || 'date_desc',
            },
            { preserveState: true, preserveScroll: true, only: ['expenses', 'totalExpensePeriod', 'filters'] }
        );
    };

    const expenseSearchTimer = useRef(null);
    const onExpenseSearchChange = (value) => {
        setExpSearch(value);
        clearTimeout(expenseSearchTimer.current);
        expenseSearchTimer.current = setTimeout(() => applyExpenseFilter(), 400);
    };

    const onExpenseCategoryChange = (value) => {
        setExpCategory(value);
        applyExpenseFilter();
    };

    const onExpenseSortChange = (value) => {
        setExpSort(value);
        applyExpenseFilter();
    };

    const resetExpenseFilter = () => {
        setExpCategory('');
        setExpSearch('');
        setExpSort('date_desc');
        applyExpenseFilter();
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('id-ID');
    };

    // formatDate imported from @/utils/dateUtils

    return (
        <AppLayout title="Laporan & Analitik">
            <Head title="Laporan Komprehensif" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-emerald-500" /> Laporan Komprehensif
                    </h2>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowManualTxModal(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold text-sm shadow-sm"
                        >
                            <DollarSign size={18} /> Catat OPEX / Manual
                        </button>
                        <a 
                            href={route('admin.reports.pdf', { type: 'comprehensive', period_from: periodFrom, period_to: periodTo })}
                            target="_blank"
                            className="flex items-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-xl transition-colors font-semibold text-sm shadow-sm"
                        >
                            <FileDown size={18} className="text-red-500" /> Export PDF
                        </a>
                        <a 
                            href={route('admin.reports.excel', { type: 'comprehensive', period_from: periodFrom, period_to: periodTo })}
                            className="flex items-center gap-2 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-xl transition-colors font-semibold text-sm shadow-sm"
                        >
                            <FileSpreadsheet size={18} className="text-emerald-500" /> Export Excel
                        </a>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <InputLabel htmlFor="period_from" value="Mulai Tanggal" />
                            <TextInput
                                id="period_from"
                                type="date"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl shadow-sm"
                                value={periodFrom}
                                onChange={(e) => setPeriodFrom(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <InputLabel htmlFor="period_to" value="Sampai Tanggal" />
                            <TextInput
                                id="period_to"
                                type="date"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl shadow-sm"
                                value={periodTo}
                                onChange={(e) => setPeriodTo(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <PrimaryButton type="submit" className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 rounded-xl">
                                Terapkan Filter
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 shadow-md text-white">
                        <div className="flex items-center justify-between mb-4 opacity-80">
                            <span className="font-semibold text-sm">Total Pendapatan Kotor</span>
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-3xl font-black mb-1">Rp {formatPrice(stats.total_revenue)}</h3>
                        <p className="text-xs opacity-75">Dari Reservasi & Resto</p>
                    </div>

                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-6 shadow-md text-white">
                        <div className="flex items-center justify-between mb-4 opacity-80">
                            <span className="font-semibold text-sm">Total Pengeluaran / HPP</span>
                            <TrendingDown size={20} />
                        </div>
                        <h3 className="text-3xl font-black mb-1">Rp {formatPrice(stats.total_expense)}</h3>
                        <p className="text-xs opacity-75">Estimasi Stok Terpakai</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-md text-white">
                        <div className="flex items-center justify-between mb-4 opacity-80">
                            <span className="font-semibold text-sm">Laba Bersih (Net Profit)</span>
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-3xl font-black mb-1">Rp {formatPrice(stats.net_profit)}</h3>
                        <p className="text-xs opacity-90">Pendapatan - Pengeluaran - Potongan Merchant</p>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span>Potongan Merchant (Tripay)</span>
                                <span>Rp {formatPrice(stats.total_fees || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
                        <div className="flex items-center justify-between mb-4 text-slate-500">
                            <span className="font-semibold text-sm">Volume Aktivitas & Rincian</span>
                            <ShoppingBag size={20} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Total Pengunjung:</span>
                                <span className="font-bold text-slate-900">{stats.total_visitors} Org</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Total Reservasi:</span>
                                <span className="font-bold text-slate-900">{stats.total_reservations}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Pesanan Makanan:</span>
                                <span className="font-bold text-slate-900">{stats.total_food_orders}</span>
                            </div>
                            <div className="border-t border-stone-100 my-2 pt-2"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Fasilitas:</span>
                                <span className="font-bold text-slate-900">Rp {formatPrice(stats.revenue_reservations || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Cafe (F&B):</span>
                                <span className="font-bold text-slate-900">Rp {formatPrice(stats.revenue_food_orders || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Tiket:</span>
                                <span className="font-bold text-slate-900">Rp {formatPrice(stats.revenue_tickets || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-900 mb-6">Tren Keuangan (Pemasukan vs Pengeluaran)</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip 
                                    formatter={(value) => `Rp ${formatPrice(value)}`}
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="Pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-900 mb-6">Tren Laba Bersih (Profit)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip 
                                    formatter={(value) => `Rp ${formatPrice(value)}`}
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    cursor={{fill: '#f8fafc'}}
                                />
                                <Bar dataKey="profit" name="Laba Bersih" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                        <ShoppingBag className="text-indigo-500" size={20} /> Top Menu Terlaris (Berdasarkan Porsi)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Menu</th>
                                    <th className="px-4 py-3 text-center">Terjual</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestSellingMenus?.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                            {item.menu_item?.name || 'Item Dihapus'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-indigo-600">{item.total_qty}</td>
                                        <td className="px-4 py-3 text-right">Rp {formatPrice(item.total_revenue)}</td>
                                    </tr>
                                ))}
                                {(!bestSellingMenus || bestSellingMenus.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400">Belum ada data penjualan menu pada periode ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                        <FileText className="text-emerald-500" size={20} /> Riwayat Restock (Stok Masuk)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Bahan Baku</th>
                                    <th className="px-4 py-3">Jumlah Masuk</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Pengeluaran Riil</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRestocks?.map((restock, index) => (
                                    <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div>{restock.inventory?.name || 'Bahan Dihapus'}</div>
                                            <div className="text-xs text-slate-400 font-normal">{formatDate(restock.created_at)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                +{parseFloat(restock.quantity)} {restock.inventory?.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                                            {parseFloat(restock.cost) > 0 ? `Rp ${formatPrice(restock.cost)}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {(!recentRestocks || recentRestocks.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400">Belum ada riwayat restock bahan baku pada periode ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Expense Ledger Section ── */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingDown className="text-rose-500" size={22} /> Riwayat Pengeluaran
                    </h3>
                    <div className="text-sm text-slate-500">
                        Total periode: <span className="font-bold text-rose-600">Rp {formatPrice(totalExpensePeriod)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <TextInput
                            type="text"
                            value={expSearch}
                            onChange={(e) => onExpenseSearchChange(e.target.value)}
                            placeholder="Cari keterangan pengeluaran..."
                            className="w-full pl-9 pr-3 py-2.5"
                        />
                    </div>
                    <select
                        value={expCategory}
                        onChange={(e) => onExpenseCategoryChange(e.target.value)}
                        className="w-full md:w-56 bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl py-2.5"
                    >
                        <option value="">Semua Kategori</option>
                        {expenseCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select
                        value={expSort}
                        onChange={(e) => onExpenseSortChange(e.target.value)}
                        className="w-full md:w-56 bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl py-2.5"
                    >
                        <option value="date_desc">Waktu: Terbaru</option>
                        <option value="date_asc">Waktu: Terlama</option>
                        <option value="amount_desc">Nominal: Terbesar</option>
                        <option value="amount_asc">Nominal: Terkecil</option>
                        <option value="category">Kategori A-Z</option>
                    </select>
                    {(expCategory || expSearch || expSort !== 'date_desc') && (
                        <button
                            onClick={resetExpenseFilter}
                            className="text-sm font-semibold text-stone-500 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        >
                            Reset
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-bold">Tanggal</th>
                                    <th className="p-4 font-bold">Kategori</th>
                                    <th className="p-4 font-bold">Keterangan</th>
                                    <th className="p-4 font-bold text-right">Jumlah</th>
                                    <th className="p-4 font-bold">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {expenses?.data?.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                                        <td className="p-4">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-700">{tx.description}</td>
                                        <td className="p-4 text-right font-bold text-rose-600 whitespace-nowrap">Rp {formatPrice(tx.amount)}</td>
                                        <td className="p-4 text-slate-500 text-sm whitespace-nowrap">{tx.user?.name || '-'}</td>
                                    </tr>
                                ))}
                                {(!expenses?.data || expenses.data.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">
                                            <TrendingDown size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Belum ada pengeluaran pada periode / filter ini.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {expenses?.links && (
                        <div className="p-4 border-t border-stone-100 flex flex-wrap gap-1 justify-center">
                            {expenses.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, only: ['expenses', 'totalExpensePeriod'] })}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${link.active ? 'bg-indigo-600 text-white' : 'bg-stone-50 text-slate-600 hover:bg-stone-100'} ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showManualTxModal} onClose={() => setShowManualTxModal(false)}>
                <form onSubmit={handleManualTxSubmit} className="p-6 bg-white dark:bg-slate-900 rounded-2xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="text-indigo-500" />
                            Catat Transaksi Manual / OPEX
                        </h2>
                        <button type="button" onClick={() => setShowManualTxModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="type" value="Jenis Transaksi" />
                            <select
                                id="type"
                                className="mt-1 block w-full rounded-xl border-stone-200 focus:border-indigo-500 shadow-sm"
                                value={txData.type}
                                onChange={(e) => setTxData('type', e.target.value)}
                                required
                            >
                                <option value="expense">Pengeluaran (Expense / OPEX)</option>
                                <option value="income">Pemasukan (Income)</option>
                            </select>
                            <InputError message={txErrors.type} className="mt-2" />
                        </div>

                        {txData.type === 'expense' && (
                            <div>
                                <InputLabel htmlFor="category" value="Kategori Pengeluaran" />
                                <select
                                    id="category"
                                    className="mt-1 block w-full rounded-xl border-stone-200 focus:border-indigo-500 shadow-sm"
                                    value={txData.category}
                                    onChange={(e) => setTxData('category', e.target.value)}
                                    required
                                >
                                    {expenseCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <InputError message={txErrors.category} className="mt-2" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="amount" value="Jumlah (Rp)" />
                            <TextInput
                                id="amount"
                                type="number"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl shadow-sm"
                                value={txData.amount}
                                onChange={(e) => setTxData('amount', e.target.value)}
                                required
                                min="1"
                            />
                            <InputError message={txErrors.amount} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value="Keterangan (Gaji, Listrik, Wifi, dll)" />
                            <TextInput
                                id="description"
                                type="text"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl shadow-sm"
                                value={txData.description}
                                onChange={(e) => setTxData('description', e.target.value)}
                                required
                                placeholder="Cth: Tagihan Listrik Bulan Ini"
                            />
                            <InputError message={txErrors.description} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="transaction_date" value="Tanggal Transaksi" />
                            <TextInput
                                id="transaction_date"
                                type="date"
                                className="mt-1 block w-full bg-stone-50 border-stone-200 focus:border-indigo-500 rounded-xl shadow-sm"
                                value={txData.transaction_date}
                                onChange={(e) => setTxData('transaction_date', e.target.value)}
                                required
                            />
                            <InputError message={txErrors.transaction_date} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setShowManualTxModal(false)} type="button">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton 
                            className="bg-indigo-600 hover:bg-indigo-700" 
                            disabled={txProcessing}
                        >
                            {txProcessing ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}

