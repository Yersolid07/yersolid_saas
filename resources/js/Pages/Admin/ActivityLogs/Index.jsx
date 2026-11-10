import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { 
    Activity, 
    Search, 
    Filter,
    Calendar,
    User,
    Database,
    Clock,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { parseServerDate } from '@/utils/dateUtils';

export default function ActivityLogsIndex({ auth, logs, filters, users }) {
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, setData, get, processing } = useForm({
        log_name: filters.log_name || '',
        event: filters.event || '',
        causer_id: filters.causer_id || '',
        subject_type: filters.subject_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    // Auto-refresh the logs every 15 seconds so it feels real-time
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['logs'], preserveState: true, preserveScroll: true });
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('admin.activity-logs.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        router.get(route('admin.activity-logs.index'));
    };

    const getEventBadgeColor = (eventName) => {
        switch (eventName) {
            case 'created': return 'bg-green-100 text-green-800 border-green-200';
            case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatSubjectType = (type) => {
        if (!type) return '-';
        const parts = type.split('\\');
        return parts[parts.length - 1];
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Audit Trail (Activity Logs)</h2>}
        >
            <Head title="Audit Trail" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Filters Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border border-gray-100">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                                <Filter size={18} />
                                <h3>Filter Log Aktivitas</h3>
                            </div>
                            
                            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="lg:col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Aksi (Event)</label>
                                    <select
                                        value={data.event}
                                        onChange={e => setData('event', e.target.value)}
                                        className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
                                    >
                                        <option value="">Semua Aksi</option>
                                        <option value="created">Created (Dibuat)</option>
                                        <option value="updated">Updated (Diubah)</option>
                                        <option value="deleted">Deleted (Dihapus)</option>
                                    </select>
                                </div>
                                
                                <div className="lg:col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pelaku (User)</label>
                                    <select
                                        value={data.causer_id}
                                        onChange={e => setData('causer_id', e.target.value)}
                                        className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
                                    >
                                        <option value="">Semua User</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Modul</label>
                                    <select
                                        value={data.subject_type}
                                        onChange={e => setData('subject_type', e.target.value)}
                                        className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
                                    >
                                        <option value="">Semua Modul</option>
                                        <option value="user">Users / Akun</option>
                                        <option value="reservation">Reservasi</option>
                                        <option value="food_order">Pesanan Kafe</option>
                                        <option value="menu_item">Menu Kafe</option>
                                        <option value="inventory">Inventori</option>
                                        <option value="financial_transaction">Keuangan (Ledger)</option>
                                        <option value="facility">Fasilitas</option>
                                        <option value="setting">Pengaturan</option>
                                    </select>
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={data.date_from}
                                        onChange={e => setData('date_from', e.target.value)}
                                        className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
                                    />
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={data.date_to}
                                        onChange={e => setData('date_to', e.target.value)}
                                        className="w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md shadow-sm text-sm"
                                    />
                                </div>

                                <div className="lg:col-span-1 flex items-end space-x-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Search size={16} /> Cari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-100">
                        <div className="p-6">
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu & Tanggal</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelaku</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modul (Subject)</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail (Perubahan)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900 font-medium">
                                                        <Calendar size={14} className="mr-2 text-gray-400" />
                                                        {format(parseServerDate(log.created_at), 'dd MMM yyyy', { locale: id })}
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                        <Clock size={12} className="mr-2 text-gray-400" />
                                                        {format(parseServerDate(log.created_at), 'HH:mm:ss')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getEventBadgeColor(log.event)}`}>
                                                        {log.event.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {log.causer ? (
                                                            <>
                                                                <div className="flex-shrink-0 h-8 w-8">
                                                                    <img className="h-8 w-8 rounded-full border border-gray-200" src={log.causer.avatar_url} alt="" />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">{log.causer.name}</div>
                                                                    <div className="text-xs text-gray-500">ID: {log.causer_id}</div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <User size={16} className="mr-2" />
                                                                System / Guest
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Database size={14} className="mr-2 text-green-600" />
                                                        {formatSubjectType(log.subject_type)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">ID: {log.subject_id || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">
                                                        {(() => {
                                                            const actor = log.causer?.name || 'Sistem';
                                                            const moduleLabel = {
                                                                'User': 'Akun Pengguna', 'Reservation': 'Reservasi',
                                                                'FoodOrder': 'Pesanan Kafe', 'MenuItem': 'Menu',
                                                                'Inventory': 'Inventori', 'FinancialTransaction': 'Keuangan',
                                                                'Facility': 'Fasilitas', 'Setting': 'Pengaturan',
                                                                'Gazebo': 'Gazebo', 'Coupon': 'Kupon', 'Banner': 'Banner',
                                                            }[formatSubjectType(log.subject_type)] || formatSubjectType(log.subject_type);
                                                            const valMap = (v) => ({
                                                                pending:'Menunggu', preparing:'Disiapkan', ready:'Siap',
                                                                delivered:'Terkirim', completed:'Selesai', cancelled:'Dibatalkan',
                                                                paid:'Lunas', unpaid:'Belum Lunas', refunded:'Refund',
                                                                active:'Aktif', inactive:'Nonaktif',
                                                            }[v] ?? v);
                                                            const fieldMap = {
                                                                status:'Status', payment_status:'Status Pembayaran',
                                                                current_stock:'Stok', is_available:'Ketersediaan',
                                                                name:'Nama', price:'Harga', email:'Email',
                                                                minimum_stock:'Batas Stok Minimum',
                                                            };
                                                            const old = log.properties?.old || {};
                                                            const attr = log.properties?.attributes || {};
                                                            const changed = Object.keys(attr).filter(k => old[k] !== attr[k]);
                                                            let summary = '';
                                                            if (log.event === 'created') summary = `${actor} menambah ${moduleLabel} baru`;
                                                            else if (log.event === 'deleted') summary = `${actor} menghapus ${moduleLabel}`;
                                                            else if (changed.length > 0) {
                                                                const parts = changed.slice(0,3).map(k => {
                                                                    const label = fieldMap[k] || k;
                                                                    const change = (valMap(old[k]) && valMap(attr[k]))
                                                                        ? `dari "${valMap(old[k])}" jadi "${valMap(attr[k])}"`
                                                                        : 'diubah';
                                                                    return `${label} ${change}`;
                                                                });
                                                                summary = `${actor} mengubah ${moduleLabel}: ${parts.join(', ')}`;
                                                            } else {
                                                                summary = `${actor} mengubah ${moduleLabel}`;
                                                            }
                                                            return <span>{summary}</span>;
                                                        })()}
                                                    </div>
                                                    {(log.properties?.attributes || log.properties?.old) && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedLog(log);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="mt-2 flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <Eye size={14} className="mr-1.5" /> Lihat Detail Teknis
                                                        </button>
                                                    )}
                                                    {!log.properties?.attributes && !log.properties?.old && (
                                                        <span className="mt-1 block italic text-xs text-gray-400">Tidak ada detail atribut.</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.data.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Activity size={48} className="text-gray-300 mb-4" />
                                                        <p className="text-lg font-medium text-gray-600">Tidak ada log aktivitas ditemukan</p>
                                                        <p className="text-sm mt-1">Coba sesuaikan filter pencarian Anda.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {logs.links && logs.links.length > 3 && (
                                <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="text-sm text-gray-600">
                                        Menampilkan <span className="font-medium text-gray-900">{logs.from || 0}</span> - <span className="font-medium text-gray-900">{logs.to || 0}</span> dari <span className="font-medium text-gray-900">{logs.total}</span> data
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {logs.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                                                    link.active 
                                                        ? 'bg-gray-800 text-white border-gray-800 font-medium shadow-sm' 
                                                        : link.url 
                                                            ? 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300' 
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Detail Log */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-5 border-b pb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="text-indigo-600" /> Detail Perubahan (Audit Trail)
                        </h2>
                    </div>
                    
                    {selectedLog && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-4 flex gap-4 text-sm border border-gray-100">
                                <div className="flex-1">
                                    <span className="text-gray-500 block mb-1">Aksi:</span>
                                    <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-md border ${getEventBadgeColor(selectedLog.event)}`}>
                                        {selectedLog.event.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-gray-500 block mb-1">Modul:</span>
                                    <span className="font-semibold text-gray-900">{formatSubjectType(selectedLog.subject_type)}</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-gray-500 block mb-1">Waktu:</span>
                                    <span className="font-semibold text-gray-900">{format(parseServerDate(selectedLog.created_at), 'dd MMM yyyy HH:mm')}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 border-b w-1/3">Field / Kolom</th>
                                            {selectedLog.properties?.old && <th className="px-4 py-3 border-b text-red-600">Nilai Lama</th>}
                                            {selectedLog.properties?.attributes && <th className="px-4 py-3 border-b text-green-600">Nilai Baru</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.keys(selectedLog.properties?.attributes || selectedLog.properties?.old || {}).map((key) => {
                                            const oldVal = selectedLog.properties?.old?.[key];
                                            const newVal = selectedLog.properties?.attributes?.[key];
                                            if (oldVal === newVal && selectedLog.event === 'updated') return null;
                                            const fieldLabel = {
                                                status:'Status', payment_status:'Status Pembayaran',
                                                current_stock:'Stok', is_available:'Ketersediaan',
                                                name:'Nama', price:'Harga', email:'Email',
                                                minimum_stock:'Batas Stok Minimum',
                                            }[key] || key;
                                            const valMap = (v) => ({
                                                pending:'Menunggu', preparing:'Disiapkan', ready:'Siap',
                                                delivered:'Terkirim', completed:'Selesai', cancelled:'Dibatalkan',
                                                paid:'Lunas', unpaid:'Belum Lunas', refunded:'Refund',
                                                active:'Aktif', inactive:'Nonaktif', true:'Ya', false:'Tidak',
                                            }[v] ?? v);
                                            return (
                                                <tr key={key} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-900 text-xs">
                                                        {fieldLabel}
                                                        <span className="block font-mono text-[10px] text-gray-400">{key}</span>
                                                    </td>
                                                    {selectedLog.properties?.old && (
                                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 break-all bg-red-50/30">
                                                            {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(valMap(oldVal) ?? '-')}
                                                        </td>
                                                    )}
                                                    {selectedLog.properties?.attributes && (
                                                        <td className="px-4 py-3 font-mono text-xs text-gray-600 break-all bg-green-50/30">
                                                            {typeof newVal === 'object' ? JSON.stringify(newVal) : String(valMap(newVal) ?? '-')}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>
                            Tutup
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
