import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Package, ChevronDown } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

/**
 * A searchable product picker that shows a text input + dropdown list.
 * Props:
 *   products  – full product array
 *   value     – currently selected product id
 *   onChange  – (id) => void
 *   required  – bool
 *   placeholder – string
 */
const SearchableProductSelect = ({ products = [], value, onChange, required = false, placeholder = 'Search product by name or SKU...' }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = products.find(p => p.id === value) || null;

    // Filter products by query
    const filtered = query.trim().length === 0
        ? products
        : products.filter(p => {
            const q = query.toLowerCase();
            return (
                p.name?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                p.barcode?.toLowerCase().includes(q)
            );
        });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (product) => {
        onChange(product.id);
        setIsOpen(false);
        setQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
        setIsOpen(false);
    };

    const handleOpen = () => {
        setIsOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Hidden native input for form validation */}
            <input type="hidden" value={value || ''} required={required} />

            {/* Trigger — shows selected product or placeholder */}
            {!isOpen ? (
                <button
                    type="button"
                    onClick={handleOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-left outline-none hover:border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                    {selected ? (
                        <>
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-center">
                                {selected.image_url
                                    ? <img src={getImageUrl(selected.image_url)} alt="" className="w-full h-full object-cover" />
                                    : <Package size={14} className="text-gray-400" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{selected.name}</p>
                                {(selected.sku || selected.barcode) && (
                                    <p className="text-[10px] font-mono text-gray-400 truncate">{selected.sku || selected.barcode}</p>
                                )}
                            </div>
                            <button type="button" onClick={handleClear} className="p-1 text-gray-400 hover:text-rose-500 shrink-0 transition-colors">
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Search size={16} className="text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-400 flex-1">{placeholder}</span>
                            <ChevronDown size={16} className="text-gray-400 shrink-0" />
                        </>
                    )}
                </button>
            ) : (
                /* Search input — shown when dropdown is open */
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-900 border-2 border-brand-500 rounded-xl text-sm font-bold dark:text-white outline-none shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => { setIsOpen(false); setQuery(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Dropdown list */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm font-bold">
                                No products match "{query}"
                            </div>
                        ) : (
                            filtered.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelect(p)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 text-left group ${p.id === value ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                                >
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shrink-0 flex items-center justify-center">
                                        {p.image_url
                                            ? <img src={getImageUrl(p.image_url)} alt="" className="w-full h-full object-cover" />
                                            : <Package size={14} className="text-gray-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors ${p.id === value ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
                                            {p.name}
                                        </p>
                                        <p className="text-[10px] font-mono text-gray-400 truncate">
                                            {p.sku || p.barcode || '—'}
                                        </p>
                                    </div>
                                    {p.id === value && (
                                        <span className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider shrink-0">Selected</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 font-bold">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableProductSelect;
