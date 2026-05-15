import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { productService } from "../services/inventoryService";
import { customerService } from "../services/customerService";
import { saleService } from "../services/saleService";
import { getEffectivePrice } from "../utils/calculations";

import {
    ShoppingCart,
    CreditCard,
    Plus,
    Minus,
    Trash2,
    User,
    X,
    Loader2,
    Package,
    Barcode,
    ScanLine
} from "lucide-react";

import toast from "react-hot-toast";

const POS = () => {
    const { user, activeShopId } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerResults, setCustomerResults] = useState([]);

    const searchRef = useRef(null);
    const scannerBuffer = useRef("");
    const lastKeyTime = useRef(Date.now());

    // ==========================================
    // HIGH-SPEED GLOBAL SCANNER LISTENER
    // ==========================================
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const currentTime = Date.now();
            
            // If typing is very fast (hardware scanner), buffer it
            if (currentTime - lastKeyTime.current < 30) {
                if (e.key === "Enter") {
                    const code = scannerBuffer.current;
                    if (code) handleScan(code);
                    scannerBuffer.current = "";
                } else if (e.key.length === 1) {
                    scannerBuffer.current += e.key;
                }
            } else {
                // Regular typing or slow input
                if (e.key === "Enter" && scannerBuffer.current.length > 5) {
                    handleScan(scannerBuffer.current);
                    scannerBuffer.current = "";
                } else {
                    scannerBuffer.current = e.key.length === 1 ? e.key : "";
                }
            }
            lastKeyTime.current = currentTime;
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    const handleScan = async (barcode) => {
        try {
            const res = await productService.getAll({ search: barcode });
            const products = Array.isArray(res) ? res : res?.products || [];
            const exact = products.find(p => p.barcode === barcode);
            
            if (exact) {
                addToCart(exact);
                toast.success(`Scanned: ${exact.name}`, { position: 'top-center' });
            } else {
                setSearchQuery(barcode); // Fallback to manual search
            }
        } catch (err) {
            console.error("Scanner error", err);
        }
    };

    // =========================
    // PRODUCT SEARCH
    // =========================
    useEffect(() => {
        const fetch = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await productService.getAll({ search: searchQuery });
                const products = Array.isArray(res) ? res : res?.products || [];
                setSearchResults(products);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        const t = setTimeout(fetch, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // =========================
    // CART LOGIC
    // =========================
    const addToCart = (product) => {
        setCart(prev => {
            const exist = prev.find(i => i.id === product.id);
            if (exist) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        navigator.vibrate?.(40);
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
    };

    const totals = cart.reduce((acc, item) => {
        const p = getEffectivePrice(item, customer?.customer_type || "retail", item.qty);
        return {
            subtotal: acc.subtotal + p.subtotal,
            tax: acc.tax + p.taxAmount,
            total: acc.total + p.total
        };
    }, { subtotal: 0, tax: 0, total: 0 });

    // =========================
    // CHECKOUT
    // =========================
    const checkout = async () => {
        if (cart.length === 0) return;
        const loading = toast.loading("Finalizing sale...");
        try {
            const payload = {
                CustomerId: customer?.id || null,
                items: cart.map(i => {
                    const p = getEffectivePrice(i, customer?.customer_type || "retail", i.qty);
                    return {
                        ProductId: i.id,
                        quantity: i.qty,
                        unitPrice: p.unitPrice,
                        total: p.total
                    };
                }),
                paymentMethod: "CASH",
                ShopId: activeShopId,
                status: 'COMPLETED'
            };

            await saleService.create(payload);
            setCart([]);
            setSearchQuery("");
            setCustomer(null);
            toast.success("Sale Successful!", { id: loading });
        } catch (e) {
            toast.error("Checkout failed. Check stock levels.", { id: loading });
        }
    };

    const [showCartMobile, setShowCartMobile] = useState(false);

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row bg-white dark:bg-gray-950 overflow-hidden select-none">
            
            {/* LEFT: Product Browser */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all ${showCartMobile ? 'hidden' : 'flex'}`}>
                {/* Search Bar */}
                <div className="p-4 lg:p-6 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500" size={20} />
                            <input
                                ref={searchRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products or scan barcode..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-brand-500 outline-none font-black text-gray-900 dark:text-white transition-all shadow-inner"
                            />
                        </div>
                        <button 
                            onClick={() => setIsCustomerModalOpen(true)}
                            className="w-full md:w-auto px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <User size={20} className={customer ? 'text-brand-600' : 'text-gray-400'} />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Customer</p>
                                <p className="font-black text-xs text-gray-900 dark:text-white uppercase truncate max-w-[120px]">
                                    {customer?.full_name || 'Walk-in Customer'}
                                </p>
                            </div>
                            {customer && <X size={14} className="text-gray-400" onClick={(e) => { e.stopPropagation(); setCustomer(null); }} />}
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-950">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <Loader2 className="animate-spin text-brand-600" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest">Searching Catalog...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {searchResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group overflow-hidden h-[180px]"
                                >
                                    <div className="h-24 w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <Package size={32} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between text-left">
                                        <p className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 leading-tight uppercase">{p.name}</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-gray-400 font-mono">{p.sku || p.barcode.substring(0,8)}</p>
                                            <p className="font-black text-brand-600 dark:text-brand-400">{Number(p.sellingPrice).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10">
                            <ScanLine size={120} strokeWidth={1} />
                            <p className="mt-6 text-2xl font-black uppercase tracking-[0.4em]">Ready to Scan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart & Totals */}
            <div className={`
                fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0
                lg:w-[450px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col
                transition-transform lg:translate-x-0 ${showCartMobile ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {/* Cart Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-black flex items-center gap-3 dark:text-white">
                        <ShoppingCart className="text-brand-600" size={24} /> 
                        ORDER CART
                        <span className="bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCart([])} className="p-2 text-gray-400 hover:text-rose-600 transition-colors">
                            <Trash2 size={20} />
                        </button>
                        <button onClick={() => setShowCartMobile(false)} className="lg:hidden p-2 text-gray-400">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Package size={48} />
                            <p className="mt-4 font-black uppercase text-[10px] tracking-widest">Cart is empty</p>
                        </div>
                    ) : cart.map(item => {
                        const p = getEffectivePrice(item, customer?.customer_type || 'retail', item.qty);
                        return (
                            <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-right-4">
                                <div className="flex justify-between mb-2">
                                    <p className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 uppercase">{item.name}</p>
                                    <button onClick={() => updateQty(item.id, -item.qty)} className="text-gray-300 hover:text-rose-500">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
                                        <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-400 hover:text-brand-600"><Minus size={14} /></button>
                                        <span className="w-10 text-center font-black text-sm dark:text-white">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-400 hover:text-brand-600"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Total</p>
                                        <p className="font-black text-lg text-gray-900 dark:text-white">{p.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Summary */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>{totals.subtotal.toLocaleString()} Fbu</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                            <span>Total Tax (VAT)</span>
                            <span>{totals.tax.toLocaleString()} Fbu</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
                            <p className="font-black text-xl dark:text-white">TOTAL</p>
                            <p className="text-4xl font-black text-brand-600 dark:text-brand-400">{totals.total.toLocaleString()} <span className="text-xs">Fbu</span></p>
                        </div>
                    </div>
                    <button
                        onClick={checkout}
                        disabled={cart.length === 0}
                        className="w-full py-5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white rounded-3xl font-black text-xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                        <CreditCard size={24} /> PAY NOW
                    </button>
                </div>
            </div>

            {/* Mobile Footer Toggle */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4 z-40">
                <button 
                    onClick={() => setShowCartMobile(true)}
                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl flex items-center justify-between px-6 font-black"
                >
                    <div className="flex items-center gap-3">
                        <ShoppingCart size={20} />
                        <span className="text-xs uppercase">{cart.length} ITEMS</span>
                    </div>
                    <span>{totals.total.toLocaleString()} FBU</span>
                </button>
            </div>

            {/* Customer Selection Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black dark:text-white">SELECT CUSTOMER</h3>
                            <button onClick={() => setIsCustomerModalOpen(false)}><X className="text-gray-400" /></button>
                        </div>
                        <input 
                            autoFocus
                            placeholder="Search by name or phone..."
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border rounded-2xl mb-4 font-bold dark:text-white"
                            onChange={async (e) => {
                                const val = e.target.value;
                                if (val.length > 2) {
                                    const res = await customerService.getAll({ search: val });
                                    setCustomerResults(Array.isArray(res) ? res : res?.customers || []);
                                }
                            }}
                        />
                        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                            {customerResults.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setCustomer(c); setIsCustomerModalOpen(false); }}
                                    className="w-full p-4 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl flex justify-between items-center border border-transparent hover:border-brand-100 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 dark:text-white group-hover:text-brand-600">{c.full_name}</p>
                                        <p className="text-xs text-gray-400 font-bold">{c.phone}</p>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full uppercase tracking-widest">{c.customer_type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;