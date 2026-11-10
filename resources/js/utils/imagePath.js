/**
 * Utility untuk memproses dan menormalisasi URL gambar dari database
 * secara aman, termasuk kompatibilitas di Windows (backslash).
 *
 * @param {string} path Path gambar dari database (contoh: 'facilities\\Mujair.jpeg' atau 'http://...')
 * @param {string} fallback URL gambar default jika path kosong
 * @returns {string} URL yang sudah di-resolve
 */
export const getImageUrl = (path, fallback = '/storage/facilities/placeholder.jpg') => {
    if (!path) return fallback;

    // Jika path sudah berupa full URL eksternal, gunakan langsung
    if (path.startsWith('http')) return path;

    // Jika sudah diawali '/storage/', gunakan langsung (kemungkinan data hardcoded / lama)
    if (path.startsWith('/storage/')) {
        // Konversi backslash ke forward slash untuk amannya
        return path.replace(/\\/g, '/');
    }

    // Konversi backslash (format OS Windows) ke forward slash
    const normalizedPath = path.replace(/\\/g, '/');

    return `/storage/${normalizedPath}`;
};
