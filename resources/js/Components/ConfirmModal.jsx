import { AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import DangerButton from './DangerButton';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = "Konfirmasi", message = "Apakah Anda yakin?", confirmText = "Ya, Lanjutkan", cancelText = "Batal", isDanger = true }) {
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {title}
                </h3>
                
                <p className="text-slate-500 mb-8">
                    {message}
                </p>
                
                <div className="flex gap-3 justify-end">
                    <SecondaryButton onClick={onClose}>
                        {cancelText}
                    </SecondaryButton>
                    
                    {isDanger ? (
                        <DangerButton onClick={() => { onConfirm(); onClose(); }}>
                            {confirmText}
                        </DangerButton>
                    ) : (
                        <PrimaryButton onClick={() => { onConfirm(); onClose(); }} className="bg-emerald-600 hover:bg-emerald-700">
                            {confirmText}
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </Modal>
    );
}
