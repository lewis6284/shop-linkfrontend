import React from 'react';
import Modal from './Modal';
import { getImageUrl } from '../utils/imageUrl';
import { Package, Tag, Barcode, Scale, DollarSign, Layers, BarChart2 } from 'lucide-react';

const ProductDetailsModal = ({ isOpen, onClose, product }) => {
    if (!product) return null;

    const getStockQuantity = (p) => {
        const shopTotal = p.Stocks?.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
        if (shopTotal > 0) return shopTotal;
        if (p.GlobalStock?.quantity != null) return Number(p.GlobalStock.quantity);
        return Number(shopTotal || 0);
    };

    const stockQuantity = getStockQuantity(product);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Details">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-1/2 flex-shrink-0">
                    <div className="w-full aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm flex items-center justify-center relative group">
                        {product.image_url ? (
                            <img 
                                src={getImageUrl(product.image_url, 'placeholder-product.png')} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <Package size={64} className="mb-4 opacity-50" />
                                <span className="text-sm font-bold uppercase tracking-widest opacity-50">No Image</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 flex flex-col space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">{product.name}</h2>
                        {product.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {product.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                <Tag size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Brand</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                {product.Brand?.name || 'No Brand'}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                <Layers size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Category</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                {product.Category?.name || 'Uncategorized'}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                <Barcode size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">SKU / Code</span>
                            </div>
                            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white truncate">
                                {product.sku || product.barcode || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                                <Scale size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Unit</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                {product.Unit?.name ? `${product.Unit.name} (${product.Unit.short_name})` : product.unit_of_measure || 'pcs'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800/50">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">Selling Price</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                {Number(product.sellingPrice).toLocaleString()} <span className="text-sm text-gray-500 dark:text-gray-400">Fbu</span>
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Stock Level</span>
                            <span className={`text-lg font-black flex items-center gap-1.5 ${stockQuantity <= (product.min_stock_level || 5) ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                <BarChart2 size={18} />
                                {stockQuantity}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black rounded-xl hover:bg-gray-800 dark:hover:bg-white transition-all active:scale-95 uppercase tracking-wider text-sm shadow-xl shadow-gray-900/20 dark:shadow-gray-100/20"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailsModal;
