import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Hotel, Trees, Waves, Coffee, Eye } from 'lucide-react';

const typeConfig = {
    homestay: { label: 'Homestay / Villa', icon: Hotel, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    gazebo: { label: 'Gazebo', icon: Trees, color: 'bg-green-50 text-green-700 border-green-200' },
    pool: { label: 'Kolam Renang', icon: Waves, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    cafe: { label: 'Café', icon: Coffee, color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function FacilityCard({ facility, onToggle, onDelete }) {
    const TypeIcon = typeConfig[facility.type]?.icon || Hotel;
    const typeColor = typeConfig[facility.type]?.color;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
            {/* Image */}
            <div className="relative h-44 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 overflow-hidden">
                {facility.image_url ? (
                    <img
                        src={`/storage/${facility.image_url}`}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <TypeIcon size={48} className="text-green-400 dark:text-green-600" />
                    </div>
                )}
                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    facility.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                }`}>
                    {facility.is_active ? 'Aktif' : 'Nonaktif'}
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-tight">{facility.name}</h3>
                    <span className={`shrink-0 text-xs border px-2 py-0.5 rounded-full ${typeColor}`}>
                        {typeConfig[facility.type]?.label}
                    </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{facility.description}</p>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {facility.capacity && <span>👥 {facility.capacity} orang</span>}
                    {facility.price_per_day && (
                        <span>💰 Rp {Number(facility.price_per_day).toLocaleString('id-ID')}{facility.price_unit || '/malam'}</span>
                    )}
                    {facility.price_per_hour && (
                        <span>⏱️ Rp {Number(facility.price_per_hour).toLocaleString('id-ID')}/jam</span>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                        href={route('admin.facilities.show', facility.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
                    >
                        <Eye size={13} /> Lihat
                    </Link>
                    <Link
                        href={route('admin.facilities.edit', facility.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                    >
                        <Edit size={13} /> Edit
                    </Link>
                    <button
                        onClick={() => onToggle(facility)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 ml-auto"
                    >
                        {facility.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {facility.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                        onClick={() => onDelete(facility)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FacilitiesIndex({ facilities, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [type, setType] = useState(filters?.type || '');
    const [status, setStatus] = useState(filters?.status || '');
    const isFirstRender = useRef(true);

    const applyFilter = useCallback(
        debounce((s, t, st) => {
            router.get(
                route('admin.facilities.index'),
                { search: s, type: t, status: st },
                { preserveState: true, replace: true }
            );
        }, 300),
        []
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        applyFilter(search, type, status);
    }, [search, type, status, applyFilter]);

    const handleToggle = (facility) => {
        router.patch(route('admin.facilities.toggle-status', facility.id));
    };

    const handleDelete = async (facility) => {
        if (await window.customConfirm(`Hapus fasilitas "${facility.name}"?`)) {
            router.delete(route('admin.facilities.destroy', facility.id));
        }
    };

    return (
        <AppLayout title="Manajemen Fasilitas">
            <Head title="Fasilitas — Admin " />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Fasilitas Resort</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{facilities.total} fasilitas terdaftar</p>
                </div>
                <Link
                    href={route('admin.facilities.create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={16} /> Tambah Fasilitas
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari fasilitas..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                >
                    <option value="">Semua Tipe</option>
                    <option value="homestay">Homestay</option>
                    <option value="gazebo">Gazebo</option>
                    <option value="pool">Kolam Renang</option>
                    <option value="cafe">Café</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                >
                    <option value="">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {facilities.data?.map(facility => (
                    <FacilityCard
                        key={facility.id}
                        facility={facility}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                ))}
                {facilities.data?.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-400">
                        <Hotel size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Tidak ada fasilitas ditemukan</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {facilities.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {facilities.links?.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                link.active
                                    ? 'bg-green-600 text-white'
                                    : link.url
                                    ? 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            preserveScroll
                        />
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
