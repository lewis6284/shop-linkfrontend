import React from 'react';
import { X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel', 
    type = 'danger' 
}) => {
    if (!isOpen) return null;

    const styles = {
        danger: {
            icon: <AlertTriangle className="text-rose-600 dark:text-rose-400" size={24} />,
            iconBg: 'bg-rose-100 dark:bg-rose-950/40',
            btn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white shadow-lg shadow-rose-500/20'
        },
        warning: {
            icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />,
            iconBg: 'bg-amber-100 dark:bg-amber-950/40',
            btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white shadow-lg shadow-amber-500/20'
        },
        success: {
            icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
            btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        },
        info: {
            icon: <Info className="text-brand-600 dark:text-brand-400" size={24} />,
            iconBg: 'bg-brand-100 dark:bg-brand-950/40',
            btn: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 text-white shadow-lg shadow-brand-500/20'
        }
    };

    const currentStyle = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 border dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${currentStyle.iconBg}`}>
                            {currentStyle.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`px-5 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${currentStyle.btn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
