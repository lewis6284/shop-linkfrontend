import React, { useEffect } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import { X, Package } from 'lucide-react';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !product) return null;

    return (
        /* Full-screen backdrop — click outside to close */
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close button — always visible */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                aria-label="Close preview"
            >
                <X size={22} />
            </button>

            {/* Image container — stops propagation so clicking image doesn't close */}
            <div
                className="relative max-w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {product.image_url ? (
                    <div className="relative">
                        <img
                            src={getImageUrl(product.image_url, 'placeholder-product.png')}
                            alt={product.name}
                            className="block max-w-[90vw] max-h-[85vh] w-auto h-auto rounded-2xl shadow-2xl object-contain"
                            style={{ imageRendering: 'auto' }}
                        />
                        {/* Subtle info overlay at the bottom of the image */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl px-5 py-4">
                            <p className="text-white font-black text-lg leading-tight drop-shadow">{product.name}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                {product.Category?.name && (
                                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{product.Category.name}</span>
                                )}
                                {product.Brand?.name && (
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">• {product.Brand.name}</span>
                                )}
                                {product.sellingPrice && (
                                    <span className="ml-auto text-sm font-black text-white/90">
                                        {Number(product.sellingPrice).toLocaleString()} <span className="text-[10px] font-bold opacity-70">Fbu</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* No image fallback */
                    <div className="flex flex-col items-center justify-center text-white/50 gap-4 bg-white/5 rounded-2xl p-16 backdrop-blur-sm border border-white/10">
                        <Package size={72} />
                        <div className="text-center">
                            <p className="font-black text-xl text-white">{product.name}</p>
                            <p className="text-sm mt-1 text-white/50 uppercase tracking-widest">No image available</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tap anywhere hint on mobile */}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                Tap outside to close
            </p>
        </div>
    );
};

export default ProductDetailsModal;
