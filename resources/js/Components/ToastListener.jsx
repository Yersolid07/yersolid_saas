import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

export default function ToastListener() {
    const { flash, errors } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.custom((t) => (
                <div role="status" aria-live="polite" className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-yellow-400`}>
                    <div className="flex-1 w-0 p-4 text-yellow-800">
                        {flash.warning}
                    </div>
                </div>
            ));
        }

        // Display validation errors as toast if there are any
        if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            toast.error(firstError);
        }
    }, [flash, errors]);

    return null;
}
