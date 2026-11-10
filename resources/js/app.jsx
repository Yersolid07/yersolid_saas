import '../css/app.css';
import './bootstrap';
import './i18n';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

import ErrorBoundary from './Components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './Contexts/ConfirmContext';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary>
                <ConfirmProvider>
                    <App {...props} />
                    <Toaster position="top-right" />
                </ConfirmProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
