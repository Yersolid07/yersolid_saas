import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Ya',
        cancelText: 'Batal',
        isDanger: true,
        resolve: null
    });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Konfirmasi',
                message: options.message || (typeof options === 'string' ? options : 'Apakah Anda yakin?'),
                confirmText: options.confirmText || 'Ya, Lanjutkan',
                cancelText: options.cancelText || 'Batal',
                isDanger: options.isDanger !== undefined ? options.isDanger : true,
                resolve
            });
        });
    }, []);

    React.useEffect(() => {
        window.customConfirm = (msg) => confirm({ message: msg });
        return () => { delete window.customConfirm; };
    }, [confirm]);

    const handleConfirm = () => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                isDanger={confirmState.isDanger}
            />
        </ConfirmContext.Provider>
    );
};
