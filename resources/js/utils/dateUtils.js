/**
 * Date utility helpers for .
 *
 * Laravel is configured with timezone = Asia/Makassar (WITA, UTC+8).
 * However, Inertia serialises Carbon dates as plain strings like
 *   "2026-08-18 16:12:00"   ← no timezone designator
 * JavaScript's Date constructor treats these as *local* time when it contains
 * a space, but browsers differ — some treat it as UTC. To be consistent we
 * always interpret server-sent strings as WITA (UTC+8) by appending +08:00.
 *
 * ISO strings that already carry timezone info (ending in Z or ±HH:MM) are
 * passed through unchanged so we don't double-shift them.
 */

/**
 * Parse a server-sent datetime string (Asia/Makassar, UTC+8) into a Date.
 * @param {string|null} dateString
 * @returns {Date}
 */
export const parseServerDate = (dateString) => {
    if (!dateString) return new Date();
    // Already has timezone info — parse directly
    if (/Z$|[+-]\d{2}:\d{2}$/.test(String(dateString))) {
        return new Date(dateString);
    }
    // Treat as WITA (UTC+8)
    return new Date(String(dateString).replace(' ', 'T') + '+08:00');
};

/**
 * Format a server date string as a localised date (Indonesian).
 * @param {string} dateString
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export const formatDate = (dateString, options = { day: 'numeric', month: 'long', year: 'numeric' }) => {
    return parseServerDate(dateString).toLocaleDateString('id-ID', options);
};

/**
 * Format a server date string as a localised date + time (Indonesian).
 * @param {string} dateString
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
    return parseServerDate(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Return a human-readable relative time string.
 * @param {string} dateString
 * @returns {string}
 */
export const getRelativeTime = (dateString) => {
    const date = parseServerDate(dateString);
    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Baru saja';
    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
};
