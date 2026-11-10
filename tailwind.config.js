import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                emerald: {
                    50: 'var(--color-primary-50, #ecfdf5)',
                    100: 'var(--color-primary-100, #d1fae5)',
                    200: 'var(--color-primary-200, #a7f3d0)',
                    300: 'var(--color-primary-300, #6ee7b7)',
                    400: 'var(--color-primary-400, #34d399)',
                    500: 'var(--color-primary-500, #10b981)',
                    600: 'var(--color-primary-600, #059669)',
                    700: 'var(--color-primary-700, #047857)',
                    800: 'var(--color-primary-800, #065f46)',
                    900: 'var(--color-primary-900, #064e3b)',
                }
            }
        },
    },

    plugins: [forms],
};
